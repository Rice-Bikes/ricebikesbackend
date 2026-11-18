import { StatusCodes } from "http-status-codes";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BikesService } from "@/api/bikes/bikesService";
import notificationTriggerService from "@/services/notificationTriggerService";
import { transactionHistoryService } from "@/services/transactionHistoryService";

function makeRepo() {
  return {
    findAll: vi.fn(),
    findAvailableForSale: vi.fn(),
    findByIdAsync: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    reserveBike: vi.fn(),
    unreserveBike: vi.fn(),
  };
}

describe("BikesService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // updateBike records history, which would otherwise look up the bike's
    // transactions in the real database.
    vi.spyOn(transactionHistoryService, "recordByBikeId").mockResolvedValue();
  });

  it("findAll returns 404 when no bikes found", async () => {
    const repo = makeRepo();
    repo.findAll.mockResolvedValue([]);
    const svc = new BikesService(repo as any);

    const res = await svc.findAll();
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.NOT_FOUND);
  });

  it("findAll returns bikes when repository returns results", async () => {
    const repo = makeRepo();
    const bikes = [{ id: "b1", make: "X" }];
    repo.findAll.mockResolvedValue(bikes);
    const svc = new BikesService(repo as any);

    const res = await svc.findAll();
    expect(res.success).toBe(true);
    expect(res.responseObject).toEqual(bikes);
  });

  it("findAll returns 500 on repository error", async () => {
    const repo = makeRepo();
    repo.findAll.mockRejectedValue(new Error("DB down"));
    const svc = new BikesService(repo as any);

    const res = await svc.findAll();
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  it("findAvailableForSale returns 404 when no bikes available", async () => {
    const repo = makeRepo();
    repo.findAvailableForSale.mockResolvedValue([]);
    const svc = new BikesService(repo as any);

    const res = await svc.findAvailableForSale();
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.NOT_FOUND);
  });

  it("findAvailableForSale returns bikes when repository returns results", async () => {
    const repo = makeRepo();
    const bikes = [{ id: "b2", make: "Y" }];
    repo.findAvailableForSale.mockResolvedValue(bikes);
    const svc = new BikesService(repo as any);

    const res = await svc.findAvailableForSale();
    expect(res.success).toBe(true);
    expect(res.responseObject).toEqual(bikes);
  });

  it("findById returns 404 when bike not found", async () => {
    const repo = makeRepo();
    repo.findByIdAsync.mockResolvedValue(null);
    const svc = new BikesService(repo as any);

    const res = await svc.findById("missing");
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.NOT_FOUND);
  });

  it("findById returns bike when found", async () => {
    const repo = makeRepo();
    const bike = { id: "b3", make: "Z" };
    repo.findByIdAsync.mockResolvedValue(bike);
    const svc = new BikesService(repo as any);

    const res = await svc.findById("b3");
    expect(res.success).toBe(true);
    expect(res.responseObject).toEqual(bike);
  });

  it("findById returns 500 when repository throws", async () => {
    const repo = makeRepo();
    repo.findByIdAsync.mockRejectedValue(new Error("oops"));
    const svc = new BikesService(repo as any);

    const res = await svc.findById("b4");
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  it("createBike returns CREATED and bike object on success", async () => {
    const repo = makeRepo();
    const created = { id: "new", make: "NewCo" };
    repo.create.mockResolvedValue(created);
    const svc = new BikesService(repo as any);

    const res = await svc.createBike({ make: "NewCo" } as any);
    expect(res.success).toBe(true);
    expect(res.statusCode).toBe(StatusCodes.CREATED);
    expect(res.responseObject).toEqual(created);
  });

  it("createBike returns 500 on repository error", async () => {
    const repo = makeRepo();
    repo.create.mockRejectedValue(new Error("create fail"));
    const svc = new BikesService(repo as any);

    const res = await svc.createBike({ make: "Bad" } as any);
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  it("updateBike returns 404 when old bike not found", async () => {
    const repo = makeRepo();
    repo.findByIdAsync.mockResolvedValue(null);
    const svc = new BikesService(repo as any);

    const res = await svc.updateBike("does-not-exist", { make: "no" } as any);
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.NOT_FOUND);
  });

  it("updateBike returns 404 when update returns null", async () => {
    const repo = makeRepo();
    repo.findByIdAsync.mockResolvedValue({ id: "exists" });
    repo.update.mockResolvedValue(null);
    const svc = new BikesService(repo as any);

    const res = await svc.updateBike("exists", { make: "updated" } as any);
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.NOT_FOUND);
  });

  it("updateBike returns updated bike on success", async () => {
    const repo = makeRepo();
    const old = { id: "exists", make: "old" };
    const updated = { id: "exists", make: "updated" };
    repo.findByIdAsync.mockResolvedValue(old);
    repo.update.mockResolvedValue(updated);
    const svc = new BikesService(repo as any);

    const res = await svc.updateBike("exists", { make: "updated" } as any);
    expect(res.success).toBe(true);
    expect(res.responseObject).toEqual(updated);
  });

  it("updateBike returns 500 when update throws", async () => {
    const repo = makeRepo();
    repo.findByIdAsync.mockResolvedValue({ id: "exists" });
    repo.update.mockRejectedValue(new Error("fail update"));
    const svc = new BikesService(repo as any);

    const res = await svc.updateBike("exists", { make: "updated" } as any);
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  it("deleteBike returns 404 when nothing deleted", async () => {
    const repo = makeRepo();
    repo.delete.mockResolvedValue(false);
    const svc = new BikesService(repo as any);

    const res = await svc.deleteBike("id");
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.NOT_FOUND);
  });

  it("deleteBike returns success when deleted", async () => {
    const repo = makeRepo();
    repo.delete.mockResolvedValue(true);
    const svc = new BikesService(repo as any);

    const res = await svc.deleteBike("id");
    expect(res.success).toBe(true);
    expect(res.responseObject).toBeNull();
  });

  it("deleteBike returns 500 when repository throws", async () => {
    const repo = makeRepo();
    repo.delete.mockRejectedValue(new Error("db error"));
    const svc = new BikesService(repo as any);

    const res = await svc.deleteBike("id");
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  it("reserveBike returns 404 when repository returns null", async () => {
    const repo = makeRepo();
    repo.reserveBike.mockResolvedValue(null);
    const svc = new BikesService(repo as any);

    const res = await svc.reserveBike("bike", "cust", 10);
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.NOT_FOUND);
  });

  it("reserveBike returns success and calls notification service on success", async () => {
    const repo = makeRepo();
    const reserved = { id: "r1", make: "Make", model: "Model", condition: "Used", price: 100 };
    repo.reserveBike.mockResolvedValue(reserved);
    const notifySpy = vi.spyOn(notificationTriggerService, "handleBikeReservation").mockResolvedValue();
    const svc = new BikesService(repo as any);

    const res = await svc.reserveBike("bike", "cust", 25);
    expect(res.success).toBe(true);
    expect(res.responseObject).toEqual(reserved);
    expect(notifySpy).toHaveBeenCalled();
  });

  it("reserveBike logs notification error but still returns success", async () => {
    const repo = makeRepo();
    const reserved = { id: "r2", make: "Make", model: "Model", condition: "Used", price: 50 };
    repo.reserveBike.mockResolvedValue(reserved);
    vi.spyOn(notificationTriggerService, "handleBikeReservation").mockRejectedValue(new Error("slack down"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const svc = new BikesService(repo as any);

    const res = await svc.reserveBike("bike", "cust", 5);
    expect(res.success).toBe(true);
    // ensure we didn't throw and that notification error was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Failed to send bike reservation notification:"),
      expect.anything(),
    );
  });

  it("unreserveBike returns 404 when not found", async () => {
    const repo = makeRepo();
    repo.unreserveBike.mockResolvedValue(null);
    const svc = new BikesService(repo as any);

    const res = await svc.unreserveBike("nope");
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.NOT_FOUND);
  });

  it("unreserveBike returns success on success", async () => {
    const repo = makeRepo();
    const unreserved = { id: "u1", make: "A" };
    repo.unreserveBike.mockResolvedValue(unreserved);
    const svc = new BikesService(repo as any);

    const res = await svc.unreserveBike("u1");
    expect(res.success).toBe(true);
    expect(res.responseObject).toEqual(unreserved);
  });

  it("unreserveBike returns 500 when repository throws", async () => {
    const repo = makeRepo();
    repo.unreserveBike.mockRejectedValue(new Error("fail"));
    const svc = new BikesService(repo as any);

    const res = await svc.unreserveBike("u1");
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
  });
});

describe("bike history", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  /** A stored bike, with every field the history looks at populated. */
  function bike(overrides: Record<string, unknown> = {}) {
    return {
      bike_id: "bike-1",
      make: "Trek",
      model: "FX 2",
      description: "blue, slight scratch on the top tube",
      bike_type: "hybrid",
      size_cm: 56,
      condition: "Used",
      price: 450,
      is_available: true,
      weight_kg: 11.5,
      reservation_customer_id: null,
      deposit_amount: null,
      ...overrides,
    };
  }

  it("logs a changed model against the bike's transactions", async () => {
    const repo = makeRepo();
    repo.findByIdAsync.mockResolvedValue(bike());
    repo.update.mockResolvedValue(bike({ model: "FX 3 Disc" }));
    const history = vi.spyOn(transactionHistoryService, "recordByBikeId").mockResolvedValue();

    const svc = new BikesService(repo as any);
    const res = await svc.updateBike("bike-1", { model: "FX 3 Disc" } as any, "user-1");

    expect(res.success).toBe(true);
    expect(history).toHaveBeenCalledWith("bike-1", "user-1", [
      { change_type: "bike", description: 'changed the bike model to "FX 3 Disc"' },
    ]);
  });

  it("logs each detail an edit changed", async () => {
    const repo = makeRepo();
    repo.findByIdAsync.mockResolvedValue(bike());
    repo.update.mockResolvedValue(bike({ make: "Specialized", model: "Sirrus", price: 525.5 }));
    const history = vi.spyOn(transactionHistoryService, "recordByBikeId").mockResolvedValue();

    const svc = new BikesService(repo as any);
    await svc.updateBike("bike-1", {} as any, "user-1");

    expect(history.mock.calls[0][2]).toEqual([
      { change_type: "bike", description: 'changed the bike make to "Specialized"' },
      { change_type: "bike", description: 'changed the bike model to "Sirrus"' },
      { change_type: "bike", description: "changed the bike price to $525.50" },
    ]);
  });

  it("writes nothing when an edit changed no detail", async () => {
    const repo = makeRepo();
    repo.findByIdAsync.mockResolvedValue(bike());
    repo.update.mockResolvedValue(bike());
    const history = vi.spyOn(transactionHistoryService, "recordByBikeId").mockResolvedValue();

    const svc = new BikesService(repo as any);
    await svc.updateBike("bike-1", { model: "FX 2" } as any, "user-1");

    expect(history).toHaveBeenCalledWith("bike-1", "user-1", []);
  });

  it("reports a detail that was emptied as cleared rather than as empty quotes", async () => {
    const repo = makeRepo();
    repo.findByIdAsync.mockResolvedValue(bike());
    repo.update.mockResolvedValue(bike({ description: "", size_cm: null, price: null }));
    const history = vi.spyOn(transactionHistoryService, "recordByBikeId").mockResolvedValue();

    const svc = new BikesService(repo as any);
    await svc.updateBike("bike-1", {} as any, "user-1");

    expect(history.mock.calls[0][2]).toEqual([
      { change_type: "bike", description: "cleared the bike description" },
      { change_type: "bike", description: "cleared the bike size" },
      { change_type: "bike", description: "cleared the bike price" },
    ]);
  });

  it("reports availability and reservation in words, not as raw values", async () => {
    const repo = makeRepo();
    repo.findByIdAsync.mockResolvedValue(bike());
    repo.update.mockResolvedValue(bike({ is_available: false, reservation_customer_id: "cust-1" }));
    const history = vi.spyOn(transactionHistoryService, "recordByBikeId").mockResolvedValue();

    const svc = new BikesService(repo as any);
    await svc.updateBike("bike-1", {} as any, "user-1");

    expect(history.mock.calls[0][2]).toEqual([
      { change_type: "bike", description: "marked the bike unavailable" },
      { change_type: "bike", description: "reserved the bike for a customer" },
    ]);
    // The customer's id is not a name, so it must not leak into the history.
    for (const entry of history.mock.calls[0][2]) {
      expect(entry.description).not.toContain("cust-1");
    }
  });

  it("records size and weight with their units", async () => {
    const repo = makeRepo();
    repo.findByIdAsync.mockResolvedValue(bike());
    repo.update.mockResolvedValue(bike({ size_cm: 58, weight_kg: 12.25 }));
    const history = vi.spyOn(transactionHistoryService, "recordByBikeId").mockResolvedValue();

    const svc = new BikesService(repo as any);
    await svc.updateBike("bike-1", {} as any, "user-1");

    expect(history.mock.calls[0][2]).toEqual([
      { change_type: "bike", description: "changed the bike size to 58 cm" },
      { change_type: "bike", description: "changed the bike weight to 12.25 kg" },
    ]);
  });

  it("does not write history when the bike was not updated", async () => {
    const repo = makeRepo();
    repo.findByIdAsync.mockResolvedValue(bike());
    repo.update.mockResolvedValue(null);
    const history = vi.spyOn(transactionHistoryService, "recordByBikeId").mockResolvedValue();

    const svc = new BikesService(repo as any);
    const res = await svc.updateBike("bike-1", { model: "FX 3" } as any, "user-1");

    expect(res.success).toBe(false);
    expect(history).not.toHaveBeenCalled();
  });
});
