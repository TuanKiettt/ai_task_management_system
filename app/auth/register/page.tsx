"use client"

import { useState } from "react"
import type React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useUser } from "@/context/user-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Industry } from "@/context/user-context"

export default function RegisterPage() {
  const router = useRouter()
  const { setUserData } = useUser()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [industry, setIndustry] = useState<Industry | "">("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const industries: { value: Industry; label: string; description: string }[] = [
    {
      value: "education",
      label: "Education",
      description: "Teacher, educator",
    },
    {
      value: "corporate",
      label: "Corporate",
      description: "Employee, manager",
    },
    {
      value: "creative",
      label: "Creative",
      description: "Designer, artist, content creator",
    },
    {
      value: "medical",
      label: "Medical",
      description: "Doctor, nurse, healthcare worker",
    },
  ]

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!fullName || !email || !password || !confirmPassword || !industry) {
      setError("Vui lòng điền đầy đủ thông tin")
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu không khớp")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự")
      setLoading(false)
      return
    }

    if (!email.includes("@")) {
      setError("Email không hợp lệ")
      setLoading(false)
      return
    }

    try {
      // Call registration API
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email,
          password,
          industry,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          setError("Email này đã được đăng ký")
        } else {
          setError(data.error || "Đã xảy ra lỗi, vui lòng thử lại")
        }
        setLoading(false)
        return
      }

      // Set user context and redirect
      setUserData({
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.fullName,
        industry: data.user.industry as Industry,
        createdAt: data.user.createdAt,
      })

      router.push("/dashboard")
    } catch (err) {
      console.error("Registration error:", err)
      setError("Đã xảy ra lỗi, vui lòng thử lại")
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050B24] to-[#0a1540] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-[#0f1f3f] rounded-lg border border-blue-500/20 p-8 shadow-2xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-gray-400">Get started with Alba AI Assistant</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
              <Input
                type="text"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-[#050B24] border-blue-500/20 text-white placeholder:text-gray-500"
              />
            </div>

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
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[#050B24] border-blue-500/20 text-white placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
              <Input
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-[#050B24] border-blue-500/20 text-white placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Your Industry</label>
              <div className="grid grid-cols-1 gap-2">
                {industries.map((ind) => (
                  <button
                    key={ind.value}
                    type="button"
                    onClick={() => setIndustry(ind.value)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      industry === ind.value
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-blue-500/20 hover:border-blue-500/40 bg-[#050B24]"
                    }`}
                  >
                    <div className="font-semibold text-white">{ind.label}</div>
                    <div className="text-xs text-gray-400">{ind.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 mt-6"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
