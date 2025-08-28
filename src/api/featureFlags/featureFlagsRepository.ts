import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class FeatureFlagsRepository {
  async getAllFlags() {
    return prisma.featureFlags.findMany();
  }

  async getFlag(flagName: string) {
    return prisma.featureFlags.findUnique({ where: { flag_name: flagName } });
  }

  async createFlag(data: {
    flag_name: string;
    value: boolean;
    description?: string;
    status?: string;
    updated_by: string;
  }) {
    return prisma.featureFlags.create({ data });
  }

  async updateFlag(flagName: string, data: { value: boolean; updated_by: string }) {
    return prisma.featureFlags.update({ where: { flag_name: flagName }, data });
  }

  async getAuditLog() {
    return prisma.featureFlagAudit.findMany({ orderBy: { changed_at: "desc" } });
  }

  async createAudit(data: {
    flag_name: string;
    old_value: boolean | null;
    new_value: boolean;
    changed_by: string;
    reason?: string;
    details?: any;
  }) {
    return prisma.featureFlagAudit.create({ data });
  }
}
