import { db } from "@/db/client";
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { CreateBikeInput } from "../bikesModel";
import { BikesRepository } from "../bikesRepository";
import { BikesRepositoryDrizzle } from "../bikesRepositoryDrizzle";

// Initialize repositories
const prisma = new PrismaClient();
const prismaRepo = new BikesRepository();
const drizzleRepo = new BikesRepositoryDrizzle();

// Test data
const testBikeData: CreateBikeInput = {
  make: "Test Make",
  model: "Test Model",
  description: "Test bike for repository comparison",
  bike_type: "Road",
  size_cm: 56,
  condition: "Used",
  price: 300,
  is_available: true,
};

// Store created bike IDs for cleanup
let prismaCreatedBikeId: string | null = null;
let drizzleCreatedBikeId: string | null = null;

// Clean up test data after tests
afterAll(async () => {
  // Clean up any created test bikes
  if (prismaCreatedBikeId) {
    try {
      await prisma.bikes.delete({ where: { bike_id: prismaCreatedBikeId } });
    } catch (error) {
      console.error("Failed to delete Prisma test bike:", error);
    }
  }

  if (drizzleCreatedBikeId) {
    try {
      await drizzleRepo.delete(drizzleCreatedBikeId);
    } catch (error) {
      console.error("Failed to delete Drizzle test bike:", error);
    }
  }

  await prisma.$disconnect();
});

describe("Bike Repository Implementation Tests", () => {
  describe("Prisma Implementation", () => {
    it("should create a bike", async () => {
      const bike = await prismaRepo.create(testBikeData);
      expect(bike).toBeDefined();
      expect(bike.make).toBe(testBikeData.make);
      expect(bike.model).toBe(testBikeData.model);
      expect(bike.bike_type).toBe(testBikeData.bike_type);

      // Store the ID for later cleanup
      prismaCreatedBikeId = bike.bike_id;
    });

    it("should find a bike by ID", async () => {
      if (!prismaCreatedBikeId) {
        throw new Error("No prisma bike created to test");
      }

      const bike = await prismaRepo.findByIdAsync(prismaCreatedBikeId);
      expect(bike).toBeDefined();
      expect(bike?.bike_id).toBe(prismaCreatedBikeId);
    });

    it("should update a bike", async () => {
      if (!prismaCreatedBikeId) {
        throw new Error("No prisma bike created to test");
      }

      const updatedData = {
        description: "Updated description for Prisma bike",
        condition: "Refurbished" as const,
      };

      const updatedBike = await prismaRepo.update(prismaCreatedBikeId, updatedData);
      expect(updatedBike).toBeDefined();
      expect(updatedBike?.description).toBe(updatedData.description);
      expect(updatedBike?.condition).toBe(updatedData.condition);
    });

    it("should find available bikes for sale", async () => {
      const bikes = await prismaRepo.findAvailableForSale();
      expect(bikes).toBeDefined();
      expect(Array.isArray(bikes)).toBe(true);

      // Check that all bikes are available and have prices
      bikes.forEach((bike) => {
        expect(bike.is_available).toBe(true);
        expect(bike.price).toBeDefined();
      });
    });
  });

  describe("Drizzle Implementation", () => {
    it("should create a bike", async () => {
      const bike = await drizzleRepo.create({
        ...testBikeData,
        make: "Drizzle Make", // Slightly different to distinguish from Prisma test bike
        model: "Drizzle Model",
      });

      expect(bike).toBeDefined();
      expect(bike.make).toBe("Drizzle Make");
      expect(bike.model).toBe("Drizzle Model");
      expect(bike.bike_type).toBe(testBikeData.bike_type);

      // Store the ID for later cleanup
      drizzleCreatedBikeId = bike.bike_id;
    });

    it("should find a bike by ID", async () => {
      if (!drizzleCreatedBikeId) {
        throw new Error("No drizzle bike created to test");
      }

      const bike = await drizzleRepo.findByIdAsync(drizzleCreatedBikeId);
      expect(bike).toBeDefined();
      expect(bike?.bike_id).toBe(drizzleCreatedBikeId);
    });

    it("should update a bike", async () => {
      if (!drizzleCreatedBikeId) {
        throw new Error("No drizzle bike created to test");
      }

      const updatedData = {
        description: "Updated description for Drizzle bike",
        condition: "New" as const,
      };

      const updatedBike = await drizzleRepo.update(drizzleCreatedBikeId, updatedData);
      expect(updatedBike).toBeDefined();
      expect(updatedBike?.description).toBe(updatedData.description);
      expect(updatedBike?.condition).toBe(updatedData.condition);
    });

    it("should find available bikes for sale", async () => {
      const bikes = await drizzleRepo.findAvailableForSale();
      expect(bikes).toBeDefined();
      expect(Array.isArray(bikes)).toBe(true);

      // Check that all bikes are available and have prices
      bikes.forEach((bike) => {
        expect(bike.is_available).toBe(true);
        expect(bike.price).toBeDefined();
      });
    });
  });

  describe("Feature Parity Tests", () => {
    it("should return the same count of bikes from both implementations", async () => {
      const prismaAllBikes = await prismaRepo.findAll();
      const drizzleAllBikes = await drizzleRepo.findAll();

      expect(drizzleAllBikes.length).toBe(prismaAllBikes.length);
    });

    it("should return the same count of available bikes from both implementations", async () => {
      const prismaAvailableBikes = await prismaRepo.findAvailableForSale();
      const drizzleAvailableBikes = await drizzleRepo.findAvailableForSale();

      expect(drizzleAvailableBikes.length).toBe(prismaAvailableBikes.length);
    });

    it("should handle filtering consistently", async () => {
      const filters = {
        is_available: true,
        condition: "Used" as const,
      };

      const prismaFilteredBikes = await prismaRepo.findAll(filters);
      const drizzleFilteredBikes = await drizzleRepo.findAll(filters);

      expect(drizzleFilteredBikes.length).toBe(prismaFilteredBikes.length);
    });
  });
});
