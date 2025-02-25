import parseQBPCatalog from "@/catalog-parse";
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

  async refreshItems(csv: string): Promise<Item[]> {
    // console.log("about to process csv", csv)
    const items = await parseQBPCatalog(csv);
    const updates: Promise<Item>[] = new Array(items.length);
    let idx = 0;
    let valid_count = 0;
    for (const item of items) {
      // console.log(item);
      if (item.upc === undefined) {
        continue;
      }
      valid_count++;
      console.log("item", item);
      updates[idx] = prisma.items.upsert({
        where: { upc: item.upc },
        update: {
          standard_price: item.standard_price,
          name: item.name,
        },
        create: item,
      });
      idx++;
    }
    const parsedItems = await Promise.all(updates);
    console.log("first item in list", parsedItems[0], valid_count);

    return parsedItems;
    // return prisma.items.findMany();
  }
}
