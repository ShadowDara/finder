import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim() ?? ''

  const templates = await prisma.template.findMany({
    where: query
      ? { name: { contains: query, mode: 'insensitive' } }
      : undefined,
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      user: { select: { name: true, email: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json({ templates })
}
