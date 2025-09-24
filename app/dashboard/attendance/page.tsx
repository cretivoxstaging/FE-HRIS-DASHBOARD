"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Search,
  Eye,
  MapPin,
  Clock,
  CalendarIcon,
  User,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Download,
} from "lucide-react"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import * as XLSX from "xlsx"

interface AttendanceRecord {
  id: string
  name: string
  employeeId: string
  date: string
  clock_in: string
  clock_out: string
  location_in: string
  location_out: string
  picture_in: string
  picture_out: string
}

interface Employee {
  id: string
  employeeId: string
  name: string
}

// Custom Calendar Component
const CustomCalendar = ({
  selectedDate,
  onDateSelect,
}: { selectedDate: Date | undefined; onDateSelect: (date: Date) => void }) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date())

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const days = getDaysInMonth(currentMonth)

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const isToday = (date: Date | null) => {
    if (!date) return false
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  // Tambahkan fungsi untuk cek sebelum/sesudah hari ini
  const isPast = (date: Date | null) => {
    if (!date) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }
  const isFuture = (date: Date | null) => {
    if (!date) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date > today
  }

  const isSelected = (date: Date | null) => {
    if (!date || !selectedDate) return false
    return date.toDateString() === selectedDate.toDateString()
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateMonth("prev")}
          className="p-1 hover:bg-gray-100 text-black"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h3 className="text-lg font-semibold text-gray-900">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateMonth("next")}
          className="p-1 hover:bg-gray-100 text-black"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => (
          <button
            key={index}
            onClick={() => date && onDateSelect(date)}
            disabled={!date}
            className={`
              h-8 w-8 text-sm rounded-md transition-colors duration-200
              ${!date ? "invisible" : ""}
              ${
                isSelected(date)
                  ? "bg-blue-600 text-white font-semibold"
                  : isToday(date)
                    ? "bg-blue-100 text-blue-600 font-semibold"
                    : isFuture(date)
                      ? "text-gray-400 hover:bg-gray-100"
                      : "text-gray-700 hover:bg-gray-100"
              }
            `}
          >
            {date?.getDate()}
          </button>
        ))}
      </div>

      {/* Today button */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDateSelect(new Date())}
          className="w-full text-white border-blue-200 hover:bg-blue-50"
        >
          Today
        </Button>
      </div>
    </div>
  )
}

export default function AttendancePage() {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([])
  const [filteredData, setFilteredData] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [showCalendar, setShowCalendar] = useState(false)
  const [employeeData, setEmployeeData] = useState<Employee[]>([])

  useEffect(() => {
    fetchAttendanceData()
    fetchEmployeeData()
  }, [])

  useEffect(() => {
    const formattedSelectedDate = selectedDate
      ? `${String(selectedDate.getDate()).padStart(2, "0")}/${String(selectedDate.getMonth() + 1).padStart(2, "0")}/${selectedDate.getFullYear()}`
      : ""

    const filtered = attendanceData.filter(
      (record) =>
        ((record.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
          (record.date || "").includes(searchTerm) ||
          (record.location_in?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
          (record.location_out?.toLowerCase() || "").includes(searchTerm.toLowerCase())) &&
        record.date === formattedSelectedDate,
    )
    setFilteredData(filtered)
  }, [searchTerm, attendanceData, selectedDate])

  const fetchAttendanceData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/attendance", { cache: "no-store" })

      if (!response.ok) {
        throw new Error("Failed to fetch attendance data")
      }

      const data = await response.json()
      setAttendanceData(data.data || [])
      setFilteredData(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployeeData = async () => {
    try {
      const response = await fetch("/api/employee")
      if (!response.ok) throw new Error("Failed to fetch employee data")
      const data = await response.json()
      setEmployeeData(data.data || [])
    } catch (err) {
      // Optional: handle error
    }
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return "-"
    try {
      // Ambil jam pertama jika ada koma
      const firstTime = timeString.split(",")[0].trim()
      const time = new Date(`2000-01-01T${firstTime}`)
      return time.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    } catch {
      return timeString
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    try {
      // format dari API: DD/MM/YYYY
      const [day, month, year] = dateString.split("/").map(Number)
      const date = new Date(year, month - 1, day) // JS bulan dimulai dari 0

      // Tampilkan format: DD Mon YYYY (contoh: 19 Sep 2025)
      const dd = String(day).padStart(2, "0")
      const mon = date.toLocaleString("en-US", { month: "short" })
      return `${dd} ${mon} ${year}`
    } catch {
      return dateString // fallback kalau parsing gagal
    }
  }

  // Beberapa field API bisa berisi beberapa nilai dipisah koma.
  // Ambil URL foto terbaru (entri terakhir yang valid).
  const getLatestPictureUrl = (pictureField: string) => {
    if (!pictureField) return ""
    const parts = pictureField
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean)
    return parts.length > 0 ? parts[parts.length - 1] : pictureField
  }

  // Tambahkan cache-buster agar browser tidak menyajikan foto lama dari cache
  const getCacheBustedUrl = (url: string, seed?: string) => {
    if (!url) return url
    try {
      const u = new URL(url)
      u.searchParams.set("v", seed || "1")
      return u.toString()
    } catch {
      // fallback jika URL tidak valid untuk constructor URL
      const separator = url.includes("?") ? "&" : "?"
      return `${url}${separator}v=${encodeURIComponent(seed || "1")}`
    }
  }

  const getInitials = (employeeId: string) => {
    return employeeId
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getAttendanceStatus = (clockIn: string, clockOut: string) => {
    if (!clockIn) return { status: "Absent", color: "bg-red-500" }
    if (!clockOut) return { status: "Present", color: "bg-yellow-500" }
    return { status: "Complete", color: "bg-green-500" }
  }

  // Function to get employee name by employeeId
  const getEmployeeName = (employeeId: string) => {
    const employee = employeeData.find((emp) => emp.employeeId === employeeId)
    return employee ? employee.name : employeeId
  }

  // Fungsi untuk menghitung statistik attendance
  const calculateAttendanceStats = () => {
    const totalAttendance = filteredData.length
    let onTimeCount = 0
    let lateArrivalCount = 0

    filteredData.forEach((record) => {
      if (record.clock_in) {
        try {
          // Ambil jam pertama jika ada koma
          const firstTime = record.clock_in.split(",")[0].trim()
          const [hours, minutes] = firstTime.split(":").map(Number)
          const clockInTime = hours * 60 + minutes // konversi ke menit
          const onTimeThreshold = 8 * 60 + 30 // 08:30 dalam menit

          if (clockInTime <= onTimeThreshold) {
            onTimeCount++
          } else {
            lateArrivalCount++
          }
        } catch (error) {
          // Jika parsing gagal, anggap sebagai late arrival
          lateArrivalCount++
        }
      }
    })

    // Hitung Absent berdasarkan employeeData vs attendanceData pada tanggal terpilih
    const formattedSelectedDate = selectedDate
      ? `${String(selectedDate.getDate()).padStart(2, "0")}/${String(selectedDate.getMonth() + 1).padStart(2, "0")}/${selectedDate.getFullYear()}`
      : ""

    const presentNameSet = new Set(
      (attendanceData || [])
        .filter((rec) => rec.date === formattedSelectedDate)
        .map((rec) => (rec.employeeId || "").toLowerCase().trim()),
    )

    const absentCount = (employeeData || []).filter(
      (emp) => !presentNameSet.has((emp.employeeId || "").toLowerCase().trim()),
    ).length

    return {
      totalAttendance,
      onTimeCount,
      lateArrivalCount,
      absentCount,
    }
  }

  const attendanceStats = calculateAttendanceStats()

  const exportToExcel = () => {
    try {
      // Gabungkan data employee dengan attendance
      const formattedSelectedDate = selectedDate
        ? `${String(selectedDate.getDate()).padStart(2, "0")}/${String(selectedDate.getMonth() + 1).padStart(2, "0")}/${selectedDate.getFullYear()}`
        : ""

      const mergedData = employeeData.map((emp, index) => {
        const attendance = attendanceData.find(
          (att) => att.employeeId === emp.employeeId && att.date === formattedSelectedDate,
        )
        return {
          No: index + 1,
          "Employee Name": emp.name,
          Date: attendance?.date || formattedSelectedDate,
          "Clock In": attendance?.clock_in || "-",
          "Clock Out": attendance?.clock_out || "-",
          "Location In": attendance?.location_in || "-",
          "Location Out": attendance?.location_out || "-",
        }
      })

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(mergedData)
      ws["!cols"] = [{ wch: 5 }, { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 20 }]
      XLSX.utils.book_append_sheet(wb, ws, "Attendance Data")
      const fileName = `attendance_data_${new Date().toISOString().split("T")[0]}.xlsx`
      XLSX.writeFile(wb, fileName)
    } catch (error) {
      console.error("Export error:", error)
    }
  }

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const sortedAttendance = [...filteredData].sort((a, b) => {
    if (!a.clock_in) return 1
    if (!b.clock_in) return -1
    const [dayA, monthA, yearA] = a.date.split("/").map(Number)
    const [dayB, monthB, yearB] = b.date.split("/").map(Number)
    // Ambil jam pertama jika ada koma
    const clockInA = a.clock_in.split(",")[0].trim()
    const clockInB = b.clock_in.split(",")[0].trim()
    const dateTimeA = new Date(yearA, monthA - 1, dayA, ...clockInA.split(":").map(Number))
    const dateTimeB = new Date(yearB, monthB - 1, dayB, ...clockInB.split(":").map(Number))
    return dateTimeB.getTime() - dateTimeA.getTime()
  })
  const paginatedAttendance = sortedAttendance.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
            <p className="text-gray-600 mt-1">Manage employee attendance records</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 animate-pulse">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">
              <User className="w-12 h-12 mx-auto mb-2" />
              <p className="text-lg font-semibold">Error Loading Data</p>
              <p className="text-sm text-gray-600">{error}</p>
            </div>
            <Button onClick={fetchAttendanceData} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600 mt-1">Manage employee attendance records</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Total Attendance */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">Total Attendance</p>
                <p className="text-2xl font-bold text-gray-900">{attendanceStats.totalAttendance}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* On Time */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">On Time</p>
                <p className="text-2xl font-bold text-green-600">{attendanceStats.onTimeCount}</p>
                <p className="text-xs text-gray-500">Clock-In Before 08:30</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Late Arrival */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">Late Arrival</p>
                <p className="text-2xl font-bold text-yellow-600">{attendanceStats.lateArrivalCount}</p>
                <p className="text-xs text-gray-500">Clock-In After 08:30</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Absent */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">Absent</p>
                <p className="text-2xl font-bold text-red-600">{attendanceStats.absentCount}</p>
                <p className="text-xs text-gray-500">Tidak melakukan clock-in</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <User className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Baris search, calendar, export, dan jumlah attendance */}
      <div className="flex flex-wrap items-center gap-4 mt-4">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black w-4 h-4" />
          <Input
            placeholder="Search name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-gray-300 text-black"
          />
        </div>

        {/* Spacer agar calendar & export ke kanan */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Calendar */}
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowCalendar(!showCalendar)}
              className="w-[200px] justify-start text-left font-normal bg-white border-gray-300 hover:bg-gray-50 text-black"
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
              {selectedDate
                ? `${selectedDate.getDate().toString().padStart(2, "0")} ${selectedDate.toLocaleString("en-US", { month: "long" })} ${selectedDate.getFullYear()}`
                : "Select date"}
            </Button>
            {showCalendar && (
              <div className="absolute top-full left-0 mt-2 z-50">
                <CustomCalendar
                  selectedDate={selectedDate}
                  onDateSelect={(date) => {
                    setSelectedDate(date)
                    setShowCalendar(false)
                  }}
                />
              </div>
            )}
          </div>
          {/* Export Button */}
          <Button
            onClick={fetchAttendanceData}
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

      {/* Click outside to close calendar */}
      {showCalendar && <div className="fixed inset-0 z-40" onClick={() => setShowCalendar(false)} />}

      {/* Attendance Table */}
      <Card className="border-none -m-6 text-black">
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <span className="text-gray-600">Loading attendance...</span>
              </div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm
                  ? "No attendance match your search criteria."
                  : "No attendance data available for this date."}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
                    <TableHead className="text-white font-bold">No</TableHead>
                    <TableHead className="text-white font-bold">Name</TableHead>
                    <TableHead className="text-white font-bold">Date</TableHead>
                    <TableHead className="text-white font-bold">Clock In</TableHead>
                    <TableHead className="text-white font-bold">Clock Out</TableHead>
                    <TableHead className="text-white font-bold">Status</TableHead>
                    <TableHead className="text-white font-bold text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAttendance.map((attendance, index) => {
                    const status = getAttendanceStatus(attendance.clock_in, attendance.clock_out)
                    return (
                      <TableRow key={attendance.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-medium text-start">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </TableCell>
                        <TableCell className="font-medium">{getEmployeeName(attendance.employeeId)}</TableCell>
                        <TableCell>{formatDate(attendance.date)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {/* <Clock className="w-4 h-4 text-green-500" /> */}
                            {formatTime(attendance.clock_in)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {/* <Clock className="w-4 h-4 text-red-500" /> */}
                            {formatTime(attendance.clock_out)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              status.status === "Complete"
                                ? "default"
                                : status.status === "Present"
                                  ? "secondary"
                                  : "destructive"
                            }
                            className={
                              status.status === "Complete"
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : status.status === "Present"
                                  ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                  : "bg-red-100 text-red-800 hover:bg-red-200"
                            }
                          >
                            {status.status}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedRecord(attendance)}
                                  className="hover:bg-blue-50 hover:border-blue-300 bg-white"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl text-black bg-white">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <User className="w-5 h-5" />
                                    Attendance Details
                                  </DialogTitle>
                                </DialogHeader>
                                {selectedRecord && (
                                  <div className="space-y-6">
                                    <div className="flex items-center space-x-4 p-4 rounded-lg">
                                      <div>
                                        <h3 className="text-xl font-semibold">
                                          {getEmployeeName(selectedRecord.employeeId)}
                                        </h3>
                                        <p className=" flex items-center gap-1">
                                          <CalendarIcon className="w-4 h-4" />
                                          {formatDate(selectedRecord.date)}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                      <div className="space-y-4 p-4 border border-green-200 rounded-lg bg-green-50">
                                        <h4 className="font-semibold text-green-700 flex items-center gap-2">
                                          <Clock className="w-4 h-4" />
                                          Clock In Details
                                        </h4>
                                        <div className="space-y-2">
                                          <p>
                                            <span className="font-medium">Time:</span>{" "}
                                            {formatTime(selectedRecord.clock_in)}
                                          </p>
                                          <p className="flex items-start gap-1">
                                            <MapPin className="w-4 h-4 mt-0.5 text-green-600" />
                                            <span>
                                              <span className="font-medium">Location:</span>{" "}
                                              {selectedRecord.location_in || "-"}
                                            </span>
                                          </p>
                                        </div>
                                        {selectedRecord.picture_in && (
                                          <div>
                                            <p className="font-medium mb-2">Photo:</p>
                                            <img
                                              src={
                                                getCacheBustedUrl(
                                                  getLatestPictureUrl(selectedRecord.picture_in),
                                                  `${selectedRecord.id || "/placeholder.svg"}-${selectedRecord.clock_in || ""}`,
                                                ) || "/placeholder.svg"
                                              }
                                              alt="Clock in photo"
                                              className="w-full h-full object-cover rounded-lg border"
                                            />
                                          </div>
                                        )}
                                      </div>

                                      <div className="space-y-4 p-4 border border-red-200 rounded-lg bg-red-50">
                                        <h4 className="font-semibold text-red-700 flex items-center gap-2">
                                          <Clock className="w-4 h-4" />
                                          Clock Out Details
                                        </h4>
                                        <div className="space-y-2">
                                          <p>
                                            <span className="font-medium">Time:</span>{" "}
                                            {formatTime(selectedRecord.clock_out)}
                                          </p>
                                          <p className="flex items-start gap-1">
                                            <MapPin className="w-4 h-4 mt-0.5 text-red-600" />
                                            <span>
                                              <span className="font-medium">Location:</span>{" "}
                                              {selectedRecord.location_out || "-"}
                                            </span>
                                          </p>
                                        </div>
                                        {selectedRecord.picture_out && (
                                          <div>
                                            <p className="font-medium mb-2">Photo:</p>
                                            <img
                                              src={
                                                getCacheBustedUrl(
                                                  getLatestPictureUrl(selectedRecord.picture_out),
                                                  `${selectedRecord.id || "/placeholder.svg"}-${selectedRecord.clock_out || ""}`,
                                                ) || "/placeholder.svg"
                                              }
                                              alt="Clock out photo"
                                              className="w-full h-full object-cover rounded-lg border"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!loading && filteredData.length > itemsPerPage && (
            <div className="flex justify-center items-center gap-4 py-4">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-200 font-medium">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="hover:bg-gray-50"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
