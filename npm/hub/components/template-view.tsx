"use client";

import { prettyJson } from "@/lib/utils";
import { highlightFinderTemplate } from "@/lib/highlight";
import { parseMarkdown } from "@shadowdara/dlib";

type TemplateViewProps = {
  template: { id: string; name: string; content: string } | null;
  onClose: () => void;
};

export function TemplateView({ template, onClose }: TemplateViewProps) {
  if (!template) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        <p className="eyebrow">{template.name}</p>
        <pre
          dangerouslySetInnerHTML={{
            __html: highlightFinderTemplate(prettyJson(template.content)),
          }}
        />
        <div className="markdown-box">
          <div
            className="markdown"
            dangerouslySetInnerHTML={{
              __html: parseMarkdown(JSON.parse(template.content)?.mdnote ?? ""),
            }}
          />
        </div>
      </div>
    </div>
  );
}
