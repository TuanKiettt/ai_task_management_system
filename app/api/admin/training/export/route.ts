import { Client } from 'pg'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const format = url.searchParams.get('format') || 'jsonl'

    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) return Response.json({ error: 'Database not configured' }, { status: 500 })

    const client = new Client({ connectionString: dbUrl })
    await client.connect()

    // Get only approved examples
    const result = await client.query(`
      SELECT user_input, model_output
      FROM training_examples
      WHERE status = 'approved'
      ORDER BY created_at ASC
    `)

    await client.end()

    if (format === 'jsonl') {
      // Convert to JSONL format
      const jsonl = result.rows
        .map(row => {
          const tasks = JSON.parse(row.model_output).tasks || []
          return JSON.stringify({
            input: row.user_input,
            output: { tasks }
          })
        })
        .join('\n')

      return new Response(jsonl, {
        headers: {
          'Content-Type': 'application/jsonl',
          'Content-Disposition': `attachment; filename="training-data.jsonl"`,
        },
      })
    } else if (format === 'csv') {
      // Convert to CSV format
      let csv = 'Input,Task Count,Tasks\n'

      result.rows.forEach(row => {
        const tasks = JSON.parse(row.model_output).tasks || []
        const taskList = tasks.map((t: any) => `${t.title} (${t.priority})`).join('; ')
        const input = `"${row.user_input.replace(/"/g, '""')}"`
        const count = tasks.length
        csv += `${input},${count},"${taskList.replace(/"/g, '""')}"\n`
      })

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="training-data.csv"`,
        },
      })
    } else {
      return Response.json({ error: 'Invalid format' }, { status: 400 })
    }
  } catch (error) {
    console.error('[v0] Export error:', error)
    return Response.json({ error: 'Failed to export training data' }, { status: 500 })
  }
}
