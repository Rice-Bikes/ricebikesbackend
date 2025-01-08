import type { TransactionDetails } from "@/api/transactionDetails/transactionDetailsModel";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class TransactionDetailsRepository {
  async findAllAsync(): Promise<TransactionDetails[]> {
    return prisma.transactionDetails.findMany();
  }

  findByIdAsync(transaction_id: string): Promise<TransactionDetails[] | null> {
    return (
      prisma.transactionDetails.findMany({
        where: {
          transaction_id: transaction_id,
        },
      }) || null
    );
  }

  createAsync(transactionDetails: TransactionDetails): Promise<TransactionDetails> {
    return prisma.transactionDetails.create({
      data: transactionDetails,
    });
  }
}
