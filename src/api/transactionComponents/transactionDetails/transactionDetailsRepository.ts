import { PrismaClient } from "@prisma/client";
import type { TransactionDetails, TransactionDetailsWithForeignKeys } from "./transactionDetailsModel";

const prisma = new PrismaClient();

export class TransactionDetailsRepository {
  async findAllAsync(): Promise<TransactionDetails[]> {
    return prisma.transactionDetails.findMany();
  }

  findAllTransactionDetails(transaction_id: string): Promise<TransactionDetailsWithForeignKeys[] | null> {
    return (
      prisma.transactionDetails.findMany({
        where: {
          transaction_id: transaction_id,
        },
        include: {
          Item: true,
          Repair: true,
        },
      }) || null
    );
  }

  findAllRepairs(transaction_id: string): Promise<TransactionDetailsWithForeignKeys[] | null> {
    console.log("finding repairs", transaction_id, "\n\n\n\\n\n\n\n");
    return (
      prisma.transactionDetails.findMany({
        where: {
          transaction_id: transaction_id,
          item_id: null,
        },
        include: {
          Repair: true,
        },
        orderBy: {
          date_modified: "desc",
        },
      }) || null
    );
  }

  findAllItems(transaction_id: string): Promise<TransactionDetailsWithForeignKeys[] | null> {
    console.log("finding items", transaction_id, "\n\n\n\n\n\n\n\n");
    return (
      prisma.transactionDetails.findMany({
        where: {
          transaction_id: transaction_id,
          repair_id: null,
        },
        include: {
          Item: true,
        },
      }) || null
    );
  }

  createAsync(transactionDetails: TransactionDetails): Promise<TransactionDetails> {
    console.log("creating transaction details in createAsync", transactionDetails);

    return prisma.transactionDetails.create({
      data: transactionDetails,
      // data: transactionDetails,
    });
  }

  deleteAsync(id: string): Promise<TransactionDetails> {
    return (
      prisma.transactionDetails.delete({
        where: {
          transaction_detail_id: id,
        },
      }) || null
    );
  }
  updateStatus(id: string, isDone: boolean): Promise<TransactionDetails | null> {
    console.log(id, isDone);
    return (
      prisma.transactionDetails.update({
        where: {
          transaction_detail_id: id,
        },
        data: {
          completed: isDone,
        },
      }) || null
    );
  }
}
