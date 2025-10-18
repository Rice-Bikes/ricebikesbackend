/**
 * Bike Repository Implementation with Drizzle ORM
 */
import { eq, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "../../db/schema";
import { bikes } from "../../db/schema/bikes";
import type { Bike, BikeCreateInput, BikeRepository, BikeUpdateInput } from "../interfaces";

export class BikeRepositoryDrizzle implements BikeRepository {
  constructor(private readonly db: PostgresJsDatabase<typeof schema>) {}

  async findAll(): Promise<Bike[]> {
    const result = await this.db.select().from(bikes);
    return result.map(this.mapDbBikeToBike);
  }

  async findById(id: string): Promise<Bike | null> {
    const result = await this.db.select().from(bikes).where(eq(bikes.bike_id, id));

    if (!result.length) return null;
    return this.mapDbBikeToBike(result[0]);
  }

  async findAvailable(): Promise<Bike[]> {
    const result = await this.db.select().from(bikes).where(eq(bikes.is_available, true));

    return result.map(this.mapDbBikeToBike);
  }

  async findByType(type: string): Promise<Bike[]> {
    const result = await this.db.select().from(bikes).where(eq(bikes.bike_type, type));

    return result.map(this.mapDbBikeToBike);
  }

  async reserveBike(bikeId: string, customerId: string): Promise<Bike | null> {
    const result = await this.db
      .update(bikes)
      .set({
        is_available: false,
        reservation_customer_id: customerId,
      })
      .where(eq(bikes.bike_id, bikeId))
      .returning();

    if (!result.length) return null;
    return this.mapDbBikeToBike(result[0]);
  }

  async create(data: BikeCreateInput): Promise<Bike> {
    // Ensure required fields are set
    if (!data.make || !data.model) {
      throw new Error("Make and model are required fields for bike creation");
    }

    // Create insert data with correct types
    const insertData: any = {
      make: data.make,
      model: data.model,
      date_created: data.date_created || new Date(),
      is_available: data.is_available !== undefined ? data.is_available : true,
    };

    // Add optional fields if they exist
    if (data.description !== undefined) insertData.description = data.description;
    if (data.bike_type !== undefined) insertData.bike_type = data.bike_type;
    if (data.size_cm !== undefined) insertData.size_cm = data.size_cm;
    if (data.condition !== undefined) insertData.condition = data.condition;
    if (data.price !== undefined) insertData.price = data.price;
    if (data.weight_kg !== undefined) insertData.weight_kg = data.weight_kg;
    if (data.reservation_customer_id !== undefined) insertData.reservation_customer_id = data.reservation_customer_id;
    if (data.deposit_amount !== undefined) insertData.deposit_amount = data.deposit_amount;

    const result = await this.db.insert(bikes).values(insertData).returning();

    if (!result.length) {
      throw new Error("Failed to create bike record");
    }

    return this.mapDbBikeToBike(result[0]);
  }

  async update(id: string, data: BikeUpdateInput): Promise<Bike | null> {
    // Create update data without undefined values
    const updateData: Record<string, any> = {};

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[key] = value;
      }
    });

    // Don't update if there are no fields to update
    if (Object.keys(updateData).length === 0) {
      // Just return the current bike
      return this.findById(id);
    }

    const result = await this.db.update(bikes).set(updateData).where(eq(bikes.bike_id, id)).returning();

    if (!result.length) return null;
    return this.mapDbBikeToBike(result[0]);
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.db.delete(bikes).where(eq(bikes.bike_id, id)).returning();

      return result.length > 0;
    } catch (error) {
      return false;
    }
  }

  async count(): Promise<number> {
    const result = await this.db.select({ count: sql`count(*)` }).from(bikes);
    return Number(result[0].count);
  }

  // Helper method to convert database bike object to Bike interface type
  private mapDbBikeToBike(dbBike: any): Bike {
    return {
      bike_id: dbBike.bike_id,
      make: dbBike.make,
      model: dbBike.model,
      date_created: new Date(dbBike.date_created),
      description: dbBike.description || null,
      bike_type: dbBike.bike_type || null,
      size_cm: dbBike.size_cm ? Number(dbBike.size_cm) : null,
      condition: dbBike.condition || null,
      price: dbBike.price ? Number(dbBike.price) : null,
      is_available: Boolean(dbBike.is_available),
      weight_kg: dbBike.weight_kg ? Number(dbBike.weight_kg) : null,
      reservation_customer_id: dbBike.reservation_customer_id || null,
      deposit_amount: dbBike.deposit_amount ? Number(dbBike.deposit_amount) : null,
    };
  }
}
