// WebSocket service for real-time chat functionality

export interface WebSocketMessage {
  type: 'message' | 'typing' | 'user_status' | 'chat_created' | 'member_added' | string
  data: any
  chatId?: string
  userId?: string
  timestamp: number
}

export class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private messageHandlers: Map<string, ((data: any) => void)[]> = new Map()
  private isConnecting = false

  constructor(private url: string) {}

  connect(userId: string, workspaceId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting) {
        reject(new Error('Connection already in progress'))
        return
      }

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      this.isConnecting = true

      try {
        const wsUrl = `${this.url}/ws?userId=${userId}&workspaceId=${workspaceId}`
        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
          console.log('WebSocket connected to:', wsUrl)
          this.isConnecting = false
          this.reconnectAttempts = 0
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            this.handleMessage(message)
          } catch (error) {
            console.error('Error parsing WebSocket message:', error)
          }
        }

        this.ws.onclose = () => {
          console.log('WebSocket disconnected')
          this.isConnecting = false
          this.attemptReconnect(userId, workspaceId)
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.isConnecting = false
          reject(error)
        }
      } catch (error) {
        this.isConnecting = false
        reject(error)
      }
    })
  }

  private handleMessage(message: WebSocketMessage) {
    const handlers = this.messageHandlers.get(message.type) || []
    handlers.forEach(handler => {
      try {
        handler(message.data)
      } catch (error) {
        console.error('Error in message handler:', error)
      }
    })
  }

  private attemptReconnect(userId: string, workspaceId: string) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    setTimeout(() => {
      this.connect(userId, workspaceId).catch(error => {
        console.error('Reconnection failed:', error)
      })
    }, this.reconnectDelay * this.reconnectAttempts)
  }

  onMessage(type: string, handler: (data: any) => void) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, [])
    }
    this.messageHandlers.get(type)!.push(handler)
  }

  offMessage(type: string, handler: (data: any) => void) {
    const handlers = this.messageHandlers.get(type)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  sendMessage(type: string, data: any, chatId?: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, message not sent')
      return
    }

    const message: WebSocketMessage = {
      type,
      data,
      chatId,
      timestamp: Date.now()
    }

    this.ws.send(JSON.stringify(message))
  }

  sendTyping(chatId: string, isTyping: boolean) {
    this.sendMessage('typing', { isTyping }, chatId)
  }

  sendUserStatus(status: 'online' | 'away' | 'offline') {
    this.sendMessage('user_status', { status })
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.messageHandlers.clear()
    this.reconnectAttempts = 0
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }
}

// Singleton instance
let wsService: WebSocketService | null = null

export function getWebSocketService(): WebSocketService {
  if (!wsService) {
    // Use WebSocket URL from environment or default
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8081'
    wsService = new WebSocketService(wsUrl)
  }
  return wsService
}
