import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Helper function to create notification
async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  category: string = 'system',
  actionUrl?: string
) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        category,
        actionUrl
      }
    })
  } catch (error) {
    console.error('Failed to create notification:', error)
    // Don't throw error - notification failure shouldn't break the main flow
  }
}

// POST accept invitation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params
    const body = await request.json()
    const { token, userId, email } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Handle internal invitation by email
    if (email) {
      // Find invitation by email instead of token
      const invitation = await prisma.workspaceInvitation.findFirst({
        where: {
          workspaceId: workspaceId,
          invitedEmail: email.toLowerCase(),
          status: 'pending',
          expiresAt: {
            gt: new Date()
          }
        }
      })

      if (!invitation) {
        return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 })
      }

      // Check if user is already a member
      const existingMember = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: workspaceId,
          userId: userId,
          isActive: true
        }
      })

      if (existingMember) {
        return NextResponse.json({ error: 'User is already a workspace member' }, { status: 400 })
      }

      // Check if user email matches invited email
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      if (user.email.toLowerCase() !== invitation.invitedEmail.toLowerCase()) {
        return NextResponse.json({ error: 'Email does not match invitation' }, { status: 403 })
      }

      // Add user as workspace member
      const member = await prisma.workspaceMember.create({
        data: {
          workspaceId: workspaceId,
          userId: userId,
          role: invitation.role,
          permissions: JSON.stringify([
            'view_tasks',
            'create_tasks',
            'edit_own_tasks',
            'comment_tasks'
          ]),
          joinedAt: new Date()
        }
      })

      // Update invitation status
      await prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'accepted'
        }
      })

      // Get workspace name for notifications
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { name: true }
      })

      // Create notification for inviter
      await createNotification(
        invitation.invitedBy,
        `${user.fullName} accepted your invitation`,
        `${user.fullName} has joined "${workspace?.name || 'your workspace'}"`,
        'success',
        'system',
        `/workspace/${workspaceId}/members`
      )

      // Create notification for new member
      await createNotification(
        userId,
        `You joined "${workspace?.name || 'workspace'}"`,
        `You have successfully joined the workspace as ${invitation.role}`,
        'success',
        'system',
        `/workspace/${workspaceId}`
      )

      return NextResponse.json({
        success: true,
        member: member,
        workspaceId: workspaceId
      })
    }

    // Original token-based invitation
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Find valid invitation
    const invitation = await prisma.workspaceInvitation.findFirst({
      where: {
        workspaceId: workspaceId,
        token: token,
        status: 'pending',
        expiresAt: {
          gt: new Date()
        }
      }
    })

    if (!invitation) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 })
    }

    // Check if user is already a member
    const existingMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: workspaceId,
        userId: userId,
        isActive: true
      }
    })

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a workspace member' }, { status: 400 })
    }

    // Check if user email matches invited email
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.email.toLowerCase() !== invitation.invitedEmail.toLowerCase()) {
      return NextResponse.json({ error: 'Email does not match invitation' }, { status: 403 })
    }

    // Add user as workspace member
    const member = await prisma.workspaceMember.create({
      data: {
        workspaceId: workspaceId,
        userId: userId,
        role: invitation.role,
        permissions: JSON.stringify([
          'view_tasks',
          'create_tasks',
          'edit_own_tasks',
          'comment_tasks'
        ]),
        joinedAt: new Date()
      }
    })

    // Update invitation status
    await prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'accepted'
      }
    })

    // Get workspace name for notifications
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { name: true }
    })

    // Create notification for inviter
    await createNotification(
      invitation.invitedBy,
      `${user.fullName} accepted your invitation`,
      `${user.fullName} has joined "${workspace?.name || 'your workspace'}"`,
      'success',
      'system',
      `/workspace/${workspaceId}/members`
    )

    // Create notification for new member
    await createNotification(
      userId,
      `You joined "${workspace?.name || 'workspace'}"`,
      `You have successfully joined the workspace as ${invitation.role}`,
      'success',
      'system',
      `/workspace/${workspaceId}`
    )

    return NextResponse.json({
      success: true,
      member: member,
      workspaceId: workspaceId
    })
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 })
  }
}
