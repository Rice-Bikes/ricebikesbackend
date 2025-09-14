import type { Bike, CreateBikeInput, UpdateBikeInput } from "@/api/bikes/bikesModel";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper function to convert Prisma Decimal fields to numbers
function convertBikeDecimalsToNumbers(bike: any): Bike {
  return {
    ...bike,
    size_cm: bike.size_cm instanceof Prisma.Decimal ? bike.size_cm.toNumber() : bike.size_cm,
    price: bike.price instanceof Prisma.Decimal ? bike.price.toNumber() : bike.price,
    weight_kg: bike.weight_kg instanceof Prisma.Decimal ? bike.weight_kg.toNumber() : bike.weight_kg,
    deposit_amount:
      bike.deposit_amount instanceof Prisma.Decimal ? bike.deposit_amount.toNumber() : bike.deposit_amount,
  };
}

export interface BikeFilters {
  bike_type?: string;
  condition?: "New" | "Refurbished" | "Used";
  is_available?: boolean;
  min_size?: number;
  max_size?: number;
  min_price?: number;
  max_price?: number;
}

export class BikesRepository {
  async findAll(filters?: BikeFilters): Promise<Bike[]> {
    const where: any = {};

    if (filters) {
      if (filters.bike_type) {
        where.bike_type = { contains: filters.bike_type, mode: "insensitive" };
      }
      if (filters.condition) {
        where.condition = filters.condition;
      }
      if (filters.is_available !== undefined) {
        where.is_available = filters.is_available;
      }
      if (filters.min_size !== undefined || filters.max_size !== undefined) {
        where.size_cm = {};
        if (filters.min_size !== undefined) {
          where.size_cm.gte = filters.min_size;
        }
        if (filters.max_size !== undefined) {
          where.size_cm.lte = filters.max_size;
        }
      }
      if (filters.min_price !== undefined || filters.max_price !== undefined) {
        where.price = {};
        if (filters.min_price !== undefined) {
          where.price.gte = filters.min_price;
        }
        if (filters.max_price !== undefined) {
          where.price.lte = filters.max_price;
        }
      }
    }

    const bikes = await prisma.bikes.findMany({
      where,
      orderBy: { date_created: "desc" },
    });

    return bikes.map(convertBikeDecimalsToNumbers);
  }

  async findByIdAsync(bike_id: string): Promise<Bike | null> {
    const bike = await prisma.bikes.findFirst({
      where: {
        bike_id: bike_id,
      },
    });

    return bike ? convertBikeDecimalsToNumbers(bike) : null;
  }

  async create(bikeData: CreateBikeInput): Promise<Bike> {
    const bike = await prisma.bikes.create({
      data: {
        ...bikeData,
        date_created: new Date(),
      },
    });

    return convertBikeDecimalsToNumbers(bike);
  }

  async update(bike_id: string, updateData: UpdateBikeInput): Promise<Bike | null> {
    try {
      const updatedBike = await prisma.bikes.update({
        where: { bike_id },
        data: updateData,
      });
      return convertBikeDecimalsToNumbers(updatedBike);
    } catch (error) {
      // Handle case where bike doesn't exist
      return null;
    }
  }

  async delete(bike_id: string): Promise<boolean> {
    try {
      await prisma.bikes.delete({
        where: { bike_id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Find available bikes for sale
  async findAvailableForSale(filters?: BikeFilters): Promise<Bike[]> {
    const where: any = {
      is_available: true,
      price: { not: null },
    };

    if (filters) {
      if (filters.bike_type) {
        where.bike_type = { contains: filters.bike_type, mode: "insensitive" };
      }
      if (filters.condition) {
        where.condition = filters.condition;
      }
      if (filters.min_size !== undefined || filters.max_size !== undefined) {
        where.size_cm = {};
        if (filters.min_size !== undefined) {
          where.size_cm.gte = filters.min_size;
        }
        if (filters.max_size !== undefined) {
          where.size_cm.lte = filters.max_size;
        }
      }
      if (filters.min_price !== undefined || filters.max_price !== undefined) {
        where.price = { ...where.price };
        if (filters.min_price !== undefined) {
          where.price.gte = filters.min_price;
        }
        if (filters.max_price !== undefined) {
          where.price.lte = filters.max_price;
        }
      }
    }

    const bikes = await prisma.bikes.findMany({
      where,
      orderBy: [
        { condition: "asc" }, // New first, then Refurbished, then Used
        { price: "asc" },
      ],
    });

    return bikes.map(convertBikeDecimalsToNumbers);
  }

  // Reserve a bike for a customer
  async reserveBike(bike_id: string, customer_id: string, deposit_amount?: number): Promise<Bike | null> {
    try {
      const updatedBike = await prisma.bikes.update({
        where: { bike_id },
        data: {
          reservation_customer_id: customer_id,
          is_available: false,
          deposit_amount: deposit_amount || 0,
        },
      });
      return convertBikeDecimalsToNumbers(updatedBike);
    } catch (error) {
      return null;
    }
  }

  // Unreserve a bike
  async unreserveBike(bike_id: string): Promise<Bike | null> {
    try {
      const updatedBike = await prisma.bikes.update({
        where: { bike_id },
        data: {
          reservation_customer_id: null,
          is_available: true,
          deposit_amount: null,
        },
      });
      return convertBikeDecimalsToNumbers(updatedBike);
    } catch (error) {
      return null;
    }
  }
}
