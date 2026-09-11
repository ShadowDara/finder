import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim() ?? ''
  const tags = (searchParams.get('tags')?.split(',') ?? []).map((tag) => tag.trim().toLowerCase()).filter(Boolean)

  const templates = await prisma.template.findMany({
    where: {
      ...(query ? { OR: [{ name: { contains: query, mode: 'insensitive' } }, { tags: { has: query.toLowerCase() } }] } : {}),
      ...(tags.length ? { tags: { hasEvery: tags } } : {}),
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      tags: true,
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json({ templates })
}
