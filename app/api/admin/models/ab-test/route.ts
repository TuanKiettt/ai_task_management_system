import { Client } from 'pg'

export async function GET(req: Request) {
  try {
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) return Response.json({ error: 'Database not configured' }, { status: 500 })

    const client = new Client({ connectionString: dbUrl })
    await client.connect()

    const result = await client.query(`
      SELECT * FROM ab_test_results
      ORDER BY created_at DESC
      LIMIT 50
    `)

    await client.end()

    return Response.json({
      tests: result.rows,
    })
  } catch (error) {
    console.error('[v0] A/B test error:', error)
    return Response.json({ error: 'Failed to fetch A/B test results' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { modelAId, modelBId, testInput, modelAOutput, modelBOutput } = await req.json()

    if (!modelAId || !modelBId || !testInput || !modelAOutput || !modelBOutput) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) return Response.json({ error: 'Database not configured' }, { status: 500 })

    const client = new Client({ connectionString: dbUrl })
    await client.connect()

    await client.query(
      `INSERT INTO ab_test_results (model_a_id, model_b_id, test_input, model_a_output, model_b_output)
       VALUES ($1, $2, $3, $4, $5)`,
      [modelAId, modelBId, testInput, modelAOutput, modelBOutput]
    )

    await client.end()

    return Response.json({ success: true })
  } catch (error) {
    console.error('[v0] A/B test creation error:', error)
    return Response.json({ error: 'Failed to create A/B test' }, { status: 500 })
  }
}
