import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BikesRepositoryDrizzle } from "@/api/bikes/bikesRepositoryDrizzle";

/**
 * Tests for BikesRepositoryDrizzle
 *
 * Strategy:
 * - Provide a lightweight, chainable `db` mock that implements the subset of
 *   Drizzle methods used by the repository (`select().from().where().orderBy()`,
 *   `.insert(...).values(...).returning()`, `.update(...).set(...).where(...).returning()`,
 *   `.delete(...).where(...).returning()`).
 * - Validate mapping behavior (string numeric fields -> number, null handling).
 * - Validate CRUD paths (create/update/delete/reserve/unreserve) and expected outcomes.
 */

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("BikesRepositoryDrizzle", () => {
  const makeSelectChain = (rows: any[] = []) => {
    // A chain object where orderBy and limit return the rows (as Promise)
    const chain: any = {
      from: () => chain,
      where: () => chain,
      orderBy: () => Promise.resolve(rows),
      limit: () => Promise.resolve(rows),
    };
    return chain;
  };

  const makeInsertChain = (rows: any[] = []) => {
    const values = vi.fn().mockReturnValue({
      returning: () => Promise.resolve(rows),
    });
    return { values, returning: undefined as any };
  };

  const makeUpdateChain = (rows: any[] = []) => {
    return {
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve(rows),
        }),
      }),
    };
  };

  const makeDeleteChain = (rows: any[] = []) => {
    return {
      where: () => ({
        returning: () => Promise.resolve(rows),
      }),
    };
  };

  it("findAll maps DB rows to Bike model (converts numeric strings to numbers)", async () => {
    const dbRows = [
      {
        bike_id: "b1",
        make: "Brand",
        model: "Model",
        date_created: new Date(),
        description: "desc",
        bike_type: "Road",
        size_cm: "54",
        condition: "New",
        price: "1000",
        is_available: true,
        weight_kg: "10",
        reservation_customer_id: null,
        deposit_amount: "25",
      },
    ];

    const mockDb: any = {
      select: vi.fn().mockImplementation(() => makeSelectChain(dbRows)),
    };

    const repo = new BikesRepositoryDrizzle(mockDb);
    const results = await repo.findAll();

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(1);

    const bike = results[0];
    expect(bike.bike_id).toBe("b1");
    expect(bike.make).toBe("Brand");
    expect(bike.size_cm).toBe(54); // converted from string
    expect(bike.price).toBe(1000); // converted from string
    expect(bike.deposit_amount).toBe(25); // converted from string
    expect(typeof bike.is_available).toBe("boolean");
  });

  it("findByIdAsync returns a mapped bike when found and null when not", async () => {
    const dbRows = [
      {
        bike_id: "b2",
        make: "Brand2",
        model: "Model2",
        date_created: new Date(),
        description: "desc2",
        bike_type: "Mountain",
        size_cm: "60",
        condition: "Used",
        price: "500",
        is_available: false,
        weight_kg: null,
        reservation_customer_id: "cust1",
        deposit_amount: null,
      },
    ];

    const mockDbFound: any = {
      select: vi.fn().mockImplementation(() => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve(dbRows),
          }),
        }),
      })),
    };

    const repoFound = new BikesRepositoryDrizzle(mockDbFound);
    const found = await repoFound.findByIdAsync("b2");
    expect(found).not.toBeNull();
    expect(found?.bike_id).toBe("b2");
    expect(found?.price).toBe(500);

    // No rows
    const mockDbNotFound: any = {
      select: vi.fn().mockImplementation(() => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([]),
          }),
        }),
      })),
    };

    const repoNotFound = new BikesRepositoryDrizzle(mockDbNotFound);
    const missing = await repoNotFound.findByIdAsync("no-such");
    expect(missing).toBeNull();
  });

  it("create converts decimal fields to strings and returns the mapped bike", async () => {
    // Simulate the DB returning the inserted row, with numeric fields as strings
    const returnedRow = {
      bike_id: "generated-uuid",
      make: "BrandCreate",
      model: "ModelCreate",
      date_created: new Date(),
      description: "some desc",
      bike_type: null,
      size_cm: "55",
      condition: "Refurbished",
      price: "750",
      is_available: true,
      weight_kg: "11",
      reservation_customer_id: null,
      deposit_amount: "0",
    };

    const valuesSpy = vi.fn().mockReturnValue({
      returning: () => Promise.resolve([returnedRow]),
    });
    const insertMock = vi.fn().mockReturnValue({ values: valuesSpy });
    const mockDb: any = {
      insert: insertMock,
    };

    const repo = new BikesRepositoryDrizzle(mockDb);
    const input = {
      make: "BrandCreate",
      model: "ModelCreate",
      description: "some desc",
      bike_type: "",
      size_cm: 55,
      condition: "Refurbished",
      price: 750,
      is_available: true,
      weight_kg: 11,
      reservation_customer_id: "",
      deposit_amount: 0,
    } as any;

    const created = await repo.create(input);

    // insert was called
    expect(insertMock).toHaveBeenCalled();
    // values was called with processed data, where decimal-like fields are strings
    const passedValues = valuesSpy.mock.calls[0][0];
    expect(typeof passedValues.bike_id).toBe("string");
    expect(passedValues.size_cm).toBe(String(input.size_cm));
    expect(passedValues.price).toBe(String(input.price));
    expect(passedValues.reservation_customer_id).toBe(null);

    // result mapping
    expect(created.price).toBe(750);
    expect(created.size_cm).toBe(55);
  });

  it("update returns mapped bike when DB returns a row and null when none", async () => {
    const updatedRow = {
      bike_id: "b3",
      make: "Brand3",
      model: "M3",
      date_created: new Date(),
      description: "updated",
      bike_type: "Road",
      size_cm: "58",
      condition: "New",
      price: "1100",
      is_available: true,
      weight_kg: "12",
      reservation_customer_id: null,
      deposit_amount: null,
    };

    const updateChainHasRow = {
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve([updatedRow]),
        }),
      }),
    };

    const mockDbHasRow: any = {
      update: vi.fn().mockReturnValue(updateChainHasRow),
    };

    const repoHasRow = new BikesRepositoryDrizzle(mockDbHasRow);
    const updated = await repoHasRow.update("b3", { price: 1100 } as any);
    expect(updated).not.toBeNull();
    expect(updated?.price).toBe(1100);

    // No rows returned
    const updateChainNoRow = {
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve([]),
        }),
      }),
    };
    const mockDbNoRow: any = { update: vi.fn().mockReturnValue(updateChainNoRow) };
    const repoNoRow = new BikesRepositoryDrizzle(mockDbNoRow);
    const noUpdate = await repoNoRow.update("bX", {} as any);
    expect(noUpdate).toBeNull();
  });

  it("delete returns true when rows returned and false when none", async () => {
    const mockDbTrue: any = {
      delete: () => ({
        where: () => ({
          returning: () => Promise.resolve([{}]),
        }),
      }),
    };
    const repoTrue = new BikesRepositoryDrizzle(mockDbTrue);
    const resTrue = await repoTrue.delete("b4");
    expect(resTrue).toBe(true);

    const mockDbFalse: any = {
      delete: () => ({
        where: () => ({
          returning: () => Promise.resolve([]),
        }),
      }),
    };
    const repoFalse = new BikesRepositoryDrizzle(mockDbFalse);
    const resFalse = await repoFalse.delete("b5");
    expect(resFalse).toBe(false);
  });

  it("reserveBike and unreserveBike update reservation and deposit and return mapped bikes", async () => {
    const reservedRow = {
      bike_id: "b5",
      make: "BrandReserve",
      model: "MR",
      date_created: new Date(),
      description: "reserved",
      bike_type: "Hybrid",
      size_cm: "52",
      condition: "New",
      price: "900",
      is_available: false,
      weight_kg: "13",
      reservation_customer_id: "cust42",
      deposit_amount: "50",
    };

    const reserveChain = {
      update: () => ({
        set: () => ({
          where: () => ({
            returning: () => Promise.resolve([reservedRow]),
          }),
        }),
      }),
    };

    const mockDbReserve: any = {
      update: vi.fn().mockReturnValue(reserveChain.update()),
    };

    const repoReserve = new BikesRepositoryDrizzle(mockDbReserve);
    const reserved = await repoReserve.reserveBike("b5", "cust42", 50);
    expect(reserved).not.toBeNull();
    expect(reserved?.reservation_customer_id).toBe("cust42");
    expect(reserved?.deposit_amount).toBe(50);

    const unreservedRow = {
      ...reservedRow,
      reservation_customer_id: null,
      is_available: true,
      deposit_amount: null,
    };

    const unreserveChain = {
      update: () => ({
        set: () => ({
          where: () => ({
            returning: () => Promise.resolve([unreservedRow]),
          }),
        }),
      }),
    };

    const mockDbUnreserve: any = { update: vi.fn().mockReturnValue(unreserveChain.update()) };
    const repoUnreserve = new BikesRepositoryDrizzle(mockDbUnreserve);
    const unreserved = await repoUnreserve.unreserveBike("b5");
    expect(unreserved).not.toBeNull();
    expect(unreserved?.reservation_customer_id).toBeNull();
    expect(unreserved?.is_available).toBe(true);
  });

  it("findAvailableForSale returns mapped rows", async () => {
    const dbRows = [
      {
        bike_id: "b6",
        make: "SaleBrand",
        model: "S1",
        date_created: new Date(),
        description: "for sale",
        bike_type: "Road",
        size_cm: "56",
        condition: "New",
        price: "1400",
        is_available: true,
        weight_kg: "9",
        reservation_customer_id: null,
        deposit_amount: null,
      },
    ];

    const mockDb: any = {
      select: vi.fn().mockImplementation(() => makeSelectChain(dbRows)),
    };

    const repo = new BikesRepositoryDrizzle(mockDb);
    const results = await repo.findAvailableForSale();
    expect(results.length).toBe(1);
    expect(results[0].price).toBe(1400);
    expect(results[0].is_available).toBe(true);
  });
});
