/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import * as XLSX from "xlsx"
import { toast } from "react-hot-toast"
import { Check, Download, FileSpreadsheet, Search, Filter } from "lucide-react"

const API_URL = "/api/overtime"
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null
  return null
}

// Type for employee overtime data
type EmployeeOvertimeData = {
  name: string
  department: string
  branch: string
  position: string
  totalHours: number
  totalSubmissions: number
  totalOvertimePay: number
}

export default function OvertimePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedMonth, setSelectedMonth] = useState(() => {
    // Get current date and format as YYYY-MM
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    return `${year}-${month}`
  })
  const [isAdmin, setIsAdmin] = useState(false)
  const [isMarketing, setIsMarketing] = useState(false)
  const [isUser, setIsUser] = useState(false)
  const [overtimeRequests, setOvertimeRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set())
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50
  const [selectedBranch, setSelectedBranch] = useState("")

  // Generate month options for the current year only
  const generateMonthOptions = () => {
    const currentYear = new Date().getFullYear()
    const months = [
      { value: `${currentYear}-01`, label: "January" },
      { value: `${currentYear}-02`, label: "February" },
      { value: `${currentYear}-03`, label: "March" },
      { value: `${currentYear}-04`, label: "April" },
      { value: `${currentYear}-05`, label: "May" },
      { value: `${currentYear}-06`, label: "June" },
      { value: `${currentYear}-07`, label: "July" },
      { value: `${currentYear}-08`, label: "August" },
      { value: `${currentYear}-09`, label: "September" },
      { value: `${currentYear}-10`, label: "October" },
      { value: `${currentYear}-11`, label: "November" },
      { value: `${currentYear}-12`, label: "December" },
    ]
    return months
  }

  const getCurrentMonth = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    return `${year}-${month}`
  }

  useEffect(() => {
    const userRole = getCookie("userRole")
    if (userRole === "admin") {
      setIsAdmin(true)
      // Set current month as default for admin users
      setSelectedMonth(getCurrentMonth())
    } else if (userRole === "marketing") {
      setIsMarketing(true)
    } else if (userRole === "user") {
      setIsUser(true)
    } else {
      router.push("/login")
    }
  }, [router])

  useEffect(() => {
    const fetchOvertimeRequests = async () => {
      try {
        const response = await fetch(API_URL, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        })

        console.log("Response status:", response.status)

        const responseData = await response.json()
        console.log("Raw API Response:", responseData)

        const overtimeData = responseData.overtime || []
        console.log("Overtime Data:", overtimeData)

        setOvertimeRequests(overtimeData)
      } catch (error: any) {
        console.error("Error fetching overtime data:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchOvertimeRequests()
  }, [])

  const filteredRequests = overtimeRequests
    .filter((request: any) => {
      const name = request.data?.overtime_name || ""
      return name.toLowerCase().includes(searchTerm.toLowerCase())
    })
    .filter((request: any) => {
      const branch = request.data?.branch || ""
      return selectedBranch === "" || branch === selectedBranch
    })
    .filter((request: any) => {
      const dept = request.data?.department || ""
      return selectedDepartment === "" || dept === selectedDepartment
    })
    .filter((request: any) => {
      const category = request.data?.category || ""
      if (isMarketing) {
        return category === "Brand"
      }
      return selectedCategory === "" || category === selectedCategory
    })
    .filter((request: any) => {
      // Month filter - always apply since we removed "All Months" option
      const requestDate = request.data?.date_input || ""
      if (!requestDate) return false

      // Extract year-month from the date_input (assuming date format is YYYY-MM-DD)
      const requestYearMonth = requestDate.substring(0, 7) // Gets "YYYY-MM"
      return requestYearMonth === selectedMonth
    })
    .sort((a: any, b: any) => {
      const nameA = (a.data?.overtime_name || "").toLowerCase()
      const nameB = (b.data?.overtime_name || "").toLowerCase()
      const nameComparison = nameA.localeCompare(nameB)
      if (nameComparison !== 0) {
        return nameComparison
      }

      const dateA = new Date(a.data?.date_input)
      const dateB = new Date(b.data?.date_input)
      return dateA.getTime() - dateB.getTime()
    })

  console.log("Filtered requests:", filteredRequests)

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage)
  const paginatedRequests = filteredRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const exportToExcel = () => {
    const dataToExport = filteredRequests.map((request: any) => ({
      Employee: request.data.overtime_name,
      Branch: request.data.branch,
      Department: request.data.department,
      Position: request.data.position,
      Date: request.data.date_input, // Changed from date to date_input
      "Start Time": request.data.start_time,
      "End Time": request.data.end_time,
      "Total Hours": request.data.count_time,
      Category: request.data.category,
      "Overtime Pay": request.data.overtime,
      Reason: request.data.reason,
      "Management Approval": request.data.management_approval || "✖",
      "HR Approval": request.data.hr_approval || "✖",
      "Brand Approval": request.data.brand_approval || "✖",
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(dataToExport)

    XLSX.utils.book_append_sheet(wb, ws, "Overtime Data")

    // Add month info to filename
    const monthLabel = generateMonthOptions().find((m) => m.value === selectedMonth)?.label || selectedMonth
    XLSX.writeFile(wb, `overtime_data_${monthLabel}_${new Date().getFullYear()}.xlsx`)
  }

  const exportEmployeeRankingToExcel = () => {
    // Process employee overtime data for ranking
    const employeeOvertimeMap = new Map<string, EmployeeOvertimeData>()

    filteredRequests.forEach((request: any) => {
      if (!request.data) return

      const employeeName = request.data.overtime_name || ""
      const department = request.data.department || ""
      const branch = request.data.branch || ""
      const position = request.data.position || ""
      const hours = Number.parseFloat(request.data.count_time) || 0
      const overtimePay = Number.parseFloat(request.data.overtime) || 0

      if (!employeeName) return

      const key = `${employeeName}-${department}-${branch}`

      if (employeeOvertimeMap.has(key)) {
        const existingData = employeeOvertimeMap.get(key)!
        existingData.totalHours += hours
        existingData.totalSubmissions += 1
        existingData.totalOvertimePay += overtimePay
        employeeOvertimeMap.set(key, existingData)
      } else {
        employeeOvertimeMap.set(key, {
          name: employeeName,
          department: department,
          branch: branch,
          position: position,
          totalHours: hours,
          totalSubmissions: 1,
          totalOvertimePay: overtimePay,
        })
      }
    })

    // Convert map to array and sort by total hours (descending)
    const sortedEmployeeOvertimeData = Array.from(employeeOvertimeMap.values()).sort(
      (a, b) => b.totalHours - a.totalHours,
    )

    // Prepare data for Excel export
    const rankingDataToExport = sortedEmployeeOvertimeData.map((employee, index) => ({
      Rank: index + 1,
      "Employee Name": employee.name,
      Department: employee.department,
      Branch: employee.branch,
      Position: employee.position,
      "Total Hours": employee.totalHours.toFixed(1),
      "Total Submissions": employee.totalSubmissions,
      "Total Overtime Pay": `Rp. ${employee.totalOvertimePay.toLocaleString()}`,
      "Average Hours per Submission": (employee.totalHours / employee.totalSubmissions).toFixed(1),
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rankingDataToExport)

    // Auto-size columns
    const colWidths = [
      { wch: 6 }, // Rank
      { wch: 25 }, // Employee Name
      { wch: 20 }, // Department
      { wch: 15 }, // Branch
      { wch: 20 }, // Position
      { wch: 12 }, // Total Hours
      { wch: 18 }, // Total Submissions
      { wch: 20 }, // Total Overtime Pay
      { wch: 25 }, // Average Hours per Submission
    ]
    ws["!cols"] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, "Employee Overtime Ranking")

    // Add month info to filename
    const monthLabel = generateMonthOptions().find((m) => m.value === selectedMonth)?.label || selectedMonth
    XLSX.writeFile(wb, `employee_overtime_ranking_${monthLabel}_${new Date().getFullYear()}.xlsx`)

    const successMessage = `Employee Overtime Ranking for ${monthLabel} ${new Date().getFullYear()} exported successfully!`
    toast.success(successMessage)
  }

  const handleApprove = async (id: string, approvalType: string) => {
    // Add to approving set to show loading state
    setApprovingIds((prev) => new Set(prev).add(`${id}-${approvalType}`))

    try {
      const response = await fetch(`/api/overtime/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, approvalType }),
      })

      if (!response.ok) {
        throw new Error("Gagal menyetujui")
      }

      setOvertimeRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === id ? { ...req, data: { ...req.data, [`${approvalType}_approval`]: "Approved" } } : req,
        ),
      )

      toast.success("Berhasil disetujui")
    } catch (error) {
      console.error("Error menyetujui permintaan:", error)
      toast.error("Gagal menyetujui permintaan")
    } finally {
      // Remove from approving set
      setApprovingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(`${id}-${approvalType}`)
        return newSet
      })
    }
  }

  const ApproveButton = ({
    requestId,
    approvalType,
    isApproved,
    onClick,
  }: {
    requestId: string
    approvalType: string
    isApproved: boolean
    onClick: () => void
  }) => {
    const isLoading = approvingIds.has(`${requestId}-${approvalType}`)

    if (isApproved) {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">
          <Check className="w-3 h-3" />
          Approved
        </div>
      )
    }

    return (
      <button
        onClick={onClick}
        disabled={isLoading}
        className={`
          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
          transition-all duration-200 transform hover:scale-105 active:scale-95
          ${
            isLoading
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg"
          }
        `}
      >
        {isLoading ? (
          <>
            <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Check className="w-3 h-3" />
            Approve
          </>
        )}
      </button>
    )
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-black whitespace-nowrap ml-">Overtime Submission</h1>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <button
                onClick={exportToExcel}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
              >
                <Download className="w-4 h-4" />
                Export Excel
              </button>
              <button
                onClick={exportEmployeeRankingToExcel}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export Ranking
              </button>
            </>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="border border-gray-300 px-3 py-2 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">All Branches</option>
            <option value="Cretivox">Cretivox</option>
            <option value="Condfe">Condfe</option>
          </select>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="border border-gray-300 px-3 py-2 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">All Departments</option>
            <option value="Creative">Creative</option>
            <option value="Digital">Digital</option>
            <option value="Video Editor">Editor</option>
            <option value="Production">Production</option>
            <option value="Sales & Marketing">Marketing</option>
            <option value="Community">Community</option>
            <option value="IT">IT</option>
            <option value="Human Resources Department">Human Resources</option>
            <option value="Finance & Accounting">Finance</option>
            <option value="Support">Support</option>
          </select>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-300 px-3 py-2 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            {isMarketing ? (
              <option value="Brand">Brand</option>
            ) : (
              <>
                <option value="">All Category</option>
                <option value="Inhouse">Inhouse</option>
                <option value="Brand">Brand</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Month Selection - Only visible to Admin */}
      {isAdmin && (
        <div className="flex items-center gap-2 bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
          <Filter className="w-5 h-5 text-gray-600" />
          <label htmlFor="month-select" className="text-black font-medium whitespace-nowrap">
            Filter by Month:
          </label>
          <select
            id="month-select"
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value)
              setCurrentPage(1) // Reset to first page when month changes
            }}
            className="border border-gray-300 px-3 py-2 rounded-lg text-black bg-white min-w-[140px] focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            {generateMonthOptions().map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
          <div className="text-sm text-gray-600 ml-2 bg-white px-3 py-1 rounded-full border">
            Showing data for:{" "}
            <span className="font-medium text-blue-600">
              {generateMonthOptions().find((m) => m.value === selectedMonth)?.label} {new Date().getFullYear()}
            </span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-gray-600">Loading overtime data...</span>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 font-medium">Error: {error}</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-gray-900 to-gray-800 text-white border-b border-gray-300">
                <TableHead className="font-bold border-r border-gray-600 text-white">No</TableHead>
                <TableHead className="font-bold border-r border-gray-600 text-white">Name</TableHead>
                <TableHead className="font-bold whitespace-nowrap border-r border-gray-600 text-white">
                  Branch
                </TableHead>
                <TableHead className="font-bold whitespace-nowrap border-r border-gray-600 text-white">
                  Department
                </TableHead>
                <TableHead className="font-bold whitespace-nowrap border-r border-gray-600 text-white">
                  Position
                </TableHead>
                <TableHead className="font-bold whitespace-nowrap border-r border-gray-600 text-white">Date</TableHead>
                <TableHead className="font-bold whitespace-nowrap border-r border-gray-600 text-white">
                  Start Time
                </TableHead>
                <TableHead className="font-bold whitespace-nowrap border-r border-gray-600 text-white">
                  End Time
                </TableHead>
                <TableHead className="font-bold whitespace-nowrap border-r border-gray-600 text-white">
                  Total Hours
                </TableHead>
                <TableHead className="font-bold whitespace-nowrap border-r border-gray-600 text-white">
                  Category
                </TableHead>
                {isAdmin && (
                  <TableHead className="font-bold whitespace-nowrap border-r border-gray-600 text-white">
                    Overtime Pay
                  </TableHead>
                )}
                <TableHead className="font-bold border-r border-gray-600 text-white">Reason</TableHead>
                {isAdmin && (
                  <TableHead className="font-bold whitespace-nowrap border-gray-600 text-white">HR Approval</TableHead>
                )}
                {(isAdmin || isUser) && (
                  <TableHead className="font-bold whitespace-nowrap border-gray-600 text-white">
                    User Approval
                  </TableHead>
                )}
                {(isAdmin || isMarketing) && (
                  <TableHead className="font-bold whitespace-nowrap border-gray-600 text-white">
                    Brand Approval
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRequests.map((request: any, index: number) => (
                <TableRow
                  className="bg-white text-black hover:bg-gray-50 transition-colors duration-150"
                  key={request.id}
                >
                  <TableCell className="border-r whitespace-nowrap border-gray-200">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </TableCell>
                  <TableCell className="border-r whitespace-nowrap border-gray-200 font-medium">
                    {request.data.overtime_name}
                  </TableCell>
                  <TableCell className="border-r whitespace-nowrap border-gray-200">{request.data.branch}</TableCell>
                  <TableCell className="border-r whitespace-nowrap border-gray-200">
                    {request.data.department}
                  </TableCell>
                  <TableCell className="border-r whitespace-nowrap border-gray-200">{request.data.position}</TableCell>
                  <TableCell className="border-r whitespace-nowrap border-gray-200">
                    {request.data.date_input}
                  </TableCell>
                  <TableCell className="border-r whitespace-nowrap border-gray-200">
                    {request.data.start_time}
                  </TableCell>
                  <TableCell className="border-r whitespace-nowrap border-gray-200">{request.data.end_time}</TableCell>
                  <TableCell className="border-r whitespace-nowrap border-gray-200 font-medium">
                    {request.data.count_time} hours
                  </TableCell>
                  <TableCell className="border-r whitespace-nowrap border-gray-200">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        request.data.category === "Brand"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {request.data.category}
                    </span>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="border-r whitespace-nowrap border-gray-200 font-medium text-green-600">
                      Rp. {request.data.overtime?.toLocaleString() || ""}
                    </TableCell>
                  )}
                  <TableCell className="border-r border-gray-200 max-w-xs truncate" title={request.data.reason}>
                    {request.data.reason}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="border-r whitespace-nowrap border-gray-200 text-center">
                      <ApproveButton
                        requestId={request.id}
                        approvalType="hr"
                        isApproved={request.data.hr_approval === "Approved"}
                        onClick={() => handleApprove(request.id, "hr")}
                      />
                    </TableCell>
                  )}
                  {(!isMarketing || isUser) && (
                    <TableCell className="border-r whitespace-nowrap border-gray-200 text-center">
                      <ApproveButton
                        requestId={request.id}
                        approvalType="management"
                        isApproved={request.data.management_approval === "Approved"}
                        onClick={() => handleApprove(request.id, "management")}
                      />
                    </TableCell>
                  )}
                  {(isAdmin || isMarketing) && (
                    <TableCell className="border-r whitespace-nowrap border-gray-200 text-center">
                      {request.data.category === "Inhouse" ? (
                        <span className="text-gray-400 text-xs">N/A</span>
                      ) : (
                        <ApproveButton
                          requestId={request.id}
                          approvalType="brand"
                          isApproved={request.data.brand_approval === "Approved"}
                          onClick={() => handleApprove(request.id, "brand")}
                        />
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex justify-center items-center gap-4 py-4">
        <button
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            currentPage === 1
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-sm"
          }`}
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <div className="flex items-center gap-2">
          <span className="text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-200 font-medium">
            Page {currentPage} of {totalPages}
          </span>
        </div>
        <button
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            currentPage === totalPages
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-sm"
          }`}
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  )
}
