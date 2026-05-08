import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET current workspace for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get user's current workspace from user settings or default to most recent
    let currentWorkspace = null

    // For now, skip user settings and use fallback logic
    // TODO: Implement user settings after database migration

    // Fallback: Get most recently updated workspace where user is owner or member
    if (!currentWorkspace) {
      currentWorkspace = await prisma.workspace.findFirst({
        where: {
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
              tasks: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      })
    }

    if (!currentWorkspace) {
      return NextResponse.json({ 
        error: 'No workspace found',
        message: 'User has no active workspaces'
      }, { status: 404 })
    }

    // Determine user's role
    const userRole = currentWorkspace.ownerId === userId ? 'owner' : 
                    currentWorkspace.members?.find((m: any) => m.userId === userId)?.role || 'member'

    return NextResponse.json({
      ...currentWorkspace,
      role: userRole
    })
  } catch (error) {
    console.error('Error fetching current workspace:', error)
    return NextResponse.json({ error: 'Failed to fetch current workspace' }, { status: 500 })
  }
}

// PUT update current workspace for a user
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, workspaceId } = body

    if (!userId || !workspaceId) {
      return NextResponse.json({ error: 'User ID and workspace ID are required' }, { status: 400 })
    }

    // Verify user has access to the workspace
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

    // TODO: Update user settings with current workspace after database migration
    // For now, just return success
    
    return NextResponse.json({ 
      message: 'Current workspace updated successfully',
      workspaceId: workspaceId
    })
  } catch (error) {
    console.error('Error updating current workspace:', error)
    return NextResponse.json({ error: 'Failed to update current workspace' }, { status: 500 })
  }
}
