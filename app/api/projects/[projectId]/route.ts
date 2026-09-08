import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId = params.projectId
    const updates = await request.json()

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.status !== undefined && { status: updates.status }),
        ...(updates.progress !== undefined && { progress: Number(updates.progress) }),
        ...(updates.team !== undefined && { team: Number(updates.team) }),
        ...(updates.deadline !== undefined && { deadline: updates.deadline }),
        ...(updates.workspaceId !== undefined && { workspaceId: updates.workspaceId }),
      },
    })
    return NextResponse.json(project)
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId = params.projectId

    await prisma.project.delete({ where: { id: projectId } })
    return NextResponse.json({ message: 'Project deleted successfully' })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
}
