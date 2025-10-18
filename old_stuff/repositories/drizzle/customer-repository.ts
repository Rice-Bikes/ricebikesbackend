/**
 * Customer Repository Implementation with Drizzle ORM
 */
import { eq, sql } from "drizzle-orm";
import { customers } from "../../db/schema/customers";
import { transactions } from "../../db/schema/transactions";
import type { DrizzleDB } from "../factory";
import type {
  Customer,
  CustomerCreateInput,
  CustomerRepository,
  CustomerUpdateInput,
  CustomerWithTransactions,
} from "../interfaces";

export class CustomerRepositoryDrizzle implements CustomerRepository {
  constructor(private readonly db: DrizzleDB) {}

  async findAll(): Promise<Customer[]> {
    return this.db.select().from(customers);
  }

  async findById(id: string): Promise<Customer | null> {
    const result = await this.db.select().from(customers).where(eq(customers.customer_id, id));

    return result.length ? result[0] : null;
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const result = await this.db.select().from(customers).where(eq(customers.email, email));

    return result.length ? result[0] : null;
  }

  async findWithTransactions(id: string): Promise<CustomerWithTransactions | null> {
    const customerResult = await this.db.select().from(customers).where(eq(customers.customer_id, id));

    if (!customerResult.length) {
      return null;
    }

    const customer = customerResult[0];

    // Get transactions separately
    const transactionsResult = await this.db.select().from(transactions).where(eq(transactions.customer_id, id));

    return {
      ...customer,
      transactions: transactionsResult.map((tx) => ({
        ...tx,
        transaction_id: tx.transaction_id || "",
      })),
    };
  }

  async create(data: CustomerCreateInput): Promise<Customer> {
    const result = await this.db.insert(customers).values(data).returning();

    return result[0];
  }

  async update(id: string, data: CustomerUpdateInput): Promise<Customer | null> {
    const result = await this.db.update(customers).set(data).where(eq(customers.customer_id, id)).returning();

    return result.length ? result[0] : null;
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.db.delete(customers).where(eq(customers.customer_id, id)).returning();

      return result.length > 0;
    } catch (error) {
      return false;
    }
  }

  async count(): Promise<number> {
    const result = await this.db.select({ count: sql`count(*)` }).from(customers);

    return Number(result[0].count);
  }
}
