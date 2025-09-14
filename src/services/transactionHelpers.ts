import prisma from "@/common/utils/prismaClient";

export interface TransactionWithDetails {
  transaction: {
    transaction_num: number;
    transaction_id: string;
    total_cost: number;
    is_completed: boolean;
    is_reserved: boolean;
  };
  bike?: {
    make: string;
    model: string;
    condition: "New" | "Refurbished" | "Used";
    price?: number;
  };
  customer?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export async function getTransactionWithDetails(transactionId: string): Promise<TransactionWithDetails | null> {
  try {
    const transaction = await prisma.transactions.findUnique({
      where: { transaction_id: transactionId },
      include: {
        Customer: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        Bike: {
          select: {
            make: true,
            model: true,
            condition: true,
            price: true,
          },
        },
      },
    });

    if (!transaction) {
      return null;
    }

    return {
      transaction: {
        transaction_num: transaction.transaction_num,
        transaction_id: transaction.transaction_id,
        total_cost: transaction.total_cost,
        is_completed: transaction.is_completed,
        is_reserved: transaction.is_reserved,
      },
      bike: transaction.Bike
        ? {
            make: transaction.Bike.make,
            model: transaction.Bike.model,
            condition: transaction.Bike.condition as "New" | "Refurbished" | "Used",
            price: typeof transaction.Bike.price === "number" ? transaction.Bike.price : undefined,
          }
        : undefined,
      customer: transaction.Customer
        ? {
            first_name: transaction.Customer.first_name,
            last_name: transaction.Customer.last_name,
            email: transaction.Customer.email,
          }
        : undefined,
    };
  } catch (error) {
    console.error("Error fetching transaction with details:", error);
    return null;
  }
}
