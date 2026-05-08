import { Client } from 'pg'

export async function GET(req: Request) {
  try {
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) return Response.json({ error: 'Database not configured' }, { status: 500 })

    const client = new Client({ connectionString: dbUrl })
    await client.connect()

    const result = await client.query(`
      SELECT * FROM model_versions
      ORDER BY created_at DESC
    `)

    const activeResult = await client.query(`
      SELECT id FROM model_versions WHERE is_active = true LIMIT 1
    `)

    await client.end()

    return Response.json({
      models: result.rows,
      activeModel: activeResult.rows[0]?.id || null,
    })
  } catch (error) {
    console.error('[v0] Models API error:', error)
    return Response.json({ error: 'Failed to fetch models' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { name, description } = await req.json()

    if (!name) {
      return Response.json({ error: 'Model name required' }, { status: 400 })
    }

    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) return Response.json({ error: 'Database not configured' }, { status: 500 })

    const client = new Client({ connectionString: dbUrl })
    await client.connect()

    await client.query(
      `INSERT INTO model_versions (name, description, status)
       VALUES ($1, $2, $3)`,
      [name, description || '', 'training']
    )

    await client.end()

    return Response.json({ success: true })
  } catch (error) {
    console.error('[v0] Model creation error:', error)
    return Response.json({ error: 'Failed to create model' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { modelId } = await req.json()

    if (!modelId) {
      return Response.json({ error: 'Model ID required' }, { status: 400 })
    }

    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) return Response.json({ error: 'Database not configured' }, { status: 500 })

    const client = new Client({ connectionString: dbUrl })
    await client.connect()

    // First check if it's active
    const activeCheck = await client.query(
      'SELECT is_active FROM model_versions WHERE id = $1',
      [modelId]
    )

    if (activeCheck.rows[0]?.is_active) {
      await client.end()
      return Response.json({ error: 'Cannot delete active model' }, { status: 400 })
    }

    await client.query('DELETE FROM model_versions WHERE id = $1', [modelId])

    await client.end()

    return Response.json({ success: true })
  } catch (error) {
    console.error('[v0] Model deletion error:', error)
    return Response.json({ error: 'Failed to delete model' }, { status: 500 })
  }
}
