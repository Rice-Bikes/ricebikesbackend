import { PrismaClient } from "@prisma/client";
import type { Repair } from "./repairModel";

const prisma = new PrismaClient();

export class RepairsRepository {
  async findAllAsync(): Promise<Repair[]> {
    return prisma.repairs.findMany({
      where: {
        disabled: false,
      },
    });
  }

  async findByIdAsync(repair_id: string): Promise<Repair | null> {
    return (
      prisma.repairs.findFirst({
        where: {
          repair_id: repair_id,
          // disabled: false,
        },
      }) || null
    );
  }

  async create(Repair: Repair): Promise<Repair> {
    return prisma.repairs.create({
      data: Repair,
    });
  }
}
