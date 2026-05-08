"use client"

import { useUser } from "@/context/user-context"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Briefcase, Users, Calendar, TrendingUp, Plus, MoreVertical } from "lucide-react"
import { useState } from "react"
import { useProjects, type Project } from "@/context/projects-context"

export default function ProjectsPage() {
  const { industry } = useUser()
  const { projects, addProject, updateProject, deleteProject, loading, error } = useProjects()

  const [showAddModal, setShowAddModal] = useState(false)
  const [newProject, setNewProject] = useState({ name: "", team: "3", deadline: "" })

  const handleAddProject = async () => {
    if (newProject.name && newProject.deadline) {
      await addProject({
        name: newProject.name,
        status: "Planning",
        progress: 0,
        team: parseInt(newProject.team),
        deadline: new Date(newProject.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        userId: "demo-user", // This should come from user context
      })
      setNewProject({ name: "", team: "3", deadline: "" })
      setShowAddModal(false)
    }
  }

  const handleStatusChange = async (id: string, status: Project["status"]) => {
    await updateProject(id, { status })
  }

  const handleProgressUpdate = async (id: string, progress: number) => {
    await updateProject(id, { progress })
  }

  const handleDeleteProject = async (id: string) => {
    await deleteProject(id)
  }

  const getStatusColor = (status: Project["status"]) => {
    switch (status) {
      case "In Progress": return "bg-blue-500/20 text-blue-600"
      case "Planning": return "bg-yellow-500/20 text-yellow-600"
      case "Review": return "bg-purple-500/20 text-purple-600"
      case "Completed": return "bg-green-500/20 text-green-600"
      default: return "bg-gray-500/20 text-gray-600"
    }
  }

  const stats = {
    total: projects.length,
    inProgress: projects.filter(p => p.status === "In Progress").length,
    planning: projects.filter(p => p.status === "Planning").length,
    review: projects.filter(p => p.status === "Review").length,
    completed: projects.filter(p => p.status === "Completed").length,
  }

  return (
    <div className="min-h-screen bg-[#050B24]">
      <Header />
      <main className="p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Projects</h1>
              <p className="text-blue-200">Track and manage your active projects</p>
            </div>
            <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" /> New Project
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-blue-900/30 backdrop-blur-xl rounded-xl border border-blue-800/50 p-5">
              <div className="flex items-center gap-3 mb-2">
                <Briefcase className="w-5 h-5 text-blue-400" />
                <div className="text-2xl font-bold text-white">{projects.length}</div>
              </div>
              <div className="text-blue-300 text-sm">Active Projects</div>
            </div>
            <div className="bg-blue-900/30 backdrop-blur-xl rounded-xl border border-blue-800/50 p-5">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <div className="text-2xl font-bold text-white">
                  {Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length)}%
                </div>
              </div>
              <div className="text-blue-300 text-sm">Average Progress</div>
            </div>
            <div className="bg-blue-900/30 backdrop-blur-xl rounded-xl border border-blue-800/50 p-5">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-purple-400" />
                <div className="text-2xl font-bold text-white">
                  {projects.reduce((acc, p) => acc + p.team, 0)}
                </div>
              </div>
              <div className="text-blue-300 text-sm">Team Members</div>
            </div>
          </div>

          {/* Projects Grid */}
          <div className="grid gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-blue-900/30 backdrop-blur-xl rounded-2xl border border-blue-800/50 p-6 hover:border-blue-700/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">{project.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-blue-300">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {project.team} members
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Due {project.deadline}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        project.status === "In Progress"
                          ? "bg-blue-500/20 text-blue-300"
                          : project.status === "Review"
                            ? "bg-yellow-500/20 text-yellow-300"
                            : project.status === "Completed"
                              ? "bg-green-500/20 text-green-300"
                              : "bg-purple-500/20 text-purple-300"
                      }`}
                    >
                      {project.status}
                    </span>
                    <div className="relative group">
                      <button className="p-1 hover:bg-blue-800/50 rounded">
                        <MoreVertical className="w-4 h-4 text-blue-300" />
                      </button>
                      <div className="absolute right-0 top-full mt-1 bg-blue-900 border border-blue-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        <button 
                          onClick={() => updateProject(project.id, { status: "In Progress" })}
                          className="block w-full text-left px-4 py-2 text-sm text-blue-200 hover:bg-blue-800 rounded-t-lg"
                        >
                          Mark In Progress
                        </button>
                        <button 
                          onClick={() => updateProject(project.id, { status: "Review" })}
                          className="block w-full text-left px-4 py-2 text-sm text-blue-200 hover:bg-blue-800"
                        >
                          Mark for Review
                        </button>
                        <button 
                          onClick={() => updateProject(project.id, { status: "Completed" })}
                          className="block w-full text-left px-4 py-2 text-sm text-blue-200 hover:bg-blue-800 rounded-b-lg"
                        >
                          Mark Complete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-300">Progress</span>
                    <span className="text-white font-semibold">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-blue-950/50 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Add Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#121c3d] rounded-2xl border border-blue-800/50 w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-white mb-6">Create New Project</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase text-blue-400 font-semibold mb-2 block">Project Name</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="Enter project name..."
                  className="w-full bg-[#0a122a] border border-blue-900/30 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase text-blue-400 font-semibold mb-2 block">Team Size</label>
                  <input
                    type="number"
                    value={newProject.team}
                    onChange={(e) => setNewProject({ ...newProject, team: e.target.value })}
                    className="w-full bg-[#0a122a] border border-blue-900/30 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase text-blue-400 font-semibold mb-2 block">Deadline</label>
                  <input
                    type="date"
                    value={newProject.deadline}
                    onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                    className="w-full bg-[#0a122a] border border-blue-900/30 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 rounded-xl bg-blue-900/20 text-blue-300 border border-blue-800/30 hover:bg-blue-900/40"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddProject}
                  className="flex-1 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500"
                >
                  Create Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
