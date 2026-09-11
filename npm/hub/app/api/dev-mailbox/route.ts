import { getLocalMails, isLocalMailboxEnabled } from '@/lib/local-mailbox'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  if (!isLocalMailboxEnabled()) {
    return NextResponse.json({ error: 'Local mailbox disabled' }, { status: 404 })
  }

  const email = new URL(request.url).searchParams.get('email')?.trim()
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

  return NextResponse.json({ mails: getLocalMails(email) })
}
