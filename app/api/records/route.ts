import { NextRequest, NextResponse } from 'next/server'

// Mock database for records
let records: any[] = []

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Filter records by user ID
    const userRecords = records.filter(r => r.userId === userId)
    
    return NextResponse.json(userRecords)
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

    // Create new record
    const newRecord = {
      id: Date.now().toString(),
      ...record,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Add to mock database
    records.push(newRecord)
    
    return NextResponse.json(newRecord, { status: 201 })
  } catch (error) {
    console.error('Error creating record:', error)
    return NextResponse.json({ error: 'Failed to create record' }, { status: 500 })
  }
}
