import { NextRequest, NextResponse } from 'next/server'

// Mock database for assignments
let assignments: any[] = []

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Filter assignments by user ID
    const userAssignments = assignments.filter(a => a.userId === userId)
    
    return NextResponse.json(userAssignments)
  } catch (error) {
    console.error('Error fetching assignments:', error)
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const assignment = await request.json()
    
    // Validate required fields
    if (!assignment.title || !assignment.subject || !assignment.dueDate || !assignment.userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create new assignment
    const newAssignment = {
      id: Date.now().toString(),
      ...assignment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Add to mock database
    assignments.push(newAssignment)
    
    return NextResponse.json(newAssignment, { status: 201 })
  } catch (error) {
    console.error('Error creating assignment:', error)
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 })
  }
}
