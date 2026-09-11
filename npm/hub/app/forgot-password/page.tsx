'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [checksum, setChecksum] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    const response = await fetch('/api/account/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, checksum, password }),
    })
    const data = await response.json()
    if (!response.ok) {
      setError(data.error ?? 'Passwort konnte nicht zurückgesetzt werden.')
      return
    }
    setMessage('Passwort geändert. Du kannst dich jetzt anmelden.')
    setChecksum('')
    setPassword('')
  }

  return (
    <main style={{ maxWidth: 460, margin: '0 auto', padding: 24 }}>
      <h1>Passwort zurücksetzen</h1>
      <p>Gib deine E-Mail-Adresse und die beim Erstellen gespeicherte Recovery-Checksum ein.</p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label>E-Mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>
        <label>Recovery-Checksum<input type="text" value={checksum} onChange={(e) => setChecksum(e.target.value)} required autoComplete="off" spellCheck={false} /></label>
        <label>Neues Passwort<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" /></label>
        {error && <p role="alert">{error}</p>}
        {message && <p role="status">{message}</p>}
        <button type="submit">Passwort ändern</button>
      </form>
      <p style={{ marginTop: 16 }}><Link href="/sign-in">Zur Anmeldung</Link></p>
    </main>
  )
}
