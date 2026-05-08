"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { 
  MessageSquare, X, Minus, History, Plus, Trash2, Send, Paperclip,
  Sparkles, CalendarClock, Lightbulb, BotMessageSquare, ChevronDown, Check
} from "lucide-react"
import { useUser } from "@/context/user-context"
import { useChat } from "@/context/chat-context"
import { useTasks } from "@/context/task-context"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { ChatMessage } from "@/context/chat-context"
import { extractTasksWithLocalAI } from "@/lib/local-ai-service"
import { HydrationWrapper } from "@/components/hydration-wrapper"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

// AI Modes configuration
type AIMode = "assistant" | "task-generate" | "smart-schedule" | "productivity"

interface AIModeConfig {
  id: AIMode
  name: string
  icon: React.ElementType
  description: string
  color: string
  placeholder: string
  systemPrompt: string
}

const AI_MODES: AIModeConfig[] = [
  {
    id: "assistant",
    name: "Chat Assistant",
    icon: BotMessageSquare,
    description: "General help & questions",
    color: "from-violet-500 to-purple-600",
    placeholder: "Ask me anything...",
    systemPrompt: "You are Alba, a helpful AI assistant. Provide clear, concise, and friendly responses."
  },
  {
    id: "task-generate",
    name: "Task Generator",
    icon: Sparkles,
    description: "Create tasks from text",
    color: "from-amber-500 to-orange-600",
    placeholder: "Describe what you need to do...",
    systemPrompt: "You are a task extraction AI. Analyze user input and identify actionable tasks with priorities, categories, and time estimates."
  },
  {
    id: "smart-schedule",
    name: "Smart Scheduling",
    icon: CalendarClock,
    description: "Optimize your schedule",
    color: "from-emerald-500 to-teal-600",
    placeholder: "Tell me about your schedule...",
    systemPrompt: "You are a scheduling optimization AI. Help users organize their time, suggest optimal task ordering, and identify scheduling conflicts."
  },
  {
    id: "productivity",
    name: "Productivity Coach",
    icon: Lightbulb,
    description: "Tips & motivation",
    color: "from-pink-500 to-rose-600",
    placeholder: "What do you need help with?",
    systemPrompt: "You are a productivity coach. Provide actionable advice, time management tips, and motivational guidance."
  },
]

interface FloatingChatProps {
  isOpen: boolean
  onClose: () => void
}

export function FloatingChat({ isOpen, onClose }: FloatingChatProps) {
  const { userName, userData } = useUser()
  const {
    conversations,
    currentConversation,
    currentConversationId,
    addMessage,
    createConversation,
    deleteConversation,
    switchConversation,
  } = useChat()
  const { tasks, addTask } = useTasks()
  const [inputValue, setInputValue] = useState("")
  const [showHistory, setShowHistory] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [currentMode, setCurrentMode] = useState<AIMode>("assistant")
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedTasks, setExtractedTasks] = useState<Array<{
    title: string
    category: string
    priority: string
    time: string
    selected: boolean
  }>>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const modeConfig = AI_MODES.find(m => m.id === currentMode)!

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, isMinimized])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [currentConversation?.messages])

  // Generate AI responses using Local AI Service
  const generateAIResponse = useCallback(async (userMessage: string, mode: AIMode): Promise<string> => {
    try {
      // Use Local AI for task generation
      if (mode === "task-generate") {
        const response = await extractTasksWithLocalAI(userMessage)
        return response
      }
      
      // For other modes, use mock responses (can be extended to use local AI later)
      switch (mode) {
        case "smart-schedule":
          return generateScheduleResponse(userMessage)
        case "productivity":
          return generateProductivityResponse(userMessage)
        default:
          return generateAssistantResponse(userMessage)
      }
      
    } catch (error) {
      console.error('Local AI Error:', error)
      
      // Simple fallback for task generation
      if (mode === "task-generate") {
        return `I found 1 task in your message:
[
  { 
    "title": "${userMessage}", 
    "category": "General", 
    "priority": "Medium", 
    "estimatedTime": "1h" 
  }
]

*Confidence: 50%*`
      }
      
      return `I apologize, but I'm having trouble processing your request right now. Please try again.`
    }
  }, [])

  const generateAssistantResponse = (message: string): string => {
    const lower = message.toLowerCase()
    if (lower.includes("hello") || lower.includes("hi")) {
      return `Hello ${userName}! I'm Alba, your AI assistant. How can I help you today? You can ask me questions, switch to Task Generator mode to create tasks, use Smart Scheduling to optimize your day, or get productivity tips.`
    }
    if (lower.includes("help")) {
      return `I can help you in several ways:\n\n**Chat Assistant** - Answer questions and provide information\n**Task Generator** - Extract actionable tasks from your descriptions\n**Smart Scheduling** - Analyze and optimize your schedule\n**Productivity Coach** - Get tips and motivation\n\nUse the mode selector above to switch between these capabilities!`
    }
    if (lower.includes("task") || lower.includes("todo")) {
      return `I see you're thinking about tasks! Try switching to **Task Generator** mode - just describe what you need to do in natural language, and I'll extract actionable tasks with priorities and time estimates.`
    }
    return `I understand you're asking about: "${message}". As your assistant, I can help with questions, planning, and more. For specialized help, try switching to Task Generator, Smart Scheduling, or Productivity Coach mode using the selector above.`
  }

  const generateTaskResponse = (message: string): string => {
    // Simulate task extraction with deterministic random for hydration
    const words = message.split(" ")
    const taskCount = Math.min(Math.max(1, Math.floor(words.length / 5)), 4)
    
    const categories = ["Work", "Personal", "Meeting", "Planning", "Research"]
    const priorities = ["High", "Medium", "Low"]
    const times = ["15m", "30m", "1h", "2h", "3h"]

    // Simple hash function for deterministic random
    const hashCode = (str: string) => {
      let hash = 0
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32-bit integer
      }
      return Math.abs(hash)
    }

    const newTasks = []
    for (let i = 0; i < taskCount; i++) {
      const startIdx = Math.floor(i * words.length / taskCount)
      const endIdx = Math.floor((i + 1) * words.length / taskCount)
      const taskWords = words.slice(startIdx, endIdx).join(" ")
      
      // Use deterministic random based on message and index
      const seed = hashCode(message + i)
      const categoryIndex = seed % categories.length
      const priorityIndex = (seed >> 8) % priorities.length
      const timeIndex = (seed >> 16) % times.length
      
      newTasks.push({
        title: taskWords.charAt(0).toUpperCase() + taskWords.slice(1),
        category: categories[categoryIndex],
        priority: priorities[priorityIndex],
        time: times[timeIndex],
        selected: true
      })
    }

    setExtractedTasks(newTasks)
    return `I've identified **${taskCount} task${taskCount > 1 ? 's'  : ''}** from your message. Review them below and click "Add Tasks" to add them to your task list, or deselect any you don't need.`
  }

  const generateScheduleResponse = (message: string): string => {
    const taskStats = {
      total: tasks.length,
      urgent: tasks.filter(t => t.status === "urgent").length,
      todayDue: tasks.filter(t => {
        if (!t.dueDate) return false
        const today = new Date().toISOString().split("T")[0]
        return t.dueDate === today
      }).length,
      overdue: tasks.filter(t => {
        if (!t.dueDate || t.status === "done") return false
        return t.dueDate < new Date().toISOString().split("T")[0]
      }).length
    }

    const lower = message.toLowerCase()
    
    if (lower.includes("today") || lower.includes("schedule")) {
      return `**Your Schedule Analysis:**\n\n📊 **Overview:**\n- Total tasks: ${taskStats.total}\n- Due today: ${taskStats.todayDue}\n- Urgent: ${taskStats.urgent}\n- Overdue: ${taskStats.overdue}\n\n**Recommendations:**\n${taskStats.urgent > 0 ? `1. Focus on your ${taskStats.urgent} urgent task${taskStats.urgent > 1 ? 's' : ''} first\n` : ''}${taskStats.overdue > 0 ? `2. Address ${taskStats.overdue} overdue item${taskStats.overdue > 1 ? 's' : ''}\n` : ''}3. Block 2-hour focus time for deep work\n4. Schedule breaks every 90 minutes`
    }

    if (lower.includes("optimize") || lower.includes("improve")) {
      return `**Schedule Optimization Tips:**\n\n🎯 **Priority Ordering:**\n1. Start with urgent tasks when energy is high\n2. Batch similar tasks together\n3. Save routine tasks for afternoon slump\n\n⏰ **Time Blocking:**\n- Deep work: 9-11 AM\n- Meetings: 2-4 PM\n- Admin tasks: End of day\n\nWant me to help you reorganize specific tasks?`
    }

    return `I can help you optimize your schedule! You have **${taskStats.total} tasks** with **${taskStats.urgent} urgent** items.\n\nTry asking:\n- "What should I focus on today?"\n- "Optimize my task order"\n- "When should I schedule meetings?"\n- "How can I reduce overdue tasks?"`
  }

  const generateProductivityResponse = (message: string): string => {
    const lower = message.toLowerCase()

    if (lower.includes("motivat") || lower.includes("stuck") || lower.includes("procrastinat")) {
      return `**Getting Unstuck:**\n\n**The 2-Minute Rule:** If a task takes less than 2 minutes, do it now.\n\n🎯 **Break It Down:** Large tasks feel overwhelming. Split them into smaller, actionable steps.\n\n⏱️ **Pomodoro Technique:** Work for 25 minutes, then take a 5-minute break. After 4 cycles, take a longer break.\n\n💪 **Remember:** Progress, not perfection. Starting is the hardest part - you've got this!`
    }

    if (lower.includes("focus") || lower.includes("distract")) {
      return `**Improving Focus:**\n\n**Environment:**\n- Turn off notifications\n- Use "Do Not Disturb" mode\n- Keep your workspace clean\n\n🧠 **Mental:**\n- Clear your mind with a brain dump\n- Set clear intentions before each task\n- Use background music or white noise\n\n⏰ **Time:**\n- Identify your peak hours\n- Schedule deep work during those times\n- Protect your calendar`
    }

    if (lower.includes("tired") || lower.includes("energy") || lower.includes("burnout")) {
      return `**Energy Management:**\n\n**Rest is Productive:**\n- Quality sleep (7-9 hours)\n- Short breaks prevent burnout\n- Step away from screens\n\n🏃 **Physical:**\n- Light exercise boosts energy\n- Stay hydrated\n- Healthy snacks over sugar\n\n🧘 **Mental Reset:**\n- 5-minute meditation\n- Deep breathing exercises\n- Take a walk outside`
    }

    return `**Productivity Tips for ${userName}:**\n\n**Daily Habits:**\n1. Plan tomorrow tonight\n2. Tackle hardest task first (Eat the Frog)\n3. Review and celebrate wins\n\n🎯 **Focus Techniques:**\n- Time blocking\n- Pomodoro (25/5 intervals)\n- Single-tasking over multitasking\n\nWhat specific area would you like help with? Focus, motivation, energy, or time management?`
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return

    // Clear extracted tasks when sending new message
    setExtractedTasks([])

    // Create conversation if needed and wait for it
    if (!currentConversationId) {
      await createConversation(`${modeConfig.name} - ${new Date().toLocaleDateString()}`)
      // Wait a bit for state to update
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    const messageText = inputValue
    setInputValue("")
    setIsProcessing(true)

    // Add user message
    await addMessage(userMessage)

    try {
      const response = await generateAIResponse(messageText, currentMode)
      
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      }
      addMessage(assistantMessage)
      
      // Auto-add tasks if in task-generate mode
      if (currentMode === "task-generate") {
        await autoAddTasksFromResponse(response, messageText)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  // Auto-add tasks from AI response
  const autoAddTasksFromResponse = async (response: string, originalMessage: string) => {
    try {
      // Parse tasks from AI response JSON
      const jsonMatch = response.match(/\[\s*\{[\s\S]*?\}\s*\]/);
      if (!jsonMatch) {
        console.log('No tasks found in response');
        return;
      }

      const tasksData = JSON.parse(jsonMatch[0]);
      
      // Extract due date from original message
      const dueDate = extractDueDate(originalMessage);
      
      // Add each task to the task list
      let addedCount = 0;
      for (const taskData of tasksData) {
        try {
          await addTask({
            title: taskData.title,
            category: taskData.category || 'General',
            priority: taskData.priority || 'Medium',
            estimatedTime: taskData.estimatedTime || '1h',
            dueDate: dueDate,
            status: 'new'
          });
          addedCount++;
        } catch (taskError) {
          console.error('Error adding individual task:', taskError);
        }
      }
      
      // Show success message
      const successMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `✅ **Successfully added ${addedCount} task${addedCount > 1 ? 's' : ''} to your task list!**\n\nYou can view them in your task dashboard.`,
        timestamp: new Date(),
      }
      addMessage(successMessage)
      
    } catch (error) {
      console.error('Error auto-adding tasks:', error);
      
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `❌ Sorry, I had trouble adding the tasks automatically. But don't worry - you can still use the tasks from the message above!\n\nJust copy the task details and add them manually if needed.`,
        timestamp: new Date(),
      }
      addMessage(errorMessage)
    }
  }

  // Extract due date from message
  const extractDueDate = (message: string): string | undefined => {
    const patterns = [
      /(?:in|on|by|for|at)\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]?\d{0,4})/i,
      /(?:in|on|by|for|at)\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
      /(?:in|on|by|for|at)\s+(this\s+week|next\s+week|this\s+weekend)/i
    ];
    
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        let dateStr = match[1];
        
        // Convert relative dates to absolute
        const today = new Date();
        if (dateStr.toLowerCase() === 'today') {
          return today.toLocaleDateString('en-CA');
        }
        if (dateStr.toLowerCase() === 'tomorrow') {
          const tomorrow = new Date(today);
          tomorrow.setDate(today.getDate() + 1);
          return tomorrow.toLocaleDateString('en-CA');
        }
        
        // Convert "28/3" to "2024-03-28" format
        if (/^\d{1,2}[\/\-]\d{1,2}$/.test(dateStr)) {
          const parts = dateStr.split(/[\/\-]/);
          if (parts.length === 2) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = today.getFullYear();
            return `${year}-${month}-${day}`;
          }
        }
        
        // Handle "28/3/2024" format
        if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(dateStr)) {
          const parts = dateStr.split(/[\/\-]/);
          if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            return `${year}-${month}-${day}`;
          }
        }
        
        return dateStr;
      }
    }
    
    return undefined;
  }

  const handleAddTasks = () => {
    const selectedTasks = extractedTasks.filter(t => t.selected)
    selectedTasks.forEach((task) => {
      addTask({
        title: task.title,
        category: task.category,
        priority: task.priority as "High" | "Medium" | "Low" | "Urgent",
        estimatedTime: task.time,
        status: "new",
      })
    })

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: `Added **${selectedTasks.length} task${selectedTasks.length !== 1 ? 's' : ''}** to your task list. You can view and manage them in the List view.`,
      timestamp: new Date(),
    }
    addMessage(message)
    setExtractedTasks([])
  }

  const toggleTaskSelection = (index: number) => {
    setExtractedTasks(prev => prev.map((t, i) => 
      i === index ? { ...t, selected: !t.selected } : t
    ))
  }

  if (!isOpen) return null

  return (
    <HydrationWrapper>
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 flex flex-col",
          "w-[380px] rounded-2xl shadow-2xl overflow-hidden",
          "bg-white dark:bg-[#1a1f2e] border border-gray-200 dark:border-[#2d3548]",
          "transition-all duration-300 ease-out",
          isMinimized ? "h-14" : "h-[580px]",
      )}
    >
      {/* Header with Mode Indicator */}
      <div className={cn(
        "flex items-center justify-between px-4 h-14 flex-shrink-0 border-b border-gray-100 dark:border-[#2d3548]",
        "bg-gradient-to-r", modeConfig.color, "bg-opacity-10"
      )}>
        <div className="flex items-center gap-2.5">
          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br", modeConfig.color)}>
            <modeConfig.icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none">{modeConfig.name}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{modeConfig.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-1.5 hover:bg-white/20 dark:hover:bg-black/20 rounded-lg transition-colors"
            title="Chat history"
          >
            <History className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-white/20 dark:hover:bg-black/20 rounded-lg transition-colors"
          >
            <Minus className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 dark:hover:bg-black/20 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Mode Selector */}
          <div className="flex items-center gap-1 p-2 border-b border-gray-100 dark:border-[#2d3548] bg-gray-50 dark:bg-[#151922]">
            {AI_MODES.map((mode) => {
              const Icon = mode.icon
              const isActive = currentMode === mode.id
              return (
                <button
                  key={mode.id}
                  onClick={() => setCurrentMode(mode.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all",
                    isActive 
                      ? `bg-gradient-to-r ${mode.color} text-white shadow-sm` 
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252b3b]"
                  )}
                  title={mode.description}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline truncate">{mode.name.split(" ")[0]}</span>
                </button>
              )
            })}
          </div>

          {/* History Panel */}
          {showHistory && (
            <div className="absolute inset-0 top-14 z-10 bg-white dark:bg-[#1a1f2e] overflow-y-auto">
              <div className="p-3 border-b border-gray-100 dark:border-[#2d3548] flex items-center justify-between sticky top-0 bg-white dark:bg-[#1a1f2e]">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Chat History</p>
                <button onClick={() => setShowHistory(false)}>
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              {conversations.length > 0 ? (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => { switchConversation(conv.id); setShowHistory(false) }}
                    className={cn(
                      "flex items-center justify-between p-3 border-b border-gray-50 dark:border-[#252b3b] cursor-pointer hover:bg-gray-50 dark:hover:bg-[#252b3b] group",
                      currentConversationId === conv.id && "bg-violet-50 dark:bg-violet-900/20"
                    )}
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white truncate">{conv.title}</p>
                      <p className="text-xs text-gray-400">{conv.messages.length} messages</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id) }}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 ml-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-400 text-sm">No conversations yet</div>
              )}
              <div className="p-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <Plus className="w-4 h-4" />
                      New Conversation
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-48">
                    {AI_MODES.map((mode) => (
                      <DropdownMenuItem
                        key={mode.id}
                        onClick={() => {
                          setCurrentMode(mode.id)
                          createConversation(`${mode.name} - ${new Date().toLocaleDateString()}`)
                          setShowHistory(false)
                        }}
                      >
                        <mode.icon className="w-4 h-4 mr-2" />
                        {mode.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Welcome message when no conversation */}
            {(!currentConversation || currentConversation.messages.length === 0) && (
              <div className="flex flex-col items-center text-center py-4 gap-3">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br", modeConfig.color)}>
                  <modeConfig.icon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{modeConfig.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-[260px]">
                    {currentMode === "assistant" && "Ask me anything - I'm here to help with questions, planning, and more."}
                    {currentMode === "task-generate" && "Describe your tasks in natural language and I'll extract actionable items."}
                    {currentMode === "smart-schedule" && "Tell me about your schedule and I'll help you optimize your time."}
                    {currentMode === "productivity" && "Get personalized tips on focus, motivation, and time management."}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 w-full mt-2">
                  {currentMode === "assistant" && (
                    <>
                      <SuggestionButton onClick={setInputValue} text="What can you help me with?" />
                      <SuggestionButton onClick={setInputValue} text="How do I use the different modes?" />
                    </>
                  )}
                  {currentMode === "task-generate" && (
                    <>
                      <SuggestionButton onClick={setInputValue} text="I need to prepare a presentation, review reports, and schedule meetings" />
                      <SuggestionButton onClick={setInputValue} text="Complete the project proposal by Friday" />
                    </>
                  )}
                  {currentMode === "smart-schedule" && (
                    <>
                      <SuggestionButton onClick={setInputValue} text="What should I focus on today?" />
                      <SuggestionButton onClick={setInputValue} text="Optimize my task order" />
                    </>
                  )}
                  {currentMode === "productivity" && (
                    <>
                      <SuggestionButton onClick={setInputValue} text="I'm feeling stuck and unmotivated" />
                      <SuggestionButton onClick={setInputValue} text="How can I improve my focus?" />
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Chat messages */}
            {currentConversation?.messages.map((message) => (
              <div
                key={message.id}
                className={cn("flex gap-2", message.role === "user" ? "justify-end" : "justify-start")}
              >
                {message.role === "assistant" && (
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-gradient-to-br", modeConfig.color)}>
                    <modeConfig.icon className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] px-3 py-2 rounded-2xl text-sm",
                    message.role === "user"
                      ? "bg-violet-600 text-white rounded-br-sm"
                      : "bg-gray-100 dark:bg-[#252b3b] text-gray-900 dark:text-white rounded-bl-sm",
                  )}
                >
                  <div className="leading-relaxed whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none [&_strong]:font-semibold [&_p]:m-0">
                    {message.content}
                  </div>
                  <p className={cn("text-[10px] mt-1", message.role === "user" ? "text-violet-200" : "text-gray-400")}>
                    {new Date(message.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {message.role === "user" && (
                  <Avatar className="w-7 h-7 flex-shrink-0 mt-0.5">
                    <AvatarFallback className="bg-gradient-to-br from-orange-400 to-pink-500 text-white text-[10px] font-semibold">
                      {userName?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {/* Processing indicator */}
            {isProcessing && (
              <div className="flex gap-2 justify-start">
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br", modeConfig.color)}>
                  <modeConfig.icon className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-100 dark:bg-[#252b3b] rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Extracted Tasks Panel (for Task Generator mode) */}
          {extractedTasks.length > 0 && (
            <div className="border-t border-gray-100 dark:border-[#2d3548] p-3 bg-amber-50 dark:bg-amber-900/10 max-h-48 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                  {extractedTasks.filter(t => t.selected).length} of {extractedTasks.length} tasks selected
                </p>
                <Button 
                  size="sm" 
                  onClick={handleAddTasks}
                  disabled={extractedTasks.filter(t => t.selected).length === 0}
                  className="h-7 text-xs bg-amber-600 hover:bg-amber-700"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Tasks
                </Button>
              </div>
              <div className="space-y-1.5">
                {extractedTasks.map((task, index) => (
                  <div
                    key={index}
                    onClick={() => toggleTaskSelection(index)}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all text-xs",
                      task.selected 
                        ? "bg-white dark:bg-[#252b3b] border border-amber-300 dark:border-amber-600" 
                        : "bg-gray-100 dark:bg-[#1a1f2e] border border-transparent opacity-60"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0",
                      task.selected ? "bg-amber-500 border-amber-500" : "border-gray-300"
                    )}>
                      {task.selected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="flex-1 truncate text-gray-900 dark:text-white">{task.title}</span>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-medium",
                      task.priority === "High" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" :
                      task.priority === "Medium" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" :
                      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    )}>
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="flex-shrink-0 p-3 border-t border-gray-100 dark:border-[#2d3548]">
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#252b3b] rounded-xl px-3 py-2 border border-gray-200 dark:border-[#2d3548] focus-within:border-violet-400 dark:focus-within:border-violet-600 transition-colors">
              <button className="p-1 hover:bg-gray-200 dark:hover:bg-[#2d3548] rounded transition-colors flex-shrink-0">
                <Paperclip className="w-3.5 h-3.5 text-gray-400" />
              </button>
              <input
                ref={inputRef}
                type="text"
                placeholder={modeConfig.placeholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) handleSendMessage()
                }}
                disabled={isProcessing}
                className="flex-1 bg-transparent text-gray-900 dark:text-white text-sm placeholder-gray-400 outline-none min-w-0 disabled:opacity-50"
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isProcessing}
                className={cn("h-7 w-7 rounded-lg flex-shrink-0 disabled:opacity-40 bg-gradient-to-r", modeConfig.color)}
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
    </HydrationWrapper>
  )
}

// Suggestion button component
function SuggestionButton({ text, onClick }: { text: string; onClick: (text: string) => void }) {
  return (
    <button
      onClick={() => onClick(text)}
      className="text-left px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#252b3b] hover:bg-violet-50 dark:hover:bg-violet-900/20 text-xs text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-[#2d3548] hover:border-violet-200 dark:hover:border-violet-800 transition-colors"
    >
      {text}
    </button>
  )
}

// Standalone floating trigger button
export function FloatingChatButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 z-50",
        "w-14 h-14 rounded-2xl",
        "bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700",
        "shadow-lg shadow-violet-500/30",
        "flex items-center justify-center",
        "transition-all duration-200 active:scale-95",
        "group",
      )}
      aria-label="Open AI Assistant"
    >
      <MessageSquare className="w-6 h-6 text-white" />
    </button>
  )
}
