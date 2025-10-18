import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load environment variables
dotenv.config();

// Export Drizzle configuration
export default defineConfig({
  schema: "./src/db/schema/*",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // Use "migrate" for production, "push" for development
  // push will apply schema changes directly without generating migration files
  // migrate will generate SQL files that can be reviewed and applied manually
  verbose: true,
  strict: true,
});
