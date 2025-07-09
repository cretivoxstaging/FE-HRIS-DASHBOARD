"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"
import type { TooltipProps, LegendProps, LegendPayload } from "recharts";

// Chart context for configuration
const ChartContext = React.createContext<ChartConfig | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"]
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={config}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "ChartContainer"

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(([, itemConfig]) => itemConfig && (itemConfig.theme || itemConfig.color));

  if (!colorConfig.length) {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: [
          `[data-chart="${id}"] {`,
          ...colorConfig
            .map(([key, itemConfig]) => {
              if (!itemConfig) return null;
              const color = itemConfig.theme?.[resolvedTheme as keyof typeof itemConfig.theme] || itemConfig.color;
              return color ? `  --color-${key}: ${color};` : null;
            })
            .filter(Boolean),
          `}`,
        ].join("\n"),
      }}
    />
  );
}

const ChartTooltip = RechartsPrimitive.Tooltip

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  Omit<TooltipProps<any, any>, "ref"> &
    React.ComponentProps<"div"> & {
      hideLabel?: boolean
      hideIndicator?: boolean
      indicator?: "line" | "dot" | "dashed"
      nameKey?: string
      labelKey?: string
    }
>(
  (
    props,
    ref,
  ) => {
    const {
      active,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
      ...rest
    } = props;
    // Ambil payload dan label dari props secara manual
    const payload = (props as any).payload;
    const label = (props as any).label;
    const { config } = useChart();

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload || !Array.isArray(payload) || !payload.length) {
        return null;
      }
      const [item] = payload as any[];
      const key = `${labelKey || item.dataKey || item.value || "value"}`;
      const itemConfig = getPayloadConfigFromPayload(config, item, key);
      const value =
        !labelKey && typeof label === "string"
          ? (config[label as keyof typeof config] && (config[label as keyof typeof config] as any).label) || label
          : itemConfig?.label;
      if (labelFormatter && typeof value !== "undefined") {
        return labelFormatter(value, payload);
      }
      return value;
    }, [label, labelFormatter, payload, hideLabel, labelKey, config]);

    if (!active || !payload || !Array.isArray(payload) || !payload.length) {
      return null;
    }

    const nestLabel = payload.length === 1 && indicator !== "dot";

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className,
        )}
        {...rest}
      >
        {!nestLabel ? <div className={cn("font-medium", labelClassName)}>{tooltipLabel}</div> : null}
        <div className="grid gap-1.5">
          {(payload as any[]).map((item, index) => {
            const key = `${nameKey || item.dataKey || item.value || "value"}`;
            const tooltipConfig = getPayloadConfigFromPayload(config, item, key);
            const indicatorColor = color || (item.payload && (item.payload as any).fill) || item.color;

            return (
              <div
                key={item.dataKey ?? index}
                className={cn(
                  "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center",
                )}
              >
                {formatter && item?.value !== undefined ? (
                  formatter(item.value, item.value, item, index, item.payload)
                ) : (
                  <>
                    {tooltipConfig?.icon ? (
                      <tooltipConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn("shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]", {
                            "h-2.5 w-2.5": indicator === "dot",
                            "w-1": indicator === "line",
                            "w-0 border-[1.5px] border-dashed bg-transparent": indicator === "dashed",
                            "my-0.5": nestLabel && indicator === "dashed",
                          })}
                          style={
                            {
                              "--color-bg": indicatorColor,
                              "--color-border": indicatorColor,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        "flex flex-1 justify-between leading-none",
                        nestLabel ? "items-end" : "items-center",
                      )}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? <div className={cn("font-medium", labelClassName)}>{tooltipLabel}</div> : null}
                        <div className="text-muted-foreground">{tooltipConfig?.label || item.value}</div>
                      </div>
                      {typeof item.value === "number" || typeof item.value === "string" ? (
                        <div className="font-mono font-medium tabular-nums text-foreground">
                          {item.value.toLocaleString?.() ?? item.value}
                        </div>
                      ) : null}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
    },
)
ChartTooltipContent.displayName = "ChartTooltipContent"

const ChartLegend = RechartsPrimitive.Legend

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    Pick<LegendProps, "verticalAlign"> & {
      payload?: LegendPayload[]
      hideIcon?: boolean
      nameKey?: string
    }
>(({ className, hideIcon = false, payload, verticalAlign = "bottom", nameKey, ...rest }, ref) => {
  const { config } = useChart()

  if (!payload || !Array.isArray(payload) || !payload.length) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-center gap-4", verticalAlign === "top" ? "pb-3" : "pt-3", className)}
      {...rest}
    >
      {payload.map((item, idx) => {
        const key = `${nameKey || item.dataKey || item.value || "value"}`;
        const legendConfig = getPayloadConfigFromPayload(config, item, key);
        return (
          <div
            key={item.value ?? idx}
            className={cn("flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground")}
          >
            {legendConfig?.icon && !hideIcon ? (
              <legendConfig.icon />
            ) : (
              !hideIcon && (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: (item as any).color,
                  }}
                />
              )
            )}
            {legendConfig?.label || item.value}
          </div>
        );
      })}
    </div>
  )
})
ChartLegendContent.displayName = "ChartLegendContent"

// Helper function to get payload configuration
function getPayloadConfigFromPayload(config: ChartConfig, payload: any, key: string): ChartConfig[string] | undefined {
  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }

  const payloadPayload =
    "payload" in payload && typeof payload.payload === "object" && payload.payload !== null
      ? payload.payload
      : undefined;

  let configLabelKey: string = key;

  if (key in config || (payloadPayload && configLabelKey in payloadPayload)) {
    configLabelKey = key;
  } else if (payloadPayload && "fill" in payloadPayload && typeof payloadPayload.fill === "string") {
    configLabelKey = payloadPayload.fill;
  }

  return config[configLabelKey] ?? undefined;
}

// Chart configuration type
type ChartConfig = {
  [k: string]: any;
}

// Get current theme (you might need to adjust this based on your theme setup)
const resolvedTheme = "light" // or get from your theme context

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartStyle }

export type { ChartConfig }
