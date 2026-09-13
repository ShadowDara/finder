"use client";

import Link from "next/link";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { useEffect, useState } from "react";
import hljs from "highlight.js/lib/common";

type T = {
  id: string;
  name: string;
  updatedAt: string;
  tags: string[];
  user: { id: string; name: string; email: string };
};

export default function UserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      image: true,
      createdAt: true,
      templates: {
        orderBy: { updatedAt: "desc" },
        select: { id: true, name: true, tags: true, updatedAt: true },
      },
    },
  });

  const [selected, setSelected] = useState<(T & { content: string }) | null>(
    null,
  );

  if (!user) notFound();

  async function open(id: string) {
    const r = await fetch(`/api/templates/discover/${id}`);
    if (r.ok) setSelected((await r.json()).template);
  }

  return (
    <main className="site-shell">
      <Link href="/discover" className="back-link">
        ← Zur Discover-Seite
      </Link>

      <section className="profile-hero">
        <div className="avatar">
          {(user.name || "U").slice(0, 1).toUpperCase()}
        </div>
        <div>
          <p className="eyebrow">Creator-Profil</p>
          <h1>{user.name || "Unbekannter User"}</h1>
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
                <button
                  className="button button-outline"
                  onClick={() => open(template.id)}
                >
                  Template ansehen
                </button>
              </article>
            ))}
          </div>
        )}
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
