import { db } from "@/db/client";
import { bikes as bikesTable, customers as customersTable, transactions as transactionsTable } from "@/db/schema";
import { eq } from "drizzle-orm";

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
    const rows = await db
      .select({
        t: transactionsTable,
        bike_make: bikesTable.make,
        bike_model: bikesTable.model,
        bike_condition: bikesTable.condition,
        bike_price: bikesTable.price,
        cust_first: customersTable.first_name,
        cust_last: customersTable.last_name,
        cust_email: customersTable.email,
      })
      .from(transactionsTable)
      .leftJoin(bikesTable, eq(transactionsTable.bike_id, bikesTable.bike_id))
      .leftJoin(customersTable, eq(transactionsTable.customer_id, customersTable.customer_id))
      .where(eq(transactionsTable.transaction_id, transactionId));

    if (!rows || rows.length === 0) {
      return null;
    }

    const row = rows[0];
    const t = row.t;

    // Normalize bike price (decimal can be string from DB)
    const priceNum =
      row.bike_price !== null && row.bike_price !== undefined ? Number(row.bike_price as unknown as string) : undefined;

    const result: TransactionWithDetails = {
      transaction: {
        transaction_num: t.transaction_num as number,
        transaction_id: t.transaction_id as string,
        total_cost: Number(t.total_cost || 0),
        is_completed: Boolean(t.is_completed),
        is_reserved: Boolean(t.is_reserved),
      },
      bike:
        row.bike_make || row.bike_model || row.bike_condition
          ? {
              make: row.bike_make || "",
              model: row.bike_model || "",
              condition: (row.bike_condition || "Used") as "New" | "Refurbished" | "Used",
              price: Number.isFinite(priceNum!) ? (priceNum as number) : undefined,
            }
          : undefined,
      customer:
        row.cust_first || row.cust_last || row.cust_email
          ? {
              first_name: row.cust_first || "",
              last_name: row.cust_last || "",
              email: row.cust_email || "",
            }
          : undefined,
    };

    return result;
  } catch (error) {
    console.error("Error fetching transaction with details (Drizzle):", error);
    return null;
  }
}
