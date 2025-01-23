import type { TransactionsSummary } from "@/api/transactions/transactionModel";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class SummaryRepository {
  async getTransactionsSummary(): Promise<TransactionsSummary> {
    const incomplete = await prisma.transactions.findMany({
      where: {
        is_completed: false,
        is_refurb: false,
        is_employee: false,
        NOT: {
          transaction_type: "retrospec",
        },
      },
    });
    console.log("pinging getTransactionsSummary", incomplete);
    const stats = [
      prisma.transactions.count({
        where: {
          is_completed: false,
          is_refurb: false,
          is_employee: false,
          NOT: {
            transaction_type: "retrospec",
          },
        },
      }),
      prisma.transactions.count({
        where: {
          is_completed: true,
          is_paid: false,
        },
      }),
      Promise.resolve(0), //TODO: make sure this resolves to something meaningful once this is implemented
    ];
    return Promise.all(stats).then(
      ([quantity_incomplete, quantity_waiting_on_pickup, quantity_waiting_on_safety_check]) => {
        const summary: TransactionsSummary = {
          quantity_incomplete,
          quantity_waiting_on_pickup,
          quantity_waiting_on_safety_check,
        };
        return summary;
      },
    );
  }
}
