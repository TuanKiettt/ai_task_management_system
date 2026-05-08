"use client"

import { Briefcase, GraduationCap, Palette, Activity, ArrowRight, CheckCircle } from "lucide-react"
import { useUser, type Industry } from "@/context/user-context"

const industries = [
  {
    id: "education",
    label: "Education",
    icon: GraduationCap,
    color: "from-blue-500 to-cyan-500",
    description: "Manage lessons, teaching schedule and students.",
  },
  { 
    id: "corporate", 
    label: "Corporate", 
    icon: Briefcase, 
    color: "from-violet-500 to-purple-500",
    description: "Optimize workflows, meetings and deadlines." 
  },
  { 
    id: "creative", 
    label: "Creative", 
    icon: Palette, 
    color: "from-pink-500 to-rose-500",
    description: "Manage design projects, ideas and portfolio." 
  },
  {
    id: "medical",
    label: "Medical",
    icon: Activity,
    color: "from-green-500 to-emerald-500",
    description: "Schedule appointments, patient records and shifts.",
  },
]

export function Onboarding() {
  const { setIndustry } = useUser()

  return (
    <div className="fixed inset-0 z-50 bg-[#13171f] flex items-center justify-center p-6">
      <div className="max-w-3xl w-full">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <span className="text-white font-bold text-2xl">A</span>
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Welcome to Alba</h1>
          <p className="text-gray-400 text-base max-w-md mx-auto">
            Select your workspace type to personalize your experience
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {industries.map((item) => (
            <button
              key={item.id}
              onClick={() => setIndustry(item.id as Industry)}
              className="group relative flex items-center gap-4 p-5 bg-[#1a1f2e] border border-[#2d3548] rounded-xl hover:border-violet-500/50 hover:bg-[#252b3b] transition-all text-left"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                <item.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold mb-0.5">{item.label}</h3>
                <p className="text-gray-400 text-sm">{item.description}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-500 opacity-0 group-hover:opacity-100 group-hover:text-violet-400 transition-all" />
            </button>
          ))}
        </div>

        {/* Features */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>AI-powered tasks</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Smart scheduling</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Team collaboration</span>
          </div>
        </div>
      </div>
    </div>
  )
}
