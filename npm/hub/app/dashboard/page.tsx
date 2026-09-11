import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const templates = await prisma.template.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
  })

  const initialTemplates = templates.map((t) => ({
    id: t.id,
    name: t.name,
    content: t.content,
    updatedAt: t.updatedAt.toISOString(),
  }))

  return (
    <DashboardClient
      userEmail={session.user.email}
      initialTemplates={initialTemplates}
    />
  )
}
