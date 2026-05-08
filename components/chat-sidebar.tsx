"use client"

import { Button } from "@/components/ui/button"
import { Plus, Trash2, LogOut } from "lucide-react"
import { useChat } from "@/context/chat-context"
import { useUser } from "@/context/user-context"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function ChatSidebar() {
  const { conversations, currentConversationId, createConversation, deleteConversation, switchConversation } = useChat()
  const { logout } = useUser()
  const router = useRouter()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const handleNewChat = () => {
    const title = `Conversation ${new Date().toLocaleDateString()}`
    createConversation(title)
  }

  const handleLogout = () => {
    logout()
    router.push("/auth/login")
  }

  return (
    <div className="w-64 bg-blue-900/40 border-r border-blue-700/30 backdrop-blur-sm flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-blue-700/30">
        <Button
          onClick={handleNewChat}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Conversation</span>
        </Button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {conversations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-blue-300/60 text-sm">No conversations yet</p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              onMouseEnter={() => setHoveredId(conversation.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`group p-3 rounded-lg cursor-pointer transition-colors ${
                currentConversationId === conversation.id
                  ? "bg-blue-600/60 text-white"
                  : "bg-blue-800/20 text-blue-200 hover:bg-blue-800/40"
              }`}
              onClick={() => switchConversation(conversation.id)}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm truncate flex-1">{conversation.title}</span>
                {hoveredId === conversation.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteConversation(conversation.id)
                    }}
                    className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-xs text-blue-300/50 mt-1">{new Date(conversation.updatedAt).toLocaleDateString()}</p>
            </div>
          ))
        )}
      </div>

      {/* Footer - Logout */}
      <div className="p-4 border-t border-blue-700/30">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg flex items-center space-x-2"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Sign Out</span>
        </Button>
      </div>
    </div>
  )
}
