import Link from 'next/link'

export default function ResetPasswordPage() {
  return (
    <main style={{ maxWidth: 460, margin: '0 auto', padding: 24 }}>
      <h1>Passwort zurücksetzen</h1>
      <p>Das Zurücksetzen erfolgt jetzt mit deiner persönlichen Recovery-Checksum.</p>
      <Link href="/forgot-password">Zur Passwort-Wiederherstellung</Link>
    </main>
  )
}
