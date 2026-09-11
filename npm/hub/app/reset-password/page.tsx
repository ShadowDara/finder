'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { resetPassword } from '@/lib/auth-client'

export default function ResetPasswordPage() {
  const params = useSearchParams()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    const result = await resetPassword({ newPassword: password, token })
    setLoading(false)
    if (result.error) {
      setError('Der Link ist ungültig oder abgelaufen.')
      return
    }
    setMessage('Dein Passwort wurde geändert.')
  }

  return (
    <main style={{ maxWidth: 400, margin: '0 auto', padding: 24 }}>
      <h1>Neues Passwort</h1>
      {message ? <><p role="status">{message}</p><Link href="/sign-in">Zur Anmeldung</Link></> : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            Neues Passwort
            <input type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" />
          </label>
          {error && <p role="alert">{error}</p>}
          <button type="submit" disabled={loading || !token}>{loading ? 'Wird gespeichert…' : 'Passwort ändern'}</button>
        </form>
      )}
    </main>
  )
}

export const dynamic = 'force-dynamic'
