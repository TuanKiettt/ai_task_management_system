import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

function getNextRun(frequency: string): Date {
  const nextRun = new Date()
  switch (frequency) {
    case 'daily': nextRun.setDate(nextRun.getDate() + 1); break
    case 'monthly': nextRun.setMonth(nextRun.getMonth() + 1, 1); break
    case 'quarterly': nextRun.setMonth(nextRun.getMonth() + 3, 1); break
    default: nextRun.setDate(nextRun.getDate() + 7)
  }
  nextRun.setHours(9, 0, 0, 0)
  return nextRun
}

function serializeReport(report: any) {
  return { ...report, recipients: JSON.parse(report.recipients || '[]') }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const { name, description, reportType, frequency = 'weekly', recipients = [], format = 'pdf' } = body

    if (!name || !reportType) {
      return NextResponse.json({ error: 'Name and report type are required' }, { status: 400 })
    }

    const report = await prisma.scheduledReport.update({
      where: { id: params.id },
      data: {
        name,
        description: description || '',
        reportType,
        frequency,
        recipients: JSON.stringify(recipients),
        format,
        nextRun: getNextRun(frequency),
      },
    })

    return NextResponse.json({ success: true, report: serializeReport(report) })
  } catch (error) {
    console.error('Error updating scheduled report:', error)
    return NextResponse.json({ error: 'Failed to update scheduled report' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.scheduledReport.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true, message: 'Scheduled report deleted successfully' })
  } catch (error) {
    console.error('Error deleting scheduled report:', error)
    return NextResponse.json({ error: 'Failed to delete scheduled report' }, { status: 500 })
  }
}

export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const current = await prisma.scheduledReport.findUnique({ where: { id: params.id } })
    if (!current) return NextResponse.json({ error: 'Report not found' }, { status: 404 })

    const report = await prisma.scheduledReport.update({
      where: { id: params.id },
      data: { isActive: !current.isActive },
    })

    return NextResponse.json({ success: true, report: serializeReport(report) })
  } catch (error) {
    console.error('Error toggling scheduled report:', error)
    return NextResponse.json({ error: 'Failed to toggle scheduled report' }, { status: 500 })
  }
}
