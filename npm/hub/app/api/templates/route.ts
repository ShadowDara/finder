import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { validateTemplateInput } from '@/lib/templates'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  }

  const templates = await prisma.template.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json({ templates })
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON im Request.' }, { status: 400 })
  }

  const result = validateTemplateInput(body)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  const template = await prisma.template.create({
    data: {
      name: result.name,
      content: result.content,
      tags: result.tags,
      userId: session.user.id,
    },
  })

  return NextResponse.json({ template }, { status: 201 })
}
