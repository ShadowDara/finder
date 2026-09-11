'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type TemplateSummary = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  user: { name: string; email: string }
}

type TemplateDetail = TemplateSummary & { content: string }

export default function DiscoverClient() {
  const [query, setQuery] = useState('')
  const [templates, setTemplates] = useState<TemplateSummary[]>([])
  const [selected, setSelected] = useState<TemplateDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const response = await fetch(`/api/templates/discover?q=${encodeURIComponent(query)}`)
        if (!response.ok) throw new Error('Die Templates konnten nicht geladen werden.')
        const data = (await response.json()) as { templates: TemplateSummary[] }
        setTemplates(data.templates)
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Laden fehlgeschlagen.')
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => window.clearTimeout(timer)
  }, [query])

  async function openTemplate(id: string) {
    setDetailLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/templates/discover/${id}`)
      if (!response.ok) throw new Error('Das Template konnte nicht geladen werden.')
      const data = (await response.json()) as { template: TemplateDetail }
      setSelected(data.template)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Laden fehlgeschlagen.')
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <Link href="/">Template Manager</Link>
          <h1>Discover</h1>
          <p>Durchsuche öffentliche Templates aus der Community.</p>
        </div>
        <nav style={{ display: 'flex', gap: 12 }}>
          <Link href="/sign-in">Anmelden</Link>
          <Link href="/sign-up">Registrieren</Link>
        </nav>
      </header>

      <label htmlFor="template-search">Templates suchen</label>
      <input
        id="template-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Nach Namen suchen..."
        style={{ display: 'block', width: '100%', maxWidth: 520, margin: '8px 0 24px', padding: 10 }}
      />

      {error && <p role="alert">{error}</p>}
      {loading && <p aria-live="polite">Lade Templates...</p>}
      {!loading && templates.length === 0 && <p>Keine Templates gefunden.</p>}
      <section aria-label="Öffentliche Templates" style={{ display: 'grid', gap: 12 }}>
        {templates.map((template) => (
          <article key={template.id} style={{ border: '1px solid #ccc', padding: 16 }}>
            <h2>{template.name}</h2>
            <p>Von {template.user.name || template.user.email}</p>
            <p>Aktualisiert: {new Date(template.updatedAt).toLocaleDateString('de-DE')}</p>
            <button type="button" onClick={() => openTemplate(template.id)}>
              Anschauen
            </button>
          </article>
        ))}
      </section>

      {detailLoading && <p aria-live="polite">Lade Template...</p>}
      {selected && (
        <div role="dialog" aria-modal="true" aria-labelledby="template-dialog-title" style={{ marginTop: 24, border: '1px solid #333', padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
            <h2 id="template-dialog-title">{selected.name}</h2>
            <button type="button" onClick={() => setSelected(null)} aria-label="Template schließen">Schließen</button>
          </div>
          <pre style={{ overflowX: 'auto', whiteSpace: 'pre-wrap' }}>{selected.content}</pre>
        </div>
      )}
    </main>
  )
}
