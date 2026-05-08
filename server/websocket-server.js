const WebSocket = require('ws');
const http = require('http');
const url = require('url');

// Store connected clients by workspace and user
const workspaceClients = new Map(); // workspaceId -> Set of clients
const userClients = new Map(); // userId -> client

class WebSocketServer {
  constructor(port = 8081) {
    this.port = port;
    this.wss = null;
    this.server = null;
  }

  start() {
    // Create HTTP server for WebSocket upgrade
    this.server = http.createServer();
    
    // Create WebSocket server
    this.wss = new WebSocket.Server({ 
      server: this.server,
      path: '/ws'
    });

    this.wss.on('connection', (ws, request) => {
      const { query } = url.parse(request.url, true);
      const userId = query.userId;
      const workspaceId = query.workspaceId;

      if (!userId || !workspaceId) {
        console.log('Connection rejected: missing userId or workspaceId');
        ws.close(1008, 'Missing userId or workspaceId');
        return;
      }

      console.log(`Client connected: userId=${userId}, workspaceId=${workspaceId}`);

      // Store client info
      ws.userId = userId;
      ws.workspaceId = workspaceId;

      // Add to workspace clients
      if (!workspaceClients.has(workspaceId)) {
        workspaceClients.set(workspaceId, new Set());
      }
      workspaceClients.get(workspaceId).add(ws);

      // Add to user clients
      userClients.set(userId, ws);

      // Send welcome message
      this.sendToClient(ws, {
        type: 'connected',
        data: {
          message: 'Connected to workspace chat',
          workspaceId,
          userId
        }
      });

      // Handle messages from client
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          console.log('Received message:', data);
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('Error parsing message:', error);
          this.sendToClient(ws, {
            type: 'error',
            data: { message: 'Invalid message format' }
          });
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        console.log(`Client disconnected: userId=${userId}, workspaceId=${workspaceId}`);
        
        // Remove from workspace clients
        const workspaceSet = workspaceClients.get(workspaceId);
        if (workspaceSet) {
          workspaceSet.delete(ws);
          if (workspaceSet.size === 0) {
            workspaceClients.delete(workspaceId);
          }
        }

        // Remove from user clients
        userClients.delete(userId);

        // Notify other clients in workspace
        this.broadcastToWorkspace(workspaceId, {
          type: 'user_status',
          data: {
            userId,
            status: 'offline'
          }
        }, ws);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      // Notify other clients in workspace that user is online
      this.broadcastToWorkspace(workspaceId, {
        type: 'user_status',
        data: {
          userId,
          status: 'online'
        }
      }, ws);
    });

    this.server.listen(this.port, () => {
      console.log(`WebSocket server running on port ${this.port}`);
      console.log(`WebSocket URL: ws://localhost:${this.port}/ws`);
    });
  }

  handleMessage(ws, message) {
    const { type, data, chatId } = message;

    switch (type) {
      case 'message':
        this.handleChatMessage(ws, data, chatId);
        break;
      case 'typing':
        this.handleTyping(ws, data, chatId);
        break;
      case 'user_status':
        this.handleUserStatus(ws, data);
        break;
      default:
        console.log('Unknown message type:', type);
    }
  }

  handleChatMessage(ws, data, chatId) {
    const message = {
      type: 'message',
      data: {
        ...data,
        id: this.generateId(),
        userId: ws.userId,
        chatId,
        timestamp: new Date().toISOString()
      }
    };

    // Broadcast to all clients in the workspace
    this.broadcastToWorkspace(ws.workspaceId, message);
  }

  handleTyping(ws, data, chatId) {
    const typingMessage = {
      type: 'typing',
      data: {
        ...data,
        userId: ws.userId,
        chatId
      }
    };

    // Broadcast to all clients in the workspace except sender
    this.broadcastToWorkspace(ws.workspaceId, typingMessage, ws);
  }

  handleUserStatus(ws, data) {
    const statusMessage = {
      type: 'user_status',
      data: {
        ...data,
        userId: ws.userId
      }
    };

    // Broadcast to all clients in the workspace
    this.broadcastToWorkspace(ws.workspaceId, statusMessage);
  }

  broadcastToWorkspace(workspaceId, message, excludeWs = null) {
    const clients = workspaceClients.get(workspaceId);
    if (clients) {
      clients.forEach(client => {
        if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
          this.sendToClient(client, message);
        }
      });
    }
  }

  sendToClient(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  stop() {
    if (this.wss) {
      this.wss.close();
    }
    if (this.server) {
      this.server.close();
    }
  }
}

// Start the server
const wsServer = new WebSocketServer(8081);
wsServer.start();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down WebSocket server...');
  wsServer.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down WebSocket server...');
  wsServer.stop();
  process.exit(0);
});
