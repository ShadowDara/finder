import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { UserClient } from "./user-client";

export default async function UserPage({
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

  if (!user) notFound();

  return (
    <UserClient
      user={{
        id: user.id,
        name: user.name,
        image: user.image,
        createdAt: user.createdAt.toISOString(),
        templates: user.templates.map((t) => ({
          id: t.id,
          name: t.name,
          tags: t.tags,
          updatedAt: t.updatedAt.toISOString(),
        })),
      }}
    />
  );
}
