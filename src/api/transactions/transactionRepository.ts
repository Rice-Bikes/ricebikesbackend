import type { Transaction } from "@/api/transactions/transactionModel";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class TransactionRepository {
  async findAllAsync(): Promise<Transaction[]> {
    return prisma.transactions.findMany();
  }

  async findByIdAsync(transaction_num: number): Promise<Transaction | null> {
    return (
      prisma.transactions.findFirst({
        where: {
          transaction_num: transaction_num,
        },
      }) || null
    );
  }
}
