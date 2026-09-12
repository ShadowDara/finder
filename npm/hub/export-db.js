const fs = require("fs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const OUTPUT_FILE = "./database-export.sql";

/**
 * Prisma Model -> Datenbank-Tabelle
 *
 * Die Namen links sind die Prisma-Client-Properties.
 * Die Namen rechts sind die tatsächlichen PostgreSQL-Tabellen.
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

  // Array
  if (Array.isArray(value)) {
    // PostgreSQL String[] / andere Arrays
    const values = value.map((item) => {
      if (item === null || item === undefined) {
        return "NULL";
      }

      return `"${String(item).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    });

    return `ARRAY[${values
      .map((value) => value.replace(/^"|"$/g, "'"))
      .join(", ")}]`;
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

async function main() {
  let sql = "";

  sql += "-- ============================================\n";
  sql += "-- Prisma PostgreSQL Database Export\n";
  sql += `-- Generated: ${new Date().toISOString()}\n`;
  sql += "-- ============================================\n\n";

  // Transaktionen sorgen dafür, dass der Import sauber ausgeführt werden kann.
  sql += "BEGIN;\n\n";

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

    // Alle Spalten anhand des ersten Datensatzes bestimmen.
    const columns = Object.keys(data[0]);

    const columnNames = columns.map(quoteIdentifier).join(", ");

    sql += `-- ============================================\n`;
    sql += `-- Table: ${model.table}\n`;
    sql += `-- Rows: ${data.length}\n`;
    sql += `-- ============================================\n\n`;

    for (const row of data) {
      const values = columns.map((column) => escapeSql(row[column])).join(", ");

      sql += `INSERT INTO ${quoteIdentifier(model.table)} (${columnNames}) VALUES (${values});\n`;
    }

    sql += "\n";
  }

  sql += "COMMIT;\n";

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
