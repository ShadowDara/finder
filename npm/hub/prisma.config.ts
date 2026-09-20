import { loadEnvFile } from "node:process";

// Prisma 7's env() in prisma.config.ts does NOT auto-load .env files.
// We load .env here so DATABASE_URL is available when defineConfig runs below.
try {
  loadEnvFile();
} catch {
  // .env is optional when DATABASE_URL is already in the environment.
}

import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
  },

  datasource: {
    url: env("DATABASE_URL"),
  },
});
