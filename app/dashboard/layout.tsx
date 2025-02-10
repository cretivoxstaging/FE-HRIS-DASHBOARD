'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  const handleLogout = () => {
    // Clear the login cookie
    document.cookie = 'isLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    // Redirect to login page
    router.push('/login')
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <nav className="p-5 space-y-2 flex-grow">
          <Link href="/dashboard" className="block">
            <Button variant="ghost" className="w-full justify-start font-bold text-black">
              Dashboard
            </Button>
          </Link>
          <Link href="/dashboard/overtime" className="block">
            <Button variant="ghost" className="w-full justify-start font-bold text-black">
              Overtime Submission
            </Button>
          </Link>
        </nav>
        <div className="p-5">
          <Button 
            variant="destructive" 
            className="w-full bg-black text-white" 
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

