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

  async create(Customer: Customer): Promise<Customer> {
    const netid = Customer.email.split("@")[0];
    const isUser = !!(await prisma.users.findFirst({
      where: {
        username: netid,
      },
    }));

    return prisma.customers.create({
      data: Customer,
    });
  }
}
