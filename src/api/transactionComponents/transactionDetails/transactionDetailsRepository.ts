import { logger } from "@/server";
import { type Items, PrismaClient } from "@prisma/client";
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

  async createAsync(transactionDetails: TransactionDetails): Promise<TransactionDetails> {
    console.log("creating transaction details in createAsync", transactionDetails);
    if (transactionDetails.item_id) {
      const item: Items | null = await prisma.items.findFirst({
        where: {
          item_id: transactionDetails.item_id,
        },
      });
      console.log("item:", item);
      if (item !== null) {
        const um = await prisma.items
          .update({
            where: {
              item_id: transactionDetails.item_id,
            },
            data: {
              stock: item.stock - 1,
            },
          })
          .catch((e: any) => {
            console.log("Error updating item stock:", e);
          });
        console.log("updated item stock", um);
      } else {
        console.log("item not found!!!!!", transactionDetails.item_id);
      }
    }
    return prisma.transactionDetails.create({
      data: transactionDetails,
      // data: transactionDetails,
    });
  }

  async deleteAsync(id: string): Promise<TransactionDetails> {
    logger.debug("deleting transaction details", id);
    const detail: TransactionDetails | null = await prisma.transactionDetails.findFirst({
      where: {
        transaction_detail_id: id,
      },
    });
    if (detail?.item_id) {
      const item: Items | null = await prisma.items.findFirst({
        where: {
          item_id: detail.item_id,
        },
      });
      if (item !== null) {
        prisma.items.update({
          where: {
            item_id: detail.item_id,
          },
          data: {
            stock: item.stock + 1,
          },
        });
      }
    }
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
