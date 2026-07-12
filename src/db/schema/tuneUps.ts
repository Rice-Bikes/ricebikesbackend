import { integer, pgTable, text, uuid } from "drizzle-orm/pg-core";

export const tuneUps = pgTable("TuneUps", {
  tune_up_id: uuid("tune_up_id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  cost: integer("cost").notNull(),
});
