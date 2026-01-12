// Using a lightweight internal parser for robustness instead of depending on fast-csv
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
  // Lightweight, robust parser that tolerates trimmed/missing columns and handles NaN values.
  return new Promise((resolve, reject) => {
    try {
      const items: Item[] = [];

      if (!qbp_file || qbp_file.trim() === "") {
        return resolve(items);
      }

      const parseNumber = (input: unknown) => {
        if (input === null || input === undefined) return Number.NaN;
        const s = String(input).trim();
        if (s === "") return Number.NaN;
        // Remove non-numeric characters (e.g. currency symbols) except '.' and '-'
        const cleaned = s.replace(/[^0-9.\-]/g, "");
        const n = Number.parseFloat(cleaned);
        return Number.isFinite(n) ? n : Number.NaN;
      };

      const lines = qbp_file.split(/\r?\n/);
      for (const rawLine of lines) {
        // preserve leading/trailing tabs so column positions aren't shifted by trimming
        const line = rawLine;
        if (line.trim() === "") continue;

        const cols = line.split("\t");
        // Ensure enough columns so indexing below is safe
        while (cols.length < 24) cols.push("");

        const upc = (cols[1] || "").trim();
        const category_1 = (cols[2] || "").trim();
        const brand = (cols[3] || "").trim();
        const category_2 = (cols[5] || "").trim();
        const name = (cols[20] || "").trim();

        const wholesale_cost_raw = cols[10];
        const standard_price_raw = cols[8];

        const wholesale_cost = Number.isFinite(parseNumber(wholesale_cost_raw)) ? parseNumber(wholesale_cost_raw) : 0;
        let standard_price = parseNumber(standard_price_raw);

        // If standard_price is missing or invalid, fall back to wholesale_cost * 2
        if (!Number.isFinite(standard_price)) {
          standard_price = Number.isFinite(wholesale_cost) ? wholesale_cost * 2 : 0;
        }

        // Preserve legacy behavior: explicit zero standard_price => wholesale_cost * 2
        if (standard_price === 0) {
          standard_price = Number.isFinite(wholesale_cost) ? wholesale_cost * 2 : 0;
        }

        const item: Item = {
          upc,
          brand,
          category_1,
          category_2,
          name,
          standard_price,
          wholesale_cost,
          disabled: false,
          stock: 0,
          minimum_stock: 0,
          managed: false,
        } as unknown as Item;

        items.push(item);
      }

      resolve(items);
    } catch (error) {
      reject(error as Error);
    }
  });
}
