import { PrismaClient } from "@prisma/client";
import type { TransactionLog, TransactionLogWithForeignKeys } from "../transactionLogs/transactionLogsModel";

const prisma = new PrismaClient();

export class TransactionLogsRepository {
  async findAllAsync(): Promise<TransactionLog[]> {
    return prisma.transactionLogs.findMany();
  }

  findAllTransactionLogs(transaction_id: number): Promise<TransactionLogWithForeignKeys[] | null> {
    return (
      prisma.transactionLogs.findMany({
        where: {
          transaction_num: transaction_id,
        },
        include: {
          Users: true,
        },
      }) || null
    );
  }

  createAsync(transactionLogs: TransactionLog): Promise<TransactionLog> {
    console.log("creating transaction details in createAsync", transactionLogs);

    return prisma.transactionLogs.create({
      data: transactionLogs,
      // data: transactionLogs,
    });
  }

  // deleteAsync(id: string): Promise<TransactionLog> {
  //   return (
  //     prisma.transactionLogs.delete({
  //       where: {
  //         log_id: id,
  //       },
  //     }) || null
  //   );
  // }
  // updateStatus(id: string, isDone: boolean): Promise<TransactionLogs | null> {
  //   console.log(id, isDone);
  //   return (
  //     prisma.transactionLogs.update({
  //       where: {
  //         transaction_detail_id: id,
  //       },
  //       data: {
  //         completed: isDone,
  //       },
  //     }) || null
  //   );
  // }
}
