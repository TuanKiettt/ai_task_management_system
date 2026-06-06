import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET check for pending invitations by email
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params
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

    return NextResponse.json({
      invitations: invitations.map(inv => ({
        id: inv.id,
        workspaceId: inv.workspaceId,
        workspaceName: inv.workspace.name,
        role: inv.role,
        invitedBy: inv.invitedBy
      }))
    })
  } catch (error) {
    console.error('Error checking pending invitations:', error)
    return NextResponse.json({ error: 'Failed to check pending invitations' }, { status: 500 })
  }
}
