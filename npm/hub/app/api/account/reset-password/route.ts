import { hashPassword } from 'better-auth/crypto'
import { auth } from '@/lib/auth'
import { hashRecoveryChecksum } from '@/lib/crypto'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const checksum = typeof body?.checksum === 'string' ? body.checksum.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!email || !checksum || password.length < 8) {
    return Response.json({ error: 'E-Mail, Checksum und ein Passwort mit mindestens 8 Zeichen sind erforderlich.' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user?.recoveryKeyHash || user.recoveryKeyHash !== hashRecoveryChecksum(checksum)) {
    return Response.json({ error: 'Die Angaben sind ungültig.' }, { status: 400 })
  }

  const account = await prisma.account.findFirst({ where: { userId: user.id, providerId: 'credential' } })
  if (!account) return Response.json({ error: 'Die Angaben sind ungültig.' }, { status: 400 })

  await prisma.account.update({
    where: { id: account.id },
    data: { password: await hashPassword(password) },
  })
  await prisma.session.deleteMany({ where: { userId: user.id } })

  return Response.json({ ok: true })
}

export const runtime = 'nodejs'
