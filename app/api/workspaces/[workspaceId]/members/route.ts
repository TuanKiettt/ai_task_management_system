import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET all members of a workspace
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

    const members = await prisma.workspaceMember.findMany({
      where: {
        workspaceId: workspaceId,
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
            industry: true
          }
        }
      },
      orderBy: [
        { role: 'asc' }, // owner, admin, member
        { joinedAt: 'asc' }
      ]
    })

    return NextResponse.json(members)
  } catch (error) {
    console.error('Error fetching workspace members:', error)
    return NextResponse.json({ error: 'Failed to fetch workspace members' }, { status: 500 })
  }
}

// POST add a member to workspace
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params
    const body = await request.json()
    const { userId: newMemberId, role, permissions, userId: requesterId } = body

    if (!newMemberId || !requesterId) {
      return NextResponse.json({ error: 'Member ID and requester ID are required' }, { status: 400 })
    }

    // Check if requester has permission to add members
    const requesterMembership = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: workspaceId,
        userId: requesterId,
        isActive: true,
        role: {
          in: ['owner', 'admin']
        }
      }
    })

    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        ownerId: requesterId,
        isActive: true
      }
    })

    if (!requesterMembership && !workspace) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if user is already a member
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspaceId,
          userId: newMemberId
        }
      }
    })

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a workspace member' }, { status: 400 })
    }

    const member = await prisma.workspaceMember.create({
      data: {
        workspaceId: workspaceId,
        userId: newMemberId,
        role: role || 'member',
        permissions: permissions ? JSON.stringify(permissions) : JSON.stringify([
          'view_tasks',
          'create_tasks',
          'edit_own_tasks',
          'comment_tasks'
        ]),
        joinedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
            industry: true
          }
        }
      }
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('Error adding workspace member:', error)
    return NextResponse.json({ error: 'Failed to add workspace member' }, { status: 500 })
  }
}

// PUT update member role or permissions
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params
    const body = await request.json()
    const { memberId, role, permissions, userId: requesterId } = body

    if (!memberId || !requesterId) {
      return NextResponse.json({ error: 'Member ID and requester ID are required' }, { status: 400 })
    }

    // Check if requester has permission to update members
    const requesterMembership = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: workspaceId,
        userId: requesterId,
        isActive: true,
        role: {
          in: ['owner', 'admin']
        }
      }
    })

    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        ownerId: requesterId,
        isActive: true
      }
    })

    if (!requesterMembership && !workspace) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Don't allow changing owner role unless requester is owner
    const memberToUpdate = await prisma.workspaceMember.findUnique({
      where: { id: memberId }
    })

    if (!memberToUpdate) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    if (memberToUpdate.role === 'owner' && workspace?.ownerId !== requesterId) {
      return NextResponse.json({ error: 'Cannot modify owner role' }, { status: 403 })
    }

    const updateData: any = {}
    if (role) updateData.role = role
    if (permissions) updateData.permissions = JSON.stringify(permissions)

    const updatedMember = await prisma.workspaceMember.update({
      where: { id: memberId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
            industry: true
          }
        }
      }
    })

    return NextResponse.json(updatedMember)
  } catch (error) {
    console.error('Error updating workspace member:', error)
    return NextResponse.json({ error: 'Failed to update workspace member' }, { status: 500 })
  }
}

// DELETE remove a member from workspace
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')
    const userId = searchParams.get('userId')

    if (!memberId || !userId) {
      return NextResponse.json({ error: 'Member ID and user ID are required' }, { status: 400 })
    }

    // Check if requester has permission to remove members
    const requesterMembership = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: workspaceId,
        userId: userId,
        isActive: true,
        role: {
          in: ['owner', 'admin']
        }
      }
    })

    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        ownerId: userId,
        isActive: true
      }
    })

    if (!requesterMembership && !workspace) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Don't allow removing owner
    const memberToRemove = await prisma.workspaceMember.findUnique({
      where: { id: memberId }
    })

    if (!memberToRemove) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    if (memberToRemove.role === 'owner') {
      return NextResponse.json({ error: 'Cannot remove workspace owner' }, { status: 403 })
    }

    // Soft delete member
    await prisma.workspaceMember.update({
      where: { id: memberId },
      data: {
        isActive: false
      }
    })

    return NextResponse.json({ message: 'Member removed successfully' })
  } catch (error) {
    console.error('Error removing workspace member:', error)
    return NextResponse.json({ error: 'Failed to remove workspace member' }, { status: 500 })
  }
}
