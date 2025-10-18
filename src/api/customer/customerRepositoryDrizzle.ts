import type { Customer } from "@/api/customer/customerModel";
import { serviceLogger as logger } from "@/common/utils/logger";
import { db } from "@/db/client";
import { customers } from "@/db/schema/customers";
import { desc, eq } from "drizzle-orm";

export class CustomersRepositoryDrizzle {
  /**
   * Find all customers with distinct emails
   */
  async findAllAsync(): Promise<Customer[]> {
    try {
      // Note: Drizzle doesn't have a direct 'distinct' operator like Prisma
      // We'll need to handle distinct emails in the application layer
      const allCustomers = await db.select().from(customers);

      // Create a map to store unique customers by email
      const uniqueCustomersMap = new Map<string, Customer>();

      // Iterate through all customers and keep only the latest entry for each email
      for (const customer of allCustomers) {
        if (!uniqueCustomersMap.has(customer.email)) {
          uniqueCustomersMap.set(customer.email, customer);
        }
      }

      // Convert map values to array
      return Array.from(uniqueCustomersMap.values());
    } catch (error) {
      logger.error(`[CustomersRepositoryDrizzle] findAllAsync error: ${error}`);
      throw error;
    }
  }

  /**
   * Find customer by ID
   */
  async findByIdAsync(customer_id: string): Promise<Customer | null> {
    try {
      const result = await db.select().from(customers).where(eq(customers.customer_id, customer_id)).limit(1);

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      logger.error(`[CustomersRepositoryDrizzle] findByIdAsync error: ${error}`);
      throw error;
    }
  }

  /**
   * Create a new customer
   */
  async create(customer: Customer): Promise<Customer> {
    try {
      const result = await db.insert(customers).values(customer).returning();

      return result[0];
    } catch (error) {
      logger.error(`[CustomersRepositoryDrizzle] create error: ${error}`);
      throw error;
    }
  }

  /**
   * Update an existing customer
   */
  async update(customer: Customer): Promise<Customer> {
    try {
      const result = await db
        .update(customers)
        .set(customer)
        .where(eq(customers.customer_id, customer.customer_id))
        .returning();

      if (result.length === 0) {
        throw new Error(`Customer with ID ${customer.customer_id} not found`);
      }

      return result[0];
    } catch (error) {
      logger.error(`[CustomersRepositoryDrizzle] update error: ${error}`);
      throw error;
    }
  }

  /**
   * Find customer by email
   */
  async findByEmail(email: string): Promise<Customer | null> {
    try {
      const result = await db.select().from(customers).where(eq(customers.email, email)).limit(1);

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      logger.error(`[CustomersRepositoryDrizzle] findByEmail error: ${error}`);
      throw error;
    }
  }
}
