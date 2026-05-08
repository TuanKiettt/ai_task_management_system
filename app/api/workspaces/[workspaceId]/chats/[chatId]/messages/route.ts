import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; chatId: string }> }
) {
  try {
    const { workspaceId, chatId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const { content, messageType } = await request.json()

    console.log('POST messages API called with:', { workspaceId, chatId, userId, content, messageType })

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (!content) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    // Check if user is a member of the workspace
    const membership = await prisma.workspaceMember.findFirst({
      where: {
        userId: userId,
        workspaceId: workspaceId,
        isActive: true
      }
    })

    console.log('Workspace membership check:', membership)

    if (!membership) {
      return NextResponse.json({ error: 'Access denied to workspace' }, { status: 403 })
    }

    // Check if user is a member of the chat
    const chatMembership = await prisma.workspaceChatMember.findFirst({
      where: {
        userId: userId,
        chatId: chatId
      }
    })

    console.log('Chat membership check:', chatMembership)

    if (!chatMembership) {
      // Auto-add user to chat if not already a member
      const newMembership = await prisma.workspaceChatMember.create({
        data: {
          userId: userId,
          chatId: chatId,
          joinedAt: new Date()
        }
      })
      console.log('Created new chat membership:', newMembership)
    }

    // Create the message
    const messageData = {
      content,
      messageType: messageType || 'text',
      chatId: chatId,
      userId: userId
    }

    console.log('Creating message with data:', messageData)

    const message = await prisma.workspaceChatMessage.create({
      data: messageData,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatar: true
          }
        }
      }
    })

    console.log('Successfully created message:', JSON.stringify(message, null, 2))
    return NextResponse.json(message)
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; chatId: string }> }
) {
  try {
    const { workspaceId, chatId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    console.log('GET messages API called with:', { workspaceId, chatId, userId })

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

    console.log('Workspace membership:', membership)

    if (!membership) {
      return NextResponse.json({ error: 'Access denied to workspace' }, { status: 403 })
    }

    // Check if user is a member of the chat, auto-add if not
    let chatMembership = await prisma.workspaceChatMember.findFirst({
      where: {
        userId: userId,
        chatId: chatId
      }
    })

    console.log('Chat membership:', chatMembership)

    if (!chatMembership) {
      // Auto-add user to chat since they're a workspace member
      chatMembership = await prisma.workspaceChatMember.create({
        data: {
          userId: userId,
          chatId: chatId,
          joinedAt: new Date()
        }
      })
      console.log('Created chat membership:', chatMembership)
    }

    // Get all messages for the chat
    const messages = await prisma.workspaceChatMessage.findMany({
      where: {
        chatId: chatId
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    console.log('Database query for messages - chatId:', chatId)
    console.log('Found messages count:', messages.length)
    console.log('API returning messages:', JSON.stringify(messages, null, 2))
    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}
