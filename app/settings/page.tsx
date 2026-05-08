"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Save, Sun, Moon, Monitor, Check, Bell, Lock, Globe, Palette, User, Trash2 } from "lucide-react"
import Link from "next/link"
import { useUser } from "@/context/user-context"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { useTheme, languageLabels, type Language } from "@/context/theme-context"
import { cn } from "@/lib/utils"

type Section = "appearance" | "language" | "notifications" | "privacy" | "account"

const sections: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "language", label: "Language & Region", icon: Globe },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy & Security", icon: Lock },
  { id: "account", label: "Account", icon: User },
]

export default function SettingsPage() {
  const { userData, isLoggedIn } = useUser()
  const router = useRouter()
  const { theme, setTheme, language, setLanguage } = useTheme()

  const [activeSection, setActiveSection] = useState<Section>("appearance")
  const [saved, setSaved] = useState(false)

  // Notification prefs
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [inAppNotifs, setInAppNotifs] = useState(true)
  const [weeklyDigest, setWeeklyDigest] = useState(false)

  // Privacy prefs
  const [publicProfile, setPublicProfile] = useState(true)
  const [publicTasks, setPublicTasks] = useState(false)
  const [twoFactor, setTwoFactor] = useState(true)

  // Staged language (only applied on save)
  const [stagedLang, setStagedLang] = useState<Language>(language)
  useEffect(() => { setStagedLang(language) }, [language])

  useEffect(() => {
    if (!isLoggedIn) router.push("/auth/login")
  }, [isLoggedIn, router])

  if (!userData) return null

  const handleSave = () => {
    setLanguage(stagedLang)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const themeOptions = [
    { value: "light" as const, label: "Light", icon: Sun, desc: "Clean and bright interface" },
    { value: "dark" as const, label: "Dark", icon: Moon, desc: "Easy on the eyes at night" },
    { value: "system" as const, label: "System", icon: Monitor, desc: "Follows your OS setting" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Nav */}
          <aside className="lg:w-52 shrink-0">
            <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0">
              {sections.map((s) => {
                const Icon = s.icon
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap w-full text-left",
                      activeSection === s.id
                        ? "bg-violet-600/15 text-violet-600 dark:text-violet-400"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {s.label}
                  </button>
                )
              })}
            </nav>
          </aside>

          {/* Main Panel */}
          <div className="flex-1 bg-card border border-border rounded-2xl p-6 sm:p-8">

            {/* APPEARANCE */}
            {activeSection === "appearance" && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-xl font-semibold text-foreground">Appearance</h1>
                  <p className="text-sm text-muted-foreground mt-1">Customize how Alba looks on your device.</p>
                </div>

                <div>
                  <h2 className="text-sm font-medium text-foreground mb-3">Theme</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {themeOptions.map((opt) => {
                      const Icon = opt.icon
                      const isActive = theme === opt.value
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setTheme(opt.value)}
                          className={cn(
                            "relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all text-center",
                            isActive
                              ? "border-violet-500 bg-violet-500/5"
                              : "border-border hover:border-violet-300 dark:hover:border-violet-700 bg-background"
                          )}
                        >
                          {isActive && (
                            <span className="absolute top-2 right-2 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </span>
                          )}
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            isActive ? "bg-violet-500 text-white" : "bg-muted text-muted-foreground"
                          )}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className={cn("text-sm font-medium", isActive ? "text-violet-600 dark:text-violet-400" : "text-foreground")}>{opt.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Current: <span className="font-medium text-foreground capitalize">{theme}</span>
                    {theme === "system" && " (follows OS preference)"}
                  </p>
                </div>
              </div>
            )}

            {/* LANGUAGE */}
            {activeSection === "language" && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-xl font-semibold text-foreground">Language & Region</h1>
                  <p className="text-sm text-muted-foreground mt-1">Choose your preferred language for the interface.</p>
                </div>

                <div>
                  <h2 className="text-sm font-medium text-foreground mb-3">Display Language</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(Object.entries(languageLabels) as [Language, string][]).map(([code, label]) => {
                      const isActive = stagedLang === code
                      return (
                        <button
                          key={code}
                          onClick={() => setStagedLang(code)}
                          className={cn(
                            "flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left",
                            isActive
                              ? "border-violet-500 bg-violet-500/5 text-violet-600 dark:text-violet-400"
                              : "border-border bg-background text-foreground hover:border-violet-300 dark:hover:border-violet-700"
                          )}
                        >
                          <span className="text-sm font-medium">{label}</span>
                          {isActive && <Check className="w-4 h-4" />}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">Changes take effect after saving.</p>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {activeSection === "notifications" && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-xl font-semibold text-foreground">Notifications</h1>
                  <p className="text-sm text-muted-foreground mt-1">Manage how and when you receive notifications.</p>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Email notifications", desc: "Receive updates via email", value: emailNotifs, set: setEmailNotifs },
                    { label: "In-app notifications", desc: "Show notifications inside Alba", value: inAppNotifs, set: setInAppNotifs },
                    { label: "Weekly digest", desc: "Summary of your week every Sunday", value: weeklyDigest, set: setWeeklyDigest },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-4 rounded-xl border border-border bg-background">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => item.set(!item.value)}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none",
                          item.value ? "bg-violet-600" : "bg-muted"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition-transform",
                            item.value ? "translate-x-5" : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PRIVACY */}
            {activeSection === "privacy" && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-xl font-semibold text-foreground">Privacy & Security</h1>
                  <p className="text-sm text-muted-foreground mt-1">Control your privacy and security settings.</p>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Public profile", desc: "Let others find your profile", value: publicProfile, set: setPublicProfile },
                    { label: "Public task list", desc: "Allow everyone to see your tasks", value: publicTasks, set: setPublicTasks },
                    { label: "Two-factor authentication", desc: "Extra layer of account security", value: twoFactor, set: setTwoFactor },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-4 rounded-xl border border-border bg-background">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => item.set(!item.value)}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                          item.value ? "bg-violet-600" : "bg-muted"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition-transform",
                            item.value ? "translate-x-5" : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ACCOUNT */}
            {activeSection === "account" && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-xl font-semibold text-foreground">Account</h1>
                  <p className="text-sm text-muted-foreground mt-1">Manage your account details.</p>
                </div>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-border bg-background space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Account Type</p>
                      <p className="text-sm font-medium text-foreground capitalize mt-0.5">{userData.industry}</p>
                    </div>
                    <div className="border-t border-border pt-3">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium text-foreground mt-0.5">{userData.email}</p>
                    </div>
                    <div className="border-t border-border pt-3">
                      <p className="text-xs text-muted-foreground">Member Since</p>
                      <p className="text-sm font-medium text-foreground mt-0.5">January 2024</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5">
                    <p className="text-sm font-medium text-destructive mb-1">Danger Zone</p>
                    <p className="text-xs text-muted-foreground mb-3">Permanently delete your account and all your data.</p>
                    <button className="flex items-center gap-2 px-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg transition-colors text-sm font-medium border border-destructive/30">
                      <Trash2 className="w-4 h-4" />
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            {activeSection !== "account" && (
              <div className="mt-8 pt-6 border-t border-border flex items-center gap-3">
                <button
                  onClick={handleSave}
                  className={cn(
                    "inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all",
                    saved
                      ? "bg-green-500 text-white"
                      : "bg-violet-600 hover:bg-violet-700 text-white"
                  )}
                >
                  {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {saved ? "Saved!" : "Save Changes"}
                </button>
                {saved && (
                  <p className="text-sm text-muted-foreground">Your preferences have been updated.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
