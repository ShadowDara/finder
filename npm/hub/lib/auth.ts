import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { APIError } from "better-auth/api";
import { prisma } from "@/lib/db";
import { isValidUsername, toUsername } from "@/lib/templates";

const vercelOrigin = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : undefined;

const productionOrigin = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : undefined;

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  baseURL:
    process.env.BETTER_AUTH_URL ??
    vercelOrigin ??
    productionOrigin ??
    "http://localhost:3000",

  trustedOrigins: [
    "http://localhost:3000",

    ...(vercelOrigin ? [vercelOrigin] : []),
    ...(productionOrigin ? [productionOrigin] : []),

    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
  ],

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const raw =
            typeof (user as Record<string, unknown>).username === "string"
              ? ((user as Record<string, unknown>).username as string)
              : (user as Record<string, unknown>).name;
          const username = toUsername(raw ?? "");

          if (!isValidUsername(username)) {
            throw APIError.fromStatus("BAD_REQUEST", {
              message:
                "Ungültiger Benutzername. Erlaubt sind kleinbuchstaben, Zahlen, Punkte, Unterstriche und Bindestriche (2-32 Zeichen).",
            });
          }

          const existing = await prisma.user.findUnique({
            where: { username },
            select: { id: true },
          });
          if (existing) {
            throw APIError.fromStatus("BAD_REQUEST", {
              message: "Dieser Benutzername ist bereits vergeben.",
            });
          }

          return { data: { ...user, username, name: username } };
        },
      },
      update: {
        before: async (user) => {
          if (
            !("username" in user) ||
            typeof (user as Record<string, unknown>).username !== "string"
          ) {
            return;
          }
          const username = toUsername(
            (user as Record<string, unknown>).username as string,
          );
          if (!isValidUsername(username)) {
            throw APIError.fromStatus("BAD_REQUEST", {
              message:
                "Ungültiger Benutzername. Erlaubt sind kleinbuchstaben, Zahlen, Punkte, Unterstriche und Bindestriche (2-32 Zeichen).",
            });
          }
          const existing = await prisma.user.findUnique({
            where: { username },
            select: { id: true },
          });
          if (existing && existing.id !== user.id) {
            throw APIError.fromStatus("BAD_REQUEST", {
              message: "Dieser Benutzername ist bereits vergeben.",
            });
          }
          return { data: { ...user, username } };
        },
      },
    },
  },

  // ...
});
