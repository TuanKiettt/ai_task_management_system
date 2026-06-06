import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

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

    // Get the chat details
    const chat = await prisma.workspaceChat.findFirst({
      where: {
        id: chatId,
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
      }
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    return NextResponse.json(chat)
  } catch (error) {
    console.error('Error fetching chat details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat details' },
      { status: 500 }
    )
  }
}
