import { WebSocketServer, WebSocket } from 'ws'
import http from 'http'

const PORT = process.env.WS_PORT || 8081
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000'
const server = http.createServer()

const wss = new WebSocketServer({ server, path: '/ws' })

// Store connected clients by workspace
const workspaceClients = new Map<string, Set<WebSocket>>()
const clientInfo = new Map<WebSocket, { userId: string; workspaceId: string }>()

wss.on('connection', (ws: WebSocket, req) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`)
  const userId = url.searchParams.get('userId')
  const workspaceId = url.searchParams.get('workspaceId')

  console.log('New connection attempt:', { userId, workspaceId })

  if (!userId || !workspaceId) {
    console.error('Missing userId or workspaceId in WebSocket connection')
    ws.close()
    return
  }

  console.log(`User ${userId} connected to workspace ${workspaceId}`)

  // Store client info
  clientInfo.set(ws, { userId, workspaceId })

  // Add client to workspace
  if (!workspaceClients.has(workspaceId)) {
    workspaceClients.set(workspaceId, new Set())
    console.log(`Created new workspace set for ${workspaceId}`)
  }
  workspaceClients.get(workspaceId)!.add(ws)
  console.log(`Added client to workspace ${workspaceId}. Total clients in workspace: ${workspaceClients.get(workspaceId)!.size}`)

  // Send connection confirmation
  ws.send(JSON.stringify({
    type: 'connection',
    data: { status: 'connected', userId, workspaceId },
    timestamp: Date.now()
  }))

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString())
      const info = clientInfo.get(ws)

      if (!info) return

      console.log(`Message from ${info.userId} in workspace ${info.workspaceId}:`, message.type)

      // If it's a chat message, save to database via API
      if (message.type === 'message' && message.data.content && message.chatId) {
        try {
          // Get chat details to find its workspaceId
          const chatDetailsUrl = `${API_BASE_URL}/api/workspaces/${info.workspaceId}/chats/${message.chatId}?userId=${info.userId}`
          console.log('Getting chat details:', chatDetailsUrl)
          
          const chatResponse = await fetch(chatDetailsUrl)
          let actualWorkspaceId = info.workspaceId
          
          if (chatResponse.ok) {
            const chatData = await chatResponse.json()
            actualWorkspaceId = chatData.workspaceId
            console.log('Chat belongs to workspace:', actualWorkspaceId)
          } else {
            console.error('Failed to get chat details, using connection workspaceId')
          }
          
          // Use the actual workspaceId from the chat
          const apiUrl = `${API_BASE_URL}/api/workspaces/${actualWorkspaceId}/chats/${message.chatId}/messages?userId=${info.userId}`
          console.log('Saving message to database:', apiUrl)
          
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: message.data.content,
              messageType: message.data.messageType || 'text'
            })
          })

          if (response.ok) {
            const savedMessage = await response.json()
            console.log('Message saved to database:', savedMessage)

            // Update message with database data (including ID, timestamp, user info)
            message.data = {
              ...message.data,
              id: savedMessage.id,
              createdAt: savedMessage.createdAt,
              userId: savedMessage.userId,
              user: savedMessage.user  // Include user info from database
            }
            
            console.log('Broadcasting message to workspace clients')
          } else {
            const errorText = await response.text()
            console.error('Failed to save message to database:', errorText)
            console.error('Response status:', response.status)
            
            // Fetch user info to include in broadcast even if database save fails
            try {
              const userResponse = await fetch(`${API_BASE_URL}/api/users/${info.userId}`)
              if (userResponse.ok) {
                const userData = await userResponse.json()
                message.data = {
                  ...message.data,
                  user: userData
                }
                console.log('Fetched user info for broadcast:', userData)
              }
            } catch (userError) {
              console.error('Failed to fetch user info:', userError)
            }
            
            // For now, still broadcast the message even if save fails
            console.log('Broadcasting message anyway (database save failed)')
          }
        } catch (error) {
          console.error('Error saving message to database:', error)
          
          // Fetch user info to include in broadcast even if API call fails
          try {
            const userResponse = await fetch(`${API_BASE_URL}/api/users/${info.userId}`)
            if (userResponse.ok) {
              const userData = await userResponse.json()
              message.data = {
                ...message.data,
                user: userData
              }
              console.log('Fetched user info for broadcast:', userData)
            }
          } catch (userError) {
            console.error('Failed to fetch user info:', userError)
          }
          
          console.log('Broadcasting message anyway (API call failed)')
        }
      }

      // Broadcast message to other clients in the same workspace
      console.log('Broadcasting message type:', message.type, 'to workspace:', info.workspaceId)
      console.log('Total clients in workspace:', workspaceClients.size)
      console.log('Clients in this workspace:', workspaceClients.get(info.workspaceId)?.size || 0)
      
      const workspace = workspaceClients.get(info.workspaceId)
      if (workspace) {
        let broadcastCount = 0
        workspace.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            // Broadcast to all clients including sender for immediate feedback
            client.send(JSON.stringify(message))
            broadcastCount++
          }
        })
        console.log(`Broadcasted to ${broadcastCount} clients in workspace ${info.workspaceId}`)
      } else {
        console.log(`No clients found in workspace ${info.workspaceId}`)
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error)
    }
  })

  ws.on('close', () => {
    const info = clientInfo.get(ws)
    if (info) {
      console.log(`User ${info.userId} disconnected from workspace ${info.workspaceId}`)

      // Remove client from workspace
      const workspace = workspaceClients.get(info.workspaceId)
      if (workspace) {
        workspace.delete(ws)
        if (workspace.size === 0) {
          workspaceClients.delete(info.workspaceId)
        }
      }

      // Remove client info
      clientInfo.delete(ws)

      // Notify other users in workspace
      const remainingWorkspace = workspaceClients.get(info.workspaceId)
      if (remainingWorkspace && remainingWorkspace.size > 0) {
        const disconnectMessage = {
          type: 'user_status',
          data: { userId: info.userId, status: 'offline' },
          timestamp: Date.now()
        }
        remainingWorkspace.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(disconnectMessage))
          }
        })
      }
    }
  })

  ws.on('error', (error) => {
    console.error('WebSocket error:', error)
  })
})

server.listen(PORT, () => {
  console.log(`WebSocket server running on ws://localhost:${PORT}`)
  console.log(`API base URL: ${API_BASE_URL}`)
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing WebSocket server')
  wss.close(() => {
    server.close(() => {
      console.log('WebSocket server closed')
      process.exit(0)
    })
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT received, closing WebSocket server')
  wss.close(() => {
    server.close(() => {
      console.log('WebSocket server closed')
      process.exit(0)
    })
  })
})
