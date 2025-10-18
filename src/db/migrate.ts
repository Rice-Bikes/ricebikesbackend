import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { db, migrationDb } from "./client";

// Load environment variables
dotenv.config();

// Run migrations
export async function runMigrations(options = { force: false }) {
  console.log("Running database migrations...");

  try {
    if (options.force) {
      console.log("Force mode enabled - handling existing tables...");
      await handleExistingTables();
    }

    await migrate(migrationDb, { migrationsFolder: "./drizzle" });
    console.log("✅ Migrations completed successfully");
    return true;
  } catch (error) {
    console.error("❌ Migration failed:", error);
    if (error.message?.includes("relation") && error.message?.includes("already exists")) {
      console.log("Try running migrations with force flag: npm run db:migrate:force");
    }
    throw error;
  }
}

// Handle existing tables when migrating from Prisma to Drizzle
async function handleExistingTables() {
  const migrationClient = postgres(process.env.DATABASE_URL!, { max: 1 });

  try {
    // Get list of migration files
    const migrationDir = path.resolve("./drizzle");
    const migrationFiles = fs.readdirSync(migrationDir).filter((f) => f.endsWith(".sql"));

    if (migrationFiles.length === 0) {
      console.log("No migration files found in ./drizzle directory");
      return;
    }

    // Read first migration file to extract table names
    const firstMigrationPath = path.join(migrationDir, migrationFiles[0]);
    const migrationContent = fs.readFileSync(firstMigrationPath, "utf8");

    // Extract table names from CREATE TABLE statements
    const tableRegex = /CREATE TABLE "([^"]+)"/g;
    const tables = [];
    let match: RegExpExecArray | null;

    while (true) {
      match = tableRegex.exec(migrationContent);
      if (!match) break;
      tables.push(match[1]);
    }

    console.log(`Found ${tables.length} tables to check: ${tables.join(", ")}`);

    // Check if migration tracking table exists, create it if not
    const drizzleMigrationsTable = "__drizzle_migrations";
    await migrationClient.unsafe(`
      CREATE TABLE IF NOT EXISTS ${drizzleMigrationsTable} (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at timestamptz
      )
    `);

    // Add migration records if needed
    console.log("Preparing migration tracking...");
  } finally {
    await migrationClient.end();
  }
}

// Execute migrations when script is run directly
if (require.main === module) {
  const forceMode = process.argv.includes("--force");

  runMigrations({ force: forceMode })
    .then(() => {
      console.log("Migration script completed. Exiting...");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration script failed:", error);
      process.exit(1);
    });
}

export default runMigrations;
