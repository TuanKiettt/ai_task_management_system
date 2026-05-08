"use client"

import { Settings, Mail, Calendar, Building2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useUser } from "@/context/user-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Header } from "@/components/header"

const industryLabels = {
  education: "Education",
  corporate: "Corporate",
  creative: "Creative",
  medical: "Medical",
}

export default function ProfilePage() {
  const { userData, isLoggedIn } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/auth/login")
    }
  }, [isLoggedIn, router])

  if (!userData) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950">
      <Header />
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link href="/" className="flex items-center gap-2 text-blue-300 hover:text-blue-200 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          {/* Profile Header Card */}
          <div className="bg-blue-900/40 backdrop-blur-sm border border-blue-800/50 rounded-2xl p-8 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-5xl font-bold flex-shrink-0">
                {userData.fullName[0]}
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-white mb-2">{userData.fullName}</h1>
                <p className="text-blue-300">{userData.email}</p>
              </div>
            </div>
          </div>

          {/* Profile Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-900/40 backdrop-blur-sm border border-blue-800/50 rounded-xl p-6 hover:bg-blue-900/60 transition-colors">
              <div className="flex items-start gap-4">
                <Mail className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <p className="text-blue-300 text-sm uppercase tracking-wider font-semibold">Email Address</p>
                  <p className="text-white font-medium mt-2 break-all">{userData.email}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-900/40 backdrop-blur-sm border border-blue-800/50 rounded-xl p-6 hover:bg-blue-900/60 transition-colors">
              <div className="flex items-start gap-4">
                <Building2 className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="text-blue-300 text-sm uppercase tracking-wider font-semibold">Industry</p>
                  <p className="text-white font-medium mt-2">
                    {industryLabels[userData.industry] || userData.industry}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-900/40 backdrop-blur-sm border border-blue-800/50 rounded-xl p-6 hover:bg-blue-900/60 transition-colors">
              <div className="flex items-start gap-4">
                <Calendar className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="text-blue-300 text-sm uppercase tracking-wider font-semibold">Account Created</p>
                  <p className="text-white font-medium mt-2">
                    {new Date(userData.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-900/40 backdrop-blur-sm border border-blue-800/50 rounded-xl p-6 hover:bg-blue-900/60 transition-colors">
              <div className="flex items-start gap-4">
                <Settings className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="text-blue-300 text-sm uppercase tracking-wider font-semibold">Status</p>
                  <p className="text-white font-medium mt-2">Active</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/settings"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              <Settings className="w-5 h-5" />
              <span>Edit Profile</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-800/50 hover:bg-blue-800 text-blue-200 rounded-lg transition-colors font-medium border border-blue-700/50"
            >
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
