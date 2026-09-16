import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { APIError } from "better-auth/api";
import { prisma } from "@/lib/db";
import { isValidUsername, toUsername } from "@/lib/templates";

const vercelUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : undefined;

const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : undefined;

const baseURL =
  process.env.BETTER_AUTH_URL ||
  vercelUrl ||
  productionUrl ||
  process.env.V0_RUNTIME_URL ||
  "http://localhost:3000";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  user: {
    additionalFields: {
      username: {
        type: "string",
        required: false, // server-derived via databaseHooks.user.create.before
        input: false, // not accepted from client; the DB column enforces NOT NULL
      },
    },
  },

  baseURL,

  trustedOrigins: async (request) => {
    const origins: string[] = [
      "http://localhost:3000",

      ...(vercelUrl ? [vercelUrl] : []),
      ...(productionUrl ? [productionUrl] : []),

      ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
      ...(process.env.V0_DEV_APP_URL ? [process.env.V0_DEV_APP_URL] : []),
      ...(process.env.V0_BUILD_URL ? [process.env.V0_BUILD_URL] : []),
      ...(process.env.V0_SANDBOX_URL ? [process.env.V0_SANDBOX_URL] : []),

      ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
    ];

    // Vercel-Preview- und wechselnde Deployment-Domains zulassen:
    // Die Origin der aktuellen Anfrage wird mit vertraut, damit Anmeldung
    // auf jeder aktuellen Deployment-URL funktioniert (z.B. git-develop-...).
    const reqOrigin = request?.headers?.get("origin");
    if (reqOrigin && !origins.includes(reqOrigin)) {
      origins.push(reqOrigin);
    }
    return origins;
  },

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: false,

    sendResetPassword: async () => {
      // Password recovery uses the user-owned SHA512 checksum
      // instead of email.
    },
  },

  emailVerification: {
    sendVerificationEmail: async () => {
      // No external mail provider is required for this authentication flow.
    },

    sendOnSignUp: false,
    autoSignInAfterVerification: false,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },

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

  ...(process.env.NODE_ENV === "development"
    ? {
        advanced: {
          defaultCookieAttributes: {
            sameSite: "none" as const,
            secure: true,
          },
        },
      }
    : {}),

  plugins: [nextCookies()],
});
