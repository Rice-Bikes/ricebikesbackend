import { env } from "@/common/utils/envConfig";
import { dbLogger } from "@/common/utils/logger";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "./schema/index";

// Connection string from environment variables
const connectionString = env.DATABASE_URL;

// Client for regular database operations
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });

// Separate client for migrations to avoid connection pool conflicts
const migrationClient = postgres(connectionString, { max: 1 });
export const migrationDb = drizzle(migrationClient);

// Function to run migrations
export async function runMigrations() {
  dbLogger.info("Running database migrations...");
  try {
    // Set migration directory based on environment
    const migrationsFolder = env.isDev ? "./drizzle" : "/app/drizzle";

    await migrate(migrationDb, { migrationsFolder });
    dbLogger.info("Migrations completed successfully");
    return true;
  } catch (error) {
    dbLogger.error({ error }, "Migration failed");
    throw error;
  } finally {
    await migrationClient.end();
  }
}

// Export schema for use in other files
export { schema };
