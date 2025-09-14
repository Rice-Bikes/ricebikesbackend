import { Prisma, PrismaClient } from "@prisma/client";
import type {
  AggTransaction,
  Transaction,
  TransactionsSummary,
  UpdateTransaction,
} from "../transactions/transactionModel";

const prisma = new PrismaClient();

// Helper function to convert bike Decimal fields to numbers in transaction data
function convertTransactionBikeDecimals(transaction: any): any {
  if (!transaction) return transaction;

  if (transaction.Bike) {
    transaction.Bike = {
      ...transaction.Bike,
      size_cm:
        transaction.Bike.size_cm instanceof Prisma.Decimal
          ? transaction.Bike.size_cm.toNumber()
          : transaction.Bike.size_cm,
      price:
        transaction.Bike.price instanceof Prisma.Decimal ? transaction.Bike.price.toNumber() : transaction.Bike.price,
      weight_kg:
        transaction.Bike.weight_kg instanceof Prisma.Decimal
          ? transaction.Bike.weight_kg.toNumber()
          : transaction.Bike.weight_kg,
      deposit_amount:
        transaction.Bike.deposit_amount instanceof Prisma.Decimal
          ? transaction.Bike.deposit_amount.toNumber()
          : transaction.Bike.deposit_amount,
    };
  }

  // Also convert transaction total_cost if it's a Decimal
  if (transaction.total_cost instanceof Prisma.Decimal) {
    transaction.total_cost = transaction.total_cost.toNumber();
  }

  return transaction;
}

export class TransactionRepository {
  findAll(after_id: number, page_limit: number): Promise<Transaction[]> {
    return prisma.transactions.findMany({
      take: page_limit,
      where: {
        transaction_num: {
          lt: after_id,
        },
        is_completed: false,
        is_paid: false,
      },
      orderBy: {
        is_urgent: "desc",
        transaction_num: "desc",
      },
    });
  }

  findAllAggregate(after_id: number, page_limit: number): Promise<AggTransaction[]> {
    return prisma.transactions
      .findMany({
        include: {
          Bike: true,
          Customer: true,
          OrderRequests: true,
        },
        take: page_limit,
        where: {
          transaction_num: {
            lt: after_id,
          },
        },
        orderBy: [
          {
            is_urgent: "desc",
          },
          {
            is_beer_bike: "desc",
          },
          {
            transaction_num: "asc",
          },
        ],
      })
      .then((transactions) => transactions.map(convertTransactionBikeDecimals));
  }

  async findByIdAggregate(transaction_id: string): Promise<AggTransaction | null> {
    const transaction = await prisma.transactions.findUnique({
      include: {
        Bike: true,
        Customer: true,
        OrderRequests: true,
      },
      where: {
        transaction_id: transaction_id,
      },
    });

    return transaction ? convertTransactionBikeDecimals(transaction) : null;
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

  updateById(transaction_id: string, transaction: UpdateTransaction): Promise<Transaction> {
    // console.log("before update", transaction_id, transaction);

    // Ensure the transaction object matches the TransactionsUpdateInput type

    return prisma.transactions.update({
      where: {
        transaction_id: transaction_id,
      },
      data: {
        transaction_num: undefined,
        transaction_id: undefined,
        date_created: undefined,
        ...transaction,
      },
    });
  }

  async getTransactionsSummary(): Promise<TransactionsSummary> {
    const stats = [
      prisma.transactions.count({
        where: {
          is_completed: false,
          is_beer_bike: false,
        },
      }),
      prisma.transactions.count({
        where: {
          is_completed: false,
          is_beer_bike: true,
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
      ([
        quantity_incomplete,
        quantity_beer_bike_incomplete,
        quantity_waiting_on_pickup,
        quantity_waiting_on_safety_check,
      ]) => {
        const summary: TransactionsSummary = {
          quantity_incomplete,
          quantity_beer_bike_incomplete,
          quantity_waiting_on_pickup,
          quantity_waiting_on_safety_check,
        };
        console.log("summary:", summary);
        return summary;
      },
    );
  }
}
