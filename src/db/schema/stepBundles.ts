import { pgTable, text, uuid } from "drizzle-orm/pg-core";

export const stepBundles = pgTable("StepBundles", {
  bundle_id: uuid("bundle_id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
});
