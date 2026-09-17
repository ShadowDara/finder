import { prisma } from "@/lib/db";
import { templateFileResponse } from "@/lib/template-download";
import { NextResponse } from "next/server";

type Context = { params: Promise<{ username: string; slug: string }> };

function templateSlug(raw: string): string {
  return raw.replace(/\.(json5|jsonc|json)$/i, "");
}

export async function GET(_request: Request, context: Context) {
  const { username, slug: rawSlug } = await context.params;
  const slug = templateSlug(rawSlug);

  const template = await prisma.template.findFirst({
    where: {
      slug,
      user: { username },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      content: true,
      user: { select: { username: true } },
    },
  });

  if (!template) {
    return new NextResponse("Template nicht gefunden.\n", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  return templateFileResponse(template);
}