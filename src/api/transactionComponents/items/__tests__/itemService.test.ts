import { StatusCodes } from "http-status-codes";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ItemsService } from "@/api/transactionComponents/items/itemService";

function makeRepo() {
  return {
    findAllAsync: vi.fn(),
    findByIdAsync: vi.fn(),
    create: vi.fn(),
    enableItem: vi.fn(),
    refreshItems: vi.fn(),
    getCategory: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}

describe("ItemsService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("findAll returns NOT_FOUND when repository returns empty array", async () => {
    const repo = makeRepo();
    repo.findAllAsync.mockResolvedValue([]);
    const svc = new ItemsService(repo as any);

    const res = await svc.findAll(false);
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.NOT_FOUND);
  });

  it("findAll returns items when repository has results", async () => {
    const repo = makeRepo();
    const rows = [{ id: "i1" }];
    repo.findAllAsync.mockResolvedValue(rows);
    const svc = new ItemsService(repo as any);

    const res = await svc.findAll(true);
    expect(res.success).toBe(true);
    expect(res.responseObject).toEqual(rows);
  });

  it("findAll returns INTERNAL_SERVER_ERROR on repository error", async () => {
    const repo = makeRepo();
    repo.findAllAsync.mockRejectedValue(new Error("db fail"));
    const svc = new ItemsService(repo as any);

    const res = await svc.findAll(false);
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  it("findById returns NOT_FOUND when item missing", async () => {
    const repo = makeRepo();
    repo.findByIdAsync.mockResolvedValue(null);
    const svc = new ItemsService(repo as any);

    const res = await svc.findById("missing");
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.NOT_FOUND);
  });

  it("findById returns item when present", async () => {
    const repo = makeRepo();
    const item = { id: "x", name: "Item X" };
    repo.findByIdAsync.mockResolvedValue(item);
    const svc = new ItemsService(repo as any);

    const res = await svc.findById("x");
    expect(res.success).toBe(true);
    expect(res.responseObject).toEqual(item);
  });

  it("createItem returns created item on success", async () => {
    const repo = makeRepo();
    const created = { id: "new" };
    repo.create.mockResolvedValue(created);
    const svc = new ItemsService(repo as any);

    const res = await svc.createItem({} as any);
    expect(res.success).toBe(true);
    expect(res.responseObject).toEqual(created);
  });

  it("createItem returns 500 when repository throws", async () => {
    const repo = makeRepo();
    repo.create.mockRejectedValue(new Error("create fail"));
    const svc = new ItemsService(repo as any);

    const res = await svc.createItem({} as any);
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  it("enableItem returns NOT_FOUND when repository returns falsy", async () => {
    const repo = makeRepo();
    repo.enableItem.mockResolvedValue(null);
    const svc = new ItemsService(repo as any);

    const res = await svc.enableItem("nope");
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.NOT_FOUND);
  });

  it("enableItem returns success when repository enables item", async () => {
    const repo = makeRepo();
    const enabled = { id: "e1", enabled: true };
    repo.enableItem.mockResolvedValue(enabled);
    const svc = new ItemsService(repo as any);

    const res = await svc.enableItem("e1");
    expect(res.success).toBe(true);
    expect(res.responseObject).toEqual(enabled);
  });

  it("refreshItems returns NOT_FOUND when repository returns empty list", async () => {
    const repo = makeRepo();
    repo.refreshItems.mockResolvedValue([]);
    const svc = new ItemsService(repo as any);

    const res = await svc.refreshItems("csv-data");
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.NOT_FOUND);
  });

  it("refreshItems returns items on success", async () => {
    const repo = makeRepo();
    const items = [{ id: "a" }, { id: "b" }];
    repo.refreshItems.mockResolvedValue(items);
    const svc = new ItemsService(repo as any);

    const res = await svc.refreshItems("csv-data");
    expect(res.success).toBe(true);
    expect(res.responseObject).toEqual(items);
  });

  it("getCategory returns NOT_FOUND when repository returns empty list", async () => {
    const repo = makeRepo();
    repo.getCategory.mockResolvedValue([]);
    const svc = new ItemsService(repo as any);

    const res = await svc.getCategory(1);
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.NOT_FOUND);
  });

  it("getCategory extracts and filters categories correctly", async () => {
    const repo = makeRepo();
    repo.getCategory.mockResolvedValue([
      { category_1: "A" },
      { category_1: null },
      { category_1: "B" },
      { category_1: undefined },
    ]);
    const svc = new ItemsService(repo as any);

    const res = await svc.getCategory(1);
    expect(res.success).toBe(true);
    expect(res.responseObject).toEqual(["A", "B"]);
  });

  it("updateItem returns NOT_FOUND when repository returns falsy", async () => {
    const repo = makeRepo();
    repo.update.mockResolvedValue(null);
    const svc = new ItemsService(repo as any);

    const res = await svc.updateItem("id", {} as any);
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.NOT_FOUND);
  });

  it("updateItem returns updated item on success", async () => {
    const repo = makeRepo();
    const updated = { id: "u1", name: "Updated" };
    repo.update.mockResolvedValue(updated);
    const svc = new ItemsService(repo as any);

    const res = await svc.updateItem("u1", {} as any);
    expect(res.success).toBe(true);
    expect(res.responseObject).toEqual(updated);
  });

  it("deleteItem returns NOT_FOUND when repository returns falsy", async () => {
    const repo = makeRepo();
    repo.delete.mockResolvedValue(null);
    const svc = new ItemsService(repo as any);

    const res = await svc.deleteItem("x");
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.NOT_FOUND);
  });

  it("deleteItem returns deleted item on success", async () => {
    const repo = makeRepo();
    const deleted = { id: "d1" };
    repo.delete.mockResolvedValue(deleted);
    const svc = new ItemsService(repo as any);

    const res = await svc.deleteItem("d1");
    expect(res.success).toBe(true);
    expect(res.responseObject).toEqual(deleted);
  });

  // A few error paths to exercise exception handling
  it("enableItem returns 500 on repository exception", async () => {
    const repo = makeRepo();
    repo.enableItem.mockRejectedValue(new Error("fail"));
    const svc = new ItemsService(repo as any);

    const res = await svc.enableItem("id");
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  it("getCategory returns 500 on repository exception", async () => {
    const repo = makeRepo();
    repo.getCategory.mockRejectedValue(new Error("fail"));
    const svc = new ItemsService(repo as any);

    const res = await svc.getCategory(2);
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
  });
});
