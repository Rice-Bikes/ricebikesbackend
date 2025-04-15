import * as csv from "fast-csv";
import type { Item } from "./api/transactionComponents/items/itemModel";

interface ItemCSVRow {
  upc: string;
  category_1: string;
  brand: string;
  category_2: string;
  standard_price: number;
  wholesale_cost: number;
  name: string;
}

interface ItemDetailRow {
  name: string;
  upc: string;
  category_1: string;
  brand: string;
  category_2: string;
  standard_price: number;
  wholesale_cost: number;
  // properties from user
  disabled: boolean;
  stock: number;
  minimum_stock: number;
  // isVerified: boolean;
  // hasLoggedIn: boolean;
  // age: number;
}
export default function parseQBPCatalog(qbp_file: string): Promise<Item[]> {
  console.log(`qbp file inpu: ${qbp_file}`);
  return new Promise((resolve, reject) => {
    const items: Item[] = [];
    csv
      .parseString(qbp_file, {
        headers: [
          undefined,
          "upc",
          "category_1",
          "brand",
          undefined,
          "category_2",
          undefined,
          undefined,
          "standard_price",
          undefined,
          "wholesale_cost",
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          "name",
          undefined,
          undefined,
          undefined,
        ],
        renameHeaders: true,
        delimiter: "\t",
      })
      .transform(
        (row: any): ItemDetailRow => ({
          standard_price: Number.parseFloat(row.standard_price) ?? Number.parseFloat(row.wholesale_cost) * 2,
          wholesale_cost: Number.parseFloat(row.wholesale_cost),
          upc: row.upc,
          brand: row.brand,
          category_1: row.category_1,
          category_2: row.category_2,
          name: row.name,
          disabled: false,
          stock: 0,
          minimum_stock: 0,
        }),
      )
      .on("data", (data: Item) => {
        data.standard_price = data.standard_price === 0 ? data.wholesale_cost * 2 : data.standard_price;
        data.managed = false;
        items.push(data);
      })
      .on("end", () => resolve(items))
      .on("error", (error: Error) => reject(error));
  });
}
