import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const records = await prisma.medicalRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(records)
  } catch (error) {
    console.error('Error fetching records:', error)
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const record = await request.json()
    
    // Validate required fields
    if (!record.patient || !record.type || !record.date || !record.userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const newRecord = await prisma.medicalRecord.create({
      data: {
        userId: record.userId,
        patient: record.patient,
        type: record.type,
        date: record.date,
        status: record.status || 'Pending Review',
      },
    })
    return NextResponse.json(newRecord, { status: 201 })
  } catch (error) {
    console.error('Error creating record:', error)
    return NextResponse.json({ error: 'Failed to create record' }, { status: 500 })
  }
}
