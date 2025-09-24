"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Plus,
  Edit,
  Trash2,
  Search,
  User,
  Phone,
  Mail,
  Building,
  Eye,
  Filter,
  AlertTriangle,
  Download,
} from "lucide-react"
import { toast } from "react-hot-toast"
import * as XLSX from "xlsx"

// Replace with:
const API_URL = "/api/employee"

interface Employee {
  id: string
  employeeId: string
  NIK: string
  name: string
  gender: string
  birth_place: string
  birth_date: string
  religion: string
  address: string
  last_education: string
  blood_type: string
  marital_status: string
  branch: string
  department: string
  job_position: string
  job_level: string
  join_date: string
  employee_status: string
  phone_number: string
  email: string
  password: string
  bank_name: string
  bank_account: string
  profile_picture: string
  annual_leave: string
  birthday_leave: string
}

const initialEmployeeData: Omit<Employee, "id"> = {
  employeeId: "",
  NIK: "",
  name: "",
  gender: "",
  birth_place: "",
  birth_date: "",
  religion: "",
  address: "",
  last_education: "",
  blood_type: "",
  marital_status: "",
  branch: "",
  department: "",
  job_position: "",
  job_level: "",
  join_date: "",
  employee_status: "",
  phone_number: "",
  email: "",
  password: "",
  bank_name: "",
  bank_account: "",
  profile_picture: "",
  annual_leave: "",
  birthday_leave: "",
}

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null
  return null
}

export default function EmployeePage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBranch, setSelectedBranch] = useState("all")
  const [selectedDepartment, setSelectedDepartment] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null)
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState<Omit<Employee, "id">>(initialEmployeeData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const router = useRouter()

  useEffect(() => {
    const userRole = getCookie("userRole")
    if (userRole !== "admin") {
      router.push("/dashboard")
      return
    }
    fetchEmployees()
  }, [router])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch employees")
      }

      const data = await response.json()
      console.log("API Response:", data) // Debug log
      setEmployees(data.data || [])
    } catch (error) {
      console.error("Error fetching employees:", error)
      toast.error("Failed to fetch employees")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = editingEmployee ? `${API_URL}/${editingEmployee.id}` : API_URL
      const method = editingEmployee ? "PUT" : "POST"

      // Buat payload tanpa field Time Off jika kosong (tidak wajib)
      const payload: Partial<typeof formData> = { ...formData }
      if (!payload.annual_leave) {
        delete payload.annual_leave
      }
      if (!payload.birthday_leave) {
        delete payload.birthday_leave
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${editingEmployee ? "update" : "create"} employee`)
      }

      toast.success(`Employee ${editingEmployee ? "updated" : "created"} successfully`)
      setIsDialogOpen(false)
      setEditingEmployee(null)
      setFormData(initialEmployeeData)
      fetchEmployees()
    } catch (error) {
      console.error("Error submitting employee:", error)
      toast.error(`Failed to ${editingEmployee ? "update" : "create"} employee`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormData({
      employeeId: employee.employeeId || "",
      NIK: employee.NIK || "",
      name: employee.name || "",
      gender: employee.gender || "",
      birth_place: employee.birth_place || "",
      birth_date: employee.birth_date || "",
      religion: employee.religion || "",
      address: employee.address || "",
      last_education: employee.last_education || "",
      blood_type: employee.blood_type || "",
      marital_status: employee.marital_status || "",
      branch: employee.branch || "",
      department: employee.department || "",
      job_position: employee.job_position || "",
      job_level: employee.job_level || "",
      join_date: employee.join_date || "",
      employee_status: employee.employee_status || "",
      phone_number: employee.phone_number || "",
      email: employee.email || "",
      password: employee.password || "",
      bank_name: employee.bank_name || "",
      bank_account: employee.bank_account || "",
      profile_picture: employee.profile_picture || "",
      annual_leave: employee.annual_leave || "",
      birthday_leave: employee.birthday_leave || "",
    })
    setIsDialogOpen(true)
  }

  const handleView = (employee: Employee) => {
    setViewingEmployee(employee)
    setIsViewDialogOpen(true)
  }

  const handleDeleteClick = (employee: Employee) => {
    setDeletingEmployee(employee)
    setDeleteConfirmText("")
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingEmployee || deleteConfirmText !== "delete") {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`${API_URL}/${deletingEmployee.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete employee")
      }

      toast.success("Employee deleted successfully")
      setIsDeleteDialogOpen(false)
      setDeletingEmployee(null)
      setDeleteConfirmText("")
      fetchEmployees()
    } catch (error) {
      console.error("Error deleting employee:", error)
      toast.error("Failed to delete employee")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAddNew = () => {
    setEditingEmployee(null)
    setFormData(initialEmployeeData)
    setIsDialogOpen(true)
  }

  const exportToExcel = () => {
    try {
      const dataToExport = filteredEmployees.map((employee, index) => ({
        No: index + 1,
        "Employee ID": employee.employeeId || "",
        NIK: employee.NIK || "",
        "Full Name": employee.name || "",
        Gender: employee.gender || "",
        "Birth Place": employee.birth_place || "",
        "Birth Date": employee.birth_date || "",
        Religion: employee.religion || "",
        Address: employee.address || "",
        "Phone Number": employee.phone_number ? `+62${employee.phone_number.replace(/^0/, "")}` : "",
        Email: employee.email || "",
        Password: employee.password || "",
        "Last Education": employee.last_education || "",
        "Blood Type": employee.blood_type || "",
        "Marital Status": employee.marital_status || "",
        Branch: employee.branch || "",
        Department: employee.department || "",
        "Job Position": employee.job_position || "",
        "Job Level": employee.job_level || "",
        "Join Date": employee.join_date || "",
        "Employee Status": employee.employee_status || "",
        "Bank Name": employee.bank_name || "",
        "Bank Account": employee.bank_account || "",
      }))

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(dataToExport)

      // Set column widths
      const colWidths = [
        { wch: 5 }, // No
        { wch: 15 }, // Employee ID
        { wch: 20 }, // NIK
        { wch: 25 }, // Full Name
        { wch: 10 }, // Gender
        { wch: 20 }, // Birth Place
        { wch: 12 }, // Birth Date
        { wch: 15 }, // Religion
        { wch: 40 }, // Address
        { wch: 18 }, // Phone Number
        { wch: 30 }, // Email
        { wch: 15 }, // Password
        { wch: 20 }, // Last Education
        { wch: 12 }, // Blood Type
        { wch: 15 }, // Marital Status
        { wch: 15 }, // Branch
        { wch: 25 }, // Department
        { wch: 25 }, // Job Position
        { wch: 15 }, // Job Level
        { wch: 12 }, // Join Date
        { wch: 15 }, // Employee Status
        { wch: 20 }, // Bank Name
        { wch: 20 }, // Bank Account
      ]
      ws["!cols"] = colWidths

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Employee Data")

      // Generate filename with current date
      const fileName = `employee_data_${new Date().toISOString().split("T")[0]}.xlsx`

      // Write file using the correct browser method
      XLSX.writeFile(wb, fileName)

      toast.success(`Employee data exported successfully! (${filteredEmployees.length} records)`)
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Failed to export employee data. Please try again.")
    }
  }

  // Safe filtering with null checks
  const filteredEmployees = employees
    .filter((employee) => {
      if (!employee) return false

      const searchLower = searchTerm.toLowerCase()
      const name = (employee.name || "").toLowerCase()
      const employeeId = (employee.employeeId || "").toLowerCase()
      const department = (employee.department || "").toLowerCase()
      const branch = (employee.branch || "").toLowerCase()

      const matchesSearch =
        name.includes(searchLower) ||
        employeeId.includes(searchLower) ||
        department.includes(searchLower) ||
        branch.includes(searchLower)

      const matchesBranch = selectedBranch === "" || selectedBranch === "all" || employee.branch === selectedBranch
      const matchesDepartment =
        selectedDepartment === "" || selectedDepartment === "all" || employee.department === selectedDepartment

      return matchesSearch && matchesBranch && matchesDepartment
    })
    .sort((a, b) => {
      // Sort by name alphabetically (A-Z)
      const nameA = (a.name || "").toLowerCase()
      const nameB = (b.name || "").toLowerCase()
      return nameA.localeCompare(nameB)
    })

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage)
  const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Get unique branches and departments for filter options
  const uniqueBranches = [...new Set(employees.map((emp) => emp.branch).filter(Boolean))]
  const uniqueDepartments = [...new Set(employees.map((emp) => emp.department).filter(Boolean))]

  return (
    <div className="space-y-6 p-6 text-black">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
            <p className="text-gray-500">Manage employee data and information</p>
          </div>
        </div>

        {/* Add & Edit employee  */}
        <div className="flex items-center gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild></DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white text-black">
              {/* Keep all the existing dialog content here */}
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {editingEmployee ? "Edit Employee" : "Add New Employee"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Keep all existing form content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-black border-b border-gray-300 pb-2">
                      Personal Information
                    </h3>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-red-500 font-medium">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="bg-white text-black border-gray-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-red-500 font-medium">
                        Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="bg-white text-black border-gray-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="NIK" className="text-black font-medium">
                        NIK
                      </Label>
                      <Input
                        id="NIK"
                        value={formData.NIK}
                        onChange={(e) => setFormData({ ...formData, NIK: e.target.value })}
                        className="bg-white text-black border-gray-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-black font-medium">
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="bg-white text-black border-gray-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-black font-medium">
                        Gender
                      </Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value) => setFormData({ ...formData, gender: value })}
                      >
                        <SelectTrigger className="bg-white text-black border-gray-300">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent className="bg-white text-black">
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="birth_place" className="text-black font-medium">
                        Birth Place
                      </Label>
                      <Input
                        id="birth_place"
                        value={formData.birth_place}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            birth_place: e.target.value,
                          })
                        }
                        className="bg-white text-black border-gray-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="birth_date" className="text-black font-medium">
                        Birth Date
                      </Label>
                      <Input
                        id="birth_date"
                        type="date"
                        value={formData.birth_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            birth_date: e.target.value,
                          })
                        }
                        className="bg-white text-black border-gray-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="religion" className="text-black font-medium">
                        Religion
                      </Label>
                      <Input
                        id="religion"
                        value={formData.religion}
                        onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                        className="bg-white text-black border-gray-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-black font-medium">
                        Address
                      </Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        rows={3}
                        className="bg-white text-black border-gray-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone_number" className="text-black font-medium">
                        Phone Number
                      </Label>
                      <Input
                        id="phone_number"
                        value={formData.phone_number}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            phone_number: e.target.value,
                          })
                        }
                        className="bg-white text-black border-gray-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_education" className="text-black font-medium">
                        Last Education
                      </Label>
                      <Input
                        id="last_education"
                        value={formData.last_education}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            last_education: e.target.value,
                          })
                        }
                        className="bg-white text-black border-gray-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="blood_type" className="text-black font-medium">
                        Blood Type
                      </Label>
                      <Select
                        value={formData.blood_type}
                        onValueChange={(value) => setFormData({ ...formData, blood_type: value })}
                      >
                        <SelectTrigger className="bg-white text-black border-gray-300">
                          <SelectValue placeholder="Select blood type" />
                        </SelectTrigger>
                        <SelectContent className="bg-white text-black">
                          <SelectItem value="A">A</SelectItem>
                          <SelectItem value="B">B</SelectItem>
                          <SelectItem value="AB">AB</SelectItem>
                          <SelectItem value="O">O</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="marital_status" className="text-black font-medium">
                        Marital Status
                      </Label>
                      <Select
                        value={formData.marital_status}
                        onValueChange={(value) => setFormData({ ...formData, marital_status: value })}
                      >
                        <SelectTrigger className="bg-white text-black border-gray-300">
                          <SelectValue placeholder="Select marital status" />
                        </SelectTrigger>
                        <SelectContent className="bg-white text-black">
                          <SelectItem value="Single">Single</SelectItem>
                          <SelectItem value="Married">Married</SelectItem>
                          <SelectItem value="Divorced">Divorced</SelectItem>
                          <SelectItem value="Widowed">Widowed</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Work Information */}
                  <div className="space-y-4 ">
                    <h3 className="text-lg font-semibold text-black border-b border-gray-300 pb-2">Work Information</h3>

                    <div className="space-y-2">
                      <Label htmlFor="employeeId" className="text-red-500 font-medium">
                        Employee ID
                      </Label>
                      <Input
                        id="employeeId"
                        value={formData.employeeId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            employeeId: e.target.value,
                          })
                        }
                        className="bg-white text-black border-gray-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="branch" className="text-black font-medium">
                        Branch
                      </Label>
                      <Select
                        value={formData.branch}
                        onValueChange={(value) => setFormData({ ...formData, branch: value })}
                      >
                        <SelectTrigger className="bg-white text-black border-gray-300">
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                        <SelectContent className="bg-white text-black">
                          <SelectItem value="Cretivox">Cretivox</SelectItem>
                          <SelectItem value="Condfe">Condfe</SelectItem>
                          <SelectItem value="OGS">OGS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="department" className="text-black font-medium">
                        Department
                      </Label>
                      <Select
                        value={formData.department}
                        onValueChange={(value) => setFormData({ ...formData, department: value })}
                      >
                        <SelectTrigger className="bg-white text-black border-gray-300">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent className="bg-white text-black">
                          <SelectItem value="Creative">Creative</SelectItem>
                          <SelectItem value="Digital">Digital</SelectItem>
                          <SelectItem value="Video Editor">Video Editor</SelectItem>
                          <SelectItem value="Production">Production</SelectItem>
                          <SelectItem value="Sales & Marketing">Sales & Marketing</SelectItem>
                          <SelectItem value="Community">Community</SelectItem>
                          <SelectItem value="IT">IT</SelectItem>
                          <SelectItem value="Human Resources Department">Human Resources</SelectItem>
                          <SelectItem value="Finance & Accounting">Finance & Accounting</SelectItem>
                          <SelectItem value="Support">Support</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="job_position" className="text-black font-medium">
                        Job Position
                      </Label>
                      <Input
                        id="job_position"
                        value={formData.job_position}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            job_position: e.target.value,
                          })
                        }
                        className="bg-white text-black border-gray-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="job_level" className="text-black font-medium">
                        Job Level
                      </Label>
                      <Input
                        id="job_level"
                        value={formData.job_level}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            job_level: e.target.value,
                          })
                        }
                        className="bg-white text-black border-gray-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="join_date" className="text-black font-medium">
                        Join Date
                      </Label>
                      <Input
                        id="join_date"
                        type="date"
                        value={formData.join_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            join_date: e.target.value,
                          })
                        }
                        className="bg-white text-black border-gray-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="employee_status" className="text-black font-medium">
                        Employee Status
                      </Label>
                      <Select
                        value={formData.employee_status}
                        onValueChange={(value) => setFormData({ ...formData, employee_status: value })}
                      >
                        <SelectTrigger className="bg-white text-black border-gray-300">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="bg-white text-black">
                          <SelectItem value="Contract">Contract</SelectItem>
                          <SelectItem value="Probation">Probation</SelectItem>
                          <SelectItem value="Permanent">Permanent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Bank Information within Work Information section */}
                    <div className="">
                      <h4 className="text-md font-semibold text-black mb-4 mt-12">Bank Information</h4>
                      <div className="pt-4 border-t border-gray-200"></div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="bank_name" className="text-black font-medium">
                            Bank Name
                          </Label>
                          <Input
                            id="bank_name"
                            value={formData.bank_name}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                bank_name: e.target.value,
                              })
                            }
                            className="bg-white text-black border-gray-300"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="bank_account" className="text-black font-medium">
                            Bank Account
                          </Label>
                          <Input
                            id="bank_account"
                            value={formData.bank_account}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                bank_account: e.target.value,
                              })
                            }
                            className="bg-white text-black border-gray-300"
                          />
                        </div>

                        {/* Time Off */}
                        <div className="">
                          <h4 className="text-md font-semibold text-black mb-3 mt-12">Time Off Information</h4>
                           <div className="pt-4 border-t border-gray-200"></div>
                          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="annual_leave" className="text-black font-medium">
                                Annual Leave
                              </Label>
                              <Input
                                id="annual_leave"
                                value={formData.annual_leave}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    annual_leave: e.target.value,
                                  })
                                }
                                className="bg-white text-black border-gray-300"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="birthday_leave" className="text-black font-medium">
                                Birthday Leave
                              </Label>
                              <Input
                                id="birthday_leave"
                                value={formData.birthday_leave}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    birthday_leave: e.target.value,
                                  })
                                }
                                className="bg-white text-black border-gray-300"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isSubmitting}
                    className="bg-white text-black border-gray-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gradient-to-r text-white from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {editingEmployee ? "Updating..." : "Creating..."}
                      </div>
                    ) : editingEmployee ? (
                      "Update Employee"
                    ) : (
                      "Create Employee"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
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
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-40 bg-white">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent className="bg-white text-black">
                <SelectItem value="all">All Branches</SelectItem>
                {uniqueBranches.map((branch) => (
                  <SelectItem key={branch} value={branch}>
                    {branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-48 bg-white">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent className="bg-white text-black">
                <SelectItem value="all">All Departments</SelectItem>
                {uniqueDepartments.map((department) => (
                  <SelectItem key={department} value={department}>
                    {department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border">
              Total: {filteredEmployees.length} employees
            </div>
          </div>
          <div className="justify-end ml-auto flex items-center gap-2">
            <Button
            onClick={handleAddNew}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md bg-white text-black">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete Employee
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> This action cannot be undone. This will permanently delete the employee
                record.
              </p>
            </div>

            {deletingEmployee && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Employee to be deleted:</strong>
                </p>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Name:</strong> {deletingEmployee.name}
                  </p>
                  <p>
                    <strong>Employee ID:</strong> {deletingEmployee.employeeId}
                  </p>
                  <p>
                    <strong>Department:</strong> {deletingEmployee.department}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="deleteConfirm" className="text-black font-medium">
                Type <span className="font-mono bg-gray-100 px-1 rounded">delete</span> to confirm:
              </Label>
              <Input
                id="deleteConfirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type 'delete' here"
                className="bg-white text-black border-gray-300"
                autoComplete="off"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false)
                  setDeletingEmployee(null)
                  setDeleteConfirmText("")
                }}
                disabled={isDeleting}
                className="bg-white text-black border-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                disabled={deleteConfirmText !== "delete" || isDeleting}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </div>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Employee
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Employee Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white text-black">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Employee Details
            </DialogTitle>
          </DialogHeader>
          {viewingEmployee && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-black border-b border-gray-300 pb-2">
                    Personal Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Email:</span>
                      <span className="text-black">{viewingEmployee.email || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Password:</span>
                      <span className="text-black">{"*".repeat((viewingEmployee.password || "").length) || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">NIK:</span>
                      <span className="text-black">{viewingEmployee.NIK || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Full Name:</span>
                      <span className="text-black">{viewingEmployee.name || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Gender:</span>
                      <span className="text-black">{viewingEmployee.gender || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Birth Place:</span>
                      <span className="text-black">{viewingEmployee.birth_place || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Birth Date:</span>
                      <span className="text-black">{viewingEmployee.birth_date || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Religion:</span>
                      <span className="text-black">{viewingEmployee.religion || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Address:</span>
                      <span className="text-black text-right max-w-xs">{viewingEmployee.address || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Phone Number:</span>
                      <span className="text-black">
                        {viewingEmployee.phone_number ? `+62${viewingEmployee.phone_number.replace(/^0/, "")}` : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Last Education:</span>
                      <span className="text-black">{viewingEmployee.last_education || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Blood Type:</span>
                      <span className="text-black">{viewingEmployee.blood_type || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Marital Status:</span>
                      <span className="text-black">{viewingEmployee.marital_status || "-"}</span>
                    </div>
                  </div>
                </div>

                {/* Work Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-black border-b border-gray-300 pb-2">Work Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Employee ID:</span>
                      <span className="text-black">{viewingEmployee.employeeId || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Branch:</span>
                      <span className="text-black">{viewingEmployee.branch || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Department:</span>
                      <span className="text-black">{viewingEmployee.department || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Job Position:</span>
                      <span className="text-black">{viewingEmployee.job_position || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Job Level:</span>
                      <span className="text-black">{viewingEmployee.job_level || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Join Date:</span>
                      <span className="text-black">{viewingEmployee.join_date || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Employee Status:</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          viewingEmployee.employee_status === "Active"
                            ? "bg-green-100 text-green-800"
                            : viewingEmployee.employee_status === "Inactive"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {viewingEmployee.employee_status || "Unknown"}
                      </span>
                    </div>
                  </div>

                  {/* Bank Information within Work Information section */}
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-md font-semibold text-black mb-3">Bank Information</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Bank Name:</span>
                        <span className="text-black">{viewingEmployee.bank_name || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Bank Account:</span>
                        <span className="text-black">{viewingEmployee.bank_account || "-"}</span>
                      </div>
                    </div>

                    {/* Time Off */}
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="text-md font-semibold text-black mb-3">Time Off Information</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Annual Leave:</span>
                          <span className="text-black">{viewingEmployee.annual_leave || "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Birthday Leave:</span>
                          <span className="text-black">{viewingEmployee.birthday_leave || "-"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={() => setIsViewDialogOpen(false)} className="bg-gray-500 hover:bg-gray-600 text-white">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Table */}
      <Card className="border-none -m-6">
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <span className="text-gray-600">Loading employees...</span>
              </div>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ||
                (selectedBranch !== "all" && selectedBranch !== "") ||
                (selectedDepartment !== "all" && selectedDepartment !== "")
                  ? "No employees match your search criteria."
                  : "Get started by adding your first employee."}
              </p>
              {!searchTerm &&
                (selectedBranch === "all" || selectedBranch === "") &&
                (selectedDepartment === "all" || selectedDepartment === "") && (
                  <Button
                    onClick={handleAddNew}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Employee
                  </Button>
                )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 ">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
                    <TableHead className="text-white font-bold">No</TableHead>
                    <TableHead className="text-white font-bold">Employee ID</TableHead>
                    <TableHead className="text-white font-bold">Picture</TableHead>
                    <TableHead className="text-white font-bold">Name</TableHead>
                    <TableHead className="text-white font-bold">Department</TableHead>
                    <TableHead className="text-white font-bold">Branch</TableHead>
                    <TableHead className="text-white font-bold">Position</TableHead>
                    <TableHead className="text-white font-bold">Status</TableHead>
                    <TableHead className="text-white font-bold">Contact</TableHead>
                    <TableHead className="text-white font-bold text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEmployees.map((employee, index) => (
                    <TableRow key={employee.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="font-medium text-center">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </TableCell>
                      <TableCell className="font-medium">{employee.employeeId || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          {employee.profile_picture ? (
                            <img
                              src={employee.profile_picture || "/placeholder.svg"}
                              alt={`${employee.name || "Employee"} profile`}
                              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                              onError={(e) => {
                                // Fallback to initials if image fails to load
                                const target = e.target as HTMLImageElement
                                target.style.display = "none"
                                target.nextElementSibling?.classList.remove("hidden")
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                              employee.profile_picture ? "hidden" : ""
                            }`}
                          >
                            {(employee.name || "?").charAt(0).toUpperCase()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium">{employee.name || "-"}</div>
                            <div className="text-sm text-gray-500">{employee.NIK || "-"}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          {employee.department || "-"}
                        </div>
                      </TableCell>
                      <TableCell>{employee.branch || "-"}</TableCell>
                      <TableCell>{employee.job_position || "-"}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            employee.employee_status === "Active"
                              ? "bg-green-100 text-green-800"
                              : employee.employee_status === "Inactive"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {employee.employee_status || "Unknown"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {employee.phone_number ? `+62${employee.phone_number.replace(/^0/, "")}` : "-"}
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="w-3 h-3 text-gray-400" />
                            {employee.email || "-"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(employee)}
                            className="bg-white hover:bg-green-50 hover:border-green-300 text-green-600"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(employee)}
                            className="bg-white hover:bg-blue-50 hover:border-blue-300"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(employee)}
                            className="bg-white hover:bg-red-50 hover:border-red-300 text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!loading && filteredEmployees.length > itemsPerPage && (
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
