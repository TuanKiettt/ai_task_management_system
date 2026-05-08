import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET a specific workspace
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
      },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true
          }
        },
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
        },
        _count: {
          select: {
            members: true,
            tasks: true,
            invitations: {
              where: {
                status: 'pending'
              }
            }
          }
        }
      }
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found or access denied' }, { status: 404 })
    }

    // Determine user's role
    const userRole = workspace.ownerId === userId ? 'owner' : 
                    workspace.members?.find((m: any) => m.userId === userId)?.role || 'member'

    return NextResponse.json({
      ...workspace,
      role: userRole
    })
  } catch (error) {
    console.error('Error fetching workspace:', error)
    return NextResponse.json({ error: 'Failed to fetch workspace' }, { status: 500 })
  }
}

// PUT update a workspace
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params
    const body = await request.json()
    const { name, description, userId, settings, securitySettings } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check if user has permission to update workspace
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

    const updateData: any = {}
    if (name) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (settings) updateData.settings = JSON.stringify(settings)
    if (securitySettings) updateData.securitySettings = JSON.stringify(securitySettings)
    updateData.updatedAt = new Date()

    const updatedWorkspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true
          }
        },
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
        },
        _count: {
          select: {
            members: true,
            tasks: true
          }
        }
      }
    })

    return NextResponse.json(updatedWorkspace)
  } catch (error) {
    console.error('Error updating workspace:', error)
    return NextResponse.json({ error: 'Failed to update workspace' }, { status: 500 })
  }
}

// DELETE a workspace
export async function DELETE(
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

    // Check if user is the owner
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        ownerId: userId,
        isActive: true
      }
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found or access denied' }, { status: 404 })
    }

    // Soft delete workspace
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ message: 'Workspace deleted successfully' })
  } catch (error) {
    console.error('Error deleting workspace:', error)
    return NextResponse.json({ error: 'Failed to delete workspace' }, { status: 500 })
  }
}
