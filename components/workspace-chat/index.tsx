'use client'

import { useState, useEffect, useRef } from 'react'
import { useUser } from '@/context/user-context'
import { useWorkspace } from '@/context/workspace-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Send, 
  Paperclip, 
  Smile, 
  Users, 
  Search,
  MoreVertical
} from 'lucide-react'

interface Message {
  id: string
  content: string
  senderId: string
  senderName: string
  senderEmail: string
  senderAvatar?: string
  timestamp: string
  workspaceId: string
}

interface WorkspaceChatProps {
  workspaceId: string
}

export function WorkspaceChat({ workspaceId }: WorkspaceChatProps) {
  const { userId } = useUser()
  const { members } = useWorkspace()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showMemberList, setShowMemberList] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Mock messages data
  useEffect(() => {
    const mockMessages: Message[] = []
    setMessages(mockMessages)
    setLoading(false)
  }, [workspaceId])

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || !userId) return

    try {
      const message: Message = {
        id: Date.now().toString(),
        content: newMessage.trim(),
        senderId: userId,
        senderName: 'Demo User', // Would get from user context
        senderEmail: 'demo@example.com',
        senderAvatar: undefined,
        timestamp: new Date().toISOString(),
        workspaceId
      }

      setMessages(prev => [...prev, message])
      setNewMessage('')
      
      // Here you would send to WebSocket or API
      console.log('Message sent:', message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredMembers = members.filter(member => 
    member.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Workspace Chat</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowMemberList(!showMemberList)}
            >
              <Users className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Members List */}
        {showMemberList && (
          <div className="flex-1 p-4 border-b border-gray-200">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredMembers.map((member) => (
                <div key={member.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.user?.avatar} />
                    <AvatarFallback>
                      {member.user?.fullName?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{member.user?.fullName || 'Unknown User'}</div>
                    <div className="text-xs text-gray-500">{member.user?.email || 'No email'}</div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {member.role}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Online Status */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">{members.length} members online</span>
          </div>
        </div>

        {/* Active Members */}
        <div className="flex-1 p-4">
          <h4 className="font-medium text-gray-900 mb-3">Active Members</h4>
          <div className="space-y-2">
            {members.slice(0, 5).map((member) => (
              <div key={member.id} className="flex items-center space-x-2">
                <div className="relative">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={member.user?.avatar} />
                    <AvatarFallback>
                      {member.user?.fullName?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{member.user?.fullName || 'Unknown'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Team Chat</h2>
              <p className="text-sm text-gray-600">Real-time collaboration</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 p-4 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">No messages yet</h3>
                <p>Start the conversation with a greeting!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={message.id} className={`flex ${message.senderId === userId ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md ${message.senderId === userId ? 'order-2' : 'order-1'}`}>
                    {message.senderId !== userId && (
                      <div className="flex items-end space-x-2 mb-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={message.senderAvatar} />
                          <AvatarFallback>
                            {message.senderName.split(' ').map(n => n[0]).join('') || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">{message.senderName}</div>
                          <div className="text-xs text-gray-500">{message.senderEmail}</div>
                        </div>
                      </div>
                    )}
                    <div className={`rounded-lg px-4 py-2 ${
                      message.senderId === userId 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <div className={`text-xs text-gray-500 mt-1 ${
                      message.senderId === userId ? 'text-right' : 'text-left'
                    }`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-200 bg-white">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded mb-2">
              {error}
            </div>
          )}
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
            <Button type="button" variant="ghost" size="sm">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button type="button" variant="ghost" size="sm">
              <Smile className="h-4 w-4" />
            </Button>
            <Button type="submit" disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
