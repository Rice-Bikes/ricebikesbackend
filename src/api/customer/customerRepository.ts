import type { Customer } from "@/api/customer/customerModel";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class CustomersRepository {
  async findAllAsync(): Promise<Customer[]> {
    return prisma.customers.findMany({
      distinct: ["email"],
    });
  }

  async findByIdAsync(Customer_id: string): Promise<Customer | null> {
    return (
      prisma.customers.findFirst({
        where: {
          customer_id: Customer_id,
        },
      }) || null
    );
  }

  create(Customer: Customer): Promise<Customer> {
    return prisma.customers.create({
      data: Customer,
    });
  }

  update(Customer: Customer): Promise<Customer> {
    return prisma.customers.update({
      where: {
        customer_id: Customer.customer_id,
      },
      data: Customer,
    });
  }
}
