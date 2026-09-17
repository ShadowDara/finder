import { prisma } from "@/lib/db";
import { templateFileResponse } from "@/lib/template-download";
import { NextResponse } from "next/server";

type Context = { params: Promise<{ id: string }> };

function templateId(raw: string): string {
  return raw.replace(/\.(json5|jsonc|json)$/i, "");
}

export async function GET(_request: Request, context: Context) {
  const { id: rawId } = await context.params;
  const id = templateId(rawId);

  const template = await prisma.template.findUnique({
    where: { id },
    select: { id: true, name: true, content: true },
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
