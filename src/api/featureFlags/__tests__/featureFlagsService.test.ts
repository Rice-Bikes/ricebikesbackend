import { FeatureFlagsRepository } from "@/api/featureFlags/featureFlagsRepository";
import { FeatureFlagsService } from "@/api/featureFlags/featureFlagsService";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("FeatureFlagsService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("createFlag calls repo.createFlag and repo.createAudit", async () => {
    const created = { flag_name: "f1", value: true } as any;
    const createSpy = vi.spyOn(FeatureFlagsRepository.prototype, "createFlag").mockResolvedValue(created);
    const auditSpy = vi.spyOn(FeatureFlagsRepository.prototype, "createAudit").mockResolvedValue({} as any);

    const svc = new FeatureFlagsService();

    const res = await svc.createFlag("f1", true, "desc", "active", "me", "reason", { x: 1 });

    expect(createSpy).toHaveBeenCalledWith({
      flag_name: "f1",
      value: true,
      description: "desc",
      status: "active",
      updated_by: "me",
    });
    expect(auditSpy).toHaveBeenCalledWith(expect.objectContaining({ flag_name: "f1", new_value: true }));
    expect(res).toEqual(created);
  });

  it("updateFlag throws when flag not found", async () => {
    vi.spyOn(FeatureFlagsRepository.prototype, "getFlag").mockResolvedValue(null as any);
    const svc = new FeatureFlagsService();
    await expect(svc.updateFlag("not-there", true, "me")).rejects.toThrow("Flag not found");
  });

  it("updateFlag updates flag and creates audit when flag exists", async () => {
    vi.spyOn(FeatureFlagsRepository.prototype, "getFlag").mockResolvedValue({ flag_name: "f2", value: false } as any);
    vi.spyOn(FeatureFlagsRepository.prototype, "updateFlag").mockResolvedValue({ flag_name: "f2", value: true } as any);
    const auditSpy = vi.spyOn(FeatureFlagsRepository.prototype, "createAudit").mockResolvedValue({} as any);

    const svc = new FeatureFlagsService();
    const res = await svc.updateFlag("f2", true, "me", "because", {
      extra: true,
    });

    expect(res).toEqual({ flag_name: "f2", value: true });
    expect(auditSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        flag_name: "f2",
        old_value: false,
        new_value: true,
      }),
    );
  });

  it("getAllFlags and getAuditLog simply delegate to repo", async () => {
    const flags = [{ flag_name: "a" }];
    const audits = [{ flag_name: "a", new_value: true }];
    vi.spyOn(FeatureFlagsRepository.prototype, "getAllFlags").mockResolvedValue(flags as any);
    vi.spyOn(FeatureFlagsRepository.prototype, "getAuditLog").mockResolvedValue(audits as any);

    const svc = new FeatureFlagsService();
    expect(await svc.getAllFlags()).toEqual(flags);
    expect(await svc.getAuditLog()).toEqual(audits);
  });
});
