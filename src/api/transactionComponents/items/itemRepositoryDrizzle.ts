/**
 * Item Repository - Drizzle Implementation
 *
 * This file implements the Item repository interface using Drizzle ORM.
 */

import fs from "node:fs";
import path from "node:path";
import csvParserModule from "csv-parser";
import { and, desc, eq, not, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { v4 as uuidv4 } from "uuid";

import { serviceLogger as logger } from "@/common/utils/logger";
import { db as drizzleDb } from "@/db/client";
import type * as schema from "@/db/schema";
import { items as itemsTable } from "@/db/schema/items";
import type { Item } from "./itemModel";

/**
 * Item Repository implementation using Drizzle ORM
 */
export class ItemRepositoryDrizzle {
  private db: PostgresJsDatabase<typeof schema>;

  constructor(db = drizzleDb) {
    this.db = db;
  }

  /**
   * Find all items that are not disabled
   */
  async findAllAsync(): Promise<Item[]> {
    try {
      logger.debug("Finding all items");

      const items = await this.db
        .select()
        .from(itemsTable)
        .where(and(eq(itemsTable.disabled, false), sql`${itemsTable.upc} IS NOT NULL`))
        .orderBy(desc(itemsTable.upc));

      return items.map((item) => this.mapToItem(item));
    } catch (error) {
      logger.error({ error }, "Error finding all items");
      throw error;
    }
  }

  /**
   * Find an item by its ID
   */
  async findByIdAsync(id: string): Promise<Item | null> {
    try {
      logger.debug({ itemId: id }, "Finding item by ID");

      const items = await this.db.select().from(itemsTable).where(eq(itemsTable.item_id, id));

      if (items.length === 0) {
        return null;
      }

      return this.mapToItem(items[0]);
    } catch (error) {
      logger.error({ error, itemId: id }, "Error finding item by ID");
      throw error;
    }
  }

  /**
   * Create a new item
   */
  async create(item: Partial<Item>): Promise<Item> {
    try {
      logger.debug({ item }, "Creating new item");

      const newId = item.item_id || uuidv4();

      const newItem = {
        item_id: newId,
        upc: item.upc || "",
        name: item.name || "Unnamed Item",
        description: item.description || null,
        brand: item.brand || null,
        stock: item.stock !== undefined ? Number(item.stock) : 0,
        minimum_stock: item.minimum_stock !== undefined ? Number(item.minimum_stock) : null,
        standard_price: item.standard_price !== undefined ? Number(item.standard_price) : 0,
        wholesale_cost: item.wholesale_cost !== undefined ? Number(item.wholesale_cost) : 0,
        condition: item.condition || null,
        disabled: item.disabled !== undefined ? Boolean(item.disabled) : false,
        managed: item.managed !== undefined ? Boolean(item.managed) : false,
        category_1: item.category_1 || null,
        category_2: item.category_2 || null,
        category_3: item.category_3 || null,
        specifications: item.specifications || null,
        features: item.features || null,
      };

      await this.db.insert(itemsTable).values(newItem);
      logger.debug({ itemId: newId }, "Item created successfully");

      return this.findByIdAsync(newId) as Promise<Item>;
    } catch (error) {
      logger.error({ error }, "Error creating item");
      throw error;
    }
  }

  /**
   * Update an existing item
   */
  async update(id: string, item: Partial<Item>): Promise<Item | null> {
    try {
      logger.debug({ itemId: id, updates: item }, "Updating item");

      // Verify item exists
      const existingItem = await this.findByIdAsync(id);
      if (!existingItem) {
        logger.warn({ itemId: id }, "Attempted to update non-existent item");
        return null;
      }

      // Ensure numeric fields are properly converted
      const updateData = {
        upc: item.upc !== undefined ? item.upc : existingItem.upc,
        name: item.name !== undefined ? item.name : existingItem.name,
        description: item.description,
        brand: item.brand,
        stock: item.stock !== undefined ? Number(item.stock) : existingItem.stock,
        minimum_stock: item.minimum_stock !== undefined ? Number(item.minimum_stock) : existingItem.minimum_stock,
        standard_price: item.standard_price !== undefined ? Number(item.standard_price) : existingItem.standard_price,
        wholesale_cost: item.wholesale_cost !== undefined ? Number(item.wholesale_cost) : existingItem.wholesale_cost,
        condition: item.condition,
        disabled: item.disabled !== undefined ? Boolean(item.disabled) : existingItem.disabled,
        managed: item.managed !== undefined ? Boolean(item.managed) : existingItem.managed,
        category_1: item.category_1,
        category_2: item.category_2,
        category_3: item.category_3,
        specifications: item.specifications,
        features: item.features,
      };

      await this.db.update(itemsTable).set(updateData).where(eq(itemsTable.item_id, id));

      logger.debug({ itemId: id }, "Item updated successfully");
      return this.findByIdAsync(id);
    } catch (error) {
      logger.error({ error, itemId: id }, "Error updating item");
      throw error;
    }
  }

  /**
   * Soft delete an item by setting disabled to true
   */
  async delete(id: string): Promise<Item | null> {
    try {
      logger.debug({ itemId: id }, "Deleting item");

      // Find the item first
      const item = await this.findByIdAsync(id);
      if (!item) {
        logger.warn({ itemId: id }, "Attempted to delete non-existent item");
        return null;
      }

      // Soft delete by setting disabled to true
      await this.db
        .update(itemsTable)
        .set({
          disabled: true,
        })
        .where(eq(itemsTable.item_id, id));

      logger.debug({ itemId: id }, "Item soft-deleted");
      return item;
    } catch (error) {
      logger.error({ error, itemId: id }, "Error deleting item");
      throw error;
    }
  }

  /**
   * Enable a previously disabled item
   */
  async enableItem(id: string): Promise<Item | null> {
    try {
      logger.debug({ itemId: id }, "Enabling item");

      // Find the item first
      const items = await this.db.select().from(itemsTable).where(eq(itemsTable.item_id, id));

      if (items.length === 0) {
        logger.warn({ itemId: id }, "Attempted to enable non-existent item");
        return null;
      }

      // Update the item
      await this.db
        .update(itemsTable)
        .set({
          disabled: false,
        })
        .where(eq(itemsTable.item_id, id));

      logger.debug({ itemId: id }, "Item enabled successfully");
      return this.findByIdAsync(id);
    } catch (error) {
      logger.error({ error, itemId: id }, "Error enabling item");
      throw error;
    }
  }

  /**
   * Get distinct values for a specific category
   */
  async getCategory(category: number): Promise<any[]> {
    try {
      logger.debug({ category }, "Getting distinct values for category");

      if (category < 1 || category > 3) {
        throw new Error("Invalid category number. Must be between 1 and 3.");
      }

      const categoryColumn = `category_${category}`;

      // Use raw SQL query with a dynamic column name
      const result = await this.db.execute(
        sql`SELECT DISTINCT ${sql.identifier(categoryColumn)}
            FROM "Items"
            WHERE ${sql.identifier(categoryColumn)} IS NOT NULL
              AND disabled = false
            ORDER BY ${sql.identifier(categoryColumn)}`,
      );

      return result as any[];
    } catch (error) {
      logger.error({ error, category }, "Error getting category values");
      throw error;
    }
  }

  /**
   * Refresh items from a CSV catalog file
   */
  async refreshItems(catalogFile: string): Promise<Item[]> {
    logger.debug({ catalogFile }, "Refreshing items from catalog file");

    const catalogPath = path.resolve(catalogFile);
    if (!fs.existsSync(catalogPath)) {
      const error = new Error(`Catalog file not found: ${catalogPath}`);
      logger.error({ error, path: catalogPath }, "Catalog file not found");
      throw error;
    }

    const results: any[] = [];

    // Read catalog file
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(catalogPath)
        .pipe(csvParserModule())
        .on("data", (data) => results.push(data))
        .on("end", () => resolve())
        .on("error", (err) => reject(err));
    });

    try {
      logger.info({ itemCount: results.length }, "Processing catalog items");

      // Begin transaction
      const createdItems: Item[] = [];

      // First, mark all items as disabled
      await this.db.update(itemsTable).set({ disabled: true });

      // Process each row in the catalog
      for (const row of results) {
        // Check if item already exists by UPC
        let item: Item | null = null;

        if (row.upc) {
          const items = await this.db.select().from(itemsTable).where(eq(itemsTable.upc, row.upc));

          if (items.length > 0) {
            item = this.mapToItem(items[0]);
          }
        }

        // Parse numeric values safely
        const stock = Number.parseInt(row.stock) || 0;
        const minimumStock = row.minimum_stock ? Number.parseInt(row.minimum_stock) : null;
        const standardPrice = Number.parseFloat(row.standard_price) || 0;
        const wholesaleCost = Number.parseFloat(row.wholesale_cost) || 0;
        const managed = row.managed === "true" || Boolean(row.managed);

        // Parse JSON fields safely
        let specifications = null;
        try {
          specifications = row.specifications ? JSON.parse(row.specifications) : null;
        } catch (e) {
          logger.warn({ error: e, data: row.specifications }, "Failed to parse specifications as JSON");
        }

        let features = null;
        try {
          features = row.features ? JSON.parse(row.features) : null;
        } catch (e) {
          logger.warn({ error: e, data: row.features }, "Failed to parse features as JSON");
        }

        // Update existing or create new item
        const itemData = {
          item_id: item?.item_id || uuidv4(),
          upc: row.upc || "",
          name: row.name || "Unknown Item",
          description: row.description || null,
          brand: row.brand || null,
          stock: stock,
          minimum_stock: minimumStock,
          standard_price: standardPrice,
          wholesale_cost: wholesaleCost,
          condition: row.condition || null,
          disabled: false,
          managed: managed,
          category_1: row.category_1 || null,
          category_2: row.category_2 || null,
          category_3: row.category_3 || null,
          specifications: specifications,
          features: features,
        };

        if (item) {
          // Update existing item
          await this.db
            .update(itemsTable)
            .set({
              ...itemData,
            })
            .where(eq(itemsTable.item_id, item.item_id));

          const updatedItem = await this.findByIdAsync(item.item_id);
          if (updatedItem) {
            createdItems.push(updatedItem);
          }
        } else {
          // Create new item
          await this.db.insert(itemsTable).values({
            ...itemData,
          });

          const newItem = await this.findByIdAsync(itemData.item_id);
          if (newItem) {
            createdItems.push(newItem);
          }
        }
      }

      logger.info({ processedCount: createdItems.length }, "Catalog refresh completed");
      return createdItems;
    } catch (error) {
      logger.error({ error }, "Error refreshing items from catalog");
      throw error;
    }
  }

  /**
   * Helper method to map database record to Item model
   */
  private mapToItem(record: any): Item {
    if (!record) {
      throw new Error("Cannot map null or undefined record to Item");
    }
    if (record.item_id && record.item_id === "0bed38b4-0569-495c-a243-278c14b1f184") {
      logger.debug({ record }, "Mapping item");
    }

    // Ensure all fields have proper types
    return {
      item_id: record.item_id,
      upc: record.upc || "",
      name: record.name || "Unnamed Item",
      description: record.description,
      brand: record.brand,
      stock: typeof record.stock === "number" ? record.stock : 0,
      minimum_stock: record.minimum_stock !== null ? Number(record.minimum_stock) : null,
      standard_price: typeof record.standard_price === "number" ? record.standard_price : 0,
      wholesale_cost: typeof record.wholesale_cost === "number" ? record.wholesale_cost : 0,
      condition: record.condition,
      disabled: typeof record.disabled === "boolean" ? record.disabled : false,
      managed: typeof record.managed === "boolean" ? record.managed : false,
      category_1: record.category_1,
      category_2: record.category_2,
      category_3: record.category_3,
      specifications: record.specifications,
      features: record.features,
    };
  }
}
