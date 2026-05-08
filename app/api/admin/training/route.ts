import { Client } from 'pg'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const filter = url.searchParams.get('filter') || 'pending'

    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) return Response.json({ error: 'Database not configured' }, { status: 500 })

    const client = new Client({ connectionString: dbUrl })
    await client.connect()

    // Get stats
    const statsResult = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
      FROM training_examples
    `)
    const stats = statsResult.rows[0]

    // Get examples based on filter
    let query = 'SELECT * FROM training_examples'
    const params: any[] = []

    if (filter !== 'all') {
      query += ' WHERE status = $1'
      params.push(filter)
    }

    query += ' ORDER BY created_at DESC LIMIT 100'

    const result = await client.query(query, params)

    await client.end()

    return Response.json({
      examples: result.rows,
      stats: {
        total: parseInt(stats.total),
        pending: parseInt(stats.pending),
        approved: parseInt(stats.approved),
        rejected: parseInt(stats.rejected),
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

    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) return Response.json({ error: 'Database not configured' }, { status: 500 })

    const client = new Client({ connectionString: dbUrl })
    await client.connect()

    await client.query(
      `UPDATE training_examples 
       SET status = $1, notes = $2, reviewed_at = NOW()
       WHERE id = $3`,
      [status, notes || '', id]
    )

    await client.end()

    return Response.json({ success: true })
  } catch (error) {
    console.error('[v0] Training update error:', error)
    return Response.json({ error: 'Failed to update training data' }, { status: 500 })
  }
}
