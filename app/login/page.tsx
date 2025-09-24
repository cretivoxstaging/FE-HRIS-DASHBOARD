"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const adminUsername = process.env.NEXT_PUBLIC_ADMIN_USERNAME;
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
    const userUsername = process.env.NEXT_PUBLIC_USER_USERNAME;
    const userPassword = process.env.NEXT_PUBLIC_USER_PASSWORD;
    const marketingUsername = process.env.NEXT_PUBLIC_MARKETING_USERNAME;
    const marketingPassword = process.env.NEXT_PUBLIC_MARKETING_PASSWORD;

    if (username === adminUsername && password === adminPassword) {
      document.cookie = "isLoggedIn=true; path=/; max-age=3600";
      document.cookie = "userRole=admin; path=/; max-age=3600";
      router.push("/dashboard");
    } else if (username === userUsername && password === userPassword) {
      document.cookie = "isLoggedIn=true; path=/; max-age=3600";
      document.cookie = "userRole=user; path=/; max-age=3600";
      router.push("/dashboard");
    } else if (
      username === marketingUsername &&
      password === marketingPassword
    ) {
      document.cookie = "isLoggedIn=true; path=/; max-age=3600";
      document.cookie = "userRole=marketing; path=/; max-age=3600";
      router.push("/dashboard");
    } else {
      alert("username dan password anda salah");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-white">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-white px-4 sm:px-8 py-8 lg:py-0">
        <div className="w-full max-w-sm bg-gray-50 p-6 rounded-lg shadow-lg">
          <div className="text-center mb-6 lg:mb-8">
            <h1 className="text-3xl sm:text-3xl font-bold text-black mb-2">
              Hello Again!
            </h1>
            <p className="text-gray-500 text-sm ">
              Please sign in to manage employee data and your team's workspace
              needs.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-11 sm:h-12 bg-gray-100 border-0 rounded-lg text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              />
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 sm:h-12 bg-gray-100 border-0 rounded-lg text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 pr-12 text-sm sm:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff size={18} className="sm:w-5 sm:h-5" />
                  ) : (
                    <Eye size={18} className="sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 sm:h-12 bg-black hover:bg-gray-700 text-white font-semibold rounded-lg text-sm uppercase tracking-wide"
            >
              Sign In
            </Button>
          </form>
        </div>
      </div>

      {/* Right Side - 3D Illustration */}
      <div
        className="flex-1 bg-gradient-to-br from-white to-gray-900 md:from-gray-900 md:to-gray-500 flex items-center justify-center p-4 sm:p-8 order-first lg:order-last 
                md:rounded-tl-3xl md:rounded-bl-3xl overflow-hidden"
      >
        <div className="relative w-full h-90 max-w-sm sm:max-w-md sm:h-full lg:max-w-lg lg:h-[650px]">
          {/* 3D Workspace Illustration */}
          <img
            src="/login.png"
            alt="3D Workspace Illustration"
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    </div>
  );
}
