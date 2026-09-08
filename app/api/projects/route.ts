import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const industry = searchParams.get('industry')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const project = await request.json()
    
    // Validate required fields
    if (!project.name || !project.deadline || !project.userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const newProject = await prisma.project.create({
      data: {
        userId: project.userId,
        workspaceId: project.workspaceId,
        name: project.name,
        status: project.status || 'Planning',
        progress: Number(project.progress || 0),
        team: Number(project.team || 0),
        deadline: project.deadline,
      },
    })
    return NextResponse.json(newProject, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
