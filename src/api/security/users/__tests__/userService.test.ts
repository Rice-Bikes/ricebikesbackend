import { UsersService } from "@/api/security/users/userService";
import { StatusCodes } from "http-status-codes";
import { beforeEach, describe, expect, it, vi } from "vitest";

function makeRepo() {
  return {
    findAllAsync: vi.fn(),
    findByIdAsync: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    attachRoleToUser: vi.fn(),
    detachRoleFromUser: vi.fn(),
  };
}

describe("UsersService", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("findAll returns NOT_FOUND when empty", async () => {
    const repo = makeRepo();
    repo.findAllAsync.mockResolvedValue([]);
    const svc = new UsersService(repo as any);
    const res = await svc.findAll();
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.NOT_FOUND);
  });

  it("findAll returns users when present", async () => {
    const repo = makeRepo();
    const users = [{ id: "u1", username: "bob" }];
    repo.findAllAsync.mockResolvedValue(users);
    const svc = new UsersService(repo as any);
    const res = await svc.findAll();
    expect(res.success).toBe(true);
    expect(res.responseObject).toEqual(users);
  });

  it("findById returns NOT_FOUND when missing", async () => {
    const repo = makeRepo();
    repo.findByIdAsync.mockResolvedValue(null);
    const svc = new UsersService(repo as any);
    const res = await svc.findById("x");
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.NOT_FOUND);
  });

  it("createUser returns created user on success", async () => {
    const repo = makeRepo();
    repo.create.mockResolvedValue({ id: "u1" });
    const svc = new UsersService(repo as any);
    const res = await svc.createUser({} as any);
    expect(res.success).toBe(true);
    expect(res.responseObject).toEqual({ id: "u1" });
  });

  it("createUser returns 500 on error", async () => {
    const repo = makeRepo();
    repo.create.mockRejectedValue(new Error("create fail"));
    const svc = new UsersService(repo as any);
    const res = await svc.createUser({} as any);
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  it("updateUser returns NOT_FOUND when repository returns falsy", async () => {
    const repo = makeRepo();
    repo.update.mockResolvedValue(null);
    const svc = new UsersService(repo as any);
    const res = await svc.updateUser("id", {} as any);
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.NOT_FOUND);
  });

  it("updateUser returns updated user when successful", async () => {
    const repo = makeRepo();
    repo.update.mockResolvedValue({ id: "u2", username: "alice" });
    const svc = new UsersService(repo as any);
    const res = await svc.updateUser("u2", { username: "alice" } as any);
    expect(res.success).toBe(true);
    expect(res.responseObject).toEqual({ id: "u2", username: "alice" });
  });

  it("deleteUser returns NOT_FOUND when repository returns falsy", async () => {
    const repo = makeRepo();
    repo.delete.mockResolvedValue(null);
    const svc = new UsersService(repo as any);
    const res = await svc.deleteUser("id");
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.NOT_FOUND);
  });

  it("deleteUser returns deleted user on success", async () => {
    const repo = makeRepo();
    repo.delete.mockResolvedValue({ id: "d1" });
    const svc = new UsersService(repo as any);
    const res = await svc.deleteUser("d1");
    expect(res.success).toBe(true);
    expect(res.responseObject).toEqual({ id: "d1" });
  });

  it("attachRoleToUser returns NOT_FOUND and success paths", async () => {
    const repo = makeRepo();
    repo.attachRoleToUser.mockResolvedValue(null);
    const svc = new UsersService(repo as any);
    const res = await svc.attachRoleToUser("u", "r");
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.NOT_FOUND);

    repo.attachRoleToUser.mockResolvedValue({ user_id: "u", role_id: "r" });
    const res2 = await svc.attachRoleToUser("u", "r");
    expect(res2.success).toBe(true);
    expect(res2.responseObject).toEqual({ user_id: "u", role_id: "r" });
  });

  it("detachRoleFromUser returns NOT_FOUND and success paths", async () => {
    const repo = makeRepo();
    repo.detachRoleFromUser.mockResolvedValue(null);
    const svc = new UsersService(repo as any);
    const res = await svc.detachRoleFromUser("u", "r");
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.NOT_FOUND);

    repo.detachRoleFromUser.mockResolvedValue({ user_id: "u", role_id: "r" });
    const res2 = await svc.detachRoleFromUser("u", "r");
    expect(res2.success).toBe(true);
    expect(res2.responseObject).toEqual({ user_id: "u", role_id: "r" });
  });
});
