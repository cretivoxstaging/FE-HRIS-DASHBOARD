"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Clock, LogOut, Building2, User, ChevronDown, ChevronRight, Calendar, CalendarDays } from "lucide-react"
import { useState, useEffect } from "react"

interface NavigationProps {
  userRole: string
  onLogout: () => void
}

export default function Navigation({ userRole, onLogout }: NavigationProps) {
  const pathname = usePathname()
  const [isOvertimeExpanded, setIsOvertimeExpanded] = useState(false)

  useEffect(() => {
    // Auto-expand overtime menu if we're on an overtime-related page
    if (pathname.startsWith("/dashboard/overtime")) {
      setIsOvertimeExpanded(true)
    }
  }, [pathname])

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname.startsWith(path)
  }

  const isOvertimeActive = () => {
    return pathname.startsWith("/dashboard/overtime")
  }

  const menuItems = [
    // Only show Main Dashboard for admin users
    ...(userRole === "admin"
      ? [
          {
            href: "/dashboard",
            label: "Main Dashboard",
            icon: LayoutDashboard,
            description: "System overview",
          },
        ]
      : []),
    // Only show Table Employee for admin users
    ...(userRole === "admin"
      ? [
          {
            href: "/dashboard/employee",
            label: "Employee",
            icon: User,
            description: "Manage employee data",
          },
        ]
      : []),
    // Only show Table Attendance for admin users
    ...(userRole === "admin"
      ? [
          {
            href: "/dashboard/attendance",
            label: "Attendance",
            icon: Calendar,
            description: "Manage attendance records",
          },
        ]
      : []),
    // Only show Time Off for admin users
    ...(userRole === "admin"
      ? [
          {
            href: "/dashboard/timeoff",
            label: "Time Off",
            icon: CalendarDays,
            description: "Manage time off requests",
          },
        ]
      : []),
  ]

  return (
    <aside className="w-72 bg-white shadow-xl border-r border-gray-200 flex flex-col relative overflow-hidden">
      {/* Decorative gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 opacity-60"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-10 transform translate-x-16 -translate-y-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-400 to-blue-500 rounded-full opacity-10 transform -translate-x-12 translate-y-12"></div>

      {/* Header */}
      <div className="relative z-10 p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-black to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">HRIS</h1>
            <p className="text-sm text-gray-500">Management System</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="relative z-10 px-6 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-black to-blue-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Welcome back!</p>
            <p className="text-xs text-gray-600 capitalize">
              Role: <span className="font-semibold text-blue-600">{userRole}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex-1 p-4 space-y-2">
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">Navigation</p>
        </div>

        {/* Regular Menu Items */}
        {menuItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          return (
            <Link key={item.href} href={item.href} className="block">
              <div
                className={`
                  group relative flex items-center p-3 rounded-xl transition-all duration-200 ease-in-out
                  ${
                    active
                      ? "bg-gradient-to-r from-black to-blue-600 text-white shadow-lg transform scale-[1.02]"
                      : "text-gray-700 hover:bg-white hover:shadow-md hover:scale-[1.01]"
                  }
                `}
              >
                {/* Active indicator */}
                {active && (
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
                )}

                {/* Icon */}
                <div
                  className={`
                  flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200
                  ${
                    active
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600"
                  }
                `}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {/* Text */}
                <div className="ml-3 flex-1">
                  <p
                    className={`
                    font-semibold text-sm transition-colors duration-200
                    ${active ? "text-white" : "text-gray-900 group-hover:text-gray-900"}
                  `}
                  >
                    {item.label}
                  </p>
                  <p
                    className={`
                    text-xs transition-colors duration-200
                    ${active ? "text-white/80" : "text-gray-500 group-hover:text-gray-600"}
                  `}
                  >
                    {item.description}
                  </p>
                </div>

                {/* Hover effect */}
                {!active && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out"></div>
                )}
              </div>
            </Link>
          )
        })}

        {/* Overtime Menu with Submenu */}
        <div className="space-y-1">
          <div
            className={`
              group relative flex items-center p-3 rounded-xl transition-all duration-200 ease-in-out cursor-pointer
              ${
                isOvertimeActive()
                  ? "bg-gradient-to-r from-black to-blue-600 text-white shadow-lg transform scale-[1.02]"
                  : "text-gray-700 hover:bg-white hover:shadow-md hover:scale-[1.01]"
              }
            `}
            onClick={() => setIsOvertimeExpanded(!isOvertimeExpanded)}
          >
            {/* Active indicator */}
            {isOvertimeActive() && (
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
            )}

            {/* Icon */}
            <div
              className={`
              flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200
              ${
                isOvertimeActive()
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600"
              }
            `}
            >
              <Clock className="w-5 h-5" />
            </div>

            {/* Text */}
            <div className="ml-3 flex-1">
              <p
                className={`
                font-semibold text-sm transition-colors duration-200
                ${isOvertimeActive() ? "text-white" : "text-gray-900 group-hover:text-gray-900"}
              `}
              >
                Overtime
              </p>
              <p
                className={`
                text-xs transition-colors duration-200
                ${isOvertimeActive() ? "text-white/80" : "text-gray-500 group-hover:text-gray-600"}
              `}
              >
                Manage overtime data
              </p>
            </div>

            {/* Expand/Collapse Icon */}
            <div className="ml-2">
              {isOvertimeExpanded ? (
                <ChevronDown
                  className={`w-4 h-4 transition-colors duration-200 ${
                    isOvertimeActive() ? "text-white" : "text-gray-500"
                  }`}
                />
              ) : (
                <ChevronRight
                  className={`w-4 h-4 transition-colors duration-200 ${
                    isOvertimeActive() ? "text-white" : "text-gray-500"
                  }`}
                />
              )}
            </div>

            {/* Hover effect */}
            {!isOvertimeActive() && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out"></div>
            )}
          </div>

          {/* Submenu */}
          {isOvertimeExpanded && (
            <div className="ml-6 space-y-1 border-l-2 border-gray-200 pl-4">
              {/* Dashboard Submenu Item */}
              <Link href="/dashboard/overtime/dashboard" className="block">
                <div
                  className={`
                    group relative flex items-center p-2 rounded-lg transition-all duration-200 ease-in-out
                    ${
                      pathname === "/dashboard/overtime/dashboard"
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }
                  `}
                >
                  <div
                    className={`
                    flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200
                    ${
                      pathname === "/dashboard/overtime/dashboard"
                        ? "bg-white/20 text-white"
                        : "bg-gray-50 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600"
                    }
                  `}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                  </div>
                  <div className="ml-3">
                    <p
                      className={`
                      font-medium text-sm transition-colors duration-200
                      ${pathname === "/dashboard/overtime/dashboard" ? "text-white" : "text-gray-800 group-hover:text-gray-900"}
                    `}
                    >
                      Dashboard
                    </p>
                    <p
                      className={`
                      text-xs transition-colors duration-200
                      ${pathname === "/dashboard/overtime/dashboard" ? "text-white/80" : "text-gray-500 group-hover:text-gray-600"}
                    `}
                    >
                      Overview & Analytics
                    </p>
                  </div>
                </div>
              </Link>

              {/* Table Overtime Submenu Item */}
              <Link href="/dashboard/overtime/table" className="block">
                <div
                  className={`
                    group relative flex items-center p-2 rounded-lg transition-all duration-200 ease-in-out
                    ${
                      pathname === "/dashboard/overtime/table"
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }
                  `}
                >
                  <div
                    className={`
                    flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200
                    ${
                      pathname === "/dashboard/overtime/table"
                        ? "bg-white/20 text-white"
                        : "bg-gray-50 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600"
                    }
                  `}
                  >
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="ml-3">
                    <p
                      className={`
                      font-medium text-sm transition-colors duration-200
                      ${pathname === "/dashboard/overtime/table" ? "text-white" : "text-gray-800 group-hover:text-gray-900"}
                    `}
                    >
                      Table Overtime
                    </p>
                    <p
                      className={`
                      text-xs transition-colors duration-200
                      ${pathname === "/dashboard/overtime/table" ? "text-white/80" : "text-gray-500 group-hover:text-gray-600"}
                    `}
                    >
                      Manage requests
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Divider */}
      <div className="relative z-10 px-6">
        <div className="border-t border-gray-200"></div>
      </div>

      {/* Logout Button */}
      <div className="relative z-10 p-4">
        <Button
          variant="outline"
          className="w-full group relative overflow-hidden border-2 border-black text-black hover:text-white hover:border-black transition-all duration-300 ease-in-out transform hover:scale-[1.02] bg-transparent"
          onClick={onLogout}
        >
          {/* Gradient background on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-black to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-in-out origin-left"></div>

          {/* Button content */}
          <div className="relative flex items-center justify-center space-x-2">
            <LogOut className="w-4 h-4 transition-transform duration-200 group-hover:rotate-12" />
            <span className="font-semibold">Logout</span>
          </div>
        </Button>
      </div>
    </aside>
  )
}
