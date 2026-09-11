import Link from 'next/link'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect('/dashboard')

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: 24 }}>
      <h1>Template Manager</h1>
      <p>Registriere dich, um deine eigenen JSON-Templates zu erstellen und zu verwalten.</p>
      <nav style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <Link href="/discover">Discover</Link>
        <Link href="/sign-up">Registrieren</Link>
        <Link href="/sign-in">Anmelden</Link>
      </nav>
    </main>
  )
}
