"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

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
  const colorConfig = Object.entries(config).filter(([, itemConfig]) => itemConfig.theme || itemConfig.color)

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: [
          `[data-chart="${id}"] {`,
          ...colorConfig
            .map(([key, itemConfig]) => {
              const color = itemConfig.theme?.["light"] || itemConfig.color
              return color ? `  --color-${key}: ${color};` : null
            })
            .filter(Boolean),
          `}`,
        ].join("\n"),
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

// Define types for tooltip payload
interface TooltipPayloadItem {
  value?: string | number
  name?: string
  dataKey?: string
  color?: string
  payload?: Record<string, unknown>
}

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    active?: boolean
    payload?: TooltipPayloadItem[]
    label?: string | number
    hideLabel?: boolean
    hideIndicator?: boolean
    indicator?: "line" | "dot" | "dashed"
    nameKey?: string
    labelKey?: string
    labelFormatter?: (label: string | number, payload: TooltipPayloadItem[]) => React.ReactNode
    formatter?: (
      value: string | number,
      name: string,
      props: TooltipPayloadItem,
      index: number,
      payload: Record<string, unknown>,
    ) => React.ReactNode
    color?: string
    labelClassName?: string
  }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref,
  ) => {
    const config = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      const [item] = payload
      const key = `${labelKey || item.dataKey || item.name || "value"}`
      const itemConfig = getPayloadConfigFromPayload(config, item, key)
      let value: React.ReactNode = undefined
      if (!labelKey && typeof label === "string") {
        const configItem = config[label as keyof typeof config]
        value = typeof configItem === "object" && configItem !== null ? configItem.label : label
      } else {
        value = typeof itemConfig === "object" && itemConfig !== null ? itemConfig.label : undefined
      }

      if (labelFormatter && typeof value !== "undefined") {
        return labelFormatter(value as string | number, payload)
      }

      return value
    }, [label, labelFormatter, payload, hideLabel, labelKey, config])

    if (!active || !payload?.length) {
      return null
    }

    const nestLabel = payload.length === 1 && indicator !== "dot"

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className,
        )}
      >
        {!nestLabel ? <div className={cn("font-medium", labelClassName)}>{tooltipLabel}</div> : null}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            let indicatorColor = color
            if (!indicatorColor) {
              if (item.payload && typeof item.payload === 'object' && item.payload !== null && 'fill' in item.payload && typeof (item.payload as Record<string, unknown>).fill === 'string') {
                indicatorColor = (item.payload as { fill: string }).fill
              } else if (item.color) {
                indicatorColor = item.color
              }
            }

            return (
              <div
                key={item.dataKey || index}
                className={cn(
                  "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center",
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload || {})
                ) : (
                  <>
                    {typeof itemConfig === "object" && itemConfig !== null && itemConfig.icon ? (
                      <itemConfig.icon />
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
                        <div className="text-muted-foreground">{typeof itemConfig === "object" && itemConfig !== null ? itemConfig.label : item.name}</div>
                      </div>
                      {item.value && (
                        <div className="font-mono font-medium tabular-nums text-foreground">
                          {typeof item.value === "number" ? item.value.toLocaleString() : item.value}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  },
)
ChartTooltipContent.displayName = "ChartTooltipContent"

const ChartLegend = RechartsPrimitive.Legend

interface ChartLegendPayloadItem {
  dataKey?: string
  value?: string
  color?: string
  [key: string]: any
}

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    payload?: ChartLegendPayloadItem[]
    verticalAlign?: "top" | "bottom"
    hideIcon?: boolean
    nameKey?: string
  }
>(({ className, hideIcon = false, payload, verticalAlign = "bottom", nameKey }, ref) => {
  const config = useChart()

  if (!payload || !Array.isArray(payload) || !payload.length) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-center gap-4", verticalAlign === "top" ? "pb-3" : "pt-3", className)}
    >
      {payload.map((item, idx) => {
        const key = `${nameKey || item.dataKey || "value"}`
        const itemConfig = getPayloadConfigFromPayload(config, item, key)

        return (
          <div
            key={item.value || idx}
            className={cn("flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground")}
          >
            {typeof itemConfig === "object" && itemConfig !== null && itemConfig.icon && !hideIcon ? (
              <itemConfig.icon />
            ) : (
              !hideIcon && (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )
            )}
            {typeof itemConfig === "object" && itemConfig !== null ? itemConfig.label : item.value}
          </div>
        )
      })}
    </div>
  )
})
ChartLegendContent.displayName = "ChartLegendContent"

// Helper function to get payload configuration
function getPayloadConfigFromPayload(config: ChartConfig, payload: unknown, key: string) {
  if (typeof payload !== "object" || payload === null) {
    return undefined
  }

  // Type guard for payload with nested payload property
  function hasPayloadProp(obj: unknown): obj is { payload: Record<string, unknown> } {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'payload' in obj &&
      typeof (obj as { payload: unknown }).payload === 'object' &&
      (obj as { payload: unknown }).payload !== null
    )
  }

  const payloadPayload = hasPayloadProp(payload) ? payload.payload : undefined

  let configLabelKey: string = key

  if (key in config || (payloadPayload && configLabelKey in payloadPayload)) {
    configLabelKey = key
  } else if (payloadPayload && 'fill' in payloadPayload && typeof payloadPayload.fill === 'string') {
    configLabelKey = payloadPayload.fill
  }

  return configLabelKey in config ? config[configLabelKey] : config[key as keyof typeof config]
}

// Chart configuration type
type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | {
        color?: string
        theme?: never
      }
    | {
        color?: never
        theme: Record<string, string>
      }
  )
}

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartStyle }

export type { ChartConfig }
