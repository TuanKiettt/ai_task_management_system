"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Mic, Paperclip, Send, MessageSquare, History, Plus, Trash2, X, ChevronDown } from "lucide-react"
import { useUser } from "@/context/user-context"
import { useChat } from "@/context/chat-context"
import { useTasks } from "@/context/task-context"
import { useWorkspace } from "@/context/workspace-context"
import { useState, useCallback } from "react"
import type { ChatMessage } from "@/context/chat-context"
import { useDebounce } from "@/hooks/use-debounce"
import { AITaskExtractor } from "@/components/ai-task-extractor"
import { HydrationFix, generateStableId } from "@/components/hydration-fix"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const conversationTemplates = [
  { title: "General Chat", icon: MessageSquare, description: "Ask anything" },
  { title: "Task Planning", icon: MessageSquare, description: "Plan and organize tasks" },
  { title: "Brainstorming", icon: MessageSquare, description: "Generate ideas" },
  { title: "Problem Solving", icon: MessageSquare, description: "Get help with issues" },
]

export function Chatbox() {
  const { industry, userName, userData } = useUser()
  const { conversations, currentConversation, currentConversationId, addMessage, createConversation, deleteConversation, switchConversation } = useChat()
  const { addTask } = useTasks()
  const { currentWorkspace, workspaces } = useWorkspace()
  const [inputValue, setInputValue] = useState("")
  const [showHistory, setShowHistory] = useState(false)
  const [showAIExtractor, setShowAIExtractor] = useState(false)
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null)
  const [showWorkspaceSelector, setShowWorkspaceSelector] = useState(false)
  const debouncedInputValue = useDebounce(inputValue, 300)

  const getIndustryContent = () => {
    switch (industry) {
      case "corporate":
        return {
          greeting: `Good day, ${userName}`,
          description: "I'm your business operations assistant. What processes can we optimize today?",
          suggestions: [
            "Summarize this morning's meeting notes",
            "Check quarterly KPI progress",
            "Schedule a meeting with the Marketing team",
            "Analyze this month's expense report",
          ],
        }
      case "creative":
        return {
          greeting: `What's your inspiration today, ${userName}?`,
          description: "I'm Alba Creative. Let's turn ideas into reality together.",
          suggestions: [
            "Create a color palette for the Rebranding project",
            "Find Minimalist design inspiration",
            "Suggest layout for Portfolio page",
            "Review client feedback",
          ],
        }
      case "medical":
        return {
          greeting: `Doctor ${userName}, welcome to your day`,
          description: "Alba Medical system is ready to help you manage patient records and schedules.",
          suggestions: [
            "View list of patients waiting for examination",
            "Update patient record A-102",
            "Check next week's schedule",
            "Summarize latest lab results",
          ],
        }
      default:
        return {
          greeting: `Hello ${userName}`,
          description: "My name is Alba. How can I help you?",
          suggestions: [
            "How do I take my attendance?",
            "How do I create my own lesson using CoPilot?",
            "Where do I submit a receipt for reimbursement?",
            "What do I need to know about today?",
          ],
        }
    }
  }

  const content = getIndustryContent()

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    // Auto-create conversation if none exists
    if (!currentConversationId) {
      await createConversation(`Chat ${new Date().toLocaleDateString()}`)
    }

    const userMessage: ChatMessage = {
      id: generateStableId(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    }
    
    // Add the user message
    await addMessage(userMessage)
    
    // Get AI response using True AI
    try {
      const response = await fetch('/api/ai/persistent-true-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,
          userId: 'chat-user',
          context: { 
            type: 'chat',
            timestamp: new Date().toISOString(),
            conversationHistory: currentConversation?.messages?.slice(-3) || [] // Include last 3 messages for context
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      // True AI returns JSON with neural response
      const data = await response.json()
      let aiResponse = ''

      if (data.success && data.neural_response) {
        // Use neural-generated response (100% AI)
        aiResponse = data.neural_response
      } else if (data.success && data.task) {
        // Fallback to formatted task info
        const task = data.task
        aiResponse = `I understand you want to: "${task.title}"\n\n` +
                    `📋 **Category:** ${task.category}\n` +
                    `⏰ **Priority:** ${task.priority}\n` +
                    `📅 **Date:** ${task.date || 'No specific date'}\n` +
                    `🎯 **Confidence:** ${(task.confidence * 100).toFixed(1)}%\n\n` +
                    `💭 ${task.motivationalNote}\n\n` +
                    `Would you like me to help you organize this task further?`
      } else {
        // Fallback response
        aiResponse = data.error || 'I understand your message. Let me help you organize your thoughts into actionable tasks.'
      }

      if (aiResponse.trim()) {
        const assistantMessage: ChatMessage = {
          id: generateStableId(),
          role: "assistant",
          content: aiResponse.trim(),
          timestamp: new Date(),
        }
        await addMessage(assistantMessage)
      }
    } catch (error) {
      console.error('AI Error:', error)
      // Fallback response
      const assistantMessage: ChatMessage = {
        id: generateStableId(),
        role: "assistant",
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      }
      await addMessage(assistantMessage)
    }

    setInputValue("")
  }

  const handleSuggestion = (suggestion: string) => {
    setInputValue(suggestion)
  }

  const handleNewConversation = async (title: string) => {
    await createConversation(title)
    setShowHistory(false)
  }

  const handleTasksExtracted = useCallback(
    (tasks: Array<{ title: string; category: string; priority: string; time: string; date?: Date }>) => {
      const targetWorkspaceId = selectedWorkspace || currentWorkspace?.id
      const targetWorkspace = workspaces.find(w => w.id === targetWorkspaceId)
      
      tasks.forEach((task) => {
        addTask({
          title: task.title,
          category: task.category,
          priority: (task.priority as "High" | "Medium" | "Low" | "Urgent"),
          estimatedTime: task.time,
          status: "new",
          dueDate: task.date ? task.date.toISOString().split('T')[0] : undefined,
          workspaceId: targetWorkspaceId, // Use selected or current workspace
        })
      })
      setShowAIExtractor(false)
      setSelectedWorkspace(null) // Reset selection after use
      
      // Show success message
      let workspaceContext = ""
      if (targetWorkspace) {
        workspaceContext = ` in workspace "${targetWorkspace.name}"`
      }
      
      const message: ChatMessage = {
        id: generateStableId(),
        role: "assistant",
        content: `✅ I've extracted ${tasks.length} task(s) from your message and added them${workspaceContext} to your task list.`,
        timestamp: new Date(),
      }
      addMessage(message)
    },
    [addTask, addMessage, currentWorkspace, selectedWorkspace, workspaces]
  )

  return (
    <div className="w-full space-y-4 relative">
      {/* Chat History Panel */}
      {showHistory && (
        <Card className="absolute top-0 left-0 right-0 z-20 bg-white dark:bg-[#1a1f2e] border-gray-200 dark:border-[#2d3548] shadow-xl">
          <CardContent className="p-0">
            <div className="p-3 border-b border-gray-200 dark:border-[#2d3548] flex items-center justify-between">
              <h3 className="text-gray-900 dark:text-white font-semibold text-sm">Chat History</h3>
              <button onClick={() => setShowHistory(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* New Conversation Options */}
            <div className="p-3 border-b border-gray-200 dark:border-[#2d3548]">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Start new conversation</p>
              <div className="grid grid-cols-2 gap-2">
                {conversationTemplates.map((template) => (
                  <button
                    key={template.title}
                    onClick={() => handleNewConversation(template.title)}
                    className="p-2 bg-gray-50 dark:bg-[#252b3b] hover:bg-gray-100 dark:hover:bg-[#2d3548] border border-gray-200 dark:border-[#2d3548] rounded-lg text-left transition-colors"
                  >
                    <p className="text-gray-900 dark:text-white text-xs font-medium">{template.title}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-[10px]">{template.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Previous Conversations */}
            <div className="max-h-64 overflow-y-auto">
              {conversations.length > 0 ? (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`p-3 border-b border-gray-100 dark:border-[#252b3b] hover:bg-gray-50 dark:hover:bg-[#252b3b] cursor-pointer flex items-center justify-between group ${
                      currentConversationId === conv.id ? "bg-violet-50 dark:bg-violet-900/20" : ""
                    }`}
                    onClick={() => {
                      switchConversation(conv.id)
                      setShowHistory(false)
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 dark:text-white text-sm truncate">{conv.title}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">
                        {conv.messages.length} messages - {new Date(conv.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteConversation(conv.id)
                      }}
                      className="text-red-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center">
                  <History className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No conversations yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Assistant Card - ClickUp Style */}
      <Card className="bg-white dark:bg-[#1a1f2e] border-gray-200 dark:border-[#2d3548]">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Alba Assistant</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">AI-powered task helper</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-[#252b3b] rounded-lg transition-colors"
              >
                <History className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-[#252b3b] rounded-lg transition-colors">
                    <Plus className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white dark:bg-[#1a1f2e] border-gray-200 dark:border-[#2d3548]">
                  {conversationTemplates.map((template) => (
                    <DropdownMenuItem
                      key={template.title}
                      onClick={() => handleNewConversation(template.title)}
                      className="cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 mr-2 text-violet-500" />
                      {template.title}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleNewConversation(`Chat ${new Date().toLocaleDateString()}`)}
                    className="cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 mr-2 text-violet-500" />
                    Custom Chat
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Current Conversation */}
          {currentConversation && (
            <div className="mb-4 px-3 py-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-800/30">
              <p className="text-[10px] text-violet-600 dark:text-violet-400 uppercase tracking-wider font-medium">Active Chat</p>
              <p className="text-gray-900 dark:text-white text-sm font-medium truncate">{currentConversation.title}</p>
            </div>
          )}

          {/* Greeting */}
          <div className="text-center py-4">
            <h3 className="text-gray-900 dark:text-white text-lg font-semibold mb-1">{content.greeting}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{content.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Chat Messages */}
      {currentConversation && currentConversation.messages.length > 0 && (
        <Card className="bg-white dark:bg-[#1a1f2e] border-gray-200 dark:border-[#2d3548] max-h-80 overflow-y-auto">
          <CardContent className="p-4 space-y-3">
            {currentConversation.messages.map((message, index) => (
              <div 
                key={message.id} 
                className={`flex gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xs">A</span>
                  </div>
                )}
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${
                    message.role === "user"
                      ? "bg-violet-600 text-white"
                      : "bg-gray-100 dark:bg-[#252b3b] text-gray-900 dark:text-white"
                  }`}
                >
                  <p>{message.content}</p>
                  <p className="text-xs mt-1 opacity-60">
                    {new Date(message.timestamp).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {message.role === "user" && (
                  <Avatar className="w-7 h-7 flex-shrink-0">
                    {userData?.avatar ? (
                      <AvatarImage src={userData.avatar} />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-orange-400 to-pink-500 text-white text-xs font-semibold">
                      {userName?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* AI Task Extractor */}
      {showAIExtractor && inputValue.trim() && (
        <AITaskExtractor 
          userMessage={inputValue} 
          onTasksExtracted={handleTasksExtracted} 
          workspaceId={selectedWorkspace || currentWorkspace?.id}
        />
      )}

      {/* Workspace Selector - Only show on home page */}
      {!currentWorkspace && workspaces.length > 0 && (
        <Card className="bg-white dark:bg-[#1a1f2e] border-gray-200 dark:border-[#2d3548]">
          <CardContent className="p-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Create tasks in:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    {selectedWorkspace ? workspaces.find(w => w.id === selectedWorkspace)?.name : "Personal Tasks"}
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                  <DropdownMenuItem onClick={() => setSelectedWorkspace(null)}>
                    <span className="text-xs">Personal Tasks</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {workspaces.map((workspace) => (
                    <DropdownMenuItem key={workspace.id} onClick={() => setSelectedWorkspace(workspace.id)}>
                      <span className="text-xs">{workspace.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Input Area */}
      <Card className="bg-white dark:bg-[#1a1f2e] border-gray-200 dark:border-[#2d3548]">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#252b3b] rounded-lg px-3 py-2 border border-gray-200 dark:border-[#2d3548]">
            <button className="p-1 hover:bg-gray-200 dark:hover:bg-[#2d3548] rounded transition-colors">
              <Paperclip className="w-4 h-4 text-gray-400" />
            </button>
            <input
              type="text"
              placeholder="Ask me anything or describe tasks..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1 bg-transparent text-gray-900 dark:text-white text-sm placeholder-gray-400 outline-none"
            />
            <Button
              size="icon"
              onClick={handleSendMessage}
              className="h-8 w-8 bg-violet-600 hover:bg-violet-700 rounded-lg"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          {inputValue.trim() && !showAIExtractor && (
            <Button
              onClick={() => setShowAIExtractor(true)}
              variant="ghost"
              size="sm"
              className="w-full text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/20 text-xs"
            >
              <MessageSquare className="w-3 h-3 mr-1" />
              Extract tasks with AI
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="space-y-2">
        <p className="text-gray-500 dark:text-gray-400 text-xs px-1 font-medium">Quick prompts</p>
        <div className="grid grid-cols-2 gap-2">
          {content.suggestions.slice(0, 4).map((suggestion, i) => (
            <Button
              key={i}
              variant="outline"
              onClick={() => handleSuggestion(suggestion)}
              className="justify-start text-left bg-white dark:bg-[#1a1f2e] border-gray-200 dark:border-[#2d3548] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252b3b] text-xs h-auto py-2 px-3"
            >
              <span className="truncate">{suggestion}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
