/**
 * Transaction Repository - Drizzle Implementation
 *
 * This file implements the Transaction repository interface using Drizzle ORM.
 */

import { type SQL, and, eq, isNotNull, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
// @ts-ignore
import { v4 as uuidv4 } from "uuid";

import { serviceLogger as logger } from "@/common/utils/logger";
import { db as drizzleDb } from "@/db/client";
import type * as schema from "@/db/schema";
import { bikes as bikesTable } from "@/db/schema/bikes";
import { customers as customersTable } from "@/db/schema/customers";
import { orderRequests as orderRequestsTable, transactions as transactionsTable } from "@/db/schema/transactions";
import { users as usersTable } from "@/db/schema/users";
import { type TransactionCursor, encodeCursor } from "./transactionCursor";
import type { AggTransaction, Transaction, TransactionsSummary, UpdateTransaction } from "./transactionModel";
import { type TransactionSortMode, type TransactionView, sortModeForView } from "./transactionViews";

export interface ListTransactionsOptions {
  page_limit: number;
  /** Position to resume from; omitted or null starts at the first page. */
  cursor?: TransactionCursor | null;
  /**
   * Named view to filter by. Omitted or null applies no filter. The view also
   * determines the ordering, via {@link sortModeForView}.
   */
  view?: TransactionView | null;
  /**
   * Whether transactions belonging to employees are included. Defaults to
   * false, which hides them from both the rows and the total.
   */
  show_employees?: boolean;
}

export interface TransactionPage<T> {
  transactions: T[];
  /** Cursor for the following page, or null when this is the last page. */
  next_cursor: string | null;
  /**
   * Total matching the filters across every page. Deliberately excludes the
   * keyset predicate, so it stays constant as the caller pages through.
   */
  total: number;
}

/**
 * Sort bucket for the default ordering. Urgent transactions come first and
 * ones waiting on an email come last; urgent wins when a transaction is both.
 *
 * `buildCursorFromRow` recomputes this in JS, so the two must stay in step.
 */
const sortBucket = (): SQL<number> => sql<number>`CASE
    WHEN ${transactionsTable.is_urgent} IS TRUE THEN 0
    WHEN ${transactionsTable.is_waiting_on_email} IS TRUE THEN 2
    ELSE 1
  END`;

// Both columns are nullable. Coalescing to an infinite timestamp pushes rows
// without a date to the end of whichever direction they are sorted in, and
// keeps the keyset comparison below free of NULLs (a NULL on either side of a
// row comparison makes it NULL, which would drop the row from every page).
const createdSort = (): SQL => sql`COALESCE(${transactionsTable.date_created}, 'infinity'::timestamp)`;
const completedSort = (): SQL => sql`COALESCE(${transactionsTable.date_completed}, '-infinity'::timestamp)`;

/** The ordering's timestamp key, as text, for embedding in a cursor. */
const sortKey = (sort_mode: TransactionSortMode): SQL<string> =>
  sort_mode === "open" ? sql<string>`(${createdSort()})::text` : sql<string>`(${completedSort()})::text`;

const orderByFor = (sort_mode: TransactionSortMode): SQL[] =>
  sort_mode === "open"
    ? [sql`${sortBucket()} ASC`, sql`${createdSort()} ASC`, sql`${transactionsTable.transaction_num} ASC`]
    : [sql`${completedSort()} DESC`, sql`${transactionsTable.transaction_num} DESC`];

/**
 * Restricts the query to rows strictly after the cursor in the sort order,
 * using a row comparison so the whole composite key is honoured at once.
 * `transaction_num` is the final tiebreaker, which makes the order total and
 * guarantees no row is served twice or skipped.
 */
const keysetCondition = (cursor: TransactionCursor): SQL => {
  if (cursor.mode === "open") {
    return sql`(${sortBucket()}, ${createdSort()}, ${transactionsTable.transaction_num}) > (${cursor.bucket}::int, ${cursor.sort_key}::timestamp, ${cursor.transaction_num}::int)`;
  }
  return sql`(${completedSort()}, ${transactionsTable.transaction_num}) < (${cursor.sort_key}::timestamp, ${cursor.transaction_num}::int)`;
};

interface SortedRow {
  transaction: typeof transactionsTable.$inferSelect;
  bucket: number;
  sort_key: string;
}

const buildCursorFromRow = (
  row: SortedRow,
  sort_mode: TransactionSortMode,
  view: TransactionView | null,
  show_employees: boolean,
): string =>
  encodeCursor(
    sort_mode === "open"
      ? {
          mode: "open",
          view,
          show_employees,
          bucket: Number(row.bucket),
          sort_key: row.sort_key,
          transaction_num: row.transaction.transaction_num,
        }
      : {
          mode: "completed",
          view,
          show_employees,
          sort_key: row.sort_key,
          transaction_num: row.transaction.transaction_num,
        },
  );

/**
 * `transaction_type` is stored with inconsistent casing ("retrospec" and
 * "Retrospec" both occur), so builds are matched case-insensitively. The rest
 * of the codebase already compares this column with toLowerCase().
 */
const isRetrospec = (): SQL => sql`lower(${transactionsTable.transaction_type}) = 'retrospec'`;
const isNotRetrospec = (): SQL => sql`lower(${transactionsTable.transaction_type}) <> 'retrospec'`;

/**
 * Employee transactions are hidden unless asked for. IS NOT TRUE rather than
 * `= false` so a row whose employee status is unknown still shows, instead of
 * disappearing from every view.
 */
const excludeEmployees = (): SQL => sql`${transactionsTable.is_employee} IS NOT TRUE`;

/** The filter behind each named view. */
const buildViewConditions = (view: TransactionView | null): SQL[] => {
  switch (view) {
    case "main":
      return [
        eq(transactionsTable.is_completed, false),
        isNotNull(transactionsTable.transaction_type),
        isNotRetrospec(),
        eq(transactionsTable.is_refurb, false),
      ];
    case "refurbs":
      return [eq(transactionsTable.is_completed, false), eq(transactionsTable.is_refurb, true)];
    case "beerBikes":
      return [
        eq(transactionsTable.is_completed, false),
        isNotNull(transactionsTable.transaction_type),
        isNotRetrospec(),
        eq(transactionsTable.is_beer_bike, true),
      ];
    case "builds":
      return [eq(transactionsTable.is_completed, false), isRetrospec()];
    case "waiting":
      return [
        eq(transactionsTable.is_completed, true),
        isNotNull(transactionsTable.date_completed),
        eq(transactionsTable.is_paid, false),
      ];
    case "paid":
      return [
        eq(transactionsTable.is_completed, true),
        isNotNull(transactionsTable.date_completed),
        eq(transactionsTable.is_paid, true),
      ];
    default:
      return [];
  }
};

/**
 * Every filter the request implies: the view, plus the employee toggle.
 * Shared by the page query and the count so the two can never disagree.
 */
const buildListConditions = (view: TransactionView | null, show_employees: boolean): SQL[] => {
  const conditions = buildViewConditions(view);
  if (!show_employees) {
    conditions.push(excludeEmployees());
  }
  return conditions;
};

/**
 * Counts every row in the view, ignoring the cursor.
 *
 * The aggregate listing left-joins bikes and customers on their primary keys,
 * which is one-to-one and so cannot change the row count. That makes this
 * single count correct for both listings.
 */
const countMatching = async (
  db: PostgresJsDatabase<typeof schema>,
  view: TransactionView | null,
  show_employees: boolean,
): Promise<number> => {
  const conditions = buildListConditions(view, show_employees);
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(transactionsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);
  return Number(row?.count ?? 0);
};

export class TransactionRepositoryDrizzle {
  private db: PostgresJsDatabase<typeof schema>;

  constructor(db = drizzleDb) {
    this.db = db;
  }

  async findAll({
    page_limit,
    cursor = null,
    view = null,
    show_employees = false,
  }: ListTransactionsOptions): Promise<TransactionPage<Transaction>> {
    try {
      const sort_mode = sortModeForView(view);
      const conditions = buildListConditions(view, show_employees);
      if (cursor) {
        conditions.push(keysetCondition(cursor));
      }

      // One extra row tells us whether a further page exists, so hasMore
      // never depends on the total.
      const [rows, total] = await Promise.all([
        this.db
          .select({
            transaction: transactionsTable,
            bucket: sortBucket(),
            sort_key: sortKey(sort_mode),
          })
          .from(transactionsTable)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(...orderByFor(sort_mode))
          .limit(page_limit + 1),
        countMatching(this.db, view, show_employees),
      ]);

      const { pageRows, next_cursor } = this.sliceToPage(rows, page_limit, sort_mode, view, show_employees);

      return {
        // Ensure transaction_id is never null
        transactions: pageRows.map((row) => ({
          ...row.transaction,
          transaction_id: row.transaction.transaction_id || "",
        })),
        next_cursor,
        total,
      };
    } catch (error) {
      logger.error(`Error finding all transactions: ${error}`);
      throw error;
    }
  }

  async findAllAggregate({
    page_limit,
    cursor = null,
    view = null,
    show_employees = false,
  }: ListTransactionsOptions): Promise<TransactionPage<AggTransaction>> {
    try {
      const sort_mode = sortModeForView(view);
      const conditions = buildListConditions(view, show_employees);
      if (cursor) {
        conditions.push(keysetCondition(cursor));
      }

      const [rows, total] = await Promise.all([
        this.db
          .select({
            transaction: transactionsTable,
            bike: bikesTable,
            customer: customersTable,
            bucket: sortBucket(),
            sort_key: sortKey(sort_mode),
          })
          .from(transactionsTable)
          .leftJoin(bikesTable, eq(transactionsTable.bike_id, bikesTable.bike_id))
          .leftJoin(customersTable, eq(transactionsTable.customer_id, customersTable.customer_id))
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(...orderByFor(sort_mode))
          .limit(page_limit + 1),
        countMatching(this.db, view, show_employees),
      ]);

      const { pageRows, next_cursor } = this.sliceToPage(rows, page_limit, sort_mode, view, show_employees);

      // Transform the results to match the expected AggTransaction structure
      const transactions = await Promise.all(
        pageRows.map(async (row) => {
          const { transaction, bike, customer } = row;

          // Get all order requests for this transaction in a separate query
          const orderRequests = await this.db
            .select()
            .from(orderRequestsTable)
            .where(eq(orderRequestsTable.transaction_id, transaction.transaction_id || ""));

          // Ensure transaction_id is never null
          return {
            ...transaction,
            transaction_id: transaction.transaction_id || "",
            Bike: bike
              ? {
                  ...bike,
                  size_cm: bike.size_cm != null ? Number(bike.size_cm) : null,
                  price: bike.price != null ? Number(bike.price) : null,
                  weight_kg: bike.weight_kg != null ? Number(bike.weight_kg) : null,
                  deposit_amount: bike.deposit_amount != null ? Number(bike.deposit_amount) : null,
                }
              : bike,
            Customer: customer,
            OrderRequests: orderRequests.length > 0 ? orderRequests : null,
          } as unknown as AggTransaction;
        }),
      );

      return { transactions, next_cursor, total };
    } catch (error) {
      logger.error(`Error finding all aggregate transactions: ${error}`);
      throw error;
    }
  }

  /**
   * Trims the extra look-ahead row off a page and derives the cursor for the
   * next one. A cursor is only issued when another page actually exists.
   */
  private sliceToPage<T extends SortedRow>(
    rows: T[],
    page_limit: number,
    sort_mode: TransactionSortMode,
    view: TransactionView | null,
    show_employees: boolean,
  ): { pageRows: T[]; next_cursor: string | null } {
    const hasMore = rows.length > page_limit;
    const pageRows = hasMore ? rows.slice(0, page_limit) : rows;
    const lastRow = pageRows[pageRows.length - 1];
    return {
      pageRows,
      next_cursor: hasMore && lastRow ? buildCursorFromRow(lastRow, sort_mode, view, show_employees) : null,
    };
  }

  async findByIdAggregate(transaction_id: string): Promise<AggTransaction | null> {
    try {
      const result = await this.db
        .select({
          transaction: transactionsTable,
          bike: bikesTable,
          customer: customersTable,
          // Removed ARRAY_AGG with invalid syntax - orderRequests are queried separately below
        })
        .from(transactionsTable)
        .leftJoin(bikesTable, eq(transactionsTable.bike_id, bikesTable.bike_id))
        .leftJoin(customersTable, eq(transactionsTable.customer_id, customersTable.customer_id))
        .where(eq(transactionsTable.transaction_id, transaction_id));

      if (result.length === 0) {
        return null;
      }

      const { transaction, bike, customer } = result[0];

      // Get all order requests for this transaction in a separate query
      const orderRequests = await this.db
        .select()
        .from(orderRequestsTable)
        .where(eq(orderRequestsTable.transaction_id, transaction.transaction_id || ""));

      // Ensure transaction_id is never null
      return {
        ...transaction,
        transaction_id: transaction.transaction_id || "",
        Bike: bike
          ? {
              ...bike,
              size_cm: bike.size_cm != null ? Number(bike.size_cm) : null,
              price: bike.price != null ? Number(bike.price) : null,
              weight_kg: bike.weight_kg != null ? Number(bike.weight_kg) : null,
              deposit_amount: bike.deposit_amount != null ? Number(bike.deposit_amount) : null,
            }
          : bike,
        Customer: customer,
        OrderRequests: orderRequests.length > 0 ? orderRequests : null,
      } as unknown as AggTransaction;
    } catch (error) {
      logger.error(`Error finding transaction by ID: ${error}`);
      throw error;
    }
  }

  async createTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      // Ensure transaction has an ID if not provided
      const transactionWithId = {
        ...transaction,
        transaction_id: transaction.transaction_id || uuidv4(),
        date_created: transaction.date_created || new Date(),
      };

      const isEmployee = transactionWithId.customer_id ? await this.isEmployee(transactionWithId.customer_id) : false;

      const result = await this.db
        .insert(transactionsTable)
        .values({ ...transactionWithId, is_employee: isEmployee })
        .returning();

      // Ensure transaction_id is never null
      return {
        ...result[0],
        transaction_id: result[0].transaction_id || "",
      };
    } catch (error) {
      logger.error(`Error creating transaction: ${error}`);
      throw error;
    }
  }

  async deleteById(transaction_id: string): Promise<Transaction> {
    try {
      const result = await this.db
        .delete(transactionsTable)
        .where(eq(transactionsTable.transaction_id, transaction_id))
        .returning();

      if (result.length === 0) {
        throw new Error(`Transaction with ID ${transaction_id} not found`);
      }

      // Ensure transaction_id is never null
      return {
        ...result[0],
        transaction_id: result[0].transaction_id || "",
      };
    } catch (error) {
      logger.error(`Error deleting transaction: ${error}`);
      throw error;
    }
  }

  async updateById(transaction_id: string, transactionUpdate: UpdateTransaction): Promise<Transaction> {
    try {
      // If transactionUpdate is from a request body schema, extract just the body
      const rawUpdate = transactionUpdate.body ? transactionUpdate.body : (transactionUpdate as any);
      const updateData: any = { ...rawUpdate };

      // Do not allow updates to date_created
      if ("date_created" in updateData) {
        updateData.date_created = undefined;
      }

      // Coerce date_completed to a Date instance if provided as string/number
      if ("date_completed" in updateData) {
        const v = updateData.date_completed;
        if (v !== null && !(v instanceof Date)) {
          if (typeof v === "string" || typeof v === "number") {
            const d = new Date(v);
            if (!Number.isNaN(d.getTime())) {
              updateData.date_completed = d;
            }
          }
        }
      }

      if ("customer_id" in updateData) {
        updateData.is_employee = await this.isEmployee(updateData.customer_id);
      }

      const result = await this.db
        .update(transactionsTable)
        .set(updateData as any)
        .where(eq(transactionsTable.transaction_id, transaction_id))
        .returning();

      if (result.length === 0) {
        throw new Error(`Transaction with ID ${transaction_id} not found`);
      }

      // Ensure transaction_id is never null
      return {
        ...result[0],
        transaction_id: result[0].transaction_id || "",
      };
    } catch (error) {
      logger.error(`Error updating transaction: ${error}`);
      throw error;
    }
  }

  async getTransactionsSummary(): Promise<TransactionsSummary> {
    try {
      // Count incomplete non-beer-bike transactions
      const incompleteCount = await this.db
        .select({ count: sql`count(*)` })
        .from(transactionsTable)
        .where(and(eq(transactionsTable.is_completed, false), eq(transactionsTable.is_beer_bike, false)));

      // Count incomplete beer bike transactions
      const beerBikeCount = await this.db
        .select({ count: sql`count(*)` })
        .from(transactionsTable)
        .where(and(eq(transactionsTable.is_completed, false), eq(transactionsTable.is_beer_bike, true)));

      // Count completed but unpaid transactions
      const waitingPickupCount = await this.db
        .select({ count: sql`count(*)` })
        .from(transactionsTable)
        .where(and(eq(transactionsTable.is_completed, true), eq(transactionsTable.is_paid, false)));

      const summary: TransactionsSummary = {
        quantity_incomplete: Number(incompleteCount[0]?.count) || 0,
        quantity_beer_bike_incomplete: Number(beerBikeCount[0]?.count) || 0,
        quantity_waiting_on_pickup: Number(waitingPickupCount[0]?.count) || 0,
        quantity_waiting_on_safety_check: 0, // TODO: implement this when needed
      };

      return summary;
    } catch (error) {
      logger.error(`Error getting transactions summary: ${error}`);
      throw error;
    }
  }

  private async isEmployee(customer_id: string): Promise<boolean> {
    const [customer] = await this.db
      .select()
      .from(customersTable)
      .where(eq(customersTable.customer_id, customer_id))
      .limit(1);
    if (!customer || !customer.email) {
      return false;
    }
    const username = customer.email.split("@")[0];
    const employeeResult = username
      ? await this.db
          .select({ id: usersTable.user_id })
          .from(usersTable)
          .where(eq(usersTable.username, username))
          .limit(1)
      : [];
    return employeeResult.length > 0;
  }
}

// Export the TransactionRepositoryDrizzle class as default
export default TransactionRepositoryDrizzle;
