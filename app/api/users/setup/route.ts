import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { workspaceId, userData } = await request.json()

    if (!workspaceId || !userData) {
      return NextResponse.json({ error: 'Workspace ID and user data are required' }, { status: 400 })
    }

    // Create or get user
    let user = await prisma.user.findUnique({
      where: { email: userData.email }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: userData.email,
          fullName: userData.fullName,
          industry: userData.industry || 'education',
          password: 'demo-password-' + Math.random().toString(36).substr(2, 9),
          createdAt: new Date()
        }
      })
    }

    // Check if user is already a member of the workspace
    const existingMembership = await prisma.workspaceMember.findFirst({
      where: {
        userId: user.id,
        workspaceId: workspaceId
      }
    })

    if (!existingMembership) {
      // Add user to workspace
      await prisma.workspaceMember.create({
        data: {
          userId: user.id,
          workspaceId: workspaceId,
          role: 'member',
          isActive: true,
          joinedAt: new Date()
        }
      })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        industry: user.industry
      }
    })

  } catch (error) {
    console.error('Error setting up user:', error)
    return NextResponse.json(
      { error: 'Failed to set up user' },
      { status: 500 }
    )
  }
}
