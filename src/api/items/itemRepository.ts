import { PrismaClient } from "@prisma/client";
import type { Item } from "./itemModel";

const prisma = new PrismaClient();

export class ItemsRepository {
  async findAllAsync(): Promise<Item[]> {
    return prisma.items.findMany({
      where: {
        disabled: false,
      },
    });
  }

  async findByIdAsync(upc: string): Promise<Item | null> {
    return (
      prisma.items.findFirst({
        where: {
          upc: upc,
        },
      }) || null
    );
  }

  async create(Item: Item): Promise<Item> {
    return prisma.items.create({
      data: Item,
    });
  }
}
