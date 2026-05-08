import { NextRequest, NextResponse } from 'next/server'

// Mock database for assignments
let assignments: any[] = []

export async function PUT(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
    const assignmentId = params.assignmentId
    const updates = await request.json()

    // Find and update assignment
    const assignmentIndex = assignments.findIndex(a => a.id === assignmentId)
    
    if (assignmentIndex === -1) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Update assignment
    assignments[assignmentIndex] = {
      ...assignments[assignmentIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json(assignments[assignmentIndex])
  } catch (error) {
    console.error('Error updating assignment:', error)
    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
    const assignmentId = params.assignmentId

    // Find and delete assignment
    const assignmentIndex = assignments.findIndex(a => a.id === assignmentId)
    
    if (assignmentIndex === -1) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Remove assignment
    assignments.splice(assignmentIndex, 1)

    return NextResponse.json({ message: 'Assignment deleted successfully' })
  } catch (error) {
    console.error('Error deleting assignment:', error)
    return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 })
  }
}
