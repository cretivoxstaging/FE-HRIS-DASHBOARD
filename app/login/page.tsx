"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
    <div
      className="flex items-center justify-center min-h-screen"
      style={{
        backgroundImage: 'url("/bglogin1.png")',
        backgroundSize: "contain", // Mengubah dari 'cover' ke 'contain'
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat", // Menambahkan ini untuk mencegah pengulangan gambar
      }}
    >
      <Card className="w-[350px] bg-white md:bg-transparent">
        <CardHeader className="text-black">
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="text-sm font-semibold text-black"
              >
                Username
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-gray-200 text-black"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-semibold text-black"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-gray-200 text-black"
              />
            </div>
            <Button type="submit" className="w-full bg-black text-white">
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
