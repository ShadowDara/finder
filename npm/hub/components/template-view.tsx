"use client";

import { prettyJson } from "@/lib/utils";
import { highlightFinderTemplate } from "@shadowdara/finder-lib/highlight";
import { parseMarkdown } from "@shadowdara/dlib";
import { useState } from "react";

type TemplateViewProps = {
  template: {
    id: string;
    name: string;
    content: string;
    slug?: string;
    username?: string;
  } | null;
  onClose: () => void;
  showclose: boolean | null;
};

function installCommand(t: {
  id: string;
  slug?: string;
  username?: string;
}): string {
  const origin =
    typeof window === "undefined"
      ? ""
      : window.location.origin.replace(/\/$/, "");
  if (t.username && t.slug) {
    return `finder install ${origin}/t/${encodeURIComponent(t.username)}/${encodeURIComponent(t.slug)}.json`;
  }
  return `finder install ${origin}/t/${t.id}.json`;
}

export function TemplateView(props: TemplateViewProps) {
  const [copied, setCopied] = useState(false);
  if (!props.template) return null;

  const mdnote: string | undefined = JSON.parse(props.template.content)?.mdnote;
  const command = installCommand(props.template);

  async function copyInstall() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={props.onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {props.showclose ? (
          <>
            <button className="modal-close" onClick={props.onClose}>
              ×
            </button>
            <p className="eyebrow">{props.template.name}</p>
          </>
        ) : null}

        <div className="install-row">
          <code>{command}</code>
          <button
            type="button"
            className="button button-outline"
            onClick={copyInstall}
          >
            {copied ? "Kopiert" : "Kopieren"}
          </button>
        </div>

        <pre
          dangerouslySetInnerHTML={{
            __html: highlightFinderTemplate(prettyJson(props.template.content)),
          }}
        />
        {mdnote ? (
          <div className="markdown-box">
            <div
              className="markdown"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(mdnote) }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
