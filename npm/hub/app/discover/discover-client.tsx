"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import hljs from "highlight.js/lib/common";

type T = {
  id: string;
  name: string;
  updatedAt: string;
  tags: string[];
  user: { id: string; name: string; email: string };
};

export default function DiscoverClient() {
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const [templates, setTemplates] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<(T & { content: string }) | null>(
    null,
  );

  const [error, setError] = useState("");
  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(
          `/api/templates/discover?q=${encodeURIComponent(q)}&tags=${encodeURIComponent(tag)}`,
        );
        const d = await r.json();
        setTemplates(d.templates ?? []);
      } catch {
        setError("Templates konnten nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [q, tag]);

  async function open(id: string) {
    const r = await fetch(`/api/templates/discover/${id}`);
    if (r.ok) setSelected((await r.json()).template);
  }

  return (
    <main className="site-shell">
      <header className="topbar">
        <Link href="/" className="brand">
          finder<span>.</span>
        </Link>
        <nav>
          <Link href="/sign-in">Anmelden</Link>
          <Link href="/sign-up" className="button button-dark">
            Registrieren
          </Link>
        </nav>
      </header>
      <section className="discover-hero">
        <p className="eyebrow">Community library</p>
        <h1>
          Finde dein nächstes <em>Template.</em>
        </h1>
        <p className="hero-copy">
          Durchsuche öffentliche Finder-Templates von der Community.
        </p>
        <div className="search-row">
          <input
            aria-label="Templates suchen"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name oder Tag suchen…"
          />
          <input
            aria-label="Nach Tags filtern"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="Tags: cli, web, react"
          />
        </div>
      </section>
      <section>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Entdecken</p>
            <h2>{loading ? "Lade…" : `${templates.length} Templates`}</h2>
          </div>
        </div>
        {error && <p role="alert">{error}</p>}
        {!loading && !templates.length && (
          <p className="empty-state">
            Keine Treffer. Versuche einen anderen Suchbegriff.
          </p>
        )}
        <div className="template-grid">
          {templates.map((t) => (
            <article className="template-card" key={t.id}>
              <div className="card-icon">{"{ }"}</div>
              <h3>{t.name}</h3>
              <p className="muted">
                von{" "}
                <Link href={`/users/${t.user.id}`} className="inline-link">
                  {t.user.name || t.user.email}
                </Link>
              </p>
              <div className="tag-row">
                {t.tags.map((x) => (
                  <button className="tag" key={x} onClick={() => setTag(x)}>
                    {x}
                  </button>
                ))}
              </div>
              <button
                className="button button-outline"
                onClick={() => open(t.id)}
              >
                Template ansehen
              </button>
            </article>
          ))}
        </div>
      </section>
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>
              ×
            </button>
            <p className="eyebrow">{selected.name}</p>
            <pre
              dangerouslySetInnerHTML={{
                __html: hljs.highlight(selected.content, {
                  language: "json",
                }).value,
              }}
            />
          </div>
        </div>
      )}
    </main>
  );
}
