'use client'

import { signUp } from '@/lib/auth-client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SignUpPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [checksum, setChecksum] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await signUp.email({ name, email, password })
    if (result.error) {
      setError('Registrierung fehlgeschlagen. Bitte prüfe deine Angaben.')
      setLoading(false)
      return
    }

    const recovery = await fetch('/api/account/recovery-key', { method: 'POST' })
    const data = await recovery.json()
    setLoading(false)
    if (!recovery.ok) {
      setError('Account erstellt, aber die Recovery-Checksum konnte nicht erzeugt werden.')
      return
    }
    setChecksum(data.checksum)
  }

  if (checksum) {
    return (
      <main style={{ maxWidth: 560, margin: '0 auto', padding: 24 }}>
        <h1>Account erstellt</h1>
        <p>Speichere diese Recovery-Checksum sicher. Sie wird nur jetzt angezeigt und ist zum Zurücksetzen deines Passworts erforderlich.</p>
        <pre style={{ padding: 16, border: '1px solid currentColor', overflowX: 'auto', userSelect: 'all' }}>{checksum}</pre>
        <p><strong>Wichtig:</strong> Ohne diese Checksum kann das Passwort nicht zurückgesetzt werden.</p>
        <button type="button" onClick={() => router.push('/dashboard')}>Zum Dashboard</button>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: 400, margin: '0 auto', padding: 24 }}>
      <h1>Registrieren</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label>Name<input type="text" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" /></label>
        <label>E-Mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>
        <label>Passwort<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" /></label>
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={loading}>{loading ? 'Wird erstellt…' : 'Account erstellen'}</button>
      </form>
      <p style={{ marginTop: 16 }}>Bereits registriert? <Link href="/sign-in">Anmelden</Link></p>
    </main>
  )
}
