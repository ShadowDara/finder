import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { headers } from 'next/headers'

export async function DELETE() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return Response.json({ error: 'Nicht angemeldet.' }, { status: 401 })

  await prisma.user.delete({ where: { id: session.user.id } })
  return Response.json({ ok: true })
}

export const runtime = 'nodejs'
