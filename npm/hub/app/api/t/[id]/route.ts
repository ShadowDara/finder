import { prisma } from "@/lib/db";
import {
  hubOrigin,
  templateDownloadUrl,
  templateInstallCommand,
} from "@/lib/template-download";
import { NextResponse } from "next/server";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  const { id } = await context.params;
  const origin = hubOrigin(request);

  const template = await prisma.template.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      updatedAt: true,
      tags: true,
      user: { select: { id: true, name: true, username: true } },
    },
  });

  if (!template) {
    return NextResponse.json(
      { error: "Template nicht gefunden." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    template: {
      ...template,
      url: templateDownloadUrl(origin, template),
      install: templateInstallCommand(origin, template),
    },
  });
}
