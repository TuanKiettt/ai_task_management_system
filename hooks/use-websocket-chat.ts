"use client"

import { useEffect, useRef, useState } from "react"
import { getWebSocketService, WebSocketMessage } from "@/lib/websocket-service"

interface UseWebSocketChatOptions {
  workspaceId: string
  userId: string
  chatId?: string
  onNewMessage?: (message: any) => void
  onTyping?: (data: { userId: string; isTyping: boolean }) => void
  onUserStatus?: (data: { userId: string; status: string }) => void
}

export function useWebSocketChat({
  workspaceId,
  userId,
  chatId,
  onNewMessage,
  onTyping,
  onUserStatus
}: UseWebSocketChatOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const wsService = useRef(getWebSocketService())
  const handlersRef = useRef({
    onNewMessage,
    onTyping,
    onUserStatus
  })

  // Update handlers when they change
  useEffect(() => {
    handlersRef.current = { onNewMessage, onTyping, onUserStatus }
  }, [onNewMessage, onTyping, onUserStatus])

  useEffect(() => {
    if (!workspaceId || !userId) return

    const ws = wsService.current

    // Connect to WebSocket
    ws.connect(userId, workspaceId)
      .then(() => {
        setIsConnected(true)
        console.log('WebSocket chat connected')
      })
      .catch(error => {
        console.error('Failed to connect WebSocket:', error)
        setIsConnected(false)
      })

    // Set up message handlers
    const handleMessage = (message: WebSocketMessage) => {
      switch (message.type) {
        case 'message':
          if (handlersRef.current.onNewMessage) {
            handlersRef.current.onNewMessage(message.data)
          }
          break
        case 'typing':
          if (handlersRef.current.onTyping) {
            handlersRef.current.onTyping(message.data)
          }
          
          // Update typing users
          if (message.data.isTyping) {
            setTypingUsers(prev => new Set([...prev, message.data.userId]))
          } else {
            setTypingUsers(prev => {
              const newSet = new Set(prev)
              newSet.delete(message.data.userId)
              return newSet
            })
          }
          break
        case 'user_status':
          if (handlersRef.current.onUserStatus) {
            handlersRef.current.onUserStatus(message.data)
          }
          break
      }
    }

    ws.onMessage('message', handleMessage)
    ws.onMessage('typing', handleMessage)
    ws.onMessage('user_status', handleMessage)

    // Set initial user status
    ws.sendUserStatus('online')

    return () => {
      // Clean up handlers
      ws.offMessage('message', handleMessage)
      ws.offMessage('typing', handleMessage)
      ws.offMessage('user_status', handleMessage)
      
      // Set user status to offline
      ws.sendUserStatus('offline')
    }
  }, [workspaceId, userId])

  const sendMessage = (content: string, messageType = 'text', replyToId?: string) => {
    if (!chatId || !isConnected) return

    wsService.current.sendMessage('message', {
      content,
      messageType,
      replyToId,
      chatId,
      userId
    }, chatId)
  }

  const sendTyping = (isTyping: boolean) => {
    if (!chatId || !isConnected) return

    wsService.current.sendTyping(chatId, isTyping)
  }

  const sendUserStatus = (status: 'online' | 'away' | 'offline') => {
    if (!isConnected) return

    wsService.current.sendUserStatus(status)
  }

  return {
    isConnected,
    sendMessage,
    sendTyping,
    sendUserStatus,
    typingUsers: Array.from(typingUsers)
  }
}
