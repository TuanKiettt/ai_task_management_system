import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET validate invitation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

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
      },
      include: {
        workspace: {
          select: {
            name: true
          }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 })
    }

    return NextResponse.json({
      valid: true,
      workspaceName: invitation.workspace.name,
      role: invitation.role,
      invitedEmail: invitation.invitedEmail
    })
  } catch (error) {
    console.error('Error validating invitation:', error)
    return NextResponse.json({ error: 'Failed to validate invitation' }, { status: 500 })
  }
}
