"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  MessageCircle, 
  Send, 
  Users, 
  Plus, 
  Settings,
  Reply,
  Smile,
  Paperclip,
  MoreVertical,
  Wifi,
  WifiOff
} from "lucide-react"
import { useWorkspace } from "@/context/workspace-context"
import { useUser } from "@/context/user-context"
import { ChatSettings } from "@/components/chat-settings"
// import { useWebSocketChat } from "@/hooks/use-websocket-chat"

interface ChatMessage {
  id: string
  content: string
  messageType: string
  userId: string
  user: {
    id: string
    fullName: string
    avatar?: string
  }
  replyTo?: {
    id: string
    content: string
    user: {
      fullName: string
    }
  }
  createdAt: string
  isEdited: boolean
  attachments: any[]
}

interface WorkspaceChat {
  id: string
  name: string
  description?: string
  isPrivate: boolean
  creator: {
    id: string
    fullName: string
    avatar?: string
  }
  _count: {
    messages: number
  }
  unreadCount: number
}

export function WorkspaceChat() {
  const { currentWorkspace } = useWorkspace()
  const { userId } = useUser()
  const [chats, setChats] = useState<WorkspaceChat[]>([])
  const [selectedChat, setSelectedChat] = useState<WorkspaceChat | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // WebSocket integration (temporarily disabled for testing)
  const isConnected = false
  const sendWebSocketMessage = () => {}
  const sendTyping = () => {}
  const typingUsers: string[] = []
  
  // const {
  //   isConnected,
  //   sendMessage: sendWebSocketMessage,
  //   sendTyping,
  //   typingUsers
  // } = useWebSocketChat({
  //   workspaceId: currentWorkspace?.id || '',
  //   userId: userId || '',
  //   chatId: selectedChat?.id,
  //   onNewMessage: (message) => {
  //     if (selectedChat && message.chatId === selectedChat.id) {
  //       setMessages(prev => [...prev, message])
  //     }
  //   },
  //   onTyping: (data) => {
  //     // Handle typing indicators
  //     console.log('User typing:', data)
  //   }
  // })

  useEffect(() => {
    if (currentWorkspace) {
      fetchChats()
    }
  }, [currentWorkspace])

  useEffect(() => {
    console.log('selectedChat changed:', selectedChat?.id, 'userId:', userId)
    if (selectedChat && userId) {
      console.log('Calling fetchMessages for chat:', selectedChat.id)
      fetchMessages()
    } else {
      console.log('Not fetching messages - missing selectedChat or userId')
    }
  }, [selectedChat, userId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchChats = async () => {
    if (!currentWorkspace || !userId) return

    try {
      setLoading(true)
      const response = await fetch(
        `/api/workspaces/${currentWorkspace.id}/chats?userId=${userId}`
      )
      if (response.ok) {
        const data = await response.json()
        setChats(data)
        // Select first chat by default
        if (data.length > 0 && !selectedChat) {
          setSelectedChat(data[0])
        }
      }
    } catch (error) {
      console.error('Error fetching chats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    if (!selectedChat || !userId) {
      console.log('fetchMessages: Missing selectedChat or userId', { selectedChat, userId })
      return
    }

    try {
      console.log('Fetching messages for chat:', selectedChat.id, 'user:', userId)
      const response = await fetch(
        `/api/workspaces/${currentWorkspace?.id}/chats/${selectedChat.id}/messages?userId=${userId}`
      )
      console.log('Messages response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched messages:', data)
        setMessages(data)
      } else {
        const errorData = await response.json()
        console.error('Failed to fetch messages:', errorData)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !userId) {
      console.log('sendMessage: Missing required data', { 
        hasMessage: !!newMessage.trim(), 
        selectedChat: !!selectedChat, 
        userId 
      })
      return
    }

    try {
      setSending(true)
      console.log('Sending message:', newMessage.trim(), 'to chat:', selectedChat.id)
      
      // Force use HTTP API only (disable WebSocket for testing)
      console.log('Sending via HTTP API (WebSocket disabled for testing)')
      const response = await fetch(
        `/api/workspaces/${currentWorkspace?.id}/chats/${selectedChat.id}/messages?userId=${userId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: newMessage.trim(),
            messageType: 'text'
          })
        }
      )

      console.log('HTTP response status:', response.status)
      if (response.ok) {
        const message = await response.json()
        console.log('Message saved:', message)
        setNewMessage("")
        
        // Fetch messages to ensure UI is updated
        console.log('Fetching messages after HTTP send')
        fetchMessages()
        
        // Update unread count
        setChats(prev => prev.map(chat => 
          chat.id === selectedChat.id 
            ? { ...chat, unreadCount: 0 }
            : chat
        ))
      } else {
        const errorData = await response.json()
        console.error('Failed to send message:', errorData)
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const createNewChat = async () => {
    if (!currentWorkspace || !userId) return

    try {
      const response = await fetch(
        `/api/workspaces/${currentWorkspace.id}/chats?userId=${userId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: `New Chat ${new Date().toLocaleTimeString()}`
          })
        }
      )

      if (response.ok) {
        const newChat = await response.json()
        console.log('Created new chat:', newChat)
        setChats(prev => [newChat, ...prev])
        setSelectedChat(newChat)
        
        // Fetch messages for the new chat after a short delay
        setTimeout(() => {
          console.log('Fetching messages for new chat')
          fetchMessages()
        }, 500)
      } else {
        const errorData = await response.json()
        console.error('Failed to create chat:', errorData)
      }
    } catch (error) {
      console.error('Error creating chat:', error)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (!currentWorkspace) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Select a workspace to start chatting
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex h-[600px] gap-4">
      {/* Chat List */}
      <div className="w-80 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Workspace Chat
          </h3>
          <Button size="sm" variant="outline" onClick={createNewChat}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <ScrollArea className="h-[550px]">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {chats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedChat?.id === chat.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedChat(chat)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium truncate">{chat.name}</h4>
                            {chat.isPrivate && (
                              <Badge variant="secondary" className="text-xs">
                                Private
                              </Badge>
                            )}
                          </div>
                          {chat.description && (
                            <p className="text-sm text-muted-foreground truncate">
                              {chat.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {chat._count.messages} messages
                            </span>
                            {chat.unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {chat.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{selectedChat.name}</CardTitle>
                      <div className="flex items-center gap-1">
                        {isConnected ? (
                          <Wifi className="w-4 h-4 text-green-500" />
                        ) : (
                          <WifiOff className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`text-xs ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
                          {isConnected ? 'Connected' : 'Disconnected'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => setShowSettings(true)}>
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Messages */}
            <Card className="flex-1 flex flex-col">
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[400px] p-4">
                  <div className="space-y-4">
                    {(() => {
                      console.log('Rendering messages array:', messages)
                      return null
                    })()}
                    {messages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-sm">No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isCurrentUser = message.user?.id === userId
                        return (
                          <div 
                            key={message.id} 
                            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`flex gap-3 max-w-[70%] ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                              <Avatar className="w-8 h-8 flex-shrink-0">
                                <AvatarImage src={message.user?.avatar} />
                                <AvatarFallback className="text-xs">
                                  {message.user?.fullName?.charAt(0) || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="space-y-1">
                                <div className={`flex items-center gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                                  <span className="font-medium text-sm">
                                    {message.user?.fullName || 'Unknown User'}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatTime(message.createdAt)}
                                  </span>
                                  {message.isEdited && (
                                    <span className="text-xs text-muted-foreground">(edited)</span>
                                  )}
                                </div>
                                
                                {message.replyTo && (
                                  <div className="bg-muted/50 p-2 rounded text-sm border-l-2 border-muted-foreground/20">
                                    <div className="text-xs text-muted-foreground mb-1">
                                      Replying to {message.replyTo.user.fullName}
                                    </div>
                                    <div className="truncate">{message.replyTo.content}</div>
                                  </div>
                                )}
                                
                                <div className={`rounded-lg px-3 py-2 text-sm ${
                                  isCurrentUser 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-gray-100 text-gray-900'
                                }`}>
                                  {message.content}
                                </div>
                                
                                <div className={`flex items-center gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                                  <Button size="sm" variant="ghost" className="h-6 px-2">
                                    <Reply className="w-3 h-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-6 px-2">
                                    <Smile className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Message Input */}
              <Separator />
              <div className="p-4">
                {/* Typing Indicator */}
                {typingUsers.length > 0 && (
                  <div className="mb-2 text-sm text-muted-foreground">
                    {typingUsers.length === 1 ? (
                      <span>Someone is typing...</span>
                    ) : (
                      <span>{typingUsers.length} people are typing...</span>
                    )}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value)
                      // Send typing indicator (disabled for testing)
                      // if (e.target.value.trim()) {
                      //   sendTyping(true)
                      // } else {
                      //   sendTyping(false)
                      // }
                    }}
                    onBlur={() => {
                      // sendTyping(false)
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                        // sendTyping(false)
                      }
                    }}
                    className="flex-1"
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={!newMessage.trim() || sending}
                    size="sm"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </>
        ) : (
          <Card className="flex-1">
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-semibold mb-2">Select a chat to start messaging</h3>
                <p className="text-sm">Choose a chat from the list or create a new one</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Chat Settings Modal */}
      {showSettings && (
        <ChatSettings 
          onClose={() => setShowSettings(false)} 
          chatId={selectedChat?.id}
          workspaceId={currentWorkspace?.id || undefined}
          userId={userId || undefined}
          onChatDeleted={() => {
            setSelectedChat(null)
            setShowSettings(false)
            fetchChats() // Refresh chat list
          }}
        />
      )}
    </div>
  )
}
