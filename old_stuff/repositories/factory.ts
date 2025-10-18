/**
 * Repository Factory
 *
 * This file provides factory functions to create repositories.
 * It centralizes the creation of repository instances.
 * All repositories now use Drizzle implementations.
 */

import type {
  BikeRepository,
  CustomerRepository,
  ItemRepository,
  RepairRepository,
  TransactionRepository,
  UserRepository,
} from "./interfaces";

// Import Drizzle repositories
import {
  BikeRepositoryDrizzle,
  CustomerRepositoryDrizzle,
  ItemRepositoryDrizzle,
  RepairRepositoryDrizzle,
  TransactionRepositoryDrizzle,
  UserRepositoryDrizzle,
} from "./drizzle";

// Import logger
import { repositoryLogger } from "@/common/utils/logger";

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
// Import database client
import { db as drizzleDb } from "../db/client";
import type * as schema from "../db/schema";

// Factory functions for repositories
export async function createUserRepository(): Promise<UserRepository> {
  repositoryLogger.debug("Creating user repository instance");
  return new UserRepositoryDrizzle(drizzleDb);
}

export async function createTransactionRepository(): Promise<TransactionRepository> {
  repositoryLogger.debug("Creating transaction repository instance");
  return new TransactionRepositoryDrizzle(drizzleDb);
}

export async function createCustomerRepository(): Promise<CustomerRepository> {
  repositoryLogger.debug("Creating customer repository instance");
  return new CustomerRepositoryDrizzle(drizzleDb);
}

export async function createBikeRepository(): Promise<BikeRepository> {
  repositoryLogger.debug("Creating bike repository instance");
  return new BikeRepositoryDrizzle(drizzleDb);
}

export async function createItemRepository(): Promise<ItemRepository> {
  repositoryLogger.debug("Creating item repository instance");
  return new ItemRepositoryDrizzle(drizzleDb);
}

export async function createRepairRepository(): Promise<RepairRepository> {
  repositoryLogger.debug("Creating repair repository instance");
  return new RepairRepositoryDrizzle(drizzleDb);
}

// Helper type for code that needs access to the database client
export type DrizzleDB = PostgresJsDatabase<typeof schema> & {
  $client: any; // Adding $client property for full compatibility
};
