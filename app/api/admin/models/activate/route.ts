import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { modelId } = await req.json()

    if (!modelId) {
      return Response.json({ error: 'Model ID required' }, { status: 400 })
    }

    // Deactivate all models
    await prisma.$executeRaw`
      UPDATE model_versions SET is_active = false
    `

    // Activate the selected model
    await prisma.$executeRaw`
      UPDATE model_versions SET is_active = true WHERE id = ${modelId}
    `

    return Response.json({ success: true })
  } catch (error) {
    console.error('[v0] Model activation error:', error)
    return Response.json({ error: 'Failed to activate model' }, { status: 500 })
  }
}
