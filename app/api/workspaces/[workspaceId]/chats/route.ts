import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const { name, description } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (!name) {
      return NextResponse.json({ error: 'Chat name is required' }, { status: 400 })
    }

    // Check if user is a member of the workspace
    const membership = await prisma.workspaceMember.findFirst({
      where: {
        userId: userId,
        workspaceId: workspaceId,
        isActive: true
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Access denied to workspace' }, { status: 403 })
    }

    // Create the chat
    const chat = await prisma.workspaceChat.create({
      data: {
        name,
        description,
        workspaceId,
        createdBy: userId,
        isPrivate: false
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            avatar: true
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      }
    })

    return NextResponse.json(chat)
  } catch (error) {
    console.error('Error creating chat:', error)
    return NextResponse.json(
      { error: 'Failed to create chat' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check if user is a member of the workspace
    const membership = await prisma.workspaceMember.findFirst({
      where: {
        userId: userId,
        workspaceId: workspaceId,
        isActive: true
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Access denied to workspace' }, { status: 403 })
    }

    // Get all chats for the workspace
    const chats = await prisma.workspaceChat.findMany({
      where: {
        workspaceId: workspaceId
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            avatar: true
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Add unread count for each chat (simplified - in real app you'd track read status)
    const chatsWithUnread = chats.map((chat: any) => ({
      ...chat,
      unreadCount: 0 // TODO: Implement proper unread count tracking
    }))

    return NextResponse.json(chatsWithUnread)
  } catch (error) {
    console.error('Error fetching chats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chats' },
      { status: 500 }
    )
  }
}
