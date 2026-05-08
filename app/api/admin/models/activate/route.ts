import { Client } from 'pg'

export async function POST(req: Request) {
  try {
    const { modelId } = await req.json()

    if (!modelId) {
      return Response.json({ error: 'Model ID required' }, { status: 400 })
    }

    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) return Response.json({ error: 'Database not configured' }, { status: 500 })

    const client = new Client({ connectionString: dbUrl })
    await client.connect()

    // Deactivate all models
    await client.query('UPDATE model_versions SET is_active = false')

    // Activate the selected model
    await client.query('UPDATE model_versions SET is_active = true WHERE id = $1', [modelId])

    await client.end()

    return Response.json({ success: true })
  } catch (error) {
    console.error('[v0] Model activation error:', error)
    return Response.json({ error: 'Failed to activate model' }, { status: 500 })
  }
}
