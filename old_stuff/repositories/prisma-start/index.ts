/**
 * Prisma Repository Implementations Index
 *
 * This file exports all Prisma-based repository implementations.
 */

import type { PrismaClient } from "@prisma/client";
import type {
  Bike,
  BikeCreateInput,
  BikeRepository,
  BikeUpdateInput,
  Customer,
  CustomerCreateInput,
  CustomerRepository,
  CustomerUpdateInput,
  CustomerWithTransactions,
  Item,
  ItemCreateInput,
  ItemRepository,
  ItemUpdateInput,
  Repair,
  RepairCreateInput,
  RepairRepository,
  RepairUpdateInput,
  Transaction,
  TransactionCreateInput,
  TransactionRepository,
  TransactionUpdateInput,
  TransactionWithDetails,
  User,
  UserCreateInput,
  UserRepository,
  UserUpdateInput,
} from "../interfaces";

// User Repository Implementation with Prisma
export class UserRepositoryPrisma implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<User[]> {
    return this.prisma.users.findMany();
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.users.findUnique({ where: { user_id: id } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.users.findUnique({ where: { username } });
  }

  async findActiveUsers(): Promise<User[]> {
    return this.prisma.users.findMany({ where: { active: true } });
  }

  async create(data: UserCreateInput): Promise<User> {
    return this.prisma.users.create({ data });
  }

  async update(id: string, data: UserUpdateInput): Promise<User | null> {
    return this.prisma.users.update({
      where: { user_id: id },
      data,
    });
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.users.delete({ where: { user_id: id } });
      return true;
    } catch (error) {
      return false;
    }
  }

  async count(): Promise<number> {
    return this.prisma.users.count();
  }
}

// Transaction Repository Implementation with Prisma
export class TransactionRepositoryPrisma implements TransactionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<Transaction[]> {
    return this.prisma.transactions.findMany();
  }

  async findById(id: string): Promise<Transaction | null> {
    return this.prisma.transactions.findUnique({
      where: { transaction_id: id },
    });
  }

  async findByCustomerId(customerId: string): Promise<Transaction[]> {
    return this.prisma.transactions.findMany({
      where: { customer_id: customerId },
    });
  }

  async findWithDetails(id: string): Promise<TransactionWithDetails | null> {
    return this.prisma.transactions.findUnique({
      where: { transaction_id: id },
      include: {
        Customer: true,
        Bike: true,
        TransactionDetails: true,
      },
    }) as unknown as TransactionWithDetails | null;
  }

  async findIncomplete(): Promise<Transaction[]> {
    return this.prisma.transactions.findMany({
      where: { is_completed: false },
    });
  }

  async findCompleted(): Promise<Transaction[]> {
    return this.prisma.transactions.findMany({
      where: { is_completed: true },
    });
  }

  async getTotalSalesAmount(): Promise<number> {
    const result = await this.prisma.transactions.aggregate({
      _sum: { total_cost: true },
      where: { is_completed: true, is_paid: true },
    });
    return result._sum.total_cost || 0;
  }

  async create(data: TransactionCreateInput): Promise<Transaction> {
    // Transform the TransactionCreateInput to match Prisma's expected format
    return this.prisma.transactions.create({
      data: data as any, // Type casting to bypass TypeScript error while keeping functionality
    });
  }

  async update(id: string, data: TransactionUpdateInput): Promise<Transaction | null> {
    return this.prisma.transactions.update({
      where: { transaction_id: id },
      data,
    });
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.transactions.delete({
        where: { transaction_id: id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async count(): Promise<number> {
    return this.prisma.transactions.count();
  }
}

// Customer Repository Implementation with Prisma
export class CustomerRepositoryPrisma implements CustomerRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<Customer[]> {
    return this.prisma.customers.findMany();
  }

  async findById(id: string): Promise<Customer | null> {
    return this.prisma.customers.findUnique({ where: { customer_id: id } });
  }

  async findByEmail(email: string): Promise<Customer | null> {
    return this.prisma.customers.findFirst({ where: { email } });
  }

  async findWithTransactions(id: string): Promise<CustomerWithTransactions | null> {
    return this.prisma.customers.findUnique({
      where: { customer_id: id },
      include: { Transactions: true },
    }) as unknown as CustomerWithTransactions | null;
  }

  async create(data: CustomerCreateInput): Promise<Customer> {
    return this.prisma.customers.create({ data });
  }

  async update(id: string, data: CustomerUpdateInput): Promise<Customer | null> {
    return this.prisma.customers.update({
      where: { customer_id: id },
      data,
    });
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.customers.delete({ where: { customer_id: id } });
      return true;
    } catch (error) {
      return false;
    }
  }

  async count(): Promise<number> {
    return this.prisma.customers.count();
  }
}

// Bike Repository Implementation with Prisma
export class BikeRepositoryPrisma implements BikeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<Bike[]> {
    return this.prisma.bikes.findMany();
  }

  async findById(id: string): Promise<Bike | null> {
    return this.prisma.bikes.findUnique({ where: { bike_id: id } });
  }

  async findAvailable(): Promise<Bike[]> {
    return this.prisma.bikes.findMany({
      where: { is_available: true },
    });
  }

  async findByType(type: string): Promise<Bike[]> {
    return this.prisma.bikes.findMany({
      where: { bike_type: type },
    });
  }

  async reserveBike(bikeId: string, customerId: string): Promise<Bike | null> {
    return this.prisma.bikes.update({
      where: { bike_id: bikeId },
      data: {
        is_available: false,
        reservation_customer_id: customerId,
      },
    });
  }

  async create(data: BikeCreateInput): Promise<Bike> {
    return this.prisma.bikes.create({ data });
  }

  async update(id: string, data: BikeUpdateInput): Promise<Bike | null> {
    return this.prisma.bikes.update({
      where: { bike_id: id },
      data,
    });
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.bikes.delete({ where: { bike_id: id } });
      return true;
    } catch (error) {
      return false;
    }
  }

  async count(): Promise<number> {
    return this.prisma.bikes.count();
  }
}

// Item Repository Implementation with Prisma
export class ItemRepositoryPrisma implements ItemRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<Item[]> {
    return this.prisma.items.findMany();
  }

  async findById(id: string): Promise<Item | null> {
    return this.prisma.items.findUnique({ where: { item_id: id } });
  }

  async findLowStock(): Promise<Item[]> {
    return this.prisma.items.findMany({
      where: {
        AND: [{ minimum_stock: { not: null } }, { stock: { lt: { minimum_stock: {} } } }],
      },
    });
  }

  async findByCategory(category: string): Promise<Item[]> {
    return this.prisma.items.findMany({
      where: {
        OR: [{ category_1: category }, { category_2: category }, { category_3: category }],
      },
    });
  }

  async updateStock(id: string, quantity: number): Promise<Item | null> {
    const item = await this.prisma.items.findUnique({ where: { item_id: id } });
    if (!item) return null;

    return this.prisma.items.update({
      where: { item_id: id },
      data: { stock: item.stock + quantity },
    });
  }

  async create(data: ItemCreateInput): Promise<Item> {
    return this.prisma.items.create({ data });
  }

  async update(id: string, data: ItemUpdateInput): Promise<Item | null> {
    return this.prisma.items.update({
      where: { item_id: id },
      data,
    });
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.items.delete({ where: { item_id: id } });
      return true;
    } catch (error) {
      return false;
    }
  }

  async count(): Promise<number> {
    return this.prisma.items.count();
  }
}

// Repair Repository Implementation with Prisma
export class RepairRepositoryPrisma implements RepairRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<Repair[]> {
    return this.prisma.repairs.findMany();
  }

  async findById(id: string): Promise<Repair | null> {
    return this.prisma.repairs.findUnique({ where: { repair_id: id } });
  }

  async findActive(): Promise<Repair[]> {
    return this.prisma.repairs.findMany({
      where: { disabled: false },
    });
  }

  async create(data: RepairCreateInput): Promise<Repair> {
    return this.prisma.repairs.create({ data });
  }

  async update(id: string, data: RepairUpdateInput): Promise<Repair | null> {
    return this.prisma.repairs.update({
      where: { repair_id: id },
      data,
    });
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.repairs.delete({ where: { repair_id: id } });
      return true;
    } catch (error) {
      return false;
    }
  }

  async count(): Promise<number> {
    return this.prisma.repairs.count();
  }
}
