import { NextResponse } from "next/server";

export function hubOrigin(request: Request): string {
  return new URL(request.url).origin.replace(/\/$/, "");
}

export function templateDownloadUrl(origin: string, id: string): string {
  return `${origin.replace(/\/$/, "")}/t/${id}.json5`;
}

export function templateInstallCommand(origin: string, id: string): string {
  return `finder install ${templateDownloadUrl(origin, id)}`;
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
