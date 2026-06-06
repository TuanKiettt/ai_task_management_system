import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET check for pending invitations by user email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Find pending invitations for this email
    const invitations = await prisma.workspaceInvitation.findMany({
      where: {
        invitedEmail: email.toLowerCase(),
        status: 'pending',
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Get inviter user details
    const invitationsWithInviter = await Promise.all(
      invitations.map(async (inv) => {
        const inviter = await prisma.user.findUnique({
          where: { id: inv.invitedBy },
          select: {
            fullName: true,
            email: true
          }
        })
        return {
          id: inv.id,
          workspaceId: inv.workspaceId,
          workspaceName: inv.workspace.name,
          role: inv.role,
          invitedBy: inv.invitedBy,
          invitedByName: inviter?.fullName || 'Unknown',
          invitedByEmail: inviter?.email || 'Unknown'
        }
      })
    )

    return NextResponse.json({
      invitations: invitationsWithInviter
    })
  } catch (error) {
    console.error('Error checking pending invitations:', error)
    return NextResponse.json({ error: 'Failed to check pending invitations' }, { status: 500 })
  }
}
