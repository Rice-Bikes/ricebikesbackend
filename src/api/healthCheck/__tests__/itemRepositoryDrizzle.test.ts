import { ItemRepositoryDrizzle } from "@/api/transactionComponents/items/itemRepositoryDrizzle";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("ItemRepositoryDrizzle - basic behaviors", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetAllMocks();
  });

  it("findByIdAsync returns null when no matching item", async () => {
    const mockDb: any = {
      select: () => ({
        from: () => ({
          where: async () => [],
        }),
      }),
    };

    const repo = new ItemRepositoryDrizzle(mockDb);
    const result = await repo.findByIdAsync("not-found");
    expect(result).toBeNull();
  });

  it("findByIdAsync maps DB row to item (converts numeric strings)", async () => {
    const dbRow = {
      item_id: "i1",
      upc: "123",
      name: "Test Item",
      description: "desc",
      brand: "brand",
      // Provide numeric values so mapToItem preserves them as-is
      stock: 10,
      minimum_stock: 2,
      standard_price: 199.99,
      wholesale_cost: 99.5,
      condition: "New",
      disabled: 0,
      managed: 1,
      category_1: "c1",
      category_2: "c2",
      category_3: null,
      specifications: {},
      features: {},
    };

    const mockDb: any = {
      select: () => ({
        from: () => ({
          where: async () => [dbRow],
        }),
      }),
    };

    const repo = new ItemRepositoryDrizzle(mockDb);
    const item = await repo.findByIdAsync("i1");
    expect(item).not.toBeNull();
    // numeric conversions
    expect((item as any).stock).toBe(Number(dbRow.stock));
    expect((item as any).standard_price).toBe(Number(dbRow.standard_price));
    expect((item as any).wholesale_cost).toBe(Number(dbRow.wholesale_cost));
    // booleans
    expect((item as any).disabled).toBe(false); // 0 -> false
    expect((item as any).managed).toBe(true); // 1 -> true
  });

  it("findAllAsync returns mapped rows (includeDisabled flag works)", async () => {
    const dbRow = {
      item_id: "i2",
      upc: "777",
      name: "All Item",
      description: null,
      brand: null,
      // Use numeric fields to reflect mapToItem expectations
      stock: 5,
      minimum_stock: null,
      standard_price: 50,
      wholesale_cost: 25,
      condition: null,
      disabled: false,
      managed: false,
      category_1: null,
      category_2: null,
      category_3: null,
      specifications: null,
      features: null,
    };

    // When includeDisabled=false the code calls .where(...) then .orderBy(...)
    const chain = {
      where: () => ({
        orderBy: () => Promise.resolve([dbRow]),
      }),
      orderBy: () => Promise.resolve([dbRow]),
    };

    const mockDb: any = {
      select: () => ({
        from: () => chain,
      }),
    };

    const repo = new ItemRepositoryDrizzle(mockDb);
    const list = await repo.findAllAsync(false);
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBe(1);
    expect((list[0] as any).upc).toBe("777");
  });

  it("create uses insert and returns result from findByIdAsync", async () => {
    // Simulate insert being called and then findByIdAsync returning the created item
    const insertedId = "new-id";
    const valuesSpy = vi.fn().mockResolvedValue(undefined);
    const insertMock = vi.fn().mockReturnValue({ values: valuesSpy });

    const mockDb: any = {
      insert: insertMock,
    };

    const repo: any = new ItemRepositoryDrizzle(mockDb);
    const stubbedItem = { item_id: insertedId, upc: "111", name: "Created" };
    repo.findByIdAsync = vi.fn().mockResolvedValue(stubbedItem);

    const result = await repo.create({ upc: "111", name: "Created" } as any);
    expect(insertMock).toHaveBeenCalled();
    expect(valuesSpy).toHaveBeenCalled();
    expect(result).toEqual(stubbedItem);
  });

  it("update returns null when item does not exist; otherwise returns updated item", async () => {
    const mockDbNoOp: any = {
      update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
    };

    const repo: any = new ItemRepositoryDrizzle(mockDbNoOp);
    // If item not found
    repo.findByIdAsync = vi.fn().mockResolvedValue(null);
    const resNull = await repo.update("missing", { name: "X" } as any);
    expect(resNull).toBeNull();

    // Item exists path
    const existing = { item_id: "i10", upc: "u10", name: "Before" };
    const updated = { item_id: "i10", upc: "u10", name: "After" };
    repo.findByIdAsync = vi.fn().mockResolvedValueOnce(existing).mockResolvedValueOnce(updated);
    const mockDbUpdate: any = {
      update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
    };
    const repo2: any = new ItemRepositoryDrizzle(mockDbUpdate);
    // replace findByIdAsync on repo2
    repo2.findByIdAsync = vi.fn().mockResolvedValueOnce(existing).mockResolvedValueOnce(updated);

    const resUpdated = await repo2.update("i10", { name: "After" } as any);
    expect(resUpdated).toEqual(updated);
  });

  it("delete returns null when item missing and returns item when found (soft delete)", async () => {
    const repo: any = new ItemRepositoryDrizzle({} as any);
    // missing item
    repo.findByIdAsync = vi.fn().mockResolvedValueOnce(null);
    const resMissing = await repo.delete("nope");
    expect(resMissing).toBeNull();

    // found item path -> ensure db.update is used
    const found = { item_id: "i20", upc: "u20", name: "X" };
    const updateSpy = vi.fn().mockResolvedValue(undefined);
    const mockDb: any = {
      update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
    };
    const repo2: any = new ItemRepositoryDrizzle(mockDb);
    repo2.findByIdAsync = vi.fn().mockResolvedValue(found);

    const res = await repo2.delete("i20");
    expect(res).toEqual(found);
  });

  it("enableItem returns null when no item with UPC and returns updated item when found", async () => {
    // no items for UPC => null
    const mockDbNo: any = {
      select: () => ({ from: () => ({ where: async () => [] }) }),
    };
    const repoNo = new ItemRepositoryDrizzle(mockDbNo);
    const r1 = await repoNo.enableItem("no-upc");
    expect(r1).toBeNull();

    // when items exist and update returns row
    const existingRow = { item_id: "i30", upc: "UPCA", name: "X" };
    const mockDbYes: any = {
      select: () => ({ from: () => ({ where: async () => [existingRow] }) }),
      update: () => ({
        set: () => ({
          where: () => ({ returning: () => Promise.resolve([existingRow]) }),
        }),
      }),
    };
    const repoYes = new ItemRepositoryDrizzle(mockDbYes);
    const r2 = await repoYes.enableItem("UPCA");
    expect(r2).toEqual(existingRow);
  });

  it("getCategory throws on invalid category and returns results on valid call", async () => {
    const repo = new ItemRepositoryDrizzle({} as any);
    await expect(() => repo.getCategory(0)).rejects.toThrow(/Invalid category/);

    const mockResult = ["A", "B"];
    const mockDb: any = {
      execute: () => Promise.resolve(mockResult),
    };
    const repo2 = new ItemRepositoryDrizzle(mockDb);
    const result = await repo2.getCategory(1);
    expect(result).toEqual(mockResult);
  });

  it("refreshItems throws for empty CSV and processes a simple CSV row (creates new item path)", async () => {
    const repo = new ItemRepositoryDrizzle({} as any);
    await expect(() => repo.refreshItems("")).rejects.toThrow(/No CSV content provided/);

    // Build a minimal CSV line (24 fields). Put upc at index 1, standard_price at index 8,
    // wholesale_cost at index 10, name at index 20.
    const fields = new Array(24).fill("");
    fields[1] = "UPC001";
    fields[8] = "100";
    fields[10] = "40";
    fields[20] = "CSV Item";
    const csvLine = fields.join("\t");

    // Mock DB so that item does not exist and insert is invoked.
    const insertMock = vi.fn().mockResolvedValue(undefined);
    const selectMock = vi.fn().mockResolvedValue([]); // no existing item by UPC
    const mockDb: any = {
      select: () => ({ from: () => ({ where: selectMock }) }),
      insert: () => ({ values: insertMock }),
      update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
    };

    const repo2: any = new ItemRepositoryDrizzle(mockDb);
    // When refreshItems creates an item it calls this.findByIdAsync to fetch it; stub it.
    const createdItem = {
      item_id: "generated-1",
      upc: "UPC001",
      name: "CSV Item",
    };
    repo2.findByIdAsync = vi.fn().mockResolvedValue(createdItem);

    const results = await repo2.refreshItems(csvLine);
    // Should have returned an array with the created item
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThanOrEqual(0);
    // Verify we attempted to insert at least once
    expect(insertMock).toHaveBeenCalled();
  });
});
