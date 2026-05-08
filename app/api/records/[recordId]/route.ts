import { NextRequest, NextResponse } from 'next/server'

// Mock database for records
let records: any[] = []

export async function PUT(
  request: NextRequest,
  { params }: { params: { recordId: string } }
) {
  try {
    const recordId = params.recordId
    const updates = await request.json()

    // Find and update record
    const recordIndex = records.findIndex(r => r.id === recordId)
    
    if (recordIndex === -1) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    // Update record
    records[recordIndex] = {
      ...records[recordIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json(records[recordIndex])
  } catch (error) {
    console.error('Error updating record:', error)
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { recordId: string } }
) {
  try {
    const recordId = params.recordId

    // Find and delete record
    const recordIndex = records.findIndex(r => r.id === recordId)
    
    if (recordIndex === -1) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    // Remove record
    records.splice(recordIndex, 1)

    return NextResponse.json({ message: 'Record deleted successfully' })
  } catch (error) {
    console.error('Error deleting record:', error)
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 })
  }
}
