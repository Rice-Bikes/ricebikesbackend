CREATE TABLE "StepBundles" (
	"bundle_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Steps" (
	"step_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid,
	"bundle_id" uuid,
	"description" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"step_order" integer NOT NULL,
	CONSTRAINT "Steps_parent_xor" CHECK (("Steps"."transaction_id" IS NOT NULL AND "Steps"."bundle_id" IS NULL) OR ("Steps"."transaction_id" IS NULL AND "Steps"."bundle_id" IS NOT NULL)),
	CONSTRAINT "Steps_step_order_positive" CHECK ("Steps"."step_order" > 0)
);
--> statement-breakpoint
CREATE TABLE "TuneUps" (
	"tune_up_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"cost" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "TuneUpItems" (
	"tune_up_item_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repair_id" uuid NOT NULL,
	"tune_up_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "WorkflowSteps" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "WorkflowSteps" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "WorkflowSteps" ALTER COLUMN "completed_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "WorkflowSteps" ALTER COLUMN "updated_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "WorkflowSteps" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "TransactionDetails" ADD COLUMN "tune_up_id" uuid;--> statement-breakpoint
ALTER TABLE "Steps" ADD CONSTRAINT "Steps_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."Transactions"("transaction_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Steps" ADD CONSTRAINT "Steps_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "public"."StepBundles"("bundle_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TuneUpItems" ADD CONSTRAINT "TuneUpItems_repair_id_fkey" FOREIGN KEY ("repair_id") REFERENCES "public"."Repairs"("repair_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TuneUpItems" ADD CONSTRAINT "TuneUpItems_tune_up_id_fkey" FOREIGN KEY ("tune_up_id") REFERENCES "public"."TuneUps"("tune_up_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "Steps_transaction_id_step_order_key" ON "Steps" USING btree ("transaction_id","step_order");--> statement-breakpoint
CREATE UNIQUE INDEX "Steps_bundle_id_step_order_key" ON "Steps" USING btree ("bundle_id","step_order");--> statement-breakpoint
CREATE INDEX "Steps_transaction_id_idx" ON "Steps" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "Steps_bundle_id_idx" ON "Steps" USING btree ("bundle_id");--> statement-breakpoint
ALTER TABLE "TransactionDetails" ADD CONSTRAINT "fk_tune_up" FOREIGN KEY ("tune_up_id") REFERENCES "public"."TuneUps"("tune_up_id") ON DELETE set null ON UPDATE no action;