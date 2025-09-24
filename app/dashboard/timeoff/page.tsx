"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Search, 
  Calendar, 
  Clock, 
  FileText, 
  User, 
  RefreshCw, 
  Download, 
  Filter,
  Eye,
  Edit,
  Trash2,
  Plus,
  View,
  ViewIcon
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "react-hot-toast"
import * as XLSX from "xlsx"

interface TimeOffRecord {
  id: string
  name: string
  employeeId: string
  email: string
  time_off_type: string
  start_date: string
  end_date: string
  reason: string
  delegate: string
  file: string
  status: string
}

export default function TimeOffPage() {
  const [timeOffData, setTimeOffData] = useState<TimeOffRecord[]>([])
  const [filteredData, setFilteredData] = useState<TimeOffRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const formatTypeLabel = (rawType: string) => {
    if (!rawType) return "-"
    return rawType
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  }

  const timeOffTypeOptions = [
    "annual_leave",
    "sick_leave",
    "birthday_leave",
    "maternity_leave",
  ]

  const formatStatusLabel = (status: string) => {
    if (!status) return "-"
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
  }

  const statusOptions = ["pending", "approved", "rejected"]

  useEffect(() => {
    fetchTimeOffData()
  }, [])

  useEffect(() => {
    const filtered = timeOffData.filter((record) => {
      const searchLower = searchTerm.toLowerCase()
      const name = (record.name || "").toLowerCase()
      const email = (record.email || "").toLowerCase()
      const employeeId = (record.employeeId || "").toLowerCase()
      const timeOffType = (record.time_off_type || "").toLowerCase()
      const status = (record.status || "").toLowerCase()
      const reason = (record.reason || "").toLowerCase()

      const matchesSearch =
        name.includes(searchLower) ||
        email.includes(searchLower) ||
        employeeId.includes(searchLower) ||
        timeOffType.includes(searchLower) ||
        status.includes(searchLower) ||
        reason.includes(searchLower)

      const matchesStatus = selectedStatus === "all" || record.status.toLowerCase() === selectedStatus.toLowerCase()
      const matchesType = selectedType === "all" || record.time_off_type.toLowerCase() === selectedType.toLowerCase()

      return matchesSearch && matchesStatus && matchesType
    })
    // Sort by highest id first
    .sort((a, b) => {
      const toNum = (val: string) => {
        const n = parseInt(val, 10)
        return Number.isNaN(n) ? 0 : n
      }
      return toNum(b.id) - toNum(a.id)
    })
    setFilteredData(filtered)
  }, [searchTerm, timeOffData, selectedStatus, selectedType])

  const fetchTimeOffData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/timeoff")
      if (!response.ok) {
        throw new Error("Failed to fetch time off data")
      }
      const data = await response.json()
      const sorted = (data.data || [])
        .slice()
        .sort((a: TimeOffRecord, b: TimeOffRecord) => {
          const toNum = (val: string) => {
            const n = parseInt(val, 10)
            return Number.isNaN(n) ? 0 : n
          }
          return toNum(b.id) - toNum(a.id)
        })
      setTimeOffData(sorted)
      setFilteredData(sorted)
    } catch (error) {
      console.error("Error fetching time off data:", error)
      setTimeOffData([])
      setFilteredData([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    try {
      const formatDdMonYyyy = (date: Date) => {
        const day = String(date.getDate()).padStart(2, "0")
        const month = date.toLocaleString("en-US", { month: "short" })
        const year = date.getFullYear()
        return `${day} ${month} ${year}`
      }

      // Handle DD/MM/YYYY format
      if (dateString.includes("/")) {
        const [day, month, year] = dateString.split("/")
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        return formatDdMonYyyy(date)
      }
      // Handle other formats (ISO, etc.)
      const date = new Date(dateString)
      return formatDdMonYyyy(date)
    } catch {
      return dateString
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getTimeOffTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case "annual_leave":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Annual Leave</Badge>
      case "sick_leave":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Sick Leave</Badge>
      case "birthday_leave":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Birthday Leave</Badge>
      case "maternity_leave":
        return <Badge className="bg-pink-100 text-pink-800 hover:bg-pink-100">Maternity Leave</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const calculateDays = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return "-"
    try {
      let start: Date
      let end: Date

      // Handle DD/MM/YYYY format
      if (startDate.includes("/")) {
        const [day, month, year] = startDate.split("/")
        start = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      } else {
        start = new Date(startDate)
      }

      if (endDate.includes("/")) {
        const [day, month, year] = endDate.split("/")
        end = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      } else {
        end = new Date(endDate)
      }

      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      return `${diffDays} day${diffDays > 1 ? "s" : ""}`
    } catch {
      return "-"
    }
  }

  const exportToExcel = () => {
    try {
      const dataToExport = filteredData.map((record, index) => ({
        No: index + 1,
        "Employee Name": record.name || "",
        "Employee ID": record.employeeId || "",
        "Email": record.email || "",
        "Time Off Type": record.time_off_type || "",
        "Start Date": formatDate(record.start_date),
        "End Date": formatDate(record.end_date),
        "Duration": calculateDays(record.start_date, record.end_date),
        "Delegate": record.delegate || "",
        "Status": record.status || "",
        "Reason": record.reason || "",
      }))

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(dataToExport)

      // Set column widths
      const colWidths = [
        { wch: 5 }, // No
        { wch: 25 }, // Employee Name
        { wch: 15 }, // Employee ID
        { wch: 30 }, // Email
        { wch: 20 }, // Time Off Type
        { wch: 12 }, // Start Date
        { wch: 12 }, // End Date
        { wch: 15 }, // Duration
        { wch: 25 }, // Delegate
        { wch: 15 }, // Status
        { wch: 40 }, // Reason
      ]
      ws["!cols"] = colWidths

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Time Off Data")

      // Generate filename with current date
      const fileName = `time_off_data_${new Date().toISOString().split("T")[0]}.xlsx`

      // Write file using the correct browser method
      XLSX.writeFile(wb, fileName)

      toast.success(`Time off data exported successfully! (${filteredData.length} records)`)
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Failed to export time off data. Please try again.")
    }
  }

  const updateTimeOffStatus = async (id: string, newStatus: string) => {
    const previousData = [...timeOffData]
    try {
      // Optimistic update
      const applyLocalUpdate = (list: TimeOffRecord[]) =>
        list.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      setTimeOffData((prev) => applyLocalUpdate(prev))
      setFilteredData((prev) => applyLocalUpdate(prev))

      const res = await fetch(`/api/timeoff/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        throw new Error("Failed to update status")
      }

      // If status approved, call decrement leave API
      if ((newStatus || "").toLowerCase() === "approved") {
        const decRes = await fetch(`/api/timeoff`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ timeoffId: id }),
        })
        if (!decRes.ok) {
          const errorText = await decRes.text().catch(() => "")
          console.error("Decrement leave failed:", errorText)
          toast.error("Gagal mengurangi jatah cuti")
        }
      }
      toast.success("Status updated")
    } catch (err) {
      console.error(err)
      toast.error("Failed to update status")
      setTimeOffData(previousData)
      // Re-fetch to be safe
      fetchTimeOffData()
    }
  }

  // Static options for filters

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-80" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 text-black">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Time Off Management</h1>
            <p className="text-gray-500">Monitor and manage employee time off requests</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredData.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredData.filter((record) => record.status.toLowerCase() === "pending").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredData.filter((record) => record.status.toLowerCase() === "approved").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredData.filter((record) => record.status.toLowerCase() === "rejected").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64 bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-40 bg-white">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="bg-white text-black">
                <SelectItem value="all">All Status</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {formatStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-48 bg-white">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="bg-white text-black">
                <SelectItem value="all">All Types</SelectItem>
                {timeOffTypeOptions.map((type) => (
                  <SelectItem key={type} value={type}>
                    {formatTypeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="justify-end flex-1 flex gap-2">
            <Button
            onClick={fetchTimeOffData}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={exportToExcel}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <Card className="border-none -m-6">
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <span className="text-gray-600">Loading time off requests...</span>
              </div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No time off requests</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ||
                (selectedStatus !== "all" && selectedStatus !== "") ||
                (selectedType !== "all" && selectedType !== "")
                  ? "No requests match your search criteria."
                  : "No time off requests available."}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
                    <TableHead className="text-white font-bold text-center">No</TableHead>
                    <TableHead className="text-white font-bold">Employee</TableHead>
                    <TableHead className="text-white font-bold">Type</TableHead>
                    <TableHead className="text-white font-bold">Duration</TableHead>
                    <TableHead className="text-white font-bold">Start Date</TableHead>
                    <TableHead className="text-white font-bold">End Date</TableHead>
                    <TableHead className="text-white font-bold">Delegate</TableHead>
                    
                    <TableHead className="text-white font-bold text-center">Attachment</TableHead>
                    <TableHead className="text-white font-bold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((record, index) => (
                    <TableRow key={record.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="font-medium text-center">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium">{record.name || "-"}</div>
                            <div className="text-xs text-gray-400">ID: {record.employeeId || "-"}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getTimeOffTypeBadge(record.time_off_type)}</TableCell>
                      <TableCell>
                        <Badge className=" text-black hover:bg-blue-100 font-medium">
                          {calculateDays(record.start_date, record.end_date)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(record.start_date)}</TableCell>
                      <TableCell>{formatDate(record.end_date)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <User className="w-3 h-3 text-gray-400" />
                          {record.delegate || "-"}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center justify-center">
                          {record.file ? (
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="bg-white hover:bg-blue-50 hover:border-blue-300 text-blue-600"
                            >
                              <a href={record.file} target="_blank" rel="noopener noreferrer">
                                <Download className="w-4 h-4 mr-1" />
                                View File
                              </a>
                            </Button>
                          ) : (
                            <span className="text-gray-400 text-sm">No file</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Select
                          value={(record.status || "").toLowerCase()}
                          onValueChange={(val) => updateTimeOffStatus(record.id, val)}
                        >
                          <SelectTrigger className="w-36 bg-white">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent className="bg-white text-black">
                            {statusOptions.map((status) => (
                              <SelectItem key={status} value={status}>
                                {formatStatusLabel(status)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>

                      
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!loading && filteredData.length > itemsPerPage && (
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
