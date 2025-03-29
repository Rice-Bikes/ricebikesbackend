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
  async update(repair_id: string, Repair: Repair): Promise<Repair> {
    console.log("update repair", Repair);
    const repair = await prisma.repairs.findFirst({
      where: {
        repair_id: repair_id,
      },
    });

    if (repair != null && repair.price !== Repair.price) {
      console.log("repair price changed");
      const createdObj = await prisma.repairs.create({
        data: {
          ...Repair,
          disabled: false,
          repair_id: crypto.randomUUID(),
        },
      });
    }

    return prisma.repairs.update({
      where: {
        repair_id: repair_id,
      },
      data: {
        disabled: repair != null && repair.price !== Repair.price,
      },
    });
  }
  async delete(repair_id: string): Promise<Repair> {
    return prisma.repairs.update({
      where: {
        repair_id: repair_id,
      },
      data: {
        disabled: true,
      },
    });
  }
}
