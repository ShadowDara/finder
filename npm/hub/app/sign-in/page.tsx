'use client'

import { signIn } from '@/lib/auth-client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await signIn.email({ email, password })

    setLoading(false)
    if (error) {
      setError('Anmeldung fehlgeschlagen. Bitte prüfe E-Mail und Passwort.')
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main style={{ maxWidth: 400, margin: '0 auto', padding: 24 }}>
      <h1>Anmelden</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          E-Mail
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          Passwort
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Wird angemeldet…' : 'Anmelden'}
        </button>
      </form>
      <p style={{ marginTop: 16 }}>
        Noch kein Account? <Link href="/sign-up">Registrieren</Link>
      </p>
    </main>
  )
}
