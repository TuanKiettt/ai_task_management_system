import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const assignments = await prisma.assignment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(assignments)
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

    const newAssignment = await prisma.assignment.create({
      data: {
        userId: assignment.userId,
        title: assignment.title,
        subject: assignment.subject,
        dueDate: assignment.dueDate,
        status: assignment.status || 'pending',
        grade: assignment.grade,
        description: assignment.description,
      },
    })
    return NextResponse.json(newAssignment, { status: 201 })
  } catch (error) {
    console.error('Error creating assignment:', error)
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 })
  }
}
