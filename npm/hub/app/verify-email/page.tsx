import Link from 'next/link'

export default function VerifyEmailPage() {
  return (
    <main style={{ maxWidth: 460, margin: '0 auto', padding: 24 }}>
      <h1>E-Mail-Bestätigung nicht erforderlich</h1>
      <p>Dieser Account verwendet eine persönliche Recovery-Checksum statt E-Mail-Bestätigungen.</p>
      <p>Bewahre deine Checksum sicher auf. Ohne sie kann dein Passwort nicht zurückgesetzt werden.</p>
      <Link href="/sign-in">Zur Anmeldung</Link>
    </main>
  )
}
