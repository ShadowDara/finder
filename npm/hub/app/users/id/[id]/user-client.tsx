"use client";

import Link from "next/link";
import { useState } from "react";
import { TemplateView } from "@/components/template-view";

type TemplateDetail = {
  id: string;
  name: string;
  slug?: string;
  content: string;
  updatedAt: string;
  tags: string[];
  user: { id: string; name: string; username?: string; email: string };
};

type UserData = {
  id: string;
  username?: string;
  name: string;
  image: string | null;
  createdAt: string;
  templates: {
    id: string;
    name: string;
    slug?: string;
    updatedAt: string;
    tags: string[];
  }[];
};

export function UserClient({ user }: { user: UserData }) {
  const [selected, setSelected] = useState<TemplateDetail | null>(null);

  async function open(id: string) {
    const r = await fetch(`/api/templates/discover/${id}`);
    if (r.ok) setSelected((await r.json()).template);
  }

  return (
    <main className="site-shell">
      <Link href="/discover" className="back-link">
        ← Zur Discover-Seite
      </Link>
      {" | "}
      <Link href="/dashboard" className="back-link">
        ← Zur Dashboard-Seite
      </Link>
      <section className="profile-hero">
        <div className="avatar">
          {(user.name || "U").slice(0, 1).toUpperCase()}
        </div>
        <div>
          <p className="eyebrow">Creator-Profil</p>
          <h1>{user.username ?? user.name ?? "Unbekannter User"}</h1>
          <p className="muted">{user.templates.length} öffentliche Templates</p>
        </div>
      </section>
      <section>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Bibliothek</p>
            <h2>Templates von {user.name || "diesem User"}</h2>
          </div>
        </div>
        {user.templates.length === 0 ? (
          <p className="empty-state">Noch keine Templates veröffentlicht.</p>
        ) : (
          <div className="template-grid">
            {user.templates.map((template) => (
              <article className="template-card" key={template.id}>
                <div className="card-icon">{"{ }"}</div>
                <h3>{template.name}</h3>
                <div className="tag-row">
                  {template.tags.map((tag) => (
                    <span className="tag" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="muted">
                  Aktualisiert{" "}
                  {new Date(template.updatedAt).toLocaleDateString("de-DE")}
                </p>
                <div className="card-actions">
                  <button
                    className="button button-outline"
                    onClick={() => open(template.id)}
                  >
                    Template ansehen
                  </button>
                  <a
                    className="button button-outline"
                    href={`/t/${user.username ?? user.id}/${template.slug ?? template.id}.json5`}
                  >
                    Download
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <TemplateView
        template={
          selected
            ? {
                ...selected,
                username: selected.user.username,
                slug: selected.slug ?? selected.id,
              }
            : null
        }
        onClose={() => setSelected(null)}
        showclose={false}
      />
    </main>
  );
}
