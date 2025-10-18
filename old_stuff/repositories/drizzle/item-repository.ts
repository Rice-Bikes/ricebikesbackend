/**
 * Item Repository Implementation with Drizzle ORM
 */
import { eq, lt, or, sql } from "drizzle-orm";
import { items } from "../../db/schema/items";
import type { DrizzleDB } from "../factory";
import type { Item, ItemCreateInput, ItemRepository, ItemUpdateInput } from "../interfaces";

export class ItemRepositoryDrizzle implements ItemRepository {
  constructor(private readonly db: DrizzleDB) {}

  async findAll(): Promise<Item[]> {
    return this.db.select().from(items);
  }

  async findById(id: string): Promise<Item | null> {
    const result = await this.db.select().from(items).where(eq(items.item_id, id));

    return result.length ? result[0] : null;
  }

  async findLowStock(): Promise<Item[]> {
    // This query gets items where stock is less than minimum_stock
    // and minimum_stock is not null
    return this.db
      .select()
      .from(items)
      .where(sql`${items.minimum_stock} IS NOT NULL AND ${items.stock} < ${items.minimum_stock}`);
  }

  async findByCategory(category: string): Promise<Item[]> {
    return this.db
      .select()
      .from(items)
      .where(or(eq(items.category_1, category), eq(items.category_2, category), eq(items.category_3, category)));
  }

  async updateStock(id: string, quantity: number): Promise<Item | null> {
    // First, get current item stock
    const currentItem = await this.findById(id);
    if (!currentItem) return null;

    // Update the stock by adding the quantity to the current stock
    const result = await this.db
      .update(items)
      .set({
        stock: currentItem.stock + quantity,
      })
      .where(eq(items.item_id, id))
      .returning();

    return result.length ? result[0] : null;
  }

  async create(data: ItemCreateInput): Promise<Item> {
    const result = await this.db.insert(items).values(data).returning();

    return result[0];
  }

  async update(id: string, data: ItemUpdateInput): Promise<Item | null> {
    const result = await this.db.update(items).set(data).where(eq(items.item_id, id)).returning();

    return result.length ? result[0] : null;
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.db.delete(items).where(eq(items.item_id, id)).returning();

      return result.length > 0;
    } catch (error) {
      return false;
    }
  }

  async count(): Promise<number> {
    const result = await this.db.select({ count: sql`count(*)` }).from(items);

    return Number(result[0].count);
  }
}
