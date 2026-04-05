CREATE TABLE "Bikes" (
	"bike_id" uuid PRIMARY KEY NOT NULL,
	"make" text,
	"model" text,
	"description" text,
	"date_created" timestamp DEFAULT CURRENT_TIMESTAMP,
	"customer_id" uuid,
	"bike_type" varchar(50),
	"size_cm" numeric(5, 2),
	"condition" varchar(20) DEFAULT 'New',
	"price" numeric(10, 2),
	"is_available" boolean DEFAULT true,
	"weight_kg" numeric(5, 2),
	"reservation_customer_id" uuid,
	"deposit_amount" numeric(10, 2),
	CONSTRAINT "bikes_deposit_check" CHECK (("Bikes"."deposit_amount" IS NULL) OR (deposit_amount >= (0)::numeric)),
	CONSTRAINT "bikes_price_check" CHECK (("Bikes"."price" IS NULL) OR (price >= (0)::numeric)),
	CONSTRAINT "bikes_weight_check" CHECK (("Bikes"."weight_kg" IS NULL) OR (weight_kg > (0)::numeric))
);
--> statement-breakpoint
CREATE TABLE "Customers" (
	"customer_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text,
	"last_name" text,
	"email" text,
	"phone" char(10)
);
--> statement-breakpoint
CREATE TABLE "feature_flag_audit" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "feature_flag_audit_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"flag_name" varchar NOT NULL,
	"old_value" boolean,
	"new_value" boolean,
	"changed_by" varchar NOT NULL,
	"changed_at" timestamp (6) DEFAULT now(),
	"reason" varchar,
	"details" jsonb
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"flag_name" varchar PRIMARY KEY NOT NULL,
	"value" boolean NOT NULL,
	"description" varchar,
	"status" varchar(32) DEFAULT 'active',
	"created_at" timestamp (6) DEFAULT now(),
	"updated_at" timestamp (6) DEFAULT now(),
	"updated_by" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Roles" (
	"role_id" uuid PRIMARY KEY NOT NULL,
	"name" text,
	"disabled" boolean NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "Users" (
	"user_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text,
	"firstname" text,
	"lastname" text,
	"active" boolean
);
--> statement-breakpoint
CREATE TABLE "Permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	CONSTRAINT "Permissions_name_key" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "RolePermissions" (
	"role_id" uuid NOT NULL,
	"permission_id" integer NOT NULL,
	CONSTRAINT "RolePermissions_pkey" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "UserRoles" (
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	CONSTRAINT "UserRoles_pkey" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "Items" (
	"item_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"upc" text,
	"name" text,
	"description" text,
	"brand" text,
	"desired_stock" double precision,
	"stock" integer DEFAULT 0,
	"minimum_stock" integer DEFAULT 0,
	"standard_price" numeric(10, 2),
	"wholesale_cost" numeric(10, 2),
	"condition" text,
	"disabled" boolean DEFAULT false,
	"managed" boolean,
	"size" text,
	"category_1" text,
	"category_2" text,
	"category_3" text,
	"features" json,
	"specifications" json,
	CONSTRAINT "unique_upc" UNIQUE("upc")
);
--> statement-breakpoint
CREATE TABLE "Repairs" (
	"repair_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"price" integer,
	"disabled" boolean,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "OrderRequests" (
	"order_request_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_by" uuid NOT NULL,
	"transaction_id" uuid,
	"item_id" uuid NOT NULL,
	"date_created" timestamp NOT NULL,
	"quantity" integer NOT NULL,
	"notes" text,
	"ordered" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "TransactionDetails" (
	"transaction_detail_id" uuid PRIMARY KEY NOT NULL,
	"transaction_id" uuid NOT NULL,
	"item_id" uuid,
	"repair_id" uuid,
	"completed" boolean DEFAULT true NOT NULL,
	"changed_by" uuid,
	"quantity" integer NOT NULL,
	"date_modified" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "TransactionLogs" (
	"log_id" uuid PRIMARY KEY NOT NULL,
	"transaction_num" integer NOT NULL,
	"changed_by" uuid NOT NULL,
	"date_modified" timestamp NOT NULL,
	"change_type" text NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Transactions" (
	"transaction_num" serial PRIMARY KEY NOT NULL,
	"transaction_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"date_created" timestamp,
	"transaction_type" text,
	"customer_id" uuid,
	"total_cost" double precision,
	"is_paid" boolean,
	"is_completed" boolean,
	"description" text,
	"is_refurb" boolean,
	"is_urgent" boolean,
	"is_beer_bike" boolean,
	"is_employee" boolean,
	"is_reserved" boolean,
	"is_waiting_on_email" boolean,
	"date_completed" timestamp,
	"completed" boolean,
	"is_status" text,
	"is_nuclear" boolean,
	"bike_id" uuid,
	CONSTRAINT "Transactions_transaction_id_key" UNIQUE("transaction_id")
);
--> statement-breakpoint
CREATE TABLE "order" (
	"order_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_date" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"estimated_delivery" timestamp NOT NULL,
	"supplier" text NOT NULL,
	"ordered_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "WorkflowSteps" (
	"step_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"workflow_type" varchar(50) NOT NULL,
	"step_name" varchar(100) NOT NULL,
	"step_order" integer NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"created_by" uuid NOT NULL,
	"completed_by" uuid,
	"created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"completed_at" timestamp(6),
	"updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "WorkflowSteps_step_order_positive" CHECK ("WorkflowSteps"."step_order" > 0),
	CONSTRAINT "WorkflowSteps_workflow_type_valid" CHECK (("WorkflowSteps"."workflow_type")::text = ANY (ARRAY[('bike_sales'::character varying)::text, ('repair_process'::character varying)::text, ('order_fulfillment'::character varying)::text, ('custom_workflow'::character varying)::text]))
);
--> statement-breakpoint
ALTER TABLE "Bikes" ADD CONSTRAINT "Bikes_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."Customers"("customer_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Bikes" ADD CONSTRAINT "fk_bikes_reservation_customer" FOREIGN KEY ("reservation_customer_id") REFERENCES "public"."Customers"("customer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "RolePermissions" ADD CONSTRAINT "RolePermissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."Permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "RolePermissions" ADD CONSTRAINT "RolePermissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."Roles"("role_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "UserRoles" ADD CONSTRAINT "UserRoles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."Users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "UserRoles" ADD CONSTRAINT "UserRoles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."Roles"("role_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "OrderRequests" ADD CONSTRAINT "fk_created_by" FOREIGN KEY ("created_by") REFERENCES "public"."Users"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "OrderRequests" ADD CONSTRAINT "fk_transaction" FOREIGN KEY ("transaction_id") REFERENCES "public"."Transactions"("transaction_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "OrderRequests" ADD CONSTRAINT "fk_item" FOREIGN KEY ("item_id") REFERENCES "public"."Items"("item_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TransactionDetails" ADD CONSTRAINT "fk_transaction" FOREIGN KEY ("transaction_id") REFERENCES "public"."Transactions"("transaction_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TransactionDetails" ADD CONSTRAINT "fk_item" FOREIGN KEY ("item_id") REFERENCES "public"."Items"("item_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TransactionDetails" ADD CONSTRAINT "fk_repair" FOREIGN KEY ("repair_id") REFERENCES "public"."Repairs"("repair_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TransactionDetails" ADD CONSTRAINT "fk_changed_by" FOREIGN KEY ("changed_by") REFERENCES "public"."Users"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TransactionLogs" ADD CONSTRAINT "TransactionLogs_transaction_num_fkey" FOREIGN KEY ("transaction_num") REFERENCES "public"."Transactions"("transaction_num") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TransactionLogs" ADD CONSTRAINT "TransactionLogs_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."Users"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Transactions" ADD CONSTRAINT "Transactions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."Customers"("customer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Transactions" ADD CONSTRAINT "Transactions_bike_id_fkey" FOREIGN KEY ("bike_id") REFERENCES "public"."Bikes"("bike_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "WorkflowSteps" ADD CONSTRAINT "WorkflowSteps_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."Transactions"("transaction_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "WorkflowSteps" ADD CONSTRAINT "WorkflowSteps_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "public"."Users"("user_id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "WorkflowSteps" ADD CONSTRAINT "WorkflowSteps_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."Users"("user_id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "idx_bikes_bike_type" ON "Bikes" USING btree ("bike_type");--> statement-breakpoint
CREATE INDEX "idx_bikes_size_cm" ON "Bikes" USING btree ("size_cm");--> statement-breakpoint
CREATE INDEX "idx_bikes_condition" ON "Bikes" USING btree ("condition");--> statement-breakpoint
CREATE INDEX "idx_bikes_is_available" ON "Bikes" USING btree ("is_available");--> statement-breakpoint
CREATE INDEX "idx_bikes_reservation_customer" ON "Bikes" USING btree ("reservation_customer_id");--> statement-breakpoint
CREATE INDEX "idx_customer_id" ON "Customers" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "RolePermissions_permission_id_idx" ON "RolePermissions" USING btree ("permission_id");--> statement-breakpoint
CREATE INDEX "RolePermissions_role_id_idx" ON "RolePermissions" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "UserRoles_role_id_idx" ON "UserRoles" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "UserRoles_user_id_idx" ON "UserRoles" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "WorkflowSteps_transaction_id_workflow_type_step_order_key" ON "WorkflowSteps" USING btree ("transaction_id","workflow_type","step_order");--> statement-breakpoint
CREATE INDEX "WorkflowSteps_transaction_id_idx" ON "WorkflowSteps" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "WorkflowSteps_transaction_id_workflow_type_idx" ON "WorkflowSteps" USING btree ("transaction_id","workflow_type");--> statement-breakpoint
CREATE INDEX "WorkflowSteps_workflow_type_idx" ON "WorkflowSteps" USING btree ("workflow_type");