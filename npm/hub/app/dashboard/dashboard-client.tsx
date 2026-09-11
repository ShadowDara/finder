'use client'

import { signOut } from '@/lib/auth-client'
import { MAX_TEMPLATE_BYTES } from '@/lib/templates'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Template = {
  id: string
  name: string
  content: string
  updatedAt: string
}

export function DashboardClient({
  userEmail,
  initialTemplates,
}: {
  userEmail: string
  initialTemplates: Template[]
}) {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>(initialTemplates)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const contentBytes = new TextEncoder().encode(content).length

  function resetForm() {
    setEditingId(null)
    setName('')
    setContent('')
    setError(null)
  }

  function startEdit(template: Template) {
    setEditingId(template.id)
    setName(template.name)
    setContent(template.content)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const url = editingId ? `/api/templates/${editingId}` : '/api/templates'
    const method = editingId ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, content }),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setError(data.error ?? 'Speichern fehlgeschlagen.')
      return
    }

    const saved: Template = {
      ...data.template,
      updatedAt: data.template.updatedAt,
    }

    setTemplates((prev) =>
      editingId ? prev.map((t) => (t.id === saved.id ? saved : t)) : [saved, ...prev],
    )
    resetForm()
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setTemplates((prev) => prev.filter((t) => t.id !== id))
      if (editingId === id) resetForm()
    }
  }

  async function handleSignOut() {
    await signOut()
    router.push('/sign-in')
    router.refresh()
  }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Dashboard</h1>
          <p>Angemeldet als {userEmail}</p>
        </div>
        <button type="button" onClick={handleSignOut}>
          Abmelden
        </button>
      </header>

      <section style={{ marginTop: 24 }}>
        <h2>{editingId ? 'Template bearbeiten' : 'Neues Template'}</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            Inhalt (JSON)
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={10}
            />
          </label>
          <p>
            {contentBytes} / {MAX_TEMPLATE_BYTES} Bytes
          </p>
          {error && <p role="alert">{error}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={saving}>
              {saving ? 'Speichern…' : editingId ? 'Aktualisieren' : 'Erstellen'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm}>
                Abbrechen
              </button>
            )}
          </div>
        </form>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Meine Templates ({templates.length})</h2>
        {templates.length === 0 ? (
          <p>Noch keine Templates vorhanden.</p>
        ) : (
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 0, listStyle: 'none' }}>
            {templates.map((template) => (
              <li key={template.id} style={{ border: '1px solid', padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{template.name}</strong>
                  <span style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => startEdit(template)}>
                      Bearbeiten
                    </button>
                    <button type="button" onClick={() => handleDelete(template.id)}>
                      Löschen
                    </button>
                  </span>
                </div>
                <pre style={{ overflowX: 'auto', marginTop: 8 }}>{template.content}</pre>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
