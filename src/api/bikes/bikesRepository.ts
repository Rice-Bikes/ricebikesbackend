import type { Bike } from "@/api/bikes/bikeModel";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class BikesRepository {
  async findAllAsync(): Promise<Bike[]> {
    return prisma.bikes.findMany();
  }

  async findByIdAsync(bike_id: string): Promise<Bike | null> {
    return (
      prisma.bikes.findFirst({
        where: {
          bike_id: bike_id,
        },
      }) || null
    );
  }

  async create(bike: Bike): Promise<Bike> {
    return prisma.bikes.create({
      data: bike,
    });
  }
}
