export type LocalMail = {
  id: string
  email: string
  kind: 'verification' | 'password-reset'
  url: string
  createdAt: string
}

const mailbox = new Map<string, LocalMail[]>()

export function saveLocalMail(mail: Omit<LocalMail, 'id' | 'createdAt'>) {
  const entry: LocalMail = {
    ...mail,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  const messages = mailbox.get(mail.email.toLowerCase()) ?? []
  mailbox.set(mail.email.toLowerCase(), [entry, ...messages].slice(0, 10))
  return entry
}

export function getLocalMails(email: string) {
  return mailbox.get(email.trim().toLowerCase()) ?? []
}

export function clearLocalMails(email: string) {
  mailbox.delete(email.trim().toLowerCase())
}

// This mailbox is intentionally development-only. A real email provider is required for production delivery.
export function isLocalMailboxEnabled() {
  return process.env.NODE_ENV !== 'production' || process.env.LOCAL_AUTH_MAILBOX === 'true'
}
