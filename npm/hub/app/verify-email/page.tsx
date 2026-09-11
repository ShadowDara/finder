'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { sendVerificationEmail } from '@/lib/auth-client'

type Mail = { url: string; createdAt: string }

export default function VerifyEmailPage() {
  const params = useSearchParams()
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mails, setMails] = useState<Mail[]>([])
  const [loading, setLoading] = useState(false)
  const [mailboxLoading, setMailboxLoading] = useState(false)

  async function loadMailbox() {
    setMailboxLoading(true)
    const response = await fetch(`/api/dev-mailbox?email=${encodeURIComponent(email)}`)
    const data = await response.json()
    setMails(data.mails ?? [])
    setMailboxLoading(false)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    const result = await sendVerificationEmail({ email, callbackURL: '/dashboard' })
    setLoading(false)
    if (result.error) {
      setError('Die Anfrage konnte nicht verarbeitet werden.')
      return
    }
    setMessage('Ein neuer Bestätigungslink wurde im lokalen Postfach abgelegt.')
    await loadMailbox()
  }

  return (
    <main style={{ maxWidth: 520, margin: '0 auto', padding: 24 }}>
      <h1>E-Mail bestätigen</h1>
      <p>Ohne Mailanbieter landen deine Auth-Mails hier im lokalen Postfach.</p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          E-Mail
          <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
        </label>
        {message && <p role="status">{message}</p>}
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={loading}>{loading ? 'Wird erstellt…' : 'Bestätigungslink erstellen'}</button>
      </form>
      <button type="button" onClick={loadMailbox} disabled={mailboxLoading || !email} style={{ marginTop: 12 }}>
        {mailboxLoading ? 'Postfach wird geladen…' : 'Lokales Postfach laden'}
      </button>
      {mails.length > 0 && (
        <section aria-label="Lokales Postfach" style={{ marginTop: 24 }}>
          <h2>Lokales Postfach</h2>
          <ul>
            {mails.filter((mail) => mail.url.includes('verify')).map((mail) => (
              <li key={mail.url}><a href={mail.url}>Bestätigungslink öffnen</a></li>
            ))}
          </ul>
        </section>
      )}
      <p><Link href="/sign-in">Zur Anmeldung</Link></p>
    </main>
  )
}

export const dynamic = 'force-dynamic'
