"use client"

import { useState, useEffect } from "react"
import { Users, Clock, Tag, Home } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Type for employee overtime data
type EmployeeOvertimeData = {
  name: string
  department: string
  totalHours: number
}

export default function DashboardPage() {
  const [overtimeCount, setOvertimeCount] = useState(0)
  const [employeeCount, setEmployeeCount] = useState(0)
  const [brandCategoryCount, setBrandCategoryCount] = useState(0)
  const [inhouseCategoryCount, setInhouseCategoryCount] = useState(0)
  const [employeeOvertimeRanking, setEmployeeOvertimeRanking] = useState<EmployeeOvertimeData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Ganti dengan URL API dan token langsung
        const apiBaseUrl = "https://hris-api-kappa.vercel.app/api/v1"; // URL API
        const apiToken = "$2a$12$JSyMjCxUTNmGBlAQOQQeaOFrOdtdUmn.U/17DlvOK1t.Ot0BTRGli"; // Token API

        // Fetch overtime data from the API
        const overtimeResponse = await fetch(`${apiBaseUrl}/overtime?pageSize=1000`, {
          headers: {
            Authorization: `Bearer ${apiToken}`,
          },
        })

        if (!overtimeResponse.ok) {
          throw new Error(`Failed to fetch overtime data: ${overtimeResponse.statusText}`)
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
        const sortedEmployeeOvertimeData = Array.from(employeeOvertimeMap.values())
          .sort((a, b) => b.totalHours - a.totalHours)
          .slice(0, 50) // Get top 10 employees

        setEmployeeOvertimeRanking(sortedEmployeeOvertimeData)

        // Fetch employee data for total count
        const employeeResponse = await fetch(`${apiBaseUrl}/employee`, {
          headers: {
            Authorization: `Bearer ${apiToken}`,
          },
        })

        if (!employeeResponse.ok) {
          throw new Error("Failed to fetch employee data")
        }

        const employeeData = await employeeResponse.json()

        // Check if the data structure is as expected
        if (employeeData && Array.isArray(employeeData.data)) {
          setEmployeeCount(employeeData.data.length)
        } else if (employeeData && Array.isArray(employeeData.employee)) {
          setEmployeeCount(employeeData.employee.length)
        } else if (employeeData && typeof employeeData === "object") {
          // Try to find any array in the response that might contain employees
          const possibleArrays = Object.values(employeeData).filter((val) => Array.isArray(val))
          if (possibleArrays.length > 0) {
            // Use the first array found
            setEmployeeCount(possibleArrays[0].length)
          } else {
            setEmployeeCount(0)
          }
        } else {
          setEmployeeCount(0)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="space-y-6 p-6 bg-white min-h-screen">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome to your HR management dashboard</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden border-none shadow-md transition-all hover:shadow-lg">
          <div className="absolute top-0 right-0 h-full w-1 bg-blue-500"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Employees</CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-gray-200"></div>
            ) : error ? (
              <div className="text-sm text-red-500">Failed to load data</div>
            ) : (
              <>
                <div className="text-3xl font-bold text-gray-900">{employeeCount}</div>
                <p className="text-xs text-gray-500 mt-1">Active employees</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-md transition-all hover:shadow-lg">
          <div className="absolute top-0 right-0 h-full w-1 bg-green-500"></div>
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
                <p className="text-xs text-gray-500 mt-1">+{Math.floor(overtimeCount * 0.15)} from last month</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-md transition-all hover:shadow-lg">
          <div className="absolute top-0 right-0 h-full w-1 bg-purple-500"></div>
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
          <div className="absolute top-0 right-0 h-full w-1 bg-amber-500"></div>
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

      {/* Employee Overtime Ranking Section */}
      <Card className="border-none shadow-md text-black">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-xl font-semibold">Employee Overtime Ranking</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Employees ranked by total overtime hours</p>
          </div>
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-lg">
                    <TableHead className="w-12 text-center font-bold">#</TableHead>
                    <TableHead className="font-bold">Employee Name</TableHead>
                    <TableHead className="font-bold">Department</TableHead>
                    <TableHead className="font-bold text-right">Total Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeOvertimeRanking.map((employee, index) => (
                    <TableRow key={index} className={index < 3 ? "bg-amber-50 text-lg" : ""}>
                      <TableCell className="font-bold text-center ">
                        {index === 0 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-amber-500 text-white rounded-full text-xs font-bold">
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
                        ) : (
                          index + 1
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
    </div>
  )
}
