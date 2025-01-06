import type { Transaction } from "@/api/transactions/transactionModel";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class TransactionRepository {
  findAllAsync(): Promise<Transaction[]> {
    return prisma.transactions.findMany({
      include: {
        Bike: true,
        Customer: true,
      },
    });
  }

  // findByIdSingle(transaction_num: number): Promise<Transaction | null> {
  //   return (
  //     prisma.transactions.findUnique({
  //       where: {
  //         transaction_num: transaction_num,
  //       },
  //     }) || null
  //   );
  // }

  findByIdAggregate(transaction_num: number): Promise<Transaction | null> {
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
}
