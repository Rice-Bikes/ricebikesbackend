/**
 * Transaction Repository - Drizzle Implementation
 *
 * This file implements the Transaction repository interface using Drizzle ORM.
 */

import { and, asc, desc, eq, lt, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
// @ts-ignore
import { v4 as uuidv4 } from "uuid";

import { serviceLogger as logger } from "@/common/utils/logger";
import { db as drizzleDb } from "@/db/client";
import type * as schema from "@/db/schema";
import { bikes as bikesTable } from "@/db/schema/bikes";
import { customers as customersTable } from "@/db/schema/customers";
import { orderRequests as orderRequestsTable, transactions as transactionsTable } from "@/db/schema/transactions";
import type { AggTransaction, Transaction, TransactionsSummary, UpdateTransaction } from "./transactionModel";

export class TransactionRepositoryDrizzle {
  private db: PostgresJsDatabase<typeof schema>;

  constructor(db = drizzleDb) {
    this.db = db;
  }

  async findAll(after_id: number, page_limit: number): Promise<Transaction[]> {
    try {
      const transactions = await this.db
        .select()
        .from(transactionsTable)
        .where(
          and(
            lt(transactionsTable.transaction_num, after_id),
            eq(transactionsTable.is_completed, false),
            eq(transactionsTable.is_paid, false),
          ),
        )
        .orderBy(desc(transactionsTable.is_urgent), desc(transactionsTable.transaction_num))
        .limit(page_limit);

      // Ensure transaction_id is never null
      return transactions.map((tx) => ({
        ...tx,
        transaction_id: tx.transaction_id || "",
      }));
    } catch (error) {
      logger.error(`Error finding all transactions: ${error}`);
      throw error;
    }
  }

  async findAllAggregate(after_id: number, page_limit: number): Promise<AggTransaction[]> {
    try {
      const transactions = await this.db
        .select({
          transaction: transactionsTable,
          bike: bikesTable,
          customer: customersTable,
        })
        .from(transactionsTable)
        .leftJoin(bikesTable, eq(transactionsTable.bike_id, bikesTable.bike_id))
        .leftJoin(customersTable, eq(transactionsTable.customer_id, customersTable.customer_id))
        .where(lt(transactionsTable.transaction_num, after_id))
        .orderBy(
          desc(transactionsTable.is_urgent),
          desc(transactionsTable.is_beer_bike),
          asc(transactionsTable.transaction_num),
        )
        .limit(page_limit);

      // Transform the results to match the expected AggTransaction structure
      return await Promise.all(
        transactions.map(async (row) => {
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
    } catch (error) {
      logger.error(`Error finding all aggregate transactions: ${error}`);
      throw error;
    }
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

      const result = await this.db
        .insert(transactionsTable)
        .values(transactionWithId as any)
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
      const updateData = transactionUpdate.body ? transactionUpdate.body : transactionUpdate;

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
}

// Export the TransactionRepositoryDrizzle class as default
export default TransactionRepositoryDrizzle;
