import { NextResponse } from "next/server";

export function hubOrigin(request: Request): string {
  return new URL(request.url).origin.replace(/\/$/, "");
}

/**
 * Bau der Download-URL im GitHub-Repo-Stil:
 * /t/{username}/{slug}.json5
 *
 * Fallback auf die alte ID-URL, falls kein Username bekannt ist.
 */
export function templateDownloadUrl(
  origin: string,
  ref: { id: string; username?: string | null; slug?: string | null },
): string {
  const base = origin.replace(/\/$/, "");
  if (ref.username && ref.slug) {
    return `${base}/t/${encodeURIComponent(ref.username)}/${encodeURIComponent(ref.slug)}.json5`;
  }
  return `${base}/t/${ref.id}.json5`;
}

export function templateInstallCommand(
  origin: string,
  ref: { id: string; username?: string | null; slug?: string | null },
): string {
  return `finder install ${templateDownloadUrl(origin, ref)}`;
}

export function templateDownloadFileName(name: string, id: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${slug || id}.json5`;
}

export function templateFileResponse(template: {
  id: string;
  name: string;
  content: string;
}): NextResponse {
  const filename = templateDownloadFileName(template.name, template.id);
  return new NextResponse(template.content, {
    status: 200,
    headers: {
      "Content-Type": "application/json5; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=60",
      "Access-Control-Allow-Origin": "*",
      "X-Template-Id": template.id,
      "X-Template-Name": encodeURIComponent(template.name),
      "X-Template-Registry": "finder-hub",
    },
  });
}
