import parseQBPCatalog from "@/catalog-parse";
import { logger } from "@/server";
import { type Prisma, PrismaClient } from "@prisma/client";
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
    Item.managed = true;
    return prisma.items.upsert({
      where: {
        upc: Item.upc,
      },
      update: {
        ...Item,
      },
      create: {
        ...Item,
      },
    });
  }

  async refreshItems(csv: string): Promise<Item[]> {
    // console.log("about to process csv", csv)
    const items = await parseQBPCatalog(csv);
    // console.log("items", items.length);
    const updates: Promise<Item>[] = new Array(items.length);
    let idx = 0;
    let valid_count = 0;
    for (const item of items) {
      // console.log(item);
      if (item.upc === undefined || Number.isNaN(item.wholesale_cost) || item.standard_price === undefined) {
        continue;
      }
      valid_count++;
      // console.log("item", item);
      const { upc, managed, stock, minimum_stock, ...rest } = item;
      updates[idx] = prisma.items
        .update({
          where: { upc: upc },
          data: {
            ...rest,
          },
        })
        .catch((e: Prisma.PrismaClientKnownRequestError) =>
          e.code !== "P2025" ? Promise.reject(e) : prisma.items.create({ data: { ...item, disabled: true } }),
        );
      idx++;
    }
    const parsedItems = await Promise.all(updates);
    return parsedItems;
  }

  enableItem(upc: string): Promise<Item | null> {
    return prisma.items.update({
      where: { upc: upc },
      data: {
        disabled: false,
      },
    });
  }

  getCategory(category: number): Promise<Item[]> {
    const fieldName: string = `category_${category}`;
    logger.info("fieldName", fieldName);
    return prisma.items.findMany({
      where: {
        disabled: false,
      },
      distinct: [fieldName as Prisma.ItemsScalarFieldEnum],
      orderBy: {
        [fieldName]: "asc",
      },
    });
  }
  async delete(id: string): Promise<Item> {
    return prisma.items.update({
      where: {
        item_id: id,
      },
      data: {
        disabled: true,
      },
    });
  }
  async update(Item: Item): Promise<Item> {
    console.log("update item", Item);
    return prisma.items.update({
      where: {
        upc: Item.upc,
      },
      data: Item,
    });
  }
}
