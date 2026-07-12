import { relations } from "drizzle-orm";
import { foreignKey, pgTable, uuid } from "drizzle-orm/pg-core";
import { repairs } from "./repairs";
import { tuneUps } from "./tuneUps";

export const tuneUpItems = pgTable(
  "TuneUpItems",
  {
    tune_up_item_id: uuid("tune_up_item_id").primaryKey().defaultRandom(),
    repair_id: uuid("repair_id").notNull(),
    tune_up_id: uuid("tune_up_id").notNull(),
  },
  (table) => ({
    repair_id_fk: foreignKey({
      columns: [table.repair_id],
      foreignColumns: [repairs.repair_id],
      name: "TuneUpItems_repair_id_fkey",
    }).onDelete("cascade"),
    tune_up_id_fk: foreignKey({
      columns: [table.tune_up_id],
      foreignColumns: [tuneUps.tune_up_id],
      name: "TuneUpItems_tune_up_id_fkey",
    }).onDelete("cascade"),
  }),
);

export const tuneUpItemsRelations = relations(tuneUpItems, ({ one }) => ({
  repair: one(repairs, {
    fields: [tuneUpItems.repair_id],
    references: [repairs.repair_id],
  }),
  tuneUp: one(tuneUps, {
    fields: [tuneUpItems.tune_up_id],
    references: [tuneUps.tune_up_id],
  }),
}));

// Reverse relations declared here (rather than editing repairs.ts / tuneUps.ts)
// so those existing schema files don't need to change, mirroring how
// WorkflowSteps declares its relation onto users in workflowSteps.ts instead
// of users.ts.
export const repairsToTuneUpItemsRelations = relations(repairs, ({ many }) => ({
  tuneUpItems: many(tuneUpItems),
}));

export const tuneUpsToTuneUpItemsRelations = relations(tuneUps, ({ many }) => ({
  tuneUpItems: many(tuneUpItems),
}));
