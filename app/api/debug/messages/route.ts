import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get all messages from database for debugging
    const allMessages = await prisma.workspaceChatMessage.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        chat: {
          select: {
            id: true,
            name: true,
            workspaceId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20 // Limit to last 20 messages
    })

    // Get all chats
    const allChats = await prisma.workspaceChat.findMany({
      include: {
        _count: {
          select: {
            messages: true
          }
        }
      }
    })

    // Get all workspace members
    const workspaceMembers = await prisma.workspaceMember.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        workspace: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      messages: allMessages,
      chats: allChats,
      workspaceMembers: workspaceMembers,
      summary: {
        totalMessages: allMessages.length,
        totalChats: allChats.length,
        totalWorkspaceMembers: workspaceMembers.length
      }
    })

  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch debug data' },
      { status: 500 }
    )
  }
}
