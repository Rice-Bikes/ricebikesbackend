/**
 * Repository Comparison Utility
 *
 * This script compares the results from Prisma and Drizzle repositories
 * to help verify the migration is working correctly.
 */

import { PrismaClient } from "@prisma/client";
import { db } from "../db/client";

// Import repository implementations
import {
  BikeRepositoryPrisma,
  CustomerRepositoryPrisma,
  ItemRepositoryPrisma,
  RepairRepositoryPrisma,
  TransactionRepositoryPrisma,
  UserRepositoryPrisma,
} from "./prisma";

import {
  BikeRepositoryDrizzle,
  CustomerRepositoryDrizzle,
  ItemRepositoryDrizzle,
  RepairRepositoryDrizzle,
  TransactionRepositoryDrizzle,
  UserRepositoryDrizzle,
} from "./drizzle";

// Initialize clients and repositories
const prisma = new PrismaClient();
const userPrisma = new UserRepositoryPrisma(prisma);
const userDrizzle = new UserRepositoryDrizzle(db);
const transactionPrisma = new TransactionRepositoryPrisma(prisma);
const transactionDrizzle = new TransactionRepositoryDrizzle(db);
const customerPrisma = new CustomerRepositoryPrisma(prisma);
const customerDrizzle = new CustomerRepositoryDrizzle(db);
const bikePrisma = new BikeRepositoryPrisma(prisma);
const bikeDrizzle = new BikeRepositoryDrizzle(db);
const itemPrisma = new ItemRepositoryPrisma(prisma);
const itemDrizzle = new ItemRepositoryDrizzle(db);
const repairPrisma = new RepairRepositoryPrisma(prisma);
const repairDrizzle = new RepairRepositoryDrizzle(db);

/**
 * Compare a single user between Prisma and Drizzle
 */
async function compareUser(userId: string): Promise<void> {
  console.log(`\n🔍 Comparing user with ID: ${userId}`);

  const prismaResult = await userPrisma.findById(userId);
  const drizzleResult = await userDrizzle.findById(userId);

  console.log("Prisma result:", prismaResult);
  console.log("Drizzle result:", drizzleResult);

  if (!prismaResult || !drizzleResult) {
    console.log("❌ One of the repositories returned no result");
    return;
  }

  const fieldsMatch =
    prismaResult.user_id === drizzleResult.user_id &&
    prismaResult.firstname === drizzleResult.firstname &&
    prismaResult.lastname === drizzleResult.lastname &&
    prismaResult.username === drizzleResult.username &&
    prismaResult.active === drizzleResult.active;

  console.log(fieldsMatch ? "✅ Results match" : "❌ Results differ");
}

/**
 * Compare a single transaction between Prisma and Drizzle
 */
async function compareTransaction(transactionId: string): Promise<void> {
  console.log(`\n🔍 Comparing transaction with ID: ${transactionId}`);

  const prismaResult = await transactionPrisma.findById(transactionId);
  const drizzleResult = await transactionDrizzle.findById(transactionId);

  console.log("Prisma result:", prismaResult ? "Found" : "Not found");
  console.log("Drizzle result:", drizzleResult ? "Found" : "Not found");

  if (!prismaResult || !drizzleResult) {
    console.log("❌ One of the repositories returned no result");
    return;
  }

  const fieldsMatch =
    prismaResult.transaction_id === drizzleResult.transaction_id &&
    prismaResult.transaction_type === drizzleResult.transaction_type &&
    prismaResult.customer_id === drizzleResult.customer_id &&
    prismaResult.total_cost === drizzleResult.total_cost &&
    prismaResult.is_completed === drizzleResult.is_completed &&
    prismaResult.is_paid === drizzleResult.is_paid;

  console.log(fieldsMatch ? "✅ Results match" : "❌ Results differ");
}

/**
 * Compare transaction totals between Prisma and Drizzle
 */
async function compareTransactionTotals(): Promise<void> {
  console.log("\n🔍 Comparing transaction totals");

  const prismaTotal = await transactionPrisma.getTotalSalesAmount();
  const drizzleTotal = await transactionDrizzle.getTotalSalesAmount();

  console.log("Prisma total sales:", prismaTotal);
  console.log("Drizzle total sales:", drizzleTotal);
  console.log(prismaTotal === drizzleTotal ? "✅ Totals match" : "❌ Totals differ");
}

/**
 * Compare counts between Prisma and Drizzle
 */
async function compareCounts(): Promise<void> {
  console.log("\n🔍 Comparing record counts");

  const prismaUserCount = await userPrisma.count();
  const drizzleUserCount = await userDrizzle.count();

  console.log("Prisma user count:", prismaUserCount);
  console.log("Drizzle user count:", drizzleUserCount);
  console.log(prismaUserCount === drizzleUserCount ? "✅ User counts match" : "❌ User counts differ");

  const prismaTransactionCount = await transactionPrisma.count();
  const drizzleTransactionCount = await transactionDrizzle.count();

  console.log("Prisma transaction count:", prismaTransactionCount);
  console.log("Drizzle transaction count:", drizzleTransactionCount);
  console.log(
    prismaTransactionCount === drizzleTransactionCount ? "✅ Transaction counts match" : "❌ Transaction counts differ",
  );

  const prismaCustomerCount = await customerPrisma.count();
  const drizzleCustomerCount = await customerDrizzle.count();

  console.log("Prisma customer count:", prismaCustomerCount);
  console.log("Drizzle customer count:", drizzleCustomerCount);
  console.log(prismaCustomerCount === drizzleCustomerCount ? "✅ Customer counts match" : "❌ Customer counts differ");

  const prismaBikeCount = await bikePrisma.count();
  const drizzleBikeCount = await bikeDrizzle.count();

  console.log("Prisma bike count:", prismaBikeCount);
  console.log("Drizzle bike count:", drizzleBikeCount);
  console.log(prismaBikeCount === drizzleBikeCount ? "✅ Bike counts match" : "❌ Bike counts differ");

  const prismaItemCount = await itemPrisma.count();
  const drizzleItemCount = await itemDrizzle.count();

  console.log("Prisma item count:", prismaItemCount);
  console.log("Drizzle item count:", drizzleItemCount);
  console.log(prismaItemCount === drizzleItemCount ? "✅ Item counts match" : "❌ Item counts differ");

  const prismaRepairCount = await repairPrisma.count();
  const drizzleRepairCount = await repairDrizzle.count();

  console.log("Prisma repair count:", prismaRepairCount);
  console.log("Drizzle repair count:", drizzleRepairCount);
  console.log(prismaRepairCount === drizzleRepairCount ? "✅ Repair counts match" : "❌ Repair counts differ");
}

/**
 * Compare a single customer between Prisma and Drizzle
 */
async function compareCustomer(customerId: string): Promise<void> {
  console.log(`\n🔍 Comparing customer with ID: ${customerId}`);

  const prismaResult = await customerPrisma.findById(customerId);
  const drizzleResult = await customerDrizzle.findById(customerId);

  console.log("Prisma result:", prismaResult);
  console.log("Drizzle result:", drizzleResult);

  if (!prismaResult || !drizzleResult) {
    console.log("❌ One of the repositories returned no result");
    return;
  }

  const fieldsMatch =
    prismaResult.customer_id === drizzleResult.customer_id &&
    prismaResult.first_name === drizzleResult.first_name &&
    prismaResult.last_name === drizzleResult.last_name &&
    prismaResult.email === drizzleResult.email;

  console.log(fieldsMatch ? "✅ Results match" : "❌ Results differ");
}

/**
 * Compare a single bike between Prisma and Drizzle
 */
async function compareBike(bikeId: string): Promise<void> {
  console.log(`\n🔍 Comparing bike with ID: ${bikeId}`);

  const prismaResult = await bikePrisma.findById(bikeId);
  const drizzleResult = await bikeDrizzle.findById(bikeId);

  console.log("Prisma result:", prismaResult ? "Found" : "Not found");
  console.log("Drizzle result:", drizzleResult ? "Found" : "Not found");

  if (!prismaResult || !drizzleResult) {
    console.log("❌ One of the repositories returned no result");
    return;
  }

  const fieldsMatch =
    prismaResult.bike_id === drizzleResult.bike_id &&
    prismaResult.make === drizzleResult.make &&
    prismaResult.model === drizzleResult.model &&
    prismaResult.is_available === drizzleResult.is_available;

  console.log(fieldsMatch ? "✅ Results match" : "❌ Results differ");
}

/**
 * Main function to run comparisons
 */
async function runComparisons(): Promise<void> {
  console.log("🔄 Starting repository comparison");

  try {
    // Compare record counts
    await compareCounts();

    // Compare transaction totals
    await compareTransactionTotals();

    // Compare a specific user if ID is provided
    const userId = process.argv[2];
    if (userId) {
      await compareUser(userId);
    } else {
      // Otherwise, get and compare first user
      const users = await userPrisma.findAll();
      if (users.length > 0) {
        await compareUser(users[0].user_id);
      }
    }

    // Compare a specific transaction if ID is provided
    const transactionId = process.argv[3];
    if (transactionId) {
      await compareTransaction(transactionId);
    } else {
      // Otherwise, get and compare first transaction
      const transactions = await transactionPrisma.findAll();
      if (transactions.length > 0) {
        await compareTransaction(transactions[0].transaction_id);
      }
    }

    // Compare a random customer
    const customers = await customerPrisma.findAll();
    if (customers.length > 0) {
      await compareCustomer(customers[0].customer_id);
    }

    // Compare a random bike
    const bikes = await bikePrisma.findAll();
    if (bikes.length > 0) {
      await compareBike(bikes[0].bike_id);
    }
  } catch (error) {
    console.error("❌ Error during comparison:", error);
  } finally {
    // Close Prisma client
    await prisma.$disconnect();
    console.log("\n✅ Comparison completed");
  }
}

// Run the comparisons if this file is executed directly
if (require.main === module) {
  runComparisons()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Fatal error:", error);
      process.exit(1);
    });
}

export {
  compareUser,
  compareTransaction,
  compareTransactionTotals,
  compareCustomer,
  compareBike,
  compareCounts,
  runComparisons,
};
