import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, image: true, createdAt: true, templates: { orderBy: { updatedAt: 'desc' }, select: { id: true, name: true, content: true, tags: true, updatedAt: true } } },
  })
  if (!user) return NextResponse.json({ error: 'User nicht gefunden.' }, { status: 404 })
  return NextResponse.json({ user })
}
