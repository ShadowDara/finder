import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateRecoveryChecksum, hashRecoveryChecksum } from '@/lib/crypto'
import { headers } from 'next/headers'

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return Response.json({ error: 'Nicht angemeldet.' }, { status: 401 })

  const checksum = generateRecoveryChecksum()
  await prisma.user.update({
    where: { id: session.user.id },
    data: { recoveryKeyHash: hashRecoveryChecksum(checksum) },
  })

  return Response.json({ checksum })
}

export async function DELETE() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return Response.json({ error: 'Nicht angemeldet.' }, { status: 401 })

  await prisma.user.update({
    where: { id: session.user.id },
    data: { recoveryKeyHash: null },
  })
  return Response.json({ ok: true })
}

export const runtime = 'nodejs'

// Account deletion is deliberately a separate route to keep recovery-key rotation isolated.
export async function OPTIONS() {
  return new Response(null, { status: 204 })
}

void OPTIONS
