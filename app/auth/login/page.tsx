"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useUser } from "@/context/user-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const router = useRouter()
  const { setUserData } = useUser()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!email || !password) {
      setError("Vui lòng nhập email và mật khẩu")
      setLoading(false)
      return
    }

    try {
      // Call login API
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Email hoặc mật khẩu không đúng")
        setLoading(false)
        return
      }

      // Check if 2FA is required
      if (data.requiresTwoFactor) {
        // Redirect to 2FA verification page
        router.push(`/auth/2fa/verify?userId=${data.user.id}&email=${encodeURIComponent(data.user.email)}`)
        return
      }

      // Set user context and redirect
      setUserData({
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.fullName,
        industry: data.user.industry,
        createdAt: data.user.createdAt,
      })

      router.push("/dashboard")
    } catch (err) {
      console.error("Login error:", err)
      setError("Đã xảy ra lỗi, vui lòng thử lại")
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050B24] to-[#0a1540] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-[#0f1f3f] rounded-lg border border-blue-500/20 p-8 shadow-2xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Sign In</h1>
            <p className="text-gray-400">Welcome back to Alba AI Assistant</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#050B24] border-blue-500/20 text-white placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[#050B24] border-blue-500/20 text-white placeholder:text-gray-500"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link 
              href="/auth/forgot-password" 
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Forgot your password?
            </Link>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{" "}
              <Link href="/auth/register" className="text-blue-400 hover:text-blue-300 font-semibold">
                Sign up
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-blue-500/10">
            <p className="text-gray-500 text-xs text-center">Demo: Use any email with password ≥ 6 characters</p>
          </div>
        </div>
      </div>
    </div>
  )
}
