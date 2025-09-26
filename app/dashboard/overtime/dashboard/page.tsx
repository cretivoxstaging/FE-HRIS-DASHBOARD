"use client"

import { useState, useEffect } from "react"
import { Clock, Tag, Home, Trophy, BarChart3, PieChart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Pie,
  PieChart as RechartsPieChart,
  Cell,
  Legend,
} from "recharts"
import { ChartContainer } from "@/components/ui/chart"

// Type for employee overtime data
type EmployeeOvertimeData = {
  name: string
  department: string
  totalHours: number
}

// Type for department overtime data
type DepartmentOvertimeData = {
  department: string
  count: number
  shortName: string
}

// Type for branch overtime data
type BranchOvertimeData = {
  branch: string
  count: number
  percentage: number
}

// Colors for pie chart
const COLORS = [
  "#3B82F6", // Blue
  "#EF4444", // Red
  "#10B981", // Green
  "#F59E0B", // Amber
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#F97316", // Orange
  "#6366F1", // Indigo
  "#14B8A6", // Teal
  "#F43F5E", // Rose
]

type BranchData = {
  branch: string
  count: number
}

export default function OvertimeDashboardPage() {
  const [overtimeCount, setOvertimeCount] = useState(0)
  const [brandCategoryCount, setBrandCategoryCount] = useState(0)
  const [inhouseCategoryCount, setInhouseCategoryCount] = useState(0)
  const [employeeOvertimeRanking, setEmployeeOvertimeRanking] = useState<EmployeeOvertimeData[]>([])
  const [departmentOvertimeData, setDepartmentOvertimeData] = useState<DepartmentOvertimeData[]>([])
  const [branchOvertimeData, setBranchOvertimeData] = useState<BranchOvertimeData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch overtime data from internal API route
        const overtimeResponse = await fetch("/api/dashboard/overtime", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        })

        if (!overtimeResponse.ok) {
          throw new Error("Failed to fetch overtime data")
        }

        const overtimeData = await overtimeResponse.json()

        // Set overtime count
        const overtimeEntries = overtimeData.overtime || []
        setOvertimeCount(overtimeEntries.length)

        // Count categories from overtime data
        let brandCount = 0
        let inhouseCount = 0

        if (Array.isArray(overtimeEntries)) {
          // First, try to count directly from the overtime array
          brandCount = overtimeEntries.filter((item) => item && item.category === "Brand").length
          inhouseCount = overtimeEntries.filter((item) => item && item.category === "Inhouse").length

          // If that doesn't work, try to look at employee data within overtime entries
          if (brandCount === 0 && inhouseCount === 0) {
            for (const item of overtimeEntries) {
              if (item && item.employee && item.employee.category === "Brand") {
                brandCount++
              }
              if (item && item.employee && item.employee.category === "Inhouse") {
                inhouseCount++
              }
            }
          }
        }

        // If we still don't have counts, try string matching as a last resort
        if (brandCount === 0 && inhouseCount === 0) {
          const responseStr = JSON.stringify(overtimeData)
          const brandMatches = responseStr.match(/"category"\s*:\s*"Brand"/g)
          const inhouseMatches = responseStr.match(/"category"\s*:\s*"Inhouse"/g)

          if (brandMatches) {
            brandCount = brandMatches.length
          }

          if (inhouseMatches) {
            inhouseCount = inhouseMatches.length
          }
        }

        setBrandCategoryCount(brandCount)
        setInhouseCategoryCount(inhouseCount)

        // Process department overtime data
        const departmentCount: { [key: string]: number } = {}

        if (Array.isArray(overtimeEntries)) {
          overtimeEntries.forEach((entry) => {
            if (!entry || !entry.data) return

            // Extract department for department chart
            const department = entry.data.department || "Unknown"
            if (departmentCount[department]) {
              departmentCount[department]++
            } else {
              departmentCount[department] = 1
            }
          })
        }

        // Convert to chart data format - sort by count descending
        const departmentChartData = Object.entries(departmentCount)
          .map(([department, count]) => ({
            department: department,
            count: count,
            shortName: department.length > 12 ? department.substring(0, 12) + "..." : department,
          }))
          .sort((a, b) => b.count - a.count) // Sort by count descending

        setDepartmentOvertimeData(departmentChartData)

        // Process branch overtime data
        const branchCount: { [key: string]: number } = {}

        if (Array.isArray(overtimeEntries)) {
          overtimeEntries.forEach((entry) => {
            if (!entry || !entry.data) return

            // Extract branch for branch pie chart
            const branch = entry.data.branch || "Unknown"
            if (branchCount[branch]) {
              branchCount[branch]++
            } else {
              branchCount[branch] = 1
            }
          })
        }

        // Convert branch data to pie chart format
        const totalBranchSubmissions = Object.values(branchCount).reduce((sum, count) => sum + count, 0)
        const branchChartData = Object.entries(branchCount)
          .map(([branch, count]) => ({
            branch: branch,
            count: count,
            percentage: Math.round((count / totalBranchSubmissions) * 100),
          }))
          .sort((a, b) => b.count - a.count) // Sort by count descending

        setBranchOvertimeData(branchChartData)

        // Process employee overtime data for ranking
        const employeeOvertimeMap = new Map<string, EmployeeOvertimeData>()

        if (Array.isArray(overtimeEntries)) {
          overtimeEntries.forEach((entry) => {
            if (!entry) return

            // Extract employee name, department, and hours
            let employeeName = ""
            let department = ""
            let hours = 0

            // Try to get data from different possible structures
            if (entry.data) {
              // From the sample data structure
              employeeName = entry.data.overtime_name || ""
              department = entry.data.department || ""

              // Try to parse hours from count_time or calculate from start/end time
              if (entry.data.count_time) {
                const countTime = Number.parseFloat(entry.data.count_time)
                if (!isNaN(countTime)) {
                  hours = countTime
                }
              }
            } else {
              // Try alternative fields
              employeeName = entry.employee_name || entry.name || ""
              department = entry.department || ""
              hours = Number.parseFloat(entry.hours || entry.count_time || "0") || 0
            }

            // Skip if we don't have a valid employee name
            if (!employeeName) return

            // Create or update employee data in the map
            const key = `${employeeName}-${department}`
            if (employeeOvertimeMap.has(key)) {
              const existingData = employeeOvertimeMap.get(key)!
              existingData.totalHours += hours
              employeeOvertimeMap.set(key, existingData)
            } else {
              employeeOvertimeMap.set(key, {
                name: employeeName,
                department: department,
                totalHours: hours,
              })
            }
          })
        }

        // Convert map to array and sort by total hours (descending)
        const sortedEmployeeOvertimeData = Array.from(employeeOvertimeMap.values()).sort(
          (a, b) => b.totalHours - a.totalHours,
        )

        setEmployeeOvertimeRanking(sortedEmployeeOvertimeData)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Calculate total submissions for center text
  const totalSubmissions = branchOvertimeData.reduce((sum, branch) => sum + branch.count, 0)

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen text-black">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900">Overtime Dashboard</h1>
        <p className="text-gray-500">Overview of overtime submissions and analytics</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="overflow-hidden border-none shadow-md transition-all hover:shadow-lg">
          <div className="absolute top-0 right-0 h-full w-1 "></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Overtime Submissions</CardTitle>
            <Clock className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-gray-200"></div>
            ) : error ? (
              <div className="text-sm text-red-500">Failed to load data</div>
            ) : (
              <>
                <div className="text-3xl font-bold text-gray-900">{overtimeCount}</div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-md transition-all hover:shadow-lg">
          <div className="absolute top-0 right-0 h-full w-1 "></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Brand Category</CardTitle>
            <Tag className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-gray-200"></div>
            ) : error ? (
              <div className="text-sm text-red-500">Failed to load data</div>
            ) : (
              <>
                <div className="text-3xl font-bold text-gray-900">{brandCategoryCount}</div>
                <p className="text-xs text-gray-500 mt-1">Overtime in Brand category</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-md transition-all hover:shadow-lg">
          <div className="absolute top-0 right-0 h-full w-1 "></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Inhouse Category</CardTitle>
            <Home className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-gray-200"></div>
            ) : error ? (
              <div className="text-sm text-red-500">Failed to load data</div>
            ) : (
              <>
                <div className="text-3xl font-bold text-gray-900">{inhouseCategoryCount}</div>
                <p className="text-xs text-gray-500 mt-1">Overtime in Inhouse category</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Department Overtime Chart */}
        <Card className="border-none shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg sm:text-xl font-semibold">Overtime Submissions by Department</CardTitle>
              <BarChart3 className="h-5 w-5 text-gray-500"/>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Number of overtime submissions by department</p>
          </CardHeader>
          <CardContent className="p-2 sm:p-6">
            {isLoading ? (
              <div className="h-[250px] sm:h-[300px] w-full animate-pulse rounded bg-gray-200"></div>
            ) : error ? (
              <div className="text-center py-6 text-red-500">Failed to load department overtime data</div>
            ) : (
              <ChartContainer
                config={{
                  count: {
                    label: "Overtime Submissions",
                    color: "hsl(221, 83%, 53%)",
                  },
                }}
                className="h-[250px] sm:h-[300px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={departmentOvertimeData}
                    margin={{
                      left: 5,
                      right: 5,
                      top: 10,
                      bottom: 50,
                    }}
                  >
                    <XAxis
                      dataKey="shortName"
                      tick={{ fontSize: 10 }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      className="text-xs"
                    />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} domain={[0, "dataMax"]} width={30} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-white p-2 sm:p-3 border border-gray-200 rounded-lg shadow-lg text-xs sm:text-sm">
                              <p className="font-medium">{data.department}</p>
                              <p className="text-blue-600">
                                <span className="font-medium">{payload[0].value}</span> overtime submissions
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="var(--color-count)"
                      radius={[2, 2, 0, 0]}
                      className="hover:opacity-80 transition-opacity"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Branch Overtime Donut Chart */}
        <Card className="border-none shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg sm:text-xl font-semibold">Overtime by Branch</CardTitle>
              <PieChart className="h-5 w-5 text-gray-500" />
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Distribution of overtime submissions by branch</p>
          </CardHeader>
          <CardContent className="p-2 sm:p-6">
            {isLoading ? (
              <div className="h-[250px] sm:h-[300px] w-full animate-pulse rounded bg-gray-200"></div>
            ) : error ? (
              <div className="text-center py-6 text-red-500">Failed to load branch overtime data</div>
            ) : branchOvertimeData.length === 0 ? (
              <div className="text-center py-6 text-gray-500">No branch overtime data available</div>
            ) : (
              <ChartContainer
                config={{
                  branch: {
                    label: "Branch",
                  },
                }}
                className="h-[250px] sm:h-[300px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                    <Pie
                      data={branchOvertimeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ branch, percentage }) => {
                        // Only show label if there's enough space
                        return branchOvertimeData.length <= 4 ? `${branch}: ${percentage}%` : `${percentage}%`
                      }}
                      outerRadius="70%"
                      innerRadius="40%"
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="branch"
                      className="text-xs"
                    >
                      {branchOvertimeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-white p-2 sm:p-3 border border-gray-200 rounded-lg shadow-lg text-xs sm:text-sm">
                              <p className="font-medium">{data.branch}</p>
                              <p className="text-gray-600">
                                <span className="font-medium">{data.count}</span> overtime submissions
                              </p>
                              <p className="text-gray-600">
                                <span className="font-medium">{data.percentage}%</span> of total
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      align="center"
                      layout="horizontal"
                      wrapperStyle={{
                        paddingTop: "10px",
                        fontSize: "12px",
                      }}
                      formatter={(_, entry) => {
                        const branchData = entry.payload as BranchData
                        return (
                          <span style={{ color: entry.color, fontSize: "12px" }}>
                            {branchData ? `${branchData.branch}: ${branchData.count}` : "Data tidak tersedia"}
                          </span>
                        )
                      }}
                    />
                    {/* Center text - responsive sizing */}
                    <text
                      x="50%"
                      y="50%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-gray-900 text-sm sm:text-lg font-bold"
                    >
                      {totalSubmissions}
                    </text>
                    <text
                      x="50%"
                      y="50%"
                      dy={15}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-gray-500 text-xs sm:text-sm"
                    >
                      Total
                    </text>
                  </RechartsPieChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Employee Overtime Ranking Section */}
      <Card className="border-none shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-xl font-semibold">Employee Overtime Ranking</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Employees ranked by total overtime hours</p>
          </div>
          <Trophy className="h-5 w-5 text-amber-500" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 w-full animate-pulse rounded bg-gray-200"></div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-6 text-red-500">Failed to load employee ranking data</div>
          ) : employeeOvertimeRanking.length === 0 ? (
            <div className="text-center py-6 text-gray-500">No employee overtime data available</div>
          ) : (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto border border-gray-200 rounded-lg">
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead className="w-12 text-center bg-white">#</TableHead>
                    <TableHead className="bg-white">Employee Name</TableHead>
                    <TableHead className="bg-white">Department</TableHead>
                    <TableHead className="text-right bg-white">Total Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeOvertimeRanking.map((employee, index) => (
                    <TableRow key={index} className={index < 3 ? "bg-amber-50" : index < 10 ? "bg-gray-50" : ""}>
                      <TableCell className="font-medium text-center">
                        {index === 0 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-amber-500 text-white rounded-full text-xs">
                            1
                          </span>
                        ) : index === 1 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-400 text-white rounded-full text-xs">
                            2
                          </span>
                        ) : index === 2 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-amber-700 text-white rounded-full text-xs">
                            3
                          </span>
                        ) : index < 10 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                            {index + 1}
                          </span>
                        ) : (
                          <span className="text-gray-600 font-medium">{index + 1}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold">{employee.totalHours.toFixed(1)}</span> hours
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      {employeeOvertimeRanking.length > 10 && (
        <div className="text-center py-2 text-sm text-gray-500 bg-gray-50 rounded-b-lg border-t">
          Showing all {employeeOvertimeRanking.length} employees • Scroll to view more
        </div>
      )}
    </div>
  )
}
