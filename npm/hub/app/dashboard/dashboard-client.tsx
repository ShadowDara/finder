"use client";

import { TemplateView } from "@/components/template-view";
import { signOut } from "@/lib/auth-client";
import { MAX_TEMPLATE_BYTES } from "@/lib/templates";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LINK } from "../vars";
import { prettyJson } from "@/lib/utils";

// Liest die URL-Parameter "template" und "name" für den Creator-Rückweg.
// Bewusst ohne useSearchParams, damit kein Suspense-Boundary nötig ist.
function getPrefill(): { name: string; content: string } | null {
  const params = new URLSearchParams(window.location.search);
  const templateRaw = params.get("template");
  const nameParam = params.get("name");
  if (templateRaw == null || nameParam == null) return null;
  return { name: nameParam, content: templateRaw };
}
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div style={{ border: "1px solid", padding: 12 }}>Editor lädt…</div>
  ),
});

// Modul-Konstante: stabile Referenz, damit Re-Renders den Editor nicht neu konfigurieren
const EDITOR_OPTIONS = {
  minimap: { enabled: false },
  fontSize: 15,
  tabSize: 2,
  wordWrap: "on" as const,
  scrollBeyondLastLine: false,
  automaticLayout: true,
};

type Template = {
  id: string;
  name: string;
  slug?: string;
  content: string;
  tags?: string[];
  updatedAt: string;
};

export function DashboardClient({
  userId,
  username,
  userEmail,
  initialTemplates,
}: {
  userId: string;
  username?: string;
  userEmail: string;
  initialTemplates: Template[];
}) {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);
  // Zähler, um den Editor bei Bearbeiten/Reset/URL-Prefill neu zu mounten,
  // damit defaultValue wirklich übernommen wird (kein Fokus-Verlust).
  const [editorReset, setEditorReset] = useState(0);

  // URL-Parameter (template & name) beim ersten Mount übernehmen:
  // - Wenn der Name schon existiert → Bearbeiten-Modus (PUT)
  // - Sonst → neues Template vorbelegen (POST)
  useEffect(() => {
    const prefill = getPrefill();
    if (!prefill) return;

    const existing = templates.find(
      (t) => t.name.toLowerCase() === prefill.name.toLowerCase(),
    );
    if (existing) {
      setEditingId(existing.id);
      setName(existing.name);
      setContent(prettyJson(prefill.content));
      setTags(existing.tags?.join(", ") ?? "");
    } else {
      setEditingId(null);
      setName(prefill.name);
      setContent(prettyJson(prefill.content));
    }
    setError(null);
    setEditorReset((n) => n + 1);
  }, []); // einmalig beim Mount

  const contentBytes = new TextEncoder().encode(
    JSON.stringify(JSON.parse(content), null, 0),
  ).length;

  function resetForm() {
    setEditingId(null);
    setName("");
    setContent("");
    setTags("");
    setError(null);
    setEditorReset((n) => n + 1);
  }

  function startEdit(template: Template) {
    setEditingId(template.id);
    setName(template.name);
    setContent(prettyJson(template.content));
    setTags(template.tags?.join(", ") ?? "");
    setError(null);
    setEditorReset((n) => n + 1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError("Der Inhalt darf nicht leer sein.");
      return;
    }

    setSaving(true);

    const url = editingId ? `/api/templates/${editingId}` : "/api/templates";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        content,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Speichern fehlgeschlagen.");
      return;
    }

    const saved: Template = {
      ...data.template,
      content: data.template.content ?? "",
      updatedAt: data.template.updatedAt,
    };

    setTemplates((prev) =>
      editingId
        ? prev.map((t) => (t.id === saved.id ? saved : t))
        : [saved, ...prev],
    );
    resetForm();
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      if (editingId === id) resetForm();
    }
  }

  async function handleDeleteAccount() {
    if (
      !window.confirm(
        "Möchtest du deinen Account und alle Templates endgültig löschen?",
      )
    )
      return;
    setDeletingAccount(true);
    setAccountError(null);
    const response = await fetch("/api/account", { method: "DELETE" });
    setDeletingAccount(false);
    if (!response.ok) {
      setAccountError("Der Account konnte nicht gelöscht werden.");
      return;
    }
    await signOut();
    router.push("/");
    router.refresh();
  }

  async function handleSignOut() {
    await signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1>
            Dashboard - <Link href="/">Discover</Link> -{" "}
            <Link href={`/users/${username ?? userId}`}>User Page</Link>
          </h1>
          <p>Angemeldet als {userEmail}</p>
        </div>
        <button type="button" onClick={handleSignOut}>
          Abmelden
        </button>
      </header>

      <section style={{ marginTop: 24 }}>
        <h2>{editingId ? "Template bearbeiten" : "Neues Template"}</h2>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            Tags (kommagetrennt)
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="cli, web, react"
            />
          </label>
          Inhalt (JSON)
          <MonacoEditor
            key={`${editingId ?? "new"}-${editorReset}`}
            language="json"
            height="300px"
            theme="vs-dark"
            defaultValue={content}
            onChange={(value) => setContent(value ?? "")}
            options={EDITOR_OPTIONS}
          />
          <p>
            {contentBytes} / {MAX_TEMPLATE_BYTES} Bytes
          </p>
          {error && <p role="alert">{error}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={saving}>
              {saving
                ? "Speichern…"
                : editingId
                  ? "Aktualisieren"
                  : "Erstellen"}
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
          <ul
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              padding: 0,
              listStyle: "none",
            }}
          >
            {templates.map((template) => (
              <li
                key={template.id}
                style={{ border: "1px solid", padding: 12 }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <strong>{template.name}</strong>
                  <span style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() =>
                        window.open(
                          `https://shadowdara.github.io/finder/creator?template=${encodeURIComponent(template.content)}&filename=${encodeURIComponent(template.name)}&origin_link=${encodeURIComponent(LINK + "/dashboard")}`,
                          "_blank",
                        )
                      }
                    >
                      Edit in webcreator
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        window.open(
                          `http://localhost:5173/creator?template=${encodeURIComponent(template.content)}&filename=${encodeURIComponent(template.name)}&origin_link=${encodeURIComponent(LINK + "/dashboard")}`,
                          "_blank",
                        )
                      }
                    >
                      Edit in creator
                    </button>
                    <button type="button" onClick={() => startEdit(template)}>
                      Bearbeiten
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(template.id)}
                    >
                      Löschen
                    </button>
                  </span>
                </div>

                <TemplateView
                  template={
                    template
                      ? {
                          ...template,
                          username,
                          slug: template.slug ?? template.id,
                        }
                      : null
                  }
                  onClose={() => {}}
                  showclose={false}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        style={{ marginTop: 48, borderTop: "1px solid", paddingTop: 24 }}
      >
        <h2>Account löschen</h2>
        <p>Diese Aktion löscht deinen Account und alle Templates dauerhaft.</p>
        {accountError && <p role="alert">{accountError}</p>}
        <button
          type="button"
          onClick={handleDeleteAccount}
          disabled={deletingAccount}
        >
          {deletingAccount
            ? "Account wird gelöscht…"
            : "Account endgültig löschen"}
        </button>
      </section>
    </main>
  );
}
