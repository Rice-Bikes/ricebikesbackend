import * as csv from "fast-csv";
import type { Item } from "./api/items/itemModel";

interface ItemCSVRow {
  upc: string;
  category_1: string;
  brand: string;
  category_2: string;
  standard_price: number;
  wholesale_price: number;
  name: string;
}

interface ItemDetailRow {
  name: string;
  upc: string;
  category_1: string;
  brand: string;
  category_2: string;
  standard_price: number;
  wholesale_price: number;
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
          "wholesale_price",
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
      .pipe(csv.format<ItemCSVRow, ItemDetailRow>({ headers: true }))
      .transform(
        (row: ItemCSVRow): ItemDetailRow => ({
          standard_price: row.standard_price === 0 ? row.wholesale_price * 2 : row.standard_price,
          wholesale_price: row.wholesale_price,
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
        items.push(data);
      })
      .on("end", () => resolve(items))
      .on("error", (error: Error) => reject(error));
  });
}
