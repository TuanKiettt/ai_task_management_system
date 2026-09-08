"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

export type Industry = "education" | "corporate" | "creative" | "medical"

interface UserData {
  id: string
  email: string
  fullName: string
  industry: Industry
  createdAt: string
  avatar?: string
}

interface UserContextType {
  industry: Industry | null
  setIndustry: (industry: Industry) => void
  userName: string
  userId: string | null
  userData: UserData | null
  setUserData: (data: UserData) => void
  isLoggedIn: boolean
  isReady: boolean
  logout: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [industry, setIndustryState] = useState<Industry | null>(null)
  const [userName, setUserName] = useState("Amber")
  const [userId, setUserId] = useState<string | null>(null)
  const [userData, setUserDataState] = useState<UserData | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const savedUserData = localStorage.getItem("user-data")
    const savedIndustry = localStorage.getItem("user-industry") as Industry

    if (savedUserData) {
      try {
        const parsedData = JSON.parse(savedUserData)
        setUserDataState(parsedData)
        setUserName(parsedData.fullName)
        setUserId(parsedData.id)
        setIndustryState(parsedData.industry)
        setIsLoggedIn(true)
      } catch (error) {
        console.error("Failed to parse user data:", error)
        // Clear invalid data instead of creating mock user
        localStorage.removeItem("user-data")
        localStorage.removeItem("user-industry")
      }
    }
    setIsReady(true)
  }, [])

  const setIndustry = (newIndustry: Industry) => {
    setIndustryState(newIndustry)
    localStorage.setItem("user-industry", newIndustry)
    document.cookie = `user-industry=${newIndustry}; path=/; max-age=31536000`
  }

  const setUserData = (data: UserData) => {
    setUserDataState(data)
    setUserName(data.fullName)
    setUserId(data.id)
    setIndustryState(data.industry)
    setIsLoggedIn(true)
    localStorage.setItem("user-data", JSON.stringify(data))
    localStorage.setItem("user-industry", data.industry)
    document.cookie = `user-industry=${data.industry}; path=/; max-age=31536000`
  }

  const logout = () => {
    setUserDataState(null)
    setUserId(null)
    setIsLoggedIn(false)
    setUserName("Amber")
    localStorage.removeItem("user-data")
    localStorage.removeItem("user-industry")
    localStorage.removeItem("userId")
    document.cookie = "user-industry=; path=/; max-age=0"
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login'
    }
  }

  return (
    <UserContext.Provider value={{ industry, setIndustry, userName, userId, userData, setUserData, isLoggedIn, isReady, logout }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) throw new Error("useUser must be used within a UserProvider")
  return context
}
