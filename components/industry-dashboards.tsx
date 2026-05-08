"use client"

import { Clock, CheckCircle2, AlertCircle, BarChart3, Users, Zap, Calendar, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useTasks } from "@/context/task-context"

export function CorporateDashboard() {
  const { getTaskStats } = useTasks()
  const stats = getTaskStats()

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white tracking-tight">Business Operations Center</h2>
        <div className="flex items-center space-x-2 text-blue-400 text-sm bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">
          <Zap className="w-4 h-4 fill-current" />
          <span>AI Insight: Prioritize morning meetings today</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-900/20 border-blue-800/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-300 flex items-center">
              <Clock className="w-4 h-4 mr-2" /> Next Meeting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-white">Project X Team Sync</p>
            <p className="text-sm text-blue-400">10:30 AM - Zoom</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-900/20 border-blue-800/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-300 flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2" /> Quarterly KPI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-white">78% Complete</p>
            <div className="w-full bg-blue-900/50 h-1.5 mt-2 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full w-[78%]" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-900/20 border-blue-800/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-300 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" /> Urgent Deadline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-red-400">Financial Report</p>
            <p className="text-sm text-blue-400">2 days remaining</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-900/20 border border-blue-800/50 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-400" /> Weekly Performance
          </h3>
          <div className="h-[150px] flex items-end justify-between gap-2 px-4">
            {[40, 70, 45, 90, 65, 30, 50].map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-blue-500/20 rounded-t-lg relative group transition-all hover:bg-blue-500/40"
                style={{ height: `${h}%` }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {h}%
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-[10px] text-blue-400 font-medium px-4">
            <span>MON</span>
            <span>TUE</span>
            <span>WED</span>
            <span>THU</span>
            <span>FRI</span>
            <span>SAT</span>
            <span>SUN</span>
          </div>
        </div>

        <div className="bg-blue-900/20 border border-blue-800/50 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-400" /> Task Summary
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-950/50 rounded-xl text-center">
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-blue-300">Total Tasks</p>
            </div>
            <div className="p-3 bg-green-950/50 rounded-xl text-center">
              <p className="text-2xl font-bold text-green-400">{stats.done}</p>
              <p className="text-xs text-green-300">Completed</p>
            </div>
            <div className="p-3 bg-yellow-950/50 rounded-xl text-center">
              <p className="text-2xl font-bold text-yellow-400">{stats.processing}</p>
              <p className="text-xs text-yellow-300">In Progress</p>
            </div>
            <div className="p-3 bg-red-950/50 rounded-xl text-center">
              <p className="text-2xl font-bold text-red-400">{stats.urgent}</p>
              <p className="text-xs text-red-300">Urgent</p>
            </div>
          </div>
          <Link href="/todo">
            <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">View All Tasks</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export function CreativeDashboard() {
  const { getTaskStats } = useTasks()
  const stats = getTaskStats()

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white tracking-tight">Creative Studio</h2>
        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl">
          <Zap className="w-4 h-4 mr-2" /> AI Moodboard
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-purple-900/10 border-purple-800/30">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-purple-300">Project: XYZ Rebranding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg" />
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg" />
              <div className="w-12 h-12 bg-pink-500/20 rounded-lg" />
            </div>
            <p className="text-white text-sm">Status: Designing Visual Identity</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-900/10 border-blue-800/30">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-blue-300">AI Inspiration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-200 text-sm italic">
              "Minimalism combined with Retro-Futurism will be the trend for your next week's project."
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-purple-900/20 border border-purple-800/50 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-purple-400" /> Creative Tasks Overview
        </h3>
        <div className="grid grid-cols-4 gap-3">
          <div className="p-3 bg-purple-950/50 rounded-xl text-center">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-purple-300">Total</p>
          </div>
          <div className="p-3 bg-green-950/50 rounded-xl text-center">
            <p className="text-2xl font-bold text-green-400">{stats.done}</p>
            <p className="text-xs text-green-300">Done</p>
          </div>
          <div className="p-3 bg-yellow-950/50 rounded-xl text-center">
            <p className="text-2xl font-bold text-yellow-400">{stats.processing}</p>
            <p className="text-xs text-yellow-300">Active</p>
          </div>
          <div className="p-3 bg-red-950/50 rounded-xl text-center">
            <p className="text-2xl font-bold text-red-400">{stats.urgent}</p>
            <p className="text-xs text-red-300">Urgent</p>
          </div>
        </div>
        <Link href="/todo">
          <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700">Manage Tasks</Button>
        </Link>
      </div>
    </div>
  )
}

export function MedicalDashboard() {
  const { getTaskStats } = useTasks()
  const stats = getTaskStats()

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white tracking-tight">Alba Medical System</h2>
        <div className="flex items-center space-x-2 text-emerald-400 text-sm">
          <Users className="w-4 h-4" />
          <span>12 patients waiting</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-emerald-900/10 border-emerald-800/30">
          <CardContent className="p-6">
            <h3 className="text-emerald-300 font-medium mb-4 flex items-center">
              <Calendar className="w-4 h-4 mr-2" /> Today's Shifts
            </h3>
            <div className="space-y-4 text-white text-sm">
              <div className="flex justify-between border-b border-emerald-800/30 pb-2">
                <span>08:00 - 12:00</span>
                <span>General Internal Medicine</span>
              </div>
              <div className="flex justify-between border-b border-emerald-800/30 pb-2">
                <span>13:00 - 17:00</span>
                <span>Emergency Room (A2)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-900/10 border-emerald-800/30">
          <CardContent className="p-6">
            <h3 className="text-emerald-300 font-medium mb-4 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" /> Task Summary
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 bg-emerald-950/50 rounded-lg text-center">
                <p className="text-xl font-bold text-white">{stats.total}</p>
                <p className="text-[10px] text-emerald-300">Total</p>
              </div>
              <div className="p-2 bg-green-950/50 rounded-lg text-center">
                <p className="text-xl font-bold text-green-400">{stats.done}</p>
                <p className="text-[10px] text-green-300">Done</p>
              </div>
              <div className="p-2 bg-yellow-950/50 rounded-lg text-center">
                <p className="text-xl font-bold text-yellow-400">{stats.processing}</p>
                <p className="text-[10px] text-yellow-300">Active</p>
              </div>
              <div className="p-2 bg-red-950/50 rounded-lg text-center">
                <p className="text-xl font-bold text-red-400">{stats.urgent}</p>
                <p className="text-[10px] text-red-300">Urgent</p>
              </div>
            </div>
            <Link href="/todo">
              <Button className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700">View Tasks</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
