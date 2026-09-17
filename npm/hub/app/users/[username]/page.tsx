import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { UserClient } from "../id/[id]/user-client";

export default async function UserPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      createdAt: true,
      templates: {
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          tags: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!user) notFound();

  return (
    <UserClient
      user={{
        id: user.id,
        username: user.username,
        name: user.name,
        image: user.image,
        createdAt: user.createdAt.toISOString(),
        templates: user.templates.map((t) => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
          tags: t.tags,
          updatedAt: t.updatedAt.toISOString(),
        })),
      }}
    />
  );
}
