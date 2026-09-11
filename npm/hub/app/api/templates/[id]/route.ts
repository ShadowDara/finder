import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { validateTemplateInput } from '@/lib/templates'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user ?? null
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  if (!user) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  }

  const { id } = await params
  const template = await prisma.template.findFirst({
    where: { id, userId: user.id },
  })

  if (!template) {
    return NextResponse.json({ error: 'Template nicht gefunden.' }, { status: 404 })
  }

  return NextResponse.json({ template })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  if (!user) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  }

  const { id } = await params

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

  // Scope the update by userId so a user can only modify their own templates.
  const updated = await prisma.template.updateMany({
    where: { id, userId: user.id },
    data: { name: result.name, content: result.content },
  })

  if (updated.count === 0) {
    return NextResponse.json({ error: 'Template nicht gefunden.' }, { status: 404 })
  }

  const template = await prisma.template.findFirst({ where: { id, userId: user.id } })
  return NextResponse.json({ template })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  if (!user) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  }

  const { id } = await params

  const deleted = await prisma.template.deleteMany({
    where: { id, userId: user.id },
  })

  if (deleted.count === 0) {
    return NextResponse.json({ error: 'Template nicht gefunden.' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
