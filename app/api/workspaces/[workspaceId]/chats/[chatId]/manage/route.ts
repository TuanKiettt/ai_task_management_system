import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// DELETE - Delete chat (only chat creator or workspace admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; chatId: string }> }
) {
  try {
    const { workspaceId, chatId } = await params
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

    // Get chat and check if user is creator or workspace admin
    const chat = await prisma.workspaceChat.findFirst({
      where: {
        id: chatId,
        workspaceId: workspaceId
      }
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    // Check permissions: only chat creator or workspace admin can delete
    const isCreator = chat.createdBy === userId
    const isAdmin = membership.role === 'admin'

    if (!isCreator && !isAdmin) {
      return NextResponse.json({ error: 'Only chat creator or workspace admin can delete chat' }, { status: 403 })
    }

    // Delete chat and all related data (messages, members)
    await prisma.workspaceChat.delete({
      where: {
        id: chatId
      }
    })

    console.log(`Chat ${chatId} deleted by user ${userId}`)
    return NextResponse.json({ message: 'Chat deleted successfully' })

  } catch (error) {
    console.error('Error deleting chat:', error)
    return NextResponse.json(
      { error: 'Failed to delete chat' },
      { status: 500 }
    )
  }
}

// GET - Get chat members and permissions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; chatId: string }> }
) {
  try {
    const { workspaceId, chatId } = await params
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

    // Get chat details
    const chat = await prisma.workspaceChat.findFirst({
      where: {
        id: chatId,
        workspaceId: workspaceId
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatar: true
              }
            }
          }
        }
      }
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    // Check if user is chat member
    const chatMembership = chat.members.find(member => member.userId === userId)
    if (!chatMembership) {
      return NextResponse.json({ error: 'Access denied to chat' }, { status: 403 })
    }

    // Determine user permissions
    const isCreator = chat.createdBy === userId
    const isWorkspaceAdmin = membership.role === 'admin'
    const canManageChat = isCreator || isWorkspaceAdmin

    return NextResponse.json({
      chat: {
        id: chat.id,
        name: chat.name,
        description: chat.description,
        createdBy: chat.createdBy
      },
      members: chat.members.map(member => ({
        id: member.id,
        userId: member.userId,
        joinedAt: member.joinedAt,
        user: member.user
      })),
      permissions: {
        canDeleteChat: canManageChat,
        canKickMembers: canManageChat,
        canEditChat: canManageChat,
        isCreator: isCreator,
        isWorkspaceAdmin: isWorkspaceAdmin
      }
    })

  } catch (error) {
    console.error('Error getting chat management info:', error)
    return NextResponse.json(
      { error: 'Failed to get chat management info' },
      { status: 500 }
    )
  }
}

// PATCH - Edit chat name
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; chatId: string }> }
) {
  try {
    const { workspaceId, chatId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const { name, description } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (!name || name.trim().length === 0) {
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

    // Get chat and check permissions
    const chat = await prisma.workspaceChat.findFirst({
      where: {
        id: chatId,
        workspaceId: workspaceId
      }
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    // Check permissions: only chat creator or workspace admin can edit
    const isCreator = chat.createdBy === userId
    const isAdmin = membership.role === 'admin'

    if (!isCreator && !isAdmin) {
      return NextResponse.json({ error: 'Only chat creator or workspace admin can edit chat' }, { status: 403 })
    }

    // Check if chat name already exists in this workspace
    const existingChat = await prisma.workspaceChat.findFirst({
      where: {
        workspaceId: workspaceId,
        name: name.trim(),
        id: { not: chatId }
      }
    })

    if (existingChat) {
      return NextResponse.json({ error: 'Chat with this name already exists' }, { status: 400 })
    }

    // Update chat
    const updatedChat = await prisma.workspaceChat.update({
      where: {
        id: chatId
      },
      data: {
        name: name.trim(),
        description: description || null
      }
    })

    console.log(`Chat ${chatId} updated by user ${userId}`)
    return NextResponse.json(updatedChat)

  } catch (error) {
    console.error('Error updating chat:', error)
    return NextResponse.json(
      { error: 'Failed to update chat' },
      { status: 500 }
    )
  }
}

// POST - Kick member from chat
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; chatId: string }> }
) {
  try {
    const { workspaceId, chatId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const { memberUserId } = await request.json()

    if (!userId || !memberUserId) {
      return NextResponse.json({ error: 'User ID and member user ID are required' }, { status: 400 })
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

    // Get chat and check permissions
    const chat = await prisma.workspaceChat.findFirst({
      where: {
        id: chatId,
        workspaceId: workspaceId
      }
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    // Check permissions: only chat creator or workspace admin can kick members
    const isCreator = chat.createdBy === userId
    const isAdmin = membership.role === 'admin'

    if (!isCreator && !isAdmin) {
      return NextResponse.json({ error: 'Only chat creator or workspace admin can kick members' }, { status: 403 })
    }

    // Cannot kick the chat creator
    if (memberUserId === chat.createdBy) {
      return NextResponse.json({ error: 'Cannot kick chat creator' }, { status: 400 })
    }

    // Remove member from chat
    const deleteResult = await prisma.workspaceChatMember.deleteMany({
      where: {
        chatId: chatId,
        userId: memberUserId
      }
    })

    if (deleteResult.count === 0) {
      return NextResponse.json({ error: 'Member not found in chat' }, { status: 404 })
    }

    console.log(`User ${memberUserId} kicked from chat ${chatId} by ${userId}`)
    return NextResponse.json({ message: 'Member kicked successfully' })

  } catch (error) {
    console.error('Error kicking member:', error)
    return NextResponse.json(
      { error: 'Failed to kick member' },
      { status: 500 }
    )
  }
}
