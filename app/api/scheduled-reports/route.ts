import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

function getNextRun(frequency: string): Date {
  const nextRun = new Date()
  switch (frequency) {
    case 'daily':
      nextRun.setDate(nextRun.getDate() + 1)
      break
    case 'monthly':
      nextRun.setMonth(nextRun.getMonth() + 1, 1)
      break
    case 'quarterly':
      nextRun.setMonth(nextRun.getMonth() + 3, 1)
      break
    case 'weekly':
    default:
      nextRun.setDate(nextRun.getDate() + 7)
      break
  }
  nextRun.setHours(9, 0, 0, 0)
  return nextRun
}

function serializeReport(report: any) {
  return {
    ...report,
    recipients: JSON.parse(report.recipients || '[]'),
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const workspaceId = searchParams.get('workspaceId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const reports = await prisma.scheduledReport.findMany({
      where: { userId, ...(workspaceId ? { workspaceId } : {}) },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, reports: reports.map(serializeReport) })
  } catch (error) {
    console.error('Error fetching scheduled reports:', error)
    return NextResponse.json({ error: 'Failed to fetch scheduled reports' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, description, reportType, frequency = 'weekly', recipients = [], format = 'pdf', userId, workspaceId } = body

    if (!userId || !name || !reportType) {
      return NextResponse.json({ error: 'User ID, name, and report type are required' }, { status: 400 })
    }

    const report = await prisma.scheduledReport.create({
      data: {
        userId,
        workspaceId: workspaceId || null,
        name,
        description: description || '',
        reportType,
        frequency,
        recipients: JSON.stringify(recipients),
        format,
        nextRun: getNextRun(frequency),
      },
    })

    return NextResponse.json({ success: true, report: serializeReport(report) }, { status: 201 })
  } catch (error) {
    console.error('Error creating scheduled report:', error)
    return NextResponse.json({ error: 'Failed to create scheduled report' }, { status: 500 })
  }
}
