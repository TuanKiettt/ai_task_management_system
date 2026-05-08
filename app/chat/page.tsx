"use client"

import { Header } from "@/components/header"
import { Chatbox } from "@/components/chatbox"
import { ChatSidebar } from "@/components/chat-sidebar"
import { useChat } from "@/context/chat-context"
import { useEffect } from "react"

export default function ChatPage() {
  const { currentConversationId, createConversation, loading } = useChat()

  // Create a new conversation if none exists
  useEffect(() => {
    if (!currentConversationId && !loading) {
      const title = `Conversation ${new Date().toLocaleDateString("en-US")}`
      createConversation(title)
    }
  }, [currentConversationId, createConversation, loading])

  return (
    <div className="flex flex-col h-screen bg-[#050B24]">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <ChatSidebar />
        <div className="flex-1 overflow-auto p-6">
          <Chatbox />
        </div>
      </div>
    </div>
  )
}
