import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

type Context = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params
  const template = await prisma.template.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      tags: true,
      user: { select: { id: true, name: true, email: true } },
    },
  })

  if (!template) return NextResponse.json({ error: 'Template nicht gefunden.' }, { status: 404 })
  return NextResponse.json({ template })
}
