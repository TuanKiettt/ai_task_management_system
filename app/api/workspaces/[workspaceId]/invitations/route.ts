import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import nodemailer from 'nodemailer'

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
    const { invitations, userId: requesterId } = body

    if (!invitations || !requesterId) {
      return NextResponse.json({ error: 'Invitations and requester ID are required' }, { status: 400 })
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

    const createdInvitations = []
    const errors = []
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Expire in 7 days

    for (const invitationData of invitations) {
      const email = invitationData.email
      const role = invitationData.role

      // Check if email exists in database - REQUIRED
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      })

      if (!existingUser) {
        // Add error for non-existent email - don't create invitation
        errors.push({
          email,
          message: `Email ${email} does not exist in the system. User must register before being invited.`
        })
        continue // Skip this email
      }

      // Check if user is already a member
      const existingMember = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: workspaceId,
          userId: existingUser.id,
          isActive: true
        }
      })

      if (existingMember) {
        errors.push({
          email,
          message: `${email} is already a member of this workspace`
        })
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
        errors.push({
          email,
          message: `${email} already has a pending invitation`
        })
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

      createdInvitations.push(invitation)
      
      // Send invitation email (optional, if SMTP configured)
      await sendInvitationEmail(email, workspace.name, token, workspaceId)
      
      // Create notification for inviter
      await createNotification(
        requesterId,
        `Invitation sent to ${email}`,
        `You have invited ${email} to join "${workspace.name}" as ${role || 'member'}`,
        'success',
        'system',
        `/workspace/${workspaceId}/members`
      )
    }

    return NextResponse.json({
      invitations: createdInvitations,
      errors: errors
    }, { status: 201 })
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

// Helper function to send invitation email
async function sendInvitationEmail(email: string, workspaceName: string, token: string, workspaceId: string) {
  // Skip email sending if SMTP credentials are not configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('SMTP credentials not configured, skipping email sending')
    return
  }

  try {
    // Configure email transporter (using environment variables)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${workspaceId}?token=${token}`

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: `You're invited to join "${workspaceName}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">You're invited to join "${workspaceName}"</h2>
          <p style="color: #666;">You have been invited to collaborate in a workspace on the AI Task Management System.</p>
          <p style="color: #666;">Click the button below to accept the invitation:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          <p style="color: #999; font-size: 12px;">Or copy and paste this link into your browser:</p>
          <p style="color: #999; font-size: 12px; word-break: break-all;">${inviteUrl}</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">This invitation will expire in 7 days.</p>
        </div>
      `
    }

    await transporter.sendMail(mailOptions)
    console.log(`Invitation email sent to ${email}`)
  } catch (error) {
    console.error('Failed to send invitation email:', error)
    // Don't throw error - invitation is still created, just email failed
  }
}

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
