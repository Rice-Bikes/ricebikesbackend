/**
 * Transaction Repository Implementation with Drizzle ORM
 */
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { sql as sqlTag } from "drizzle-orm";
import { bikes } from "../../db/schema/bikes";
import { customers } from "../../db/schema/customers";
import { transactions } from "../../db/schema/transactions";
import { transactionDetails } from "../../db/schema/transactions";
import type { DrizzleDB } from "../factory";
import type {
  Bike,
  Customer,
  Transaction,
  TransactionCreateInput,
  TransactionRepository,
  TransactionUpdateInput,
  TransactionWithDetails,
} from "../interfaces";

export class TransactionRepositoryDrizzle implements TransactionRepository {
  constructor(private readonly db: DrizzleDB) {}

  async findAll(): Promise<Transaction[]> {
    const result = await this.db.select().from(transactions);
    // Ensure all returned transactions are properly mapped and have non-null transaction_id
    return result.map((record) => this.mapToTransaction(record));
  }

  async findById(id: string): Promise<Transaction | null> {
    const result = await this.db.select().from(transactions).where(eq(transactions.transaction_id, id));

    return result.length ? this.mapToTransaction(result[0]) : null;
  }

  async findByCustomerId(customerId: string): Promise<Transaction[]> {
    const result = await this.db
      .select()
      .from(transactions)
      .where(eq(transactions.customer_id, customerId))
      .orderBy(asc(transactions.date_created));

    return result.map((record) => this.mapToTransaction(record));
  }

  async findWithDetails(id: string): Promise<TransactionWithDetails | null> {
    const result = await this.db
      .select({
        transaction: transactions,
        customer: customers,
        bike: bikes,
      })
      .from(transactions)
      .where(eq(transactions.transaction_id, id))
      .leftJoin(customers, eq(transactions.customer_id, customers.customer_id))
      .leftJoin(bikes, eq(transactions.bike_id, bikes.bike_id));

    if (!result.length) {
      return null;
    }

    // Get transaction details separately
    const details = await this.db.select().from(transactionDetails).where(eq(transactionDetails.transaction_id, id));

    // Construct the combined result
    if (!result.length) {
      return null;
    }

    const { transaction, customer, bike } = result[0];

    // Map database records to proper types
    return {
      ...this.mapToTransaction(transaction),
      customer: this.mapToCustomer(customer),
      bike: bike ? this.mapToBike(bike) : null,
      transactionDetails: details,
    };
  }

  async findIncomplete(): Promise<Transaction[]> {
    const result = await this.db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.date_created))
      .where(eq(transactions.is_completed, false));

    return result.map((record) => this.mapToTransaction(record));
  }

  async findCompleted(): Promise<Transaction[]> {
    const result = await this.db
      .select()
      .from(transactions)
      .where(eq(transactions.is_completed, true))
      .orderBy(desc(transactions.date_created));

    return result.map((record) => this.mapToTransaction(record));
  }

  async getTotalSalesAmount(): Promise<number> {
    const result = await this.db
      .select({
        total: sqlTag`SUM(${transactions.total_cost})`,
      })
      .from(transactions)
      .where(and(eq(transactions.is_completed, true), eq(transactions.is_paid, true)));

    return Number(result[0].total) || 0;
  }

  async create(data: TransactionCreateInput): Promise<Transaction> {
    // Ensure required fields are present and properly formatted
    const transactionData = {
      ...data,
      date_created: data.date_created || new Date(),
    };

    // Insert the transaction
    const result = await this.db
      .insert(transactions)
      .values(transactionData as any)
      .returning();

    if (!result[0].transaction_id) {
      throw new Error("Failed to create transaction: missing transaction_id");
    }

    // Ensure we're returning a valid Transaction with non-null transaction_id
    if (!result[0]) {
      throw new Error("Failed to create transaction");
    }

    return this.mapToTransaction(result[0]);
  }

  async update(id: string, data: TransactionUpdateInput): Promise<Transaction | null> {
    // Make sure we don't try to update protected fields
    const { date_created, transaction_id, transaction_num, ...updateData } = data as any;

    // Add updatedAt timestamp if your schema supports it
    const dataToUpdate = {
      ...updateData,
      // If you have an updated_at field, uncomment the line below
      // updated_at: new Date()
    };

    const result = await this.db
      .update(transactions)
      .set(dataToUpdate)
      .where(eq(transactions.transaction_id, id))
      .returning();

    return result.length ? this.mapToTransaction(result[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    try {
      // First check if transaction exists
      const existing = await this.findById(id);
      if (!existing) {
        return false;
      }

      const result = await this.db.delete(transactions).where(eq(transactions.transaction_id, id)).returning();

      return result.length > 0;
    } catch (error) {
      console.error(`Error deleting transaction ${id}:`, error);
      return false;
    }
  }

  async count(): Promise<number> {
    const result = await this.db.select({ count: sqlTag`count(*)` }).from(transactions);

    return Number(result[0].count);
  }

  // Helper methods to ensure type compatibility
  private mapToTransaction(record: any): Transaction {
    if (!record) return record;

    return {
      transaction_id: record.transaction_id || "", // Ensure it's never null
      transaction_num: Number(record.transaction_num),
      date_created: record.date_created,
      transaction_type: record.transaction_type,
      customer_id: record.customer_id,
      bike_id: record.bike_id || null, // Match expected type in interface
      total_cost: Number(record.total_cost),
      is_completed: Boolean(record.is_completed),
      is_paid: Boolean(record.is_paid),
      is_refurb: Boolean(record.is_refurb),
      is_urgent: Boolean(record.is_urgent),
      is_beer_bike: Boolean(record.is_beer_bike),
      is_employee: Boolean(record.is_employee),
      is_reserved: Boolean(record.is_reserved),
      description: record.description || null, // Make consistent with expected type
      date_completed: record.date_completed || null, // Make consistent with expected type
      is_waiting_on_email: Boolean(record.is_waiting_on_email),
      is_nuclear: record.is_nuclear !== null ? Boolean(record.is_nuclear) : null, // Handle potential null field
    };
  }

  private mapToCustomer(record: any): Customer {
    if (!record) return {} as Customer;

    return {
      customer_id: record.customer_id || "",
      first_name: record.first_name,
      last_name: record.last_name,
      email: record.email,
      phone: record.phone,
    };
  }

  private mapToBike(record: any): Bike {
    if (!record) return {} as Bike;

    return {
      bike_id: record.bike_id || "",
      make: record.make,
      model: record.model,
      date_created: record.date_created,
      description: record.description,
      bike_type: record.bike_type,
      size_cm: record.size_cm !== null ? Number(record.size_cm) : null,
      condition: record.condition,
      price: record.price !== null ? Number(record.price) : null,
      is_available: Boolean(record.is_available),
      weight_kg: record.weight_kg !== null ? Number(record.weight_kg) : null,
    };
  }
}
