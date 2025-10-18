import type { Bike, CreateBikeInput, UpdateBikeInput } from "@/api/bikes/bikesModel";
import { serviceLogger as logger } from "@/common/utils/logger";
import { db } from "@/db/client";
import type * as schema from "@/db/schema";
import { bikes } from "@/db/schema/bikes";
import { and, asc, desc, eq, gte, ilike, isNotNull, isNull, lte } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
export interface BikeFilters {
  bike_type?: string;
  condition?: "New" | "Refurbished" | "Used";
  is_available?: boolean;
  min_size?: number;
  max_size?: number;
  min_price?: number;
  max_price?: number;
}
export class BikesRepositoryDrizzle {
  private db: PostgresJsDatabase<typeof schema>;

  constructor(dbInstance = db) {
    this.db = dbInstance;
  }

  /**
   * Helper method to map database record to Bike model with proper type conversions
   */
  private mapToBike(record: any): Bike {
    if (!record) {
      throw new Error("Cannot map null or undefined record to Bike");
    }

    return {
      bike_id: record.bike_id,
      make: record.make,
      model: record.model,
      date_created: record.date_created,
      description: record.description,
      bike_type: record.bike_type,
      size_cm: record.size_cm !== null ? Number(record.size_cm) : null,
      condition: record.condition,
      price: record.price !== null ? Number(record.price) : null,
      is_available: Boolean(record.is_available),
      weight_kg: record.weight_kg !== null ? Number(record.weight_kg) : null,
      reservation_customer_id: record.reservation_customer_id,
      deposit_amount: record.deposit_amount !== null ? Number(record.deposit_amount) : null,
    };
  }
  /**
   * Find all bikes with optional filtering
   */
  async findAll(filters?: BikeFilters): Promise<Bike[]> {
    try {
      const conditions = [];

      if (filters) {
        if (filters.bike_type) {
          conditions.push(ilike(bikes.bike_type, `%${filters.bike_type}%`));
        }
        if (filters.condition) {
          conditions.push(eq(bikes.condition, filters.condition));
        }
        if (filters.is_available !== undefined) {
          conditions.push(eq(bikes.is_available, filters.is_available));
        }
      }

      // Combine conditions using 'and' if there are any
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const result = await this.db.select().from(bikes).where(whereClause).orderBy(desc(bikes.date_created));

      return result.map((record) => this.mapToBike(record));
    } catch (error) {
      logger.error(`[BikesRepositoryDrizzle] findAll error: ${error}`);
      throw error;
    }
  }

  /**
   * Find bike by ID
   */
  async findByIdAsync(bike_id: string): Promise<Bike | null> {
    try {
      const result = await this.db.select().from(bikes).where(eq(bikes.bike_id, bike_id)).limit(1);

      return result.length > 0 ? this.mapToBike(result[0]) : null;
    } catch (error) {
      logger.error(`[BikesRepositoryDrizzle] findByIdAsync error: ${error}`);
      throw error;
    }
  }

  /**
   * Create a new bike
   */
  async create(bikeData: CreateBikeInput): Promise<Bike> {
    try {
      logger.debug({ bikeData }, "[BikesRepositoryDrizzle] create input data");

      // Helper function to convert empty strings to null and numbers to strings
      const convertDecimalField = (value: any) => {
        if (value == null || value === "") return null;
        return String(value);
      };

      // Build processed data with explicit null handling for decimal fields
      const processedData = {
        bike_id: crypto.randomUUID(),
        make: bikeData.make,
        model: bikeData.model,
        description: bikeData.description,
        bike_type: bikeData.bike_type === "" ? null : bikeData.bike_type,
        size_cm: convertDecimalField(bikeData.size_cm),
        condition: bikeData.condition,
        price: convertDecimalField(bikeData.price),
        is_available: bikeData.is_available,
        weight_kg: convertDecimalField(bikeData.weight_kg),
        reservation_customer_id: bikeData.reservation_customer_id === "" ? null : bikeData.reservation_customer_id,
        deposit_amount: convertDecimalField(bikeData.deposit_amount),
        date_created: new Date(),
      };

      logger.debug({ processedData }, "[BikesRepositoryDrizzle] processed data for insert");

      const result = await this.db.insert(bikes).values(processedData).returning();

      return this.mapToBike(result[0]);
    } catch (error) {
      logger.error({ error, bikeData }, "[BikesRepositoryDrizzle] create error");
      throw error;
    }
  }

  /**
   * Update an existing bike
   */
  async update(bike_id: string, updateData: UpdateBikeInput): Promise<Bike | null> {
    try {
      // Helper function to convert empty strings to null and numbers to strings
      const convertDecimalField = (value: any) => {
        if (value == null || value === "") return null;
        return String(value);
      };

      // Build processed data with explicit null handling for decimal fields
      const processedData = {
        ...updateData,
        bike_type: updateData.bike_type === "" ? null : updateData.bike_type,
        size_cm: convertDecimalField(updateData.size_cm),
        price: convertDecimalField(updateData.price),
        weight_kg: convertDecimalField(updateData.weight_kg),
        reservation_customer_id: updateData.reservation_customer_id === "" ? null : updateData.reservation_customer_id,
        deposit_amount: convertDecimalField(updateData.deposit_amount),
      };

      const result = await this.db.update(bikes).set(processedData).where(eq(bikes.bike_id, bike_id)).returning();

      return result.length > 0 ? this.mapToBike(result[0]) : null;
    } catch (error) {
      logger.error({ error, updateData, bike_id }, "[BikesRepositoryDrizzle] update error");
      return null;
    }
  }

  /**
   * Delete a bike
   */
  async delete(bike_id: string): Promise<boolean> {
    try {
      const result = await this.db.delete(bikes).where(eq(bikes.bike_id, bike_id)).returning();

      return result.length > 0;
    } catch (error) {
      logger.error(`[BikesRepositoryDrizzle] delete error: ${error}`);
      return false;
    }
  }

  /**
   * Find bikes available for sale
   */
  async findAvailableForSale(filters?: BikeFilters): Promise<Bike[]> {
    try {
      const conditions = [eq(bikes.is_available, true), isNotNull(bikes.price)];

      if (filters) {
        if (filters.bike_type) {
          conditions.push(ilike(bikes.bike_type, `%${filters.bike_type}%`));
        }
        if (filters.condition) {
          conditions.push(eq(bikes.condition, filters.condition));
        }
      }

      const result = await this.db
        .select()
        .from(bikes)
        .where(and(...conditions))
        .orderBy(
          asc(bikes.condition), // New first, then Refurbished, then Used
          asc(bikes.price),
        );

      return result.map((record) => this.mapToBike(record));
    } catch (error) {
      logger.error(`[BikesRepositoryDrizzle] findAvailableForSale error: ${error}`);
      throw error;
    }
  }

  /**
   * Reserve a bike for a customer
   */
  async reserveBike(bike_id: string, customer_id: string, deposit_amount?: number): Promise<Bike | null> {
    try {
      const result = await this.db
        .update(bikes)
        .set({
          reservation_customer_id: customer_id,
          is_available: false,
          deposit_amount: deposit_amount != null ? String(deposit_amount) : "0",
        })
        .where(eq(bikes.bike_id, bike_id))
        .returning();

      return result.length > 0 ? this.mapToBike(result[0]) : null;
    } catch (error) {
      logger.error(`[BikesRepositoryDrizzle] reserveBike error: ${error}`);
      return null;
    }
  }

  /**
   * Unreserve a bike
   */
  async unreserveBike(bike_id: string): Promise<Bike | null> {
    try {
      const result = await this.db
        .update(bikes)
        .set({
          reservation_customer_id: null,
          is_available: true,
          deposit_amount: null,
        })
        .where(eq(bikes.bike_id, bike_id))
        .returning();

      return result.length > 0 ? this.mapToBike(result[0]) : null;
    } catch (error) {
      logger.error(`[BikesRepositoryDrizzle] unreserveBike error: ${error}`);
      return null;
    }
  }
}
