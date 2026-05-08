"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, User, Settings, Heart } from "lucide-react"
import { useUser } from "@/context/user-context"

export function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { logout, userData } = useUser()
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const handleLogout = () => {
    logout()
    setIsOpen(false)
    router.push("/auth/login")
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-[#252b3b] transition-all rounded-lg p-1.5"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
          {userData?.fullName?.[0] || "A"}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1a1f2e] border border-gray-200 dark:border-[#2d3548] rounded-xl shadow-xl z-50 overflow-hidden">
          {/* User Info Section */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-[#2d3548]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold">
                {userData?.fullName?.[0] || "A"}
              </div>
              <div>
                <p className="text-gray-900 dark:text-white text-sm font-semibold">{userData?.fullName}</p>
                <p className="text-gray-500 dark:text-gray-400 text-xs">{userData?.email}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#252b3b] transition-colors"
            >
              <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm">My Profile</span>
            </Link>

            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#252b3b] transition-colors"
            >
              <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm">Settings</span>
            </Link>

            <Link
              href="/favorites"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#252b3b] transition-colors"
            >
              <Heart className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm">Favorites</span>
            </Link>
          </div>

          {/* Logout Button */}
          <div className="border-t border-gray-200 dark:border-[#2d3548]">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
