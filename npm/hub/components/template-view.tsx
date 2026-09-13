"use client";

import { prettyJson } from "@/lib/utils";
import { highlightFinderTemplate } from "@shadowdara/finder-lib/highlight";
import { parseMarkdown } from "@shadowdara/dlib";

type TemplateViewProps = {
  template: { id: string; name: string; content: string } | null;
  onClose: () => void;
  showclose: boolean | null;
};

export function TemplateView(props: TemplateViewProps) {
  if (!props.template) return null;

  const mdnote: string | undefined = JSON.parse(props.template.content)?.mdnote;

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
