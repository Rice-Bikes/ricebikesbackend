import dotenv from "dotenv";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Load environment variables
dotenv.config();

// Create a function to run the initialization
async function initDrizzle() {
  console.log("Initializing Drizzle on existing database...");

  // Create a connection
  const connectionString = process.env.DATABASE_URL!;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const queryClient = postgres(connectionString);

  try {
    // Create the Drizzle migrations table if it doesn't exist
    console.log("Creating Drizzle migrations table...");
    await queryClient.unsafe(`
      CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at timestamptz DEFAULT now() NOT NULL
      );
    `);

    // Insert a placeholder migration record to mark the initial state
    console.log("Adding initial migration record...");
    const initialMigrationExists = await queryClient`
      SELECT COUNT(*) FROM "__drizzle_migrations" WHERE hash = 'initial_prisma_migration'
    `;

    if (initialMigrationExists[0].count === "0") {
      await queryClient`
        INSERT INTO "__drizzle_migrations" (hash, created_at)
        VALUES ('initial_prisma_migration', now())
      `;
    }

    // Check if there are any newer migrations that need to be applied
    console.log("Checking for new migrations...");
    const migrationFiles = await queryClient`
      SELECT hash FROM "__drizzle_migrations"
    `;

    console.log(`Found ${migrationFiles.length} migration(s) already applied.`);

    console.log("✅ Drizzle initialization complete!");
    console.log("");
    console.log("Next steps:");
    console.log("1. Use 'npm run db:push' to synchronize any schema changes");
    console.log("2. Use 'npm run db:studio' to view the database in Drizzle Studio");
  } catch (error) {
    console.error("❌ Drizzle initialization failed:", error);
    throw error;
  } finally {
    await queryClient.end();
  }
}

// Run the initialization
if (require.main === module) {
  initDrizzle()
    .then(() => {
      console.log("Initialization script completed successfully.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Initialization script failed:", error);
      process.exit(1);
    });
}

export default initDrizzle;
