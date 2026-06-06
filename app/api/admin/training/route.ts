import prisma from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const filter = url.searchParams.get('filter') || 'pending'

    // Get stats
    const statsResult: any = await prisma.$queryRaw`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
      FROM training_examples
    `
    const stats = statsResult[0] || { total: 0, pending: 0, approved: 0, rejected: 0 }

    // Get examples based on filter
    const result: any = filter !== 'all'
      ? await prisma.$queryRaw`
          SELECT * FROM training_examples
          WHERE status = ${filter}
          ORDER BY created_at DESC
          LIMIT 100
        `
      : await prisma.$queryRaw`
          SELECT * FROM training_examples
          ORDER BY created_at DESC
          LIMIT 100
        `

    return Response.json({
      examples: result,
      stats: {
        total: Number(stats.total),
        pending: Number(stats.pending),
        approved: Number(stats.approved),
        rejected: Number(stats.rejected),
      },
    })
  } catch (error) {
    console.error('[v0] Training API error:', error)
    return Response.json({ error: 'Failed to fetch training data' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, status, notes } = await req.json()

    if (!id || !status || !['approved', 'rejected'].includes(status)) {
      return Response.json({ error: 'Invalid request' }, { status: 400 })
    }

    await prisma.$executeRaw`
      UPDATE training_examples
      SET status = ${status}, notes = ${notes || ''}, reviewed_at = NOW()
      WHERE id = ${id}
    `

    return Response.json({ success: true })
  } catch (error) {
    console.error('[v0] Training update error:', error)
    return Response.json({ error: 'Failed to update training data' }, { status: 500 })
  }
}
