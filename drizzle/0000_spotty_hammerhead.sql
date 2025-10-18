CREATE TABLE "Bikes" (
	"bike_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"make" varchar NOT NULL,
	"model" varchar NOT NULL,
	"date_created" timestamp NOT NULL,
	"description" text,
	"bike_type" varchar(50),
	"size_cm" numeric(5, 2),
	"condition" varchar(20) DEFAULT 'Used',
	"price" numeric(10, 2),
	"is_available" boolean DEFAULT true NOT NULL,
	"weight_kg" numeric(5, 2),
	"reservation_customer_id" uuid,
	"deposit_amount" numeric(10, 2)
);
--> statement-breakpoint
CREATE TABLE "Customers" (
	"customer_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"phone" char(10)
);
--> statement-breakpoint
CREATE TABLE "FeatureFlagAudit" (
	"id" integer PRIMARY KEY NOT NULL,
	"flag_name" varchar NOT NULL,
	"old_value" boolean,
	"new_value" boolean,
	"changed_by" varchar NOT NULL,
	"changed_at" timestamp DEFAULT now() NOT NULL,
	"reason" varchar,
	"details" json
);
--> statement-breakpoint
CREATE TABLE "FeatureFlags" (
	"flag_name" varchar PRIMARY KEY NOT NULL,
	"value" boolean NOT NULL,
	"description" varchar,
	"status" varchar(32) DEFAULT 'active',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Items" (
	"item_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"upc" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"brand" varchar,
	"stock" integer NOT NULL,
	"minimum_stock" integer,
	"standard_price" double precision NOT NULL,
	"wholesale_cost" double precision NOT NULL,
	"condition" varchar,
	"disabled" boolean NOT NULL,
	"managed" boolean,
	"category_1" varchar,
	"category_2" varchar,
	"category_3" varchar,
	"specifications" json,
	"features" json,
	CONSTRAINT "Items_upc_unique" UNIQUE("upc")
);
--> statement-breakpoint
CREATE TABLE "order" (
	"order_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_date" timestamp DEFAULT now() NOT NULL,
	"estimated_delivery" timestamp NOT NULL,
	"supplier" varchar NOT NULL,
	"ordered_by" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Repairs" (
	"repair_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"price" integer NOT NULL,
	"disabled" boolean NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "Permissions" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" text NOT NULL,
	CONSTRAINT "Permissions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "RolePermissions" (
	"role_id" uuid NOT NULL,
	"permission_id" integer NOT NULL,
	CONSTRAINT "RolePermissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "Roles" (
	"role_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"disabled" boolean NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "UserRoles" (
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	CONSTRAINT "UserRoles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "OrderRequests" (
	"order_request_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_by" uuid NOT NULL,
	"transaction_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"date_created" timestamp NOT NULL,
	"quantity" integer NOT NULL,
	"notes" text,
	"ordered" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "TransactionDetails" (
	"transaction_detail_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid,
	"repair_id" uuid,
	"changed_by" uuid,
	"completed" boolean NOT NULL,
	"quantity" integer NOT NULL,
	"date_modified" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "TransactionLogs" (
	"log_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date_modified" timestamp NOT NULL,
	"transaction_num" integer NOT NULL,
	"changed_by" uuid NOT NULL,
	"change_type" varchar NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Transactions" (
	"transaction_num" serial PRIMARY KEY NOT NULL,
	"transaction_id" uuid DEFAULT gen_random_uuid(),
	"date_created" timestamp NOT NULL,
	"transaction_type" varchar NOT NULL,
	"customer_id" uuid NOT NULL,
	"bike_id" uuid,
	"total_cost" double precision NOT NULL,
	"description" text,
	"is_completed" boolean NOT NULL,
	"is_paid" boolean NOT NULL,
	"is_refurb" boolean NOT NULL,
	"is_urgent" boolean NOT NULL,
	"is_nuclear" boolean,
	"is_beer_bike" boolean NOT NULL,
	"is_employee" boolean NOT NULL,
	"is_reserved" boolean NOT NULL,
	"is_waiting_on_email" boolean NOT NULL,
	"date_completed" timestamp,
	CONSTRAINT "Transactions_transaction_id_unique" UNIQUE("transaction_id")
);
--> statement-breakpoint
CREATE TABLE "Users" (
	"user_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firstname" varchar NOT NULL,
	"lastname" varchar NOT NULL,
	"active" boolean NOT NULL,
	"username" varchar NOT NULL,
	CONSTRAINT "Users_username_unique" UNIQUE("username")
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
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Bikes" ADD CONSTRAINT "Bikes_reservation_customer_id_Customers_customer_id_fk" FOREIGN KEY ("reservation_customer_id") REFERENCES "public"."Customers"("customer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "RolePermissions" ADD CONSTRAINT "RolePermissions_role_id_Roles_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."Roles"("role_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "RolePermissions" ADD CONSTRAINT "RolePermissions_permission_id_Permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."Permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "UserRoles" ADD CONSTRAINT "UserRoles_user_id_Users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."Users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "UserRoles" ADD CONSTRAINT "UserRoles_role_id_Roles_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."Roles"("role_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "OrderRequests" ADD CONSTRAINT "OrderRequests_created_by_Users_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."Users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "OrderRequests" ADD CONSTRAINT "OrderRequests_transaction_id_Transactions_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."Transactions"("transaction_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "OrderRequests" ADD CONSTRAINT "OrderRequests_item_id_Items_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."Items"("item_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TransactionDetails" ADD CONSTRAINT "TransactionDetails_transaction_id_Transactions_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."Transactions"("transaction_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TransactionDetails" ADD CONSTRAINT "TransactionDetails_item_id_Items_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."Items"("item_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TransactionDetails" ADD CONSTRAINT "TransactionDetails_repair_id_Repairs_repair_id_fk" FOREIGN KEY ("repair_id") REFERENCES "public"."Repairs"("repair_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TransactionLogs" ADD CONSTRAINT "TransactionLogs_transaction_num_Transactions_transaction_num_fk" FOREIGN KEY ("transaction_num") REFERENCES "public"."Transactions"("transaction_num") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TransactionLogs" ADD CONSTRAINT "TransactionLogs_changed_by_Users_user_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."Users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Transactions" ADD CONSTRAINT "Transactions_customer_id_Customers_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."Customers"("customer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Transactions" ADD CONSTRAINT "Transactions_bike_id_Bikes_bike_id_fk" FOREIGN KEY ("bike_id") REFERENCES "public"."Bikes"("bike_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "WorkflowSteps" ADD CONSTRAINT "WorkflowSteps_transaction_id_Transactions_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."Transactions"("transaction_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "WorkflowSteps" ADD CONSTRAINT "WorkflowSteps_created_by_Users_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."Users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "WorkflowSteps" ADD CONSTRAINT "WorkflowSteps_completed_by_Users_user_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."Users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_bike_type" ON "Bikes" USING btree ("bike_type");--> statement-breakpoint
CREATE INDEX "idx_size_cm" ON "Bikes" USING btree ("size_cm");--> statement-breakpoint
CREATE INDEX "idx_condition" ON "Bikes" USING btree ("condition");--> statement-breakpoint
CREATE INDEX "idx_is_available" ON "Bikes" USING btree ("is_available");--> statement-breakpoint
CREATE INDEX "idx_reservation_customer_id" ON "Bikes" USING btree ("reservation_customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "transaction_workflow_step_order_unique" ON "WorkflowSteps" USING btree ("transaction_id","workflow_type","step_order");--> statement-breakpoint
CREATE INDEX "idx_workflow_steps_transaction_id" ON "WorkflowSteps" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "idx_workflow_steps_workflow_type" ON "WorkflowSteps" USING btree ("workflow_type");--> statement-breakpoint
CREATE INDEX "idx_workflow_steps_transaction_workflow" ON "WorkflowSteps" USING btree ("transaction_id","workflow_type");