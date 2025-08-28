import { FeatureFlagsRepository } from "./featureFlagsRepository";

export class FeatureFlagsService {
  private repo: FeatureFlagsRepository;
  constructor() {
    this.repo = new FeatureFlagsRepository();
  }

  async getAllFlags() {
    return this.repo.getAllFlags();
  }

  async getFlag(flagName: string) {
    return this.repo.getFlag(flagName);
  }

  async createFlag(
    flagName: string,
    value: boolean,
    description: string,
    status: string,
    updated_by: string,
    reason?: string,
    details?: any,
  ) {
    const flag = await this.repo.createFlag({ flag_name: flagName, value, description, status, updated_by });
    await this.repo.createAudit({
      flag_name: flagName,
      old_value: null,
      new_value: value,
      changed_by: updated_by,
      reason,
      details,
    });
    return flag;
  }

  async updateFlag(flagName: string, value: boolean, updated_by: string, reason?: string, details?: any) {
    const flag = await this.repo.getFlag(flagName);
    if (!flag) throw new Error("Flag not found");
    const updated = await this.repo.updateFlag(flagName, { value, updated_by });
    await this.repo.createAudit({
      flag_name: flagName,
      old_value: flag.value,
      new_value: value,
      changed_by: updated_by,
      reason,
      details,
    });
    return updated;
  }

  async getAuditLog() {
    return this.repo.getAuditLog();
  }
}
