/**
 * Repository interfaces for Rice Bikes Backend
 *
 * This file defines the interfaces for all repository classes.
 * Both Prisma and Drizzle repository implementations will implement these interfaces.
 */

// Generic base repository interface
export interface BaseRepository<T, ID, CreateInput, UpdateInput> {
  findAll(): Promise<T[]>;
  findById(id: ID): Promise<T | null>;
  create(data: CreateInput): Promise<T>;
  update(id: ID, data: UpdateInput): Promise<T | null>;
  delete(id: ID): Promise<boolean>;
  count(): Promise<number>;
}

// User specific repository interface with any custom methods
export interface UserRepository extends BaseRepository<User, string, UserCreateInput, UserUpdateInput> {
  findByUsername(username: string): Promise<User | null>;
  findActiveUsers(): Promise<User[]>;
}

// Transaction specific repository interface with any custom methods
export interface TransactionRepository
  extends BaseRepository<Transaction, string, TransactionCreateInput, TransactionUpdateInput> {
  findByCustomerId(customerId: string): Promise<Transaction[]>;
  findWithDetails(id: string): Promise<TransactionWithDetails | null>;
  findIncomplete(): Promise<Transaction[]>;
  findCompleted(): Promise<Transaction[]>;
  getTotalSalesAmount(): Promise<number>;
}

// Customer specific repository interface with any custom methods
export interface CustomerRepository extends BaseRepository<Customer, string, CustomerCreateInput, CustomerUpdateInput> {
  findByEmail(email: string): Promise<Customer | null>;
  findWithTransactions(id: string): Promise<CustomerWithTransactions | null>;
}

// Bike specific repository interface with any custom methods
export interface BikeRepository extends BaseRepository<Bike, string, BikeCreateInput, BikeUpdateInput> {
  findAvailable(): Promise<Bike[]>;
  findByType(type: string): Promise<Bike[]>;
  reserveBike(bikeId: string, customerId: string): Promise<Bike | null>;
}

// Item specific repository interface with any custom methods
export interface ItemRepository extends BaseRepository<Item, string, ItemCreateInput, ItemUpdateInput> {
  findLowStock(): Promise<Item[]>;
  findByCategory(category: string): Promise<Item[]>;
  updateStock(id: string, quantity: number): Promise<Item | null>;
}

// Repair specific repository interface
export interface RepairRepository extends BaseRepository<Repair, string, RepairCreateInput, RepairUpdateInput> {
  findActive(): Promise<Repair[]>;
}

// Type definitions for entities and inputs
// These are just placeholder types - you would replace with actual types from your schema
export type User = {
  user_id: string;
  firstname: string;
  lastname: string;
  active: boolean;
  username: string;
};

export type Transaction = {
  transaction_id: string;
  transaction_num: number;
  date_created: Date;
  transaction_type: string;
  customer_id: string;
  bike_id?: string | null;
  total_cost: number;
  is_completed: boolean;
  is_paid: boolean;
  [key: string]: any;
};

export type Customer = {
  customer_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
};

export type Bike = {
  bike_id: string;
  make: string;
  model: string;
  date_created: Date;
  description?: string | null;
  bike_type?: string | null;
  size_cm?: number | null;
  condition?: string | null;
  price?: number | null;
  is_available: boolean;
  [key: string]: any;
};

export type Item = {
  item_id: string;
  upc: string;
  name: string;
  description?: string | null;
  stock: number;
  standard_price: number;
  wholesale_cost: number;
  disabled: boolean;
  [key: string]: any;
};

export type Repair = {
  repair_id: string;
  name: string;
  price: number;
  disabled: boolean;
  description?: string | null;
};

// Input types for creating entities
export type UserCreateInput = Omit<User, "user_id">;
export type UserUpdateInput = Partial<UserCreateInput>;

export type TransactionCreateInput = Omit<Transaction, "transaction_id" | "transaction_num">;
export type TransactionUpdateInput = Partial<Omit<Transaction, "transaction_id" | "transaction_num" | "date_created">>;

export type CustomerCreateInput = Omit<Customer, "customer_id">;
export type CustomerUpdateInput = Partial<CustomerCreateInput>;

export type BikeCreateInput = Omit<Bike, "bike_id">;
export type BikeUpdateInput = Partial<BikeCreateInput>;

export type ItemCreateInput = Omit<Item, "item_id">;
export type ItemUpdateInput = Partial<ItemCreateInput>;

export type RepairCreateInput = Omit<Repair, "repair_id">;
export type RepairUpdateInput = Partial<RepairCreateInput>;

// Joined entity types for related data
export type TransactionWithDetails = Transaction & {
  customer: Customer;
  bike?: Bike | null;
  transactionDetails?: any[];
};

export type CustomerWithTransactions = Customer & {
  transactions: Transaction[];
};
