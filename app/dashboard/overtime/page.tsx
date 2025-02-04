"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import * as XLSX from "xlsx"
import { Button } from "@/components/ui/button"
import { toast } from "react-hot-toast"

const API_URL = "https://hris-api-kappa.vercel.app/api/v1/overtime?pageSize=200" // Mengubah ke /api/v1/overtime
const AUTH_TOKEN = "Bearer $2a$12$JSyMjCxUTNmGBlAQOQQeaOFrOdtdUmn.U/17DlvOK1t.Ot0BTRGli"

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null
  return null
}

export default function OvertimePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)
  const [overtimeRequests, setOvertimeRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  useEffect(() => {
    const userRole = getCookie("userRole")
    if (userRole === "admin") {
      setIsAdmin(true)
    } else if (userRole !== "user") {
      router.push("/login")
    }
  }, [router])

  useEffect(() => {
    const fetchOvertimeRequests = async () => {
      try {
        console.log("Fetching from URL:", API_URL)

        const response = await fetch(API_URL, {
          method: "GET",
          headers: {
            Authorization: AUTH_TOKEN,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        })

        console.log("Response status:", response.status)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

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

  // Modifikasi filter untuk struktur data yang benar dan menambahkan pengurutan
  const filteredRequests = overtimeRequests
    .filter((request: any) => {
      const name = request.data?.overtime_name || ""
      return name.toLowerCase().includes(searchTerm.toLowerCase())
    })
    .filter((request: any) => {
      const dept = request.data?.department || ""
      return selectedDepartment === "" || dept === selectedDepartment
    })
    .sort((a: any, b: any) => {
      const nameA = (a.data?.overtime_name || "").toLowerCase()
      const nameB = (b.data?.overtime_name || "").toLowerCase()
      return nameA.localeCompare(nameB)
    })

  // Log hasil filter
  console.log("Filtered requests:", filteredRequests)

  const totalPages = Math.ceil(overtimeRequests.length / itemsPerPage)
  const paginatedRequests = filteredRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const exportToExcel = () => {
    // Menyiapkan data untuk ekspor
    const dataToExport = filteredRequests.map((request: any) => ({
      Employee: request.data.overtime_name,
      Branch: request.data.branch,
      Department: request.data.department,
      Position: request.data.position,
      Date: request.data.date,
      "Start Time": request.data.start_time,
      "End Time": request.data.end_time,
      "Total Hours": request.data.count_time,
      Category: request.data.category,
      "Overtime Pay": request.data.overtime,
      "Management Approval": request.data.management_approval || "Pending",
      "HR Approval": request.data.hr_approval || "Pending",
      "Brand Approval": request.data.brand_approval || "Pending",
    }))

    // Membuat workbook baru
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(dataToExport)

    // Menambahkan worksheet ke workbook
    XLSX.utils.book_append_sheet(wb, ws, "Overtime Data")

    // Menyimpan file
    XLSX.writeFile(wb, "overtime_data.xlsx")
  }

  const handleApprove = async (id: string, approvalType: string) => {
    try {
      const response = await fetch(`/api/overtime/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, approvalType }),
      });
  
      if (!response.ok) {
        throw new Error("Gagal menyetujui");
      }
  
      // Mengubah status menjadi "Approved" agar sesuai dengan kondisi render
      setOvertimeRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === id
            ? { ...req, data: { ...req.data, [`${approvalType}_approval`]: "Approved" } }
            : req
        )
      );
  
      toast.success("Berhasil disetujui");
    } catch (error) {
      console.error("Error menyetujui permintaan:", error);
      toast.error("Gagal menyetujui permintaan");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Overtime Submission</h1>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button onClick={exportToExcel} className="bg-green-500 text-black px-4 py-2 rounded hover:bg-green-600">
              Export to Excel
            </button>
          )}
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="border border-black p-2 rounded ml-2"
          >
            <option value="">All Departments</option>
            <option value="Condfe">Condfe</option>
            <option value="Creative">Creative</option>
            <option value="Digital">Digital</option>
            <option value="Editor">Editor</option>
            <option value="Production">Production</option>
            <option value="Marketing">Marketing</option>
            <option value="Community">Community</option>
            <option value="IT">IT</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Finance & Accounting">Finance</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">Error: {error}</p>
      ) : (
        <Table className="border border-gray-300 bg-white shadow-md">
          <TableHeader>
            <TableRow className="bg-blue-500 text-white border-r border-gray-300 font-bold">
              <TableHead className=" font-bold border-r border-gray-300">Name</TableHead>
              <TableHead className="font-bold whitespace-nowrap border-r border-gray-300">Branch</TableHead>
              <TableHead className="font-bold whitespace-nowrap border-r border-gray-300">Department</TableHead>
              <TableHead className="font-bold whitespace-nowrap border-r border-gray-300">Position</TableHead>
              <TableHead className="font-bold whitespace-nowrap border-r border-gray-300">Date</TableHead>
              <TableHead className="font-bold whitespace-nowrap border-r border-gray-300">Start Time</TableHead>
              <TableHead className="font-bold whitespace-nowrap border-r border-gray-300">End Time</TableHead>
              <TableHead className="font-bold whitespace-nowrap border-r border-gray-300">Total Hours</TableHead>
              <TableHead className="font-bold whitespace-nowrap border-r border-gray-300">Category</TableHead>
              {isAdmin && (
                <>
                  <TableHead className="font-bold whitespace-nowrap border-r border-gray-300">Overtime Pay</TableHead>
                </>
              )}
              <TableHead className="font-bold whitespace-nowrap border-r border-gray-300">
                Management Approval
              </TableHead>
              {isAdmin && (
                <>
                  <TableHead className="font-bold whitespace-nowrap border-r border-gray-300">HR Approval</TableHead>
                  <TableHead className="font-bold whitespace-nowrap border-r border-gray-300">Brand Approval</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRequests.map((request: any) => (
              <TableRow key={request.id}>
                <TableCell className="border-r whitespace-nowrap border-gray-300">
                  {request.data.overtime_name}
                </TableCell>
                <TableCell className="border-r whitespace-nowrap border-gray-300">{request.data.branch}</TableCell>
                <TableCell className="border-r whitespace-nowrap border-gray-300">{request.data.department}</TableCell>
                <TableCell className="border-r whitespace-nowrap border-gray-300">{request.data.position}</TableCell>
                <TableCell className="border-r whitespace-nowrap border-gray-300">{request.data.date}</TableCell>
                <TableCell className="border-r whitespace-nowrap border-gray-300">{request.data.start_time}</TableCell>
                <TableCell className="border-r whitespace-nowrap border-gray-300">{request.data.end_time}</TableCell>
                <TableCell className="border-r whitespace-nowrap border-gray-300">
                  {request.data.count_time} hours
                </TableCell>
                <TableCell className="border-r whitespace-nowrap border-gray-300">{request.data.category}</TableCell>
                {isAdmin && (
                  <>
                    <TableCell className="border-r whitespace-nowrap border-gray-300">
                      Rp. {request.data.overtime?.toLocaleString() || ""}
                    </TableCell>
                  </>
                )}
                <TableCell className="border-r whitespace-nowrap border-gray-300">
                  {request.data.management_approval || "Pending"}
                  {isAdmin && request.data.management_approval !== "Approved" && (
                    <Button
                      onClick={() => handleApprove(request.id, "management")}
                      className="ml-2 bg-green-500 text-white px-2 py-1 rounded text-sm"
                    >
                      Approve
                    </Button>
                  )}
                  {!isAdmin && request.data.management_approval !== "Approved" && (
                    <Button
                      onClick={() => handleApprove(request.id, "management")}
                      className="ml-2 bg-green-500 text-white px-2 py-1 rounded text-sm"
                    >
                      Approve
                    </Button>
                  )}
                </TableCell>
                {isAdmin && (
                  <>
                    <TableCell className="border-r whitespace-nowrap border-gray-300">
                      {request.data.hr_approval || "Pending"}
                      {isAdmin && request.data.hr_approval !== "Approved" && (
                        <Button
                          onClick={() => handleApprove(request.id, "hr")}
                          className="ml-2 bg-green-500 text-white px-2 py-1 rounded text-sm"
                        >
                          Approve
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="border-r whitespace-nowrap border-gray-300">
                      {request.data.brand_approval || "Pending"}
                      {isAdmin && request.data.brand_approval !== "Approved" && (
                        <Button
                          onClick={() => handleApprove(request.id, "brand")}
                          className="ml-2 bg-green-500 text-white px-2 py-1 rounded text-sm"
                        >
                          Approve
                        </Button>
                      )}
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <div className="flex justify-center">
        <button className="mr-2 bg-blue-500 text-white px-2 py-1 rounded"
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span className=" px-2 py-1">Page {currentPage} of {totalPages}</span>
        <button className="ml-2 bg-blue-500 text-white px-2 py-1 rounded"
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  )
}

