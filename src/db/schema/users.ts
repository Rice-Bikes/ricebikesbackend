import { relations } from "drizzle-orm";
import { boolean, pgTable, uuid, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("Users", {
  user_id: uuid("user_id").primaryKey().defaultRandom(),
  firstname: varchar("firstname").notNull(),
  lastname: varchar("lastname").notNull(),
  active: boolean("active").notNull(),
  username: varchar("username").notNull().unique(),
});

// Relations will be defined in the related schema files to avoid circular dependencies
