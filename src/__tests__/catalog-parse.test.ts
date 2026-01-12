import parseQBPCatalog from "@/catalog-parse";
import { describe, expect, it } from "vitest";

describe("parseQBPCatalog", () => {
  function makeRow({
    upc = "",
    category_1 = "",
    brand = "",
    category_2 = "",
    standard_price = "",
    wholesale_cost = "",
    name = "",
  }: {
    upc?: string;
    category_1?: string;
    brand?: string;
    category_2?: string;
    standard_price?: string;
    wholesale_cost?: string;
    name?: string;
  }) {
    // The parser expects 24 columns (indices 0..23). Populate relevant indices.
    const cols = Array(24).fill("");
    cols[1] = upc;
    cols[2] = category_1;
    cols[3] = brand;
    cols[5] = category_2;
    cols[8] = standard_price;
    cols[10] = wholesale_cost;
    cols[20] = name;
    return cols.join("\t");
  }

  it("parses a single row with a non-zero standard price", async () => {
    const row = makeRow({
      upc: "123456",
      category_1: "Bikes",
      brand: "Acme",
      category_2: "Road",
      standard_price: "10.5",
      wholesale_cost: "4.25",
      name: "Acme Roadster",
    });

    const csv = `${row}\n`;
    const items = await parseQBPCatalog(csv);

    expect(items).toHaveLength(1);
    const item = items[0];
    expect(item.upc).toBe("123456");
    expect(item.managed).toBe(false);
    expect(item.standard_price).toBe(10.5);
    expect(item.wholesale_cost).toBe(4.25);
    expect(item.name).toBe("Acme Roadster");
  });

  it("uses wholesale_cost * 2 when standard_price is zero", async () => {
    const row = makeRow({
      upc: "000111",
      standard_price: "0",
      wholesale_cost: "5",
      name: "Zero Priced Item",
    });

    const csv = `${row}\n`;
    const items = await parseQBPCatalog(csv);

    expect(items).toHaveLength(1);
    const item = items[0];
    // When standard_price === 0, code sets it to wholesale_cost * 2
    expect(item.wholesale_cost).toBe(5);
    expect(item.standard_price).toBe(10);
    expect(item.name).toBe("Zero Priced Item");
  });

  it("parses multiple rows correctly", async () => {
    const row1 = makeRow({
      upc: "111",
      standard_price: "7.5",
      wholesale_cost: "3.5",
      name: "First",
    });
    const row2 = makeRow({
      upc: "222",
      standard_price: "0",
      wholesale_cost: "8",
      name: "Second",
    });

    const csv = `${row1}\n${row2}\n`;
    const items = await parseQBPCatalog(csv);

    expect(items).toHaveLength(2);
    expect(items[0].upc).toBe("111");
    expect(items[0].standard_price).toBe(7.5);
    expect(items[1].upc).toBe("222");
    expect(items[1].standard_price).toBe(16); // 8 * 2
  });
});
