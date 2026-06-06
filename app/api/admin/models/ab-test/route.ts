import prisma from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const result: any = await prisma.$queryRaw`
      SELECT * FROM ab_test_results
      ORDER BY created_at DESC
      LIMIT 50
    `

    return Response.json({
      tests: result,
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

    await prisma.$executeRaw`
      INSERT INTO ab_test_results (model_a_id, model_b_id, test_input, model_a_output, model_b_output)
      VALUES (${modelAId}, ${modelBId}, ${testInput}, ${modelAOutput}, ${modelBOutput})
    `

    return Response.json({ success: true })
  } catch (error) {
    console.error('[v0] A/B test creation error:', error)
    return Response.json({ error: 'Failed to create A/B test' }, { status: 500 })
  }
}
