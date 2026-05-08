import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET all workspaces for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get all workspaces in a single query
    const workspaces = await prisma.workspace.findMany({
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
          where: { isActive: true },
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
            members: {
              where: { isActive: true }
            },
            tasks: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Format workspaces with role information
    const allWorkspaces = workspaces.map((workspace: any) => {
      const isOwner = workspace.ownerId === userId
      const memberRole = workspace.members?.find((m: any) => m.userId === userId)?.role
      
      return {
        ...workspace,
        role: isOwner ? 'owner' : (memberRole || 'member')
      }
    })

    return NextResponse.json(allWorkspaces)
  } catch (error) {
    console.error('Error fetching workspaces:', error)
    return NextResponse.json({ error: 'Failed to fetch workspaces' }, { status: 500 })
  }
}

// POST create a new workspace
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, userId } = body

    if (!name || !userId) {
      return NextResponse.json({ error: 'Name and userId are required' }, { status: 400 })
    }

    const workspace = await prisma.workspace.create({
      data: {
        name,
        description,
        ownerId: userId,
        settings: JSON.stringify({
          theme: 'default',
          notifications: true,
          allowInvites: true
        }),
        securitySettings: JSON.stringify({
          twoFactorRequired: false,
          guestAccess: false,
          dataRetention: 'indefinite'
        }),
        defaultPermissions: JSON.stringify([
          'view_tasks',
          'create_tasks',
          'edit_own_tasks',
          'comment_tasks'
        ])
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
        members: true,
        _count: {
          select: {
            members: true,
            tasks: true
          }
        }
      }
    })

    // Add owner as a member with owner role
    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: workspace.ownerId,
        role: 'owner',
        permissions: JSON.stringify([
          'manage_workspace',
          'manage_members',
          'manage_settings',
          'delete_workspace'
        ]),
        joinedAt: new Date()
      }
    })

    return NextResponse.json({
      ...workspace,
      role: 'owner'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating workspace:', error)
    return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 })
  }
}
