const fs = require("fs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const OUTPUT_FILE = "./database-export.sql";

/**
 * Prisma Model -> Datenbank-Tabelle
 */
const models = [
  {
    client: "user",
    table: "user",
  },
  {
    client: "session",
    table: "session",
  },
  {
    client: "account",
    table: "account",
  },
  {
    client: "verification",
    table: "verification",
  },
  {
    client: "template",
    table: "template",
  },
];

/**
 * PostgreSQL Identifier escapen
 */
function quoteIdentifier(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

/**
 * Wert für SQL vorbereiten
 */
function escapeSql(value) {
  if (value === null || value === undefined) {
    return "NULL";
  }

  // Boolean
  if (typeof value === "boolean") {
    return value ? "TRUE" : "FALSE";
  }

  // Number
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error(`Ungültige Zahl: ${value}`);
    }

    return String(value);
  }

  // BigInt
  if (typeof value === "bigint") {
    return String(value);
  }

  // Date
  if (value instanceof Date) {
    return `'${value.toISOString().replace(/'/g, "''")}'`;
  }

  // PostgreSQL Arrays
  if (Array.isArray(value)) {
    const values = value.map((item) => {
      if (item === null || item === undefined) {
        return "NULL";
      }

      const escaped = String(item).replace(/\\/g, "\\\\").replace(/'/g, "''");

      return `'${escaped}'`;
    });

    return `ARRAY[${values.join(", ")}]`;
  }

  // Objekt / JSON
  if (typeof value === "object") {
    const json = JSON.stringify(value)
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "''");

    return `'${json}'`;
  }

  // String
  return `'${String(value).replace(/'/g, "''")}'`;
}

/**
 * SQL-Datei erstellen
 */
async function main() {
  let sql = "";

  sql += "-- ============================================\n";
  sql += "-- Prisma PostgreSQL Database Export\n";
  sql += `-- Generated: ${new Date().toISOString()}\n`;
  sql += "-- ============================================\n\n";

  // ============================================================
  // TRANSACTION
  // ============================================================

  sql += "BEGIN;\n\n";

  // ============================================================
  // EXTENSIONS
  // ============================================================

  sql += "-- ============================================\n";
  sql += "-- Extensions\n";
  sql += "-- ============================================\n\n";

  // CUIDs werden von Prisma bereits in der Anwendung erzeugt.
  // Für das Schema selbst ist daher keine Extension notwendig.

  // ============================================================
  // TABLES
  // ============================================================

  sql += "-- ============================================\n";
  sql += "-- Create Tables\n";
  sql += "-- ============================================\n\n";

  // ------------------------------------------------------------
  // USER
  // ------------------------------------------------------------

  sql += `CREATE TABLE IF NOT EXISTS "user" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  "image" TEXT,
  "recoveryKeyHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

`;

  sql += `CREATE UNIQUE INDEX IF NOT EXISTS "user_email_key"
ON "user" ("email");

`;

  // ------------------------------------------------------------
  // SESSION
  // ------------------------------------------------------------

  sql += `CREATE TABLE IF NOT EXISTS "session" (
  "id" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "token" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" TEXT NOT NULL,

  CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

`;

  sql += `CREATE UNIQUE INDEX IF NOT EXISTS "session_token_key"
ON "session" ("token");

`;

  // ------------------------------------------------------------
  // ACCOUNT
  // ------------------------------------------------------------

  sql += `CREATE TABLE IF NOT EXISTS "account" (
  "id" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMP(3),
  "refreshTokenExpiresAt" TIMESTAMP(3),
  "scope" TEXT,
  "password" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

`;

  // ------------------------------------------------------------
  // VERIFICATION
  // ------------------------------------------------------------

  sql += `CREATE TABLE IF NOT EXISTS "verification" (
  "id" TEXT NOT NULL,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

`;

  // ------------------------------------------------------------
  // TEMPLATE
  // ------------------------------------------------------------

  sql += `CREATE TABLE IF NOT EXISTS "template" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "template_pkey" PRIMARY KEY ("id")
);

`;

  // ============================================================
  // INDEXES
  // ============================================================

  sql += "-- ============================================\n";
  sql += "-- Create Indexes\n";
  sql += "-- ============================================\n\n";

  sql += `CREATE INDEX IF NOT EXISTS "template_userId_idx"
ON "template" ("userId");

`;

  // ============================================================
  // DATA
  // ============================================================

  sql += "-- ============================================\n";
  sql += "-- Insert Data\n";
  sql += "-- ============================================\n\n";

  for (const model of models) {
    console.log(`Exportiere ${model.client}...`);

    const prismaModel = prisma[model.client];

    if (!prismaModel) {
      console.warn(
        `⚠️ Prisma Model "${model.client}" wurde nicht gefunden. Überspringe...`,
      );
      continue;
    }

    const data = await prismaModel.findMany();

    console.log(`   ${data.length} Datensätze gefunden.`);

    if (data.length === 0) {
      sql += `-- ${model.table}: keine Daten\n\n`;
      continue;
    }

    const columns = Object.keys(data[0]);

    const columnNames = columns.map(quoteIdentifier).join(", ");

    sql += `-- --------------------------------------------\n`;
    sql += `-- Table: ${model.table}\n`;
    sql += `-- Rows: ${data.length}\n`;
    sql += `-- --------------------------------------------\n\n`;

    for (const row of data) {
      const values = columns.map((column) => escapeSql(row[column])).join(", ");

      sql += `INSERT INTO ${quoteIdentifier(model.table)} (${columnNames}) VALUES (${values});\n`;
    }

    sql += "\n";
  }

  // ============================================================
  // FOREIGN KEYS
  // ============================================================

  sql += "-- ============================================\n";
  sql += "-- Foreign Keys\n";
  sql += "-- ============================================\n\n";

  sql += `ALTER TABLE "session"
ADD CONSTRAINT "session_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "user" ("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

`;

  sql += `ALTER TABLE "account"
ADD CONSTRAINT "account_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "user" ("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

`;

  sql += `ALTER TABLE "template"
ADD CONSTRAINT "template_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "user" ("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

`;

  // ============================================================
  // COMMIT
  // ============================================================

  sql += "COMMIT;\n";

  // Datei schreiben
  fs.writeFileSync(OUTPUT_FILE, sql, "utf8");

  console.log("\n============================================");
  console.log("✅ Export erfolgreich!");
  console.log(`📄 Datei: ${OUTPUT_FILE}`);
  console.log("============================================\n");
}

main()
  .catch((error) => {
    console.error("\n❌ Export fehlgeschlagen:");
    console.error(error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
