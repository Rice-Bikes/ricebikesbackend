import type { AggTransaction, Transaction } from "@/api/transactions/transactionModel";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class TransactionRepository {
  findAll(after_id: number, page_limit: number): Promise<any> {
    return prisma.transactions.findMany({
      take: page_limit,
      where: {
        transaction_num: {
          lt: after_id,
        },
      },
      orderBy: {
        transaction_num: "desc",
      },
    });
  }

  findByIdAggregate(transaction_num: number): Promise<AggTransaction | null> {
    return (
      prisma.transactions.findUnique({
        include: {
          Bike: true,
          Customer: true,
        },
        where: {
          transaction_num: transaction_num,
        },
      }) || null
    );
  }

  createTransaction(transaction: Transaction): Promise<Transaction> {
    return prisma.transactions.create({
      data: transaction,
    });
  }

  deleteById(transaction_id: string): Promise<Transaction> {
    return prisma.transactions.delete({
      where: {
        transaction_id: transaction_id,
      },
    });
  }

  updateById(transaction_id: string, transaction: Transaction): Promise<Transaction> {
    return prisma.transactions.update({
      where: {
        transaction_id: transaction_id,
      },
      data: transaction,
    });
  }
}
