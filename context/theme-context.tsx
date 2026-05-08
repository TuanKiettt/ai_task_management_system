"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark" | "system"

export type Language = "en" | "vi" | "es" | "fr" | "de" | "ja" | "zh"

export const languageLabels: Record<Language, string> = {
  en: "English",
  vi: "Vietnamese",
  es: "Spanish",
  fr: "French",
  de: "German",
  ja: "Japanese",
  zh: "Chinese (Simplified)",
}

interface ThemeContextType {
  theme: Theme
  resolvedTheme: "light" | "dark"
  setTheme: (theme: Theme) => void
  language: Language
  setLanguage: (lang: Language) => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  resolvedTheme: "dark",
  setTheme: () => {},
  language: "en",
  setLanguage: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark")
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark")
  const [language, setLanguageState] = useState<Language>("en")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    const savedTheme = (localStorage.getItem("alba-theme") as Theme) || "dark"
    const savedLang = (localStorage.getItem("alba-language") as Language) || "en"
    
    setThemeState(savedTheme)
    setLanguageState(savedLang)
  }, [mounted])

  // Apply theme to <html> whenever it changes
  useEffect(() => {
    const root = document.documentElement

    const apply = (resolved: "light" | "dark") => {
      setResolvedTheme(resolved)
      if (resolved === "dark") {
        root.classList.add("dark")
      } else {
        root.classList.remove("dark")
      }
    }

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)")
      apply(mq.matches ? "dark" : "light")
      const handler = (e: MediaQueryListEvent) => apply(e.matches ? "dark" : "light")
      mq.addEventListener("change", handler)
      return () => mq.removeEventListener("change", handler)
    } else {
      apply(theme)
    }
  }, [theme])

  const setTheme = (t: Theme) => {
    setThemeState(t)
    localStorage.setItem("alba-theme", t)
  }

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("alba-language", lang)
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, language, setLanguage }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
