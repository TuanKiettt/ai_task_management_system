import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET all invitations for a workspace
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

    // Check if user has access to this workspace
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        isActive: true,
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId: userId,
                role: {
                  in: ['owner', 'admin']
                },
                isActive: true
              }
            }
          }
        ]
      }
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found or access denied' }, { status: 404 })
    }

    const invitations = await prisma.workspaceInvitation.findMany({
      where: {
        workspaceId: workspaceId,
        status: 'pending'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(invitations)
  } catch (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 })
  }
}

// POST create new invitation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params
    const body = await request.json()
    const { emails, role, message, userId: requesterId } = body

    if (!emails || !requesterId) {
      return NextResponse.json({ error: 'Emails and requester ID are required' }, { status: 400 })
    }

    // Check if user has permission to invite
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        isActive: true,
        OR: [
          { ownerId: requesterId },
          {
            members: {
              some: {
                userId: requesterId,
                role: {
                  in: ['owner', 'admin']
                },
                isActive: true
              }
            }
          }
        ]
      }
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found or access denied' }, { status: 404 })
    }

    const invitations = []
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Expire in 7 days

    for (const email of emails) {
      // Check if user is already a member
      const existingMember = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: workspaceId,
          user: {
            email: email.toLowerCase()
          },
          isActive: true
        }
      })

      if (existingMember) {
        continue // Skip if already a member
      }

      // Check if invitation already exists
      const existingInvitation = await prisma.workspaceInvitation.findFirst({
        where: {
          workspaceId: workspaceId,
          invitedEmail: email.toLowerCase(),
          status: 'pending'
        }
      })

      if (existingInvitation) {
        continue // Skip if invitation already pending
      }

      const token = generateInvitationToken()
      
      const invitation = await prisma.workspaceInvitation.create({
        data: {
          workspaceId: workspaceId,
          invitedEmail: email.toLowerCase(),
          invitedBy: requesterId,
          role: role || 'member',
          token,
          status: 'pending',
          expiresAt
        }
      })

      invitations.push(invitation)
    }

    return NextResponse.json(invitations, { status: 201 })
  } catch (error) {
    console.error('Error creating invitations:', error)
    return NextResponse.json({ error: 'Failed to create invitations' }, { status: 500 })
  }
}

// DELETE cancel invitation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params
    const { searchParams } = new URL(request.url)
    const invitationId = searchParams.get('invitationId')
    const userId = searchParams.get('userId')

    if (!invitationId || !userId) {
      return NextResponse.json({ error: 'Invitation ID and user ID are required' }, { status: 400 })
    }

    // Check if user has permission to cancel invitations
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        isActive: true,
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId: userId,
                role: {
                  in: ['owner', 'admin']
                },
                isActive: true
              }
            }
          }
        ]
      }
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found or access denied' }, { status: 404 })
    }

    const invitation = await prisma.workspaceInvitation.findFirst({
      where: {
        id: invitationId,
        workspaceId: workspaceId
      }
    })

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    await prisma.workspaceInvitation.update({
      where: { id: invitationId },
      data: {
        status: 'declined'
      }
    })

    return NextResponse.json({ message: 'Invitation cancelled successfully' })
  } catch (error) {
    console.error('Error cancelling invitation:', error)
    return NextResponse.json({ error: 'Failed to cancel invitation' }, { status: 500 })
  }
}

// Helper function to generate invitation token
function generateInvitationToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}
