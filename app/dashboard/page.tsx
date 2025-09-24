"use client"

import { useState, useEffect } from "react"
import { Users, Building2, UserCheck, Calendar, ChevronUp, ChevronDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChartContainer } from "@/components/ui/chart"
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar } from "recharts"

interface Employee {
  id: string
  employee_status: string
  job_level: string
  gender: string
  profile_picture?: string
  [key: string]: any
}

interface EmploymentStatusData {
  total: number
  permanent: number
  contract: number
  probation: number
}

interface JobLevelData {
  total: number
  seniorStaff: number
  middleStaff: number
  juniorStaff: number
}

interface GenderData {
  total: number
  male: number
  female: number
}

interface AttendanceRecord {
  id?: string
  name?: string
  date: string
  clock_in?: string
}

export default function MainDashboardPage() {
  const [employeeCount, setEmployeeCount] = useState(0)
  const [departmentCount, setDepartmentCount] = useState(0)
  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatusData>({
    total: 0,
    permanent: 0,
    contract: 0,
    probation: 0,
  })
  const [jobLevel, setJobLevel] = useState<JobLevelData>({
    total: 0,
    seniorStaff: 0,
    middleStaff: 0,
    juniorStaff: 0,
  })
  const [genderData, setGenderData] = useState<GenderData>({
    total: 0,
    male: 0,
    female: 0,
  })
  const [branchCount, setBranchCount] = useState(0)
  const [companyCounts, setCompanyCounts] = useState({
    cretivox: 0,
    condfe: 0,
    ogs: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [allBirthdays, setAllBirthdays] = useState<{ name: string; birth_date: string; age: number; profile_picture?: string }[]>([])
  const [birthdaysThisMonth, setBirthdaysThisMonth] = useState<
    { name: string; birth_date: string; age: number; profile_picture?: string }[]
  >([])
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [showMonthDropdown, setShowMonthDropdown] = useState<boolean>(false)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const [greeting, setGreeting] = useState("")
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth())
  const [calendarYear, setCalendarYear] = useState<number>(new Date().getFullYear())
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([])
  const [attendanceCounts, setAttendanceCounts] = useState<{ day: number; count: number }[]>([])
  const [attendanceLoading, setAttendanceLoading] = useState<boolean>(false)
  const [attendanceMonth, setAttendanceMonth] = useState<number>(new Date().getMonth() + 1)
  const [attendanceYear, setAttendanceYear] = useState<number>(new Date().getFullYear())

  // Function to get greeting based on current time
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) {
      return "Good morning"
    } else if (hour < 18) {
      return "Good afternoon"
    } else {
      return "Good evening"
    }
  }

  useEffect(() => {
    // Set initial greeting
    setGreeting(getGreeting())
    
    // Update greeting every minute
    const interval = setInterval(() => {
      setGreeting(getGreeting())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch employee data from internal API route
        const employeeResponse = await fetch("/api/dashboard/employee", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        })

        if (!employeeResponse.ok) {
          throw new Error("Failed to fetch employee data")
        }

        const employeeData = await employeeResponse.json()
        let employees: Employee[] = []

        // Check if the data structure is as expected
        if (employeeData && Array.isArray(employeeData.data)) {
          employees = employeeData.data
          setEmployeeCount(employeeData.data.length)
        } else if (employeeData && Array.isArray(employeeData.employee)) {
          employees = employeeData.employee
          setEmployeeCount(employeeData.employee.length)
        } else if (employeeData && typeof employeeData === "object") {
          // Try to find any array in the response that might contain employees
          const possibleArrays = Object.values(employeeData).filter((val) => Array.isArray(val))
          if (possibleArrays.length > 0) {
            employees = possibleArrays[0] as Employee[]
            setEmployeeCount(possibleArrays[0].length)
          } else {
            setEmployeeCount(0)
          }
        } else {
          setEmployeeCount(0)
        }

        // Hitung jumlah departemen unik dari kemungkinan nama field yang berbeda
        const departmentKeys = [
          "department",
          "dept",
          "division",
          "unit",
          "department_name",
          "departement",
          "section",
          "group",
          "org",
          "organization",
          "organization_name",
        ] as const

        const uniqueDepartments = new Set<string>()
        employees.forEach((employee: Employee) => {
          let deptValue: unknown = undefined
          for (const key of departmentKeys) {
            if (employee[key] !== undefined && employee[key] !== null) {
              deptValue = employee[key]
              break
            }
          }

          if (typeof deptValue === "string") {
            const normalized = deptValue.trim()
            if (normalized) uniqueDepartments.add(normalized.toLowerCase())
          }
        })
        setDepartmentCount(uniqueDepartments.size)

        // Hitung jumlah branch unik dari kemungkinan nama field yang berbeda
        const branchKeys = [
          "branch",
          "branch_name",
          "location",
          "office",
          "site",
          "work_location",
        ] as const

        const uniqueBranches = new Set<string>()
        employees.forEach((employee: Employee) => {
          let branchValue: unknown = undefined
          for (const key of branchKeys) {
            if (employee[key] !== undefined && employee[key] !== null) {
              branchValue = employee[key]
              break
            }
          }

          if (typeof branchValue === "string") {
            const normalized = branchValue.trim()
            if (normalized) uniqueBranches.add(normalized.toLowerCase())
          }
        })
        setBranchCount(uniqueBranches.size)

        // Hitung jumlah karyawan untuk Cretivox, Condfe, dan OGS dari field branch
        let cretivox = 0
        let condfe = 0
        let ogs = 0

        employees.forEach((employee: Employee) => {
          const branchValue = typeof employee["branch"] === "string" ? employee["branch"].trim().toLowerCase() : ""
          if (!branchValue) return
          if (branchValue === "cretivox") cretivox++
          if (branchValue === "condfe") condfe++
          if (branchValue === "ogs") ogs++
        })
        setCompanyCounts({ cretivox, condfe, ogs })

        // Process employment status data
        const statusCounts = {
          total: employees.length,
          permanent: 0,
          contract: 0,
          probation: 0,
        }

        employees.forEach((employee: Employee) => {
          const status = employee.employee_status?.toLowerCase()
          if (status === "permanent") {
            statusCounts.permanent++
          } else if (status === "contract") {
            statusCounts.contract++
          } else if (status === "probation") {
            statusCounts.probation++
          }
        })

        setEmploymentStatus(statusCounts)

        // Process job level data
        const jobLevelCounts = {
          total: employees.length,
          seniorStaff: 0,
          middleStaff: 0,
          juniorStaff: 0,
        }

        employees.forEach((employee: Employee) => {
          const level = employee.job_level?.toLowerCase()
          if (level === "senior staff" || level === "senior") {
            jobLevelCounts.seniorStaff++
          } else if (level === "middle staff" || level === "middle") {
            jobLevelCounts.middleStaff++
          } else if (level === "junior staff" || level === "junior") {
            jobLevelCounts.juniorStaff++
          }
        })

        setJobLevel(jobLevelCounts)

        // Process gender data
        const genderCounts = {
          total: employees.length,
          male: 0,
          female: 0,
        }

        employees.forEach((employee: Employee) => {
          const gender = employee.gender?.toLowerCase()
          if (gender === "male" || gender === "m") {
            genderCounts.male++
          } else if (gender === "female" || gender === "f") {
            genderCounts.female++
          }
        })

        setGenderData(genderCounts)

        // Setelah proses gender data, tambahkan proses ulang tahun:
        // Asumsi nama field nama karyawan adalah "name" dan tanggal lahir "birth_date"
        const now = new Date()
        const thisMonth = now.getMonth() + 1 // getMonth() 0-based
        const today = now.getDate()
        const allBdays = employees
          .filter((emp) => emp.birth_date)
          .map((emp) => {
            const [year, month, day] = emp.birth_date.split("-").map(Number)
            // Hitung umur
            let age = now.getFullYear() - year
            if (
              month > thisMonth ||
              (month === thisMonth && day > today)
            ) {
              age--
            }
            return {
              name: emp.name || emp.full_name || "Tanpa Nama",
              birth_date: emp.birth_date,
              age,
              profile_picture: emp.profile_picture,
            }
          })
          .sort((a, b) => {
            // Urutkan berdasarkan bulan dan tanggal
            const [ , monthA, dayA ] = a.birth_date.split("-").map(Number)
            const [ , monthB, dayB ] = b.birth_date.split("-").map(Number)
            if (monthA !== monthB) return monthA - monthB
            return dayA - dayB
          })
        setAllBirthdays(allBdays)
        // Data ulang tahun bulan ini tetap untuk default
        const birthdays = allBdays.filter((b) => {
          const [ , month ] = b.birth_date.split("-").map(Number)
          return month === thisMonth
        })
        setBirthdaysThisMonth(birthdays)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Fetch attendance once
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setAttendanceLoading(true)
        const res = await fetch("/api/attendance", { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to fetch attendance data")
        const json = await res.json()
        const rows: AttendanceRecord[] = (json?.data || []) as AttendanceRecord[]
        setAttendanceData(rows)
      } catch (e) {
        // silent fail on dashboard summary
      } finally {
        setAttendanceLoading(false)
      }
    }
    fetchAttendance()
  }, [])

  // Recompute counts when month/year or data changes
  useEffect(() => {
    const year = attendanceYear
    const month = attendanceMonth // 1-12
    if (!year || !month) return

    const daysInMonth = new Date(year, month, 0).getDate()
    const counts = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, count: 0 }))

    for (const rec of attendanceData) {
      if (!rec?.date) continue
      const [dStr, mStr, yStr] = rec.date.split("/")
      const d = parseInt(dStr || "", 10)
      const m = parseInt(mStr || "", 10)
      const y = parseInt(yStr || "", 10)
      if (!d || !m || !y) continue
      if (m === month && y === year && rec.clock_in && rec.clock_in.trim() !== "") {
        if (d >= 1 && d <= daysInMonth) {
          counts[d - 1].count += 1
        }
      }
    }

    setAttendanceCounts(counts)
  }, [attendanceData, attendanceMonth, attendanceYear])

  // Tutup dropdown saat klik di luar area
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const dropdown = document.getElementById("month-dropdown")
      const btn = document.getElementById("calendar-btn")
      const target = e.target as Node | null
      if (
        showMonthDropdown &&
        dropdown &&
        !dropdown.contains(target as Node) &&
        btn &&
        !btn.contains(target as Node)
      ) {
        setShowMonthDropdown(false)
      }
    }
    const updateDropdownPos = () => {
      const btn = document.getElementById("calendar-btn")
      if (!btn) return
      const rect = btn.getBoundingClientRect()
      const dropdownWidth = 224 // w-56 (14rem)
      const gutter = 8
      const desiredLeft = rect.right + window.scrollX - dropdownWidth
      const maxLeft = window.scrollX + window.innerWidth - gutter - dropdownWidth
      const minLeft = window.scrollX + gutter
      const clampedLeft = Math.max(minLeft, Math.min(desiredLeft, maxLeft))
      const top = rect.bottom + window.scrollY + gutter
      setDropdownPos({ top, left: clampedLeft })
    }
    if (showMonthDropdown) {
      document.addEventListener("mousedown", handleClickOutside)
      window.addEventListener("resize", updateDropdownPos)
      window.addEventListener("scroll", updateDropdownPos, true)
      // hitung saat buka
      updateDropdownPos()
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      window.removeEventListener("resize", updateDropdownPos)
      window.removeEventListener("scroll", updateDropdownPos, true)
    }
  }, [showMonthDropdown])

  // Calculate percentages for employment status
  const permanentPercentage =
    employmentStatus.total > 0 ? (employmentStatus.permanent / employmentStatus.total) * 100 : 0
  const contractPercentage = employmentStatus.total > 0 ? (employmentStatus.contract / employmentStatus.total) * 100 : 0
  const probationPercentage =
    employmentStatus.total > 0 ? (employmentStatus.probation / employmentStatus.total) * 100 : 0

  // Calculate percentages for job level
  const seniorStaffPercentage = jobLevel.total > 0 ? (jobLevel.seniorStaff / jobLevel.total) * 100 : 0
  const middleStaffPercentage = jobLevel.total > 0 ? (jobLevel.middleStaff / jobLevel.total) * 100 : 0
  const juniorStaffPercentage = jobLevel.total > 0 ? (jobLevel.juniorStaff / jobLevel.total) * 100 : 0

  // Calculate percentages for gender
  const malePercentage = genderData.total > 0 ? (genderData.male / genderData.total) * 100 : 0
  const femalePercentage = genderData.total > 0 ? (genderData.female / genderData.total) * 100 : 0

  // Calculate angles for donut chart
  const maleAngle = (malePercentage / 100) * 360
  const femaleAngle = (femalePercentage / 100) * 360

  const createDonutPath = (startAngle: number, endAngle: number, innerRadius: number, outerRadius: number) => {
    const start = polarToCartesian(50, 50, outerRadius, endAngle)
    const end = polarToCartesian(50, 50, outerRadius, startAngle)
    const innerStart = polarToCartesian(50, 50, innerRadius, endAngle)
    const innerEnd = polarToCartesian(50, 50, innerRadius, startAngle)

    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"

    return [
      "M",
      start.x,
      start.y,
      "A",
      outerRadius,
      outerRadius,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
      "L",
      innerEnd.x,
      innerEnd.y,
      "A",
      innerRadius,
      innerRadius,
      0,
      largeArcFlag,
      1,
      innerStart.x,
      innerStart.y,
      "Z",
    ].join(" ")
  }

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    }
  }

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ]

  const monthNamesShort = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
  ]

  // Current month/year for dropdown styling (past/current months black, future months gray)
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  const filteredBirthdays = allBirthdays.filter((b) => {
    const [ , month ] = b.birth_date.split("-").map(Number)
    return month === selectedMonth
  })
  .map((b) => {
    // Hitung umur pada tahun yang dipilih (umur saat ulang tahun di tahun tersebut)
    const [year] = b.birth_date.split("-").map(Number)
    const age = selectedYear - year
    return { ...b, age }
  })

  // Onboarding Calendar Component
  const OnboardingCalendar = () => {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    

    const getDaysInMonth = (month: number, year: number) => {
      return new Date(year, month + 1, 0).getDate()
    }

    const getFirstDayOfMonth = (month: number, year: number) => {
      return new Date(year, month, 1).getDay()
    }

    const daysInMonth = getDaysInMonth(calendarMonth, calendarYear)
    const firstDay = getFirstDayOfMonth(calendarMonth, calendarYear)
    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }

    const isToday = (day: number) => {
      return day === today.getDate() && 
             calendarMonth === today.getMonth() && 
             calendarYear === today.getFullYear()
    }

    const isWeekend = (day: number) => {
      const dayOfWeek = new Date(calendarYear, calendarMonth, day).getDay()
      return dayOfWeek === 0 || dayOfWeek === 6
    }

    const isFutureDay = (day: number) => {
      const cellDate = new Date(calendarYear, calendarMonth, day)
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      return cellDate > todayStart
    }

    const navigateMonth = (direction: 'prev' | 'next') => {
      if (direction === 'prev') {
        if (calendarMonth === 0) {
          setCalendarMonth(11)
          setCalendarYear(calendarYear - 1)
        } else {
          setCalendarMonth(calendarMonth - 1)
        }
      } else {
        if (calendarMonth === 11) {
          setCalendarMonth(0)
          setCalendarYear(calendarYear + 1)
        } else {
          setCalendarMonth(calendarMonth + 1)
        }
      }
    }

    return (
      <div className="space-y-4">
        {/* Calendar Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {monthNames[calendarMonth]} {calendarYear}
          </h3>
          <div className="flex gap-1">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronUp className="h-4 w-4 rotate-[-90deg]" />
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronUp className="h-4 w-4 rotate-90" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="space-y-2">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
              <div key={index} className="text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (day === null) {
                return <div key={index} className="h-8"></div>
              }

              const isCurrentDay = isToday(day)
              const isWeekendDay = isWeekend(day)
              const isFuture = isFutureDay(day)

              return (
                <div
                  key={index}
                  className={`h-8 flex items-center justify-center text-sm rounded-md transition-colors cursor-pointer ${
                    isCurrentDay
                      ? 'bg-blue-500 text-white font-semibold'
                      : isFuture
                      ? 'text-gray-400'
                      : isWeekendDay
                      ? 'text-red-500 hover:bg-red-50'
                      : 'text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {day}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen text-black">
      {/* Judul */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900">Main Dashboard</h1>
        <p className="text-lg text-gray-600 font-medium">{greeting}, Here's what's going on today</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Employees */}
        <Card className="overflow-hidden border border-gray-200 bg-white shadow-md transition-all hover:shadow-lg">
          <div className="absolute top-0 right-0 h-full w-1 "></div>
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
        
        {/* Branch */}
        <Card className="overflow-hidden border border-gray-200 bg-white shadow-md transition-all hover:shadow-lg">
          <div className="absolute top-0 right-0 h-full w-1"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Branch</CardTitle>
            <UserCheck className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-gray-200"></div>
            ) : (
              <>
                <div className="text-3xl font-bold text-gray-900">{branchCount}</div>
                <p className="text-xs text-gray-500 mt-1">Active branches</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Departments */}
        <Card className="overflow-hidden border border-gray-200 bg-white shadow-md transition-all hover:shadow-lg">
          <div className="absolute top-0 right-0 h-full w-1 "></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Departments</CardTitle>
            <Building2 className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-gray-200"></div>
            ) : (
              <>
                <div className="text-3xl font-bold text-gray-900">{departmentCount}</div>
                <p className="text-xs text-gray-500 mt-1">Active departments</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Company */}
        <Card className="overflow-hidden border border-gray-200 bg-white shadow-md transition-all hover:shadow-lg">
          <div className="absolute top-0 right-0 h-full w-1 "></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-4 w-28 animate-pulse rounded bg-gray-200"></div>
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200"></div>
                <div className="h-4 w-20 animate-pulse rounded bg-gray-200"></div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-xs text-gray-500">Cretivox</div>
                  <div className="text-2xl font-bold text-gray-900">{companyCounts.cretivox}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Condfe</div>
                  <div className="text-2xl font-bold text-gray-900">{companyCounts.condfe}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">OGS</div>
                  <div className="text-2xl font-bold text-gray-900">{companyCounts.ogs}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Employment Status, Job Level, and Gender Diversity */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Employment Status */}
        <Card className="border border-gray-200 bg-white shadow-md transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold">Employment Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-4 w-full animate-pulse rounded bg-gray-200"></div>
                <div className="h-6 w-full animate-pulse rounded bg-gray-200"></div>
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-4 w-full animate-pulse rounded bg-gray-200"></div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div className="h-full flex">
                      <div
                        className="bg-blue-500 h-full transition-all duration-500"
                        style={{ width: `${permanentPercentage}%` }}
                      ></div>
                      <div
                        className="bg-orange-500 h-full transition-all duration-500"
                        style={{ width: `${contractPercentage}%` }}
                      ></div>
                      <div
                        className="bg-purple-500 h-full transition-all duration-500"
                        style={{ width: `${probationPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total</span>
                    <span className="text-sm font-semibold text-gray-900">{employmentStatus.total}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                      <span className="text-sm text-gray-700">Permanent</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{employmentStatus.permanent}</span>
                      <span className="text-sm text-gray-500">{permanentPercentage.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
                      <span className="text-sm text-gray-700">Contract</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{employmentStatus.contract}</span>
                      <span className="text-sm text-gray-500">{contractPercentage.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-sm"></div>
                      <span className="text-sm text-gray-700">Probation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{employmentStatus.probation}</span>
                      <span className="text-sm text-gray-500">{probationPercentage.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Job Level */}
        <Card className="border border-gray-200 bg-white shadow-md transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold">Job Level</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-4 w-full animate-pulse rounded bg-gray-200"></div>
                <div className="h-6 w-full animate-pulse rounded bg-gray-200"></div>
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-4 w-full animate-pulse rounded bg-gray-200"></div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div className="h-full flex">
                      <div
                        className="bg-blue-500 h-full transition-all duration-500"
                        style={{ width: `${seniorStaffPercentage}%` }}
                      ></div>
                      <div
                        className="bg-orange-500 h-full transition-all duration-500"
                        style={{ width: `${middleStaffPercentage}%` }}
                      ></div>
                      <div
                        className="bg-purple-500 h-full transition-all duration-500"
                        style={{ width: `${juniorStaffPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total</span>
                    <span className="text-sm font-semibold text-gray-900">{jobLevel.total}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                      <span className="text-sm text-gray-700">Senior</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{jobLevel.seniorStaff}</span>
                      <span className="text-sm text-gray-500">{seniorStaffPercentage.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
                      <span className="text-sm text-gray-700">Middle</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{jobLevel.middleStaff}</span>
                      <span className="text-sm text-gray-500">{middleStaffPercentage.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-sm"></div>
                      <span className="text-sm text-gray-700">Junior</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{jobLevel.juniorStaff}</span>
                      <span className="text-sm text-gray-500">{juniorStaffPercentage.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Gender */}
        <Card className="border border-gray-200 bg-white shadow-md transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold">Gender</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-24 w-24 mx-auto animate-pulse rounded-full bg-gray-200"></div>
                <div className="space-y-2">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="h-4 w-full animate-pulse rounded bg-gray-200"></div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Donut Chart */}
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <svg width="120" height="120" viewBox="0 0 100 100" className="transform -rotate-90">
                      {/* Male segment */}
                      <path
                        d={createDonutPath(0, maleAngle, 25, 40)}
                        fill="#3b82f6"
                        className="transition-all duration-500"
                      />
                      {/* Female segment */}
                      <path
                        d={createDonutPath(maleAngle, 360, 25, 40)}
                        fill="#db2777"
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold text-gray-900">{genderData.total}</span>
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                      <span className="text-sm text-gray-700">Male</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{genderData.male}</span>
                      <span className="text-sm text-gray-500">{malePercentage.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-pink-500 rounded-sm"></div>
                      <span className="text-sm text-gray-700">Female</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{genderData.female}</span>
                      <span className="text-sm text-gray-500">{femalePercentage.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Onboarding Calendar */}
        <Card className="overflow-hidden border border-gray-200 shadow-md transition-all hover:shadow-lg bg-white relative">
          <div className="absolute top-0 right-0 h-full w-1"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
          </CardHeader>
          <CardContent>
            <OnboardingCalendar />
          </CardContent>
        </Card>
      </div>

      {/* Birthdays + Attendance Clock-in Chart */}
      <div className="grid gap-6 lg:grid-cols-2 mt-4">
        {/* Birthdays Card */}
        <Card className="overflow-hidden border border-gray-200 shadow-md transition-all hover:shadow-lg bg-white relative">
          <div className="absolute top-0 right-0 h-full w-1 "></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-bold black flex items-center gap-2">
              <span className="text-lg"></span> Birthdays
            </CardTitle>
            <div className="relative">
              <button
                type="button"
                className="focus:outline-none"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMonthDropdown((prev) => !prev)
                }}
                id="calendar-btn"
              >
                <Calendar className="h-5 w-5 text-black cursor-pointer" />
              </button>
              {showMonthDropdown && (
                <div
                  id="month-dropdown"
                  className="fixed z-50 w-56 rounded-md border border-gray-200 bg-white shadow-lg"
                  style={{ top: dropdownPos.top, left: dropdownPos.left }}
                >
                  <div className="flex items-center justify-between px-3 py-2 border-b">
                    <span className="text-sm font-medium">{selectedYear}</span>
                    <div className="flex flex-col -my-2">
                      <button
                        type="button"
                        className="p-1 hover:bg-gray-100 rounded"
                        onClick={() => setSelectedYear((y) => y + 1)}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="p-1 hover:bg-gray-100 rounded"
                        onClick={() => setSelectedYear((y) => y - 1)}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 p-3">
                    {monthNamesShort.map((name, idx) => (
                      <button
                        key={idx}
                        className={`text-sm px-2 py-2 rounded-md text-center transition-colors ${
                          selectedMonth === idx + 1
                            ? "bg-blue-500 text-white"
                            : (selectedYear > currentYear || (selectedYear === currentYear && idx + 1 > currentMonth))
                                ? "text-gray-400"
                                : "text-gray-900 hover:bg-gray-100"
                        }`}
                        onClick={() => {
                          setSelectedMonth(idx + 1)
                          setShowMonthDropdown(false)
                        }}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[260px] overflow-y-auto pr-2">
              {isLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-gray-200"></div>
              ) : filteredBirthdays.length === 0 ? (
                <div className="text-sm text-gray-500">Tidak ada yang berulang tahun bulan {monthNames[selectedMonth-1]}</div>
              ) : (
                <ul className="space-y-2">
                  {filteredBirthdays.map((b, idx) => {
                  const today = new Date()
                  const [year, month, day] = b.birth_date.split("-").map(Number)
                  const isToday = today.getDate() === day && (today.getMonth() + 1) === month
                  return (
                    <li
                      key={idx}
                      className={`flex items-center gap-3 p-2 rounded-lg transition-all ${isToday ? 'bg-blue-50 border border-blue-300 shadow scale-[1.02]' : 'hover:bg-gray-50'}`}
                    >
                      {isToday && <span className="text-xl">🎉</span>}
                      <Avatar className="h-12 w-12">
                        <AvatarImage 
                          src={b.profile_picture} 
                          alt={b.name}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-gray-200 text-gray-600 font-semibold">
                          {b.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col flex-1">
                        <span className={`font-semibold ${isToday ? 'text-blue-700' : 'text-gray-900'}`}>{b.name}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(b.birth_date).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full font-bold ${isToday ? 'bg-blue-400 text-white shadow' : 'bg-blue-100 text-blue-700'}`}>{b.age} th</span>
                      {isToday && (
                        <span className="ml-2 text-lg animate-pulse">🎂</span>
                      )}
                    </li>
                  )
                  })}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Attendance Clock-in per Day (this month) */}
        <Card className="overflow-hidden border border-gray-200 shadow-md transition-all hover:shadow-lg bg-white relative">
          <div className="absolute top-0 right-0 h-full w-1 mt-11"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-bold black flex items-center gap-2">
              Attendance — Clock In per Day
            </CardTitle>
            <div className="flex items-center gap-2">
              <select
                className="border border-gray-300 rounded-md px-2 py-1 text-sm bg-white text-black"
                value={attendanceMonth}
                onChange={(e) => setAttendanceMonth(parseInt(e.target.value, 10))}
              >
                {monthNamesShort.map((name, idx) => (
                  <option key={idx} value={idx + 1}>{name}</option>
                ))}
              </select>
              <select
                className="border border-gray-300 rounded-md px-2 py-1 text-sm bg-white text-black"
                value={attendanceYear}
                onChange={(e) => setAttendanceYear(parseInt(e.target.value, 10))}
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent className="pt-10">
            {attendanceLoading ? (
              <div className="h-[240px] w-full animate-pulse rounded bg-gray-200"></div>
            ) : (
              <ChartContainer
                config={{ count: { label: "Clock In", color: "hsl(221, 83%, 53%)" } }}
                className="h-[240px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={attendanceCounts.map((x) => ({
                      dayLabel: String(x.day),
                      count: x.count,
                    }))}
                    margin={{ left: 5, right: 5, top: 10, bottom: 30 }}
                  >
                    <XAxis
                      dataKey="dayLabel"
                      tick={{ fontSize: 10 }}
                      interval={0}
                      height={30}
                      className="text-xs"
                    />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} width={28} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-2 border border-gray-200 rounded shadow text-xs">
                              <div>Clock In: <span className="font-semibold">{payload[0].value}</span></div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar dataKey="count" fill="var(--color-count)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
