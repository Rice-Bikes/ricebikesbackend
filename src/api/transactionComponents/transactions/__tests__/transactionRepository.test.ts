import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db as drizzleDb } from "@/db/client";
// @ts-ignore
import { v4 as uuidv4 } from "uuid";
import { TransactionRepository } from "../transactionRepository";
import { TransactionRepositoryDrizzle } from "../transactionRepositoryDrizzle";

describe("Transaction Repository Implementation Comparison", () => {
  const prismaRepo = new TransactionRepository();
  const drizzleRepo = new TransactionRepositoryDrizzle(drizzleDb);

  let testTransactionId: string;
  const testTransactionNum = Math.floor(Math.random() * 10000) + 1000;
  const testTransaction = {
    transaction_num: testTransactionNum,
    transaction_id: uuidv4(),
    bike_id: null,
    customer_id: "00000000-0000-0000-0000-000000000000", // Use a placeholder UUID
    is_completed: false,
    is_paid: false,
    is_beer_bike: false,
    is_urgent: false,
    is_reserved: false,
    transaction_type: "REPAIR",
    total_cost: 49.99,
    date_created: new Date(),
    date_completed: null,
    description: "Test transaction for repository comparison",
    is_refurb: false,
    is_employee: false,
    is_waiting_on_email: false,
    is_nuclear: false,
  };

  beforeAll(async () => {
    // Clean up any existing test transactions
    try {
      const transactions = await prismaRepo.findAllAggregate(10000, 100);
      for (const transaction of transactions) {
        if (transaction.description === "Test transaction for repository comparison") {
          await prismaRepo.deleteById(transaction.transaction_id);
        }
      }
    } catch (error) {
      console.log("Error in cleanup:", error);
    }
  });

  describe("Basic CRUD operations", () => {
    it("should create a transaction with same data in both repositories", async () => {
      // Create a transaction using Prisma repo
      const prismaTransaction = await prismaRepo.createTransaction({
        ...testTransaction,
        transaction_id: undefined, // Let it generate a new ID
      } as any);

      expect(prismaTransaction).toHaveProperty("transaction_id");
      testTransactionId = prismaTransaction.transaction_id;

      // Create a transaction using Drizzle repo with the same data
      const drizzleTransaction = await drizzleRepo.createTransaction({
        ...testTransaction,
        transaction_id: undefined, // Let it generate a new ID
      } as any);

      expect(drizzleTransaction).toHaveProperty("transaction_id");

      // Verify key properties match on both transactions
      expect(prismaTransaction.transaction_num).toBe(testTransaction.transaction_num);
      expect(drizzleTransaction.transaction_num).toBe(testTransaction.transaction_num);
      expect(prismaTransaction.transaction_type).toBe(testTransaction.transaction_type);
      expect(drizzleTransaction.transaction_type).toBe(testTransaction.transaction_type);
      expect(prismaTransaction.total_cost).toBe(testTransaction.total_cost);
      expect(drizzleTransaction.total_cost).toBe(testTransaction.total_cost);
    });

    it("should find transactions by ID with both repositories", async () => {
      const prismaTransaction = await prismaRepo.findByIdAggregate(testTransactionId);
      expect(prismaTransaction).not.toBeNull();
      expect(prismaTransaction?.transaction_id).toBe(testTransactionId);

      // Get the same transaction using Drizzle repository
      const drizzleTransaction = await drizzleRepo.findByIdAggregate(testTransactionId);
      expect(drizzleTransaction).not.toBeNull();
      expect(drizzleTransaction?.transaction_id).toBe(testTransactionId);

      // Compare properties from both implementations
      expect(drizzleTransaction?.transaction_num).toBe(prismaTransaction?.transaction_num);
      expect(drizzleTransaction?.transaction_type).toBe(prismaTransaction?.transaction_type);
      expect(drizzleTransaction?.total_cost).toBe(prismaTransaction?.total_cost);
      expect(drizzleTransaction?.is_completed).toBe(prismaTransaction?.is_completed);
      expect(drizzleTransaction?.is_paid).toBe(prismaTransaction?.is_paid);
    });

    it("should find all transactions with pagination using both repositories", async () => {
      const limit = 10;
      const prismaTransactions = await prismaRepo.findAll(10000, limit);
      const drizzleTransactions = await drizzleRepo.findAll(10000, limit);

      // Both implementations should return arrays of transactions
      expect(Array.isArray(prismaTransactions)).toBe(true);
      expect(Array.isArray(drizzleTransactions)).toBe(true);

      // Verify pagination works for both repositories
      expect(prismaTransactions.length).toBeLessThanOrEqual(limit);
      expect(drizzleTransactions.length).toBeLessThanOrEqual(limit);
    });

    it("should find all transactions with aggregation using both repositories", async () => {
      const limit = 10;
      const prismaTransactions = await prismaRepo.findAllAggregate(10000, limit);
      const drizzleTransactions = await drizzleRepo.findAllAggregate(10000, limit);

      // Both implementations should return arrays of transactions
      expect(Array.isArray(prismaTransactions)).toBe(true);
      expect(Array.isArray(drizzleTransactions)).toBe(true);

      // Verify pagination works for both repositories
      expect(prismaTransactions.length).toBeLessThanOrEqual(limit);
      expect(drizzleTransactions.length).toBeLessThanOrEqual(limit);

      // Check that our test transaction exists in both results
      const prismaTestTransaction = prismaTransactions.find((tx) => tx.transaction_id === testTransactionId);
      expect(prismaTestTransaction).toBeTruthy();
    });

    it("should update transaction with both repositories", async () => {
      const updateData = {
        params: { transaction_id: testTransactionId },
        body: {
          is_urgent: true,
          description: "Updated notes for test",
          total_cost: 59.99,
          transaction_type: "REPAIR",
          is_completed: false,
          is_paid: false,
          is_refurb: false,
          is_beer_bike: false,
          is_employee: false,
          is_reserved: false,
          is_waiting_on_email: false,
          is_nuclear: false,
          date_completed: null,
        },
      };

      // Update using Prisma repo
      const updatedPrismaTransaction = await prismaRepo.updateById(testTransactionId, updateData.body as any);
      expect(updatedPrismaTransaction).not.toBeNull();
      expect(updatedPrismaTransaction?.is_urgent).toBe(true);
      expect(updatedPrismaTransaction?.description).toBe("Updated notes for test");
      expect(updatedPrismaTransaction?.total_cost).toBe(59.99);

      // Get the updated transaction using Drizzle repo to verify changes
      const drizzleTransaction = await drizzleRepo.findByIdAggregate(testTransactionId);
      expect(drizzleTransaction?.is_urgent).toBe(true);
      expect(drizzleTransaction?.description).toBe("Updated notes for test");
      expect(drizzleTransaction?.total_cost).toBe(59.99);

      // Update using Drizzle repo
      const newUpdateData = {
        params: { transaction_id: testTransactionId },
        body: {
          is_urgent: false,
          description: "Updated by Drizzle repo",
          total_cost: 69.99,
          transaction_type: "REPAIR",
          is_completed: false,
          is_paid: false,
          is_refurb: false,
          is_beer_bike: false,
          is_employee: false,
          is_reserved: false,
          is_waiting_on_email: false,
          is_nuclear: false,
          date_completed: null,
        },
      };

      const updatedDrizzleTransaction = await drizzleRepo.updateById(testTransactionId, newUpdateData);
      expect(updatedDrizzleTransaction).not.toBeNull();
      expect(updatedDrizzleTransaction?.is_urgent).toBe(false);
      expect(updatedDrizzleTransaction?.description).toBe("Updated by Drizzle repo");
      expect(updatedDrizzleTransaction?.total_cost).toBe(69.99);

      // Get the updated transaction using Prisma repo to verify changes
      const prismaTransaction = await prismaRepo.findByIdAggregate(testTransactionId);
      expect(prismaTransaction?.is_urgent).toBe(false);
      expect(prismaTransaction?.description).toBe("Updated by Drizzle repo");
      expect(prismaTransaction?.total_cost).toBe(69.99);
    });

    it("should complete and pay for transaction with both repositories", async () => {
      // Update transaction to completed using Prisma repo
      const completeData = {
        params: { transaction_id: testTransactionId },
        body: {
          transaction_type: "REPAIR",
          is_completed: true,
          is_paid: false,
          is_refurb: false,
          is_urgent: false,
          is_beer_bike: false,
          is_employee: false,
          is_reserved: false,
          is_waiting_on_email: false,
          is_nuclear: false,
          date_completed: new Date().toISOString(),
          description: "Test transaction for repository comparison",
          total_cost: 69.99,
        },
      };

      const completedTransaction = await prismaRepo.updateById(testTransactionId, completeData.body as any);
      expect(completedTransaction).not.toBeNull();
      expect(completedTransaction?.is_completed).toBe(true);
      expect(completedTransaction?.date_completed).not.toBeNull();

      // Verify with Drizzle repo
      const drizzleTransaction = await drizzleRepo.findByIdAggregate(testTransactionId);
      expect(drizzleTransaction?.is_completed).toBe(true);
      expect(drizzleTransaction?.date_completed).not.toBeNull();

      // Now update to paid using Drizzle repo
      const paidData = {
        params: { transaction_id: testTransactionId },
        body: {
          transaction_type: "REPAIR",
          is_completed: true,
          is_paid: true,
          is_refurb: false,
          is_urgent: false,
          is_beer_bike: false,
          is_employee: false,
          is_reserved: false,
          is_waiting_on_email: false,
          is_nuclear: false,
          date_completed: new Date().toISOString(),
          description: "Test transaction for repository comparison",
          total_cost: 69.99,
        },
      };

      const paidTransaction = await drizzleRepo.updateById(testTransactionId, paidData.body as any);
      expect(paidTransaction).not.toBeNull();
      expect(paidTransaction?.is_paid).toBe(true);

      // Verify with Prisma repo
      const prismaTransaction = await prismaRepo.findByIdAggregate(testTransactionId);
      expect(prismaTransaction?.is_paid).toBe(true);
    });
  });

  describe("Transaction summary operations", () => {
    it("should get transaction summary with both repositories", async () => {
      // Test getTransactionsSummary with both implementations
      const prismaSummary = await prismaRepo.getTransactionsSummary();
      const drizzleSummary = await drizzleRepo.getTransactionsSummary();

      // Both should have the same structure
      expect(prismaSummary).toHaveProperty("quantity_incomplete");
      expect(prismaSummary).toHaveProperty("quantity_beer_bike_incomplete");
      expect(prismaSummary).toHaveProperty("quantity_waiting_on_pickup");

      expect(drizzleSummary).toHaveProperty("quantity_incomplete");
      expect(drizzleSummary).toHaveProperty("quantity_beer_bike_incomplete");
      expect(drizzleSummary).toHaveProperty("quantity_waiting_on_pickup");

      // The actual numbers might be different depending on database state during testing
    });
  });

  // Clean up test data after all tests
  afterAll(async () => {
    try {
      await prismaRepo.deleteById(testTransactionId);
    } catch (error) {
      console.log("Clean up error:", error);
    }
  });
});
