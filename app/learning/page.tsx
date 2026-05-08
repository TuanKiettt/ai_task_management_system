"use client"

import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GraduationCap, BookOpen, Award, Clock, Play, CheckCircle, AlertCircle } from "lucide-react"
import { useState, useMemo } from "react"
import { useLearning, type Course, type CourseStatus } from "@/context/learning-context"
import { useUser } from "@/context/user-context"

export default function LearningPage() {
  const [filter, setFilter] = useState<"all" | CourseStatus>("all")
  
  const { courses, startCourse, getCourseStats, loading, error, refreshCourses } = useLearning()
  const { userId } = useUser()
  
  const stats = getCourseStats()
  
  const filteredCourses = filter === "all" ? courses : courses.filter(c => c.status === filter)
  
  const handleStartCourse = async (id: string) => {
    await startCourse(id)
  }

  const getStatusColor = (status: Course["status"]) => {
    switch (status) {
      case "completed": return "text-green-400"
      case "in-progress": return "text-orange-400"
      case "assigned": return "text-blue-400"
      default: return "text-yellow-400"
    }
  }

  const getStatusBgColor = (status: Course["status"]) => {
    switch (status) {
      case "completed": return "bg-green-500"
      case "in-progress": return "bg-orange-500"
      case "assigned": return "bg-blue-500"
      default: return "bg-yellow-500"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Professional Learning</h1>
            <p className="text-muted-foreground">Enhance your skills with personalized courses</p>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Progress Overview */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 border-b">
              <GraduationCap className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Course Progress Overview</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Progress Bar */}
                <div className="h-6 rounded-full overflow-hidden bg-secondary border flex">
                  <div className="bg-green-500 transition-all" style={{ width: `${(stats.completed / courses.length) * 100}%` }} />
                  <div className="bg-orange-500 transition-all" style={{ width: `${(stats.inProgress / courses.length) * 100}%` }} />
                  <div className="bg-primary transition-all" style={{ width: `${(stats.assigned / courses.length) * 100}%` }} />
                  <div className="bg-yellow-500 transition-all" style={{ width: `${(stats.recommended / courses.length) * 100}%` }} />
                </div>

                {/* Legend */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-green-600 text-sm font-semibold">Completed ({stats.completed})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span className="text-orange-600 text-sm font-semibold">In Progress ({stats.inProgress})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-primary text-sm font-semibold">Assigned ({stats.assigned})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="text-yellow-600 text-sm font-semibold">Recommended ({stats.recommended})</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-card rounded-xl p-4 border text-center">
              <Award className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{courses.length}</p>
              <p className="text-muted-foreground text-sm">Total Courses</p>
            </div>
            <div className="bg-card rounded-xl p-4 border text-center">
              <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
              <p className="text-muted-foreground text-sm">Completed</p>
            </div>
            <div className="bg-card rounded-xl p-4 border text-center">
              <BookOpen className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stats.inProgress}</p>
              <p className="text-muted-foreground text-sm">In Progress</p>
            </div>
            <div className="bg-card rounded-xl p-4 border text-center">
              <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">
                {courses.reduce((acc, c) => acc + parseFloat(c.duration), 0).toFixed(1)}h
              </p>
              <p className="text-muted-foreground text-sm">Total Hours</p>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {(["all", "completed", "in-progress", "assigned", "recommended"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-accent border"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1).replace("-", " ")}
              </button>
            ))}
          </div>

          {/* Courses List */}
          <div className="grid gap-4">
            {filteredCourses.map((course) => (
              <Card
                key={course.id}
                className="p-5 hover:bg-accent/50 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    course.status === "completed" ? "bg-green-500/20" : "bg-primary/20"
                  }`}>
                    {course.status === "completed" ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <BookOpen className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-foreground font-semibold group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>{course.category}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {course.duration}
                      </span>
                      <span className={getStatusColor(course.status)}>
                        {course.status.replace("-", " ")}
                      </span>
                    </div>
                    {course.status !== "completed" && course.progress > 0 && (
                      <div className="mt-2 w-full max-w-xs">
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${getStatusBgColor(course.status)} transition-all`}
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{course.progress}% complete</p>
                      </div>
                    )}
                  </div>
                  {course.status !== "completed" && (
                    <Button
                      onClick={() => handleStartCourse(course.id)}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {course.progress > 0 ? "Continue" : "Start"}
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {!loading && (
        <>
        </>
      )}
    </div>
  )
}
