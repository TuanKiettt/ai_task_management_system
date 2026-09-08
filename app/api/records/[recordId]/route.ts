import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { recordId: string } }
) {
  try {
    const recordId = params.recordId
    const updates = await request.json()

    const record = await prisma.medicalRecord.update({
      where: { id: recordId },
      data: {
        ...(updates.patient !== undefined && { patient: updates.patient }),
        ...(updates.type !== undefined && { type: updates.type }),
        ...(updates.date !== undefined && { date: updates.date }),
        ...(updates.status !== undefined && { status: updates.status }),
      },
    })
    return NextResponse.json(record)
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

    await prisma.medicalRecord.delete({ where: { id: recordId } })
    return NextResponse.json({ message: 'Record deleted successfully' })
  } catch (error) {
    console.error('Error deleting record:', error)
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 })
  }
}
