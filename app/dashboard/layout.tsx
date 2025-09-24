"use client"

import type React from "react"
import { useRouter, usePathname } from "next/navigation"
import Navigation from "@/components/navigation"
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

    // Redirect non-admin users to overtime dashboard if they try to access main dashboard
    if ((role === "user" || role === "marketing") && pathname === "/dashboard") {
      router.push("/dashboard/overtime/dashboard")
      return
    }

  }, [pathname, router])

  const handleLogout = () => {
    // Clear all cookies
    document.cookie = "isLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;"
    document.cookie = "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;"
    // Redirect to login page
    router.push("/login")
  }


  return (
    <div className="flex h-screen bg-gray-50">
      {/* Navigation Component */}
      <Navigation userRole={userRole} onLogout={handleLogout} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="min-h-full">{children}</div>
      </main>
    </div>
  )
}
