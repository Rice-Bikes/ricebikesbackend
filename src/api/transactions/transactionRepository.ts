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

  // findByIdSingle(transaction_num: number): Promise<Transaction | null> {
  //   return (
  //     prisma.transactions.findUnique({
  //       where: {
  //         transaction_num: transaction_num,
  //       },
  //     }) || null
  //   );
  // }

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
}
