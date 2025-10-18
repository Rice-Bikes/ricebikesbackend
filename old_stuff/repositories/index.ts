/**
 * Repository Index
 *
 * This file re-exports all repository implementations.
 * Since the migration to Drizzle is complete, we now export the Drizzle
 * implementations directly using the interface names for cleaner imports.
 */

import {
  BikeRepositoryDrizzle,
  CustomerRepositoryDrizzle,
  ItemRepositoryDrizzle,
  RepairRepositoryDrizzle,
  TransactionRepositoryDrizzle,
  UserRepositoryDrizzle,
} from "./drizzle";

// Export Drizzle implementations with interface names for cleaner imports
export const UserRepository = UserRepositoryDrizzle;
export const TransactionRepository = TransactionRepositoryDrizzle;
export const CustomerRepository = CustomerRepositoryDrizzle;
export const BikeRepository = BikeRepositoryDrizzle;
export const ItemRepository = ItemRepositoryDrizzle;
export const RepairRepository = RepairRepositoryDrizzle;

// Re-export from interfaces for convenience
export {
  User,
  UserCreateInput,
  UserUpdateInput,
  Transaction,
  TransactionCreateInput,
  TransactionUpdateInput,
  Customer,
  CustomerCreateInput,
  CustomerUpdateInput,
  Bike,
  BikeCreateInput,
  BikeUpdateInput,
  Item,
  ItemCreateInput,
  ItemUpdateInput,
  Repair,
  RepairCreateInput,
  RepairUpdateInput,
  TransactionWithDetails,
  CustomerWithTransactions,
} from "./interfaces";

// Export interface types for type safety
export type {
  UserRepository as UserRepositoryType,
  TransactionRepository as TransactionRepositoryType,
  CustomerRepository as CustomerRepositoryType,
  BikeRepository as BikeRepositoryType,
  ItemRepository as ItemRepositoryType,
  RepairRepository as RepairRepositoryType,
} from "./interfaces";
