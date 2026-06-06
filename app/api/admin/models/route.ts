import prisma from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const result: any = await prisma.$queryRaw`
      SELECT * FROM model_versions
      ORDER BY created_at DESC
    `

    const activeResult: any = await prisma.$queryRaw`
      SELECT id FROM model_versions WHERE is_active = true LIMIT 1
    `

    return Response.json({
      models: result,
      activeModel: activeResult[0]?.id || null,
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

    await prisma.$executeRaw`
      INSERT INTO model_versions (name, description, status)
      VALUES (${name}, ${description || ''}, 'training')
    `

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

    const activeCheck: any = await prisma.$queryRaw`
      SELECT is_active FROM model_versions WHERE id = ${modelId}
    `

    if (activeCheck[0]?.is_active) {
      return Response.json({ error: 'Cannot delete active model' }, { status: 400 })
    }

    await prisma.$executeRaw`
      DELETE FROM model_versions WHERE id = ${modelId}
    `

    return Response.json({ success: true })
  } catch (error) {
    console.error('[v0] Model deletion error:', error)
    return Response.json({ error: 'Failed to delete model' }, { status: 500 })
  }
}
