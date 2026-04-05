import { relations } from "drizzle-orm";
import { boolean, pgTable, text, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("Users", {
  user_id: uuid("user_id").primaryKey().defaultRandom(),
  username: text("username"),
  firstname: text("firstname"),
  lastname: text("lastname"),
  active: boolean("active"),
});

// Relations will be defined in the related schema files to avoid circular dependencies
