"use client"

import type React from "react"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Clock, LogOut, Building2, User } from "lucide-react"
import { useState, useEffect } from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string>("")

  useEffect(() => {
    // Get user role from cookie
    const getCookie = (name: string): string | null => {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(";").shift() || null
      return null
    }

    const role = getCookie("userRole") || "user"
    setUserRole(role)
  }, [])

  const handleLogout = () => {
    // Clear all cookies
    document.cookie = "isLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;"
    document.cookie = "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;"
    // Redirect to login page
    router.push("/login")
  }

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname.startsWith(path)
  }

  const menuItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      description: "Overview & Analytics",
    },
    {
      href: "/dashboard/overtime",
      label: "Table Overtime",
      icon: Clock,
      description: "Manage overtime requests",
    },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-72 bg-white shadow-xl border-r border-gray-200 flex flex-col relative overflow-hidden">
        {/* Decorative gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 opacity-60"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-10 transform translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-400 to-blue-500 rounded-full opacity-10 transform -translate-x-12 translate-y-12"></div>

        {/* Header */}
        <div className="relative z-10 p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-black to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
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
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
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
                        ? "bg-gradient-to-r from-black to-purple-600 text-white shadow-lg transform scale-[1.02]"
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
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  )}
                </div>
              </Link>
            )
          })}
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
            onClick={handleLogout}
          >
            {/* Gradient background on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-black to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-in-out origin-left"></div>

            {/* Button content */}
            <div className="relative flex items-center justify-center space-x-2">
              <LogOut className="w-4 h-4 transition-transform duration-200 group-hover:rotate-12" />
              <span className="font-semibold">Logout</span>
            </div>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="min-h-full">{children}</div>
      </main>
    </div>
  )
}
