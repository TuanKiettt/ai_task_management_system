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
  logout: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [industry, setIndustryState] = useState<Industry | null>(null)
  const [userName, setUserName] = useState("Amber")
  const [userId, setUserId] = useState<string | null>(null)
  const [userData, setUserDataState] = useState<UserData | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
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
        // If parsing fails, create mock user
        createMockUser()
      }
    } else {
      // Create mock user data for testing
      createMockUser()
    }
    
    async function createMockUser() {
      // Generate unique user data
      const mockUserData: UserData = {
        id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        email: `user${Date.now()}@demo.com`,
        fullName: `User ${Math.floor(Math.random() * 1000)}`,
        industry: "education",
        createdAt: new Date().toISOString()
      }
      
      try {
        // Call setup API to create user and add to default workspace
        const response = await fetch('/api/users/setup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workspaceId: 'cmnokv6tv00034yd4m3njp4ey', // Default workspace
            userData: mockUserData
          })
        })
        
        if (response.ok) {
          const result = await response.json()
          const realUserData = result.user
          
          setUserDataState(realUserData)
          setUserName(realUserData.fullName)
          setUserId(realUserData.id)
          setIndustryState(realUserData.industry)
          setIsLoggedIn(true)
          
          // Save real user data to localStorage
          localStorage.setItem("user-data", JSON.stringify(realUserData))
          localStorage.setItem("user-industry", realUserData.industry)
        } else {
          // Fallback to temp user if API fails
          setUserDataState(mockUserData)
          setUserName(mockUserData.fullName)
          setUserId(mockUserData.id)
          setIndustryState(mockUserData.industry)
          setIsLoggedIn(true)
          
          localStorage.setItem("user-data", JSON.stringify(mockUserData))
          localStorage.setItem("user-industry", mockUserData.industry)
        }
      } catch (error) {
        console.error('Failed to setup user:', error)
        // Fallback to temp user
        setUserDataState(mockUserData)
        setUserName(mockUserData.fullName)
        setUserId(mockUserData.id)
        setIndustryState(mockUserData.industry)
        setIsLoggedIn(true)
        
        localStorage.setItem("user-data", JSON.stringify(mockUserData))
        localStorage.setItem("user-industry", mockUserData.industry)
      }
    }
  }, [mounted])

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
    document.cookie = "user-industry=; path=/; max-age=0"
  }

  return (
    <UserContext.Provider value={{ industry, setIndustry, userName, userId, userData, setUserData, isLoggedIn, logout }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) throw new Error("useUser must be used within a UserProvider")
  return context
}
