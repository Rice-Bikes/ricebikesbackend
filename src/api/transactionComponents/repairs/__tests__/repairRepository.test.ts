import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db as drizzleDb } from "@/db/client";
import { RepairRepository } from "../repairRepository";
import { RepairRepositoryDrizzle } from "../repairRepositoryDrizzle";

describe("Repair Repository Implementation Comparison", () => {
  const prismaRepo = new RepairRepository();
  const drizzleRepo = new RepairRepositoryDrizzle(drizzleDb);

  let testRepairId: string;
  const testRepair = {
    description: "Test Repair",
    repair_type: "Test Type",
    price: 49.99,
    tax_rate: 0.08,
    status: "PENDING",
    complete: false,
  };

  beforeAll(async () => {
    // Clean up any existing test repairs
    const allRepairs = await prismaRepo.findAllAsync();
    for (const repair of allRepairs) {
      if (repair.description === "Test Repair") {
        await prismaRepo.delete(repair.id!);
      }
    }
  });

  describe("Basic CRUD operations", () => {
    it("should create a repair with same data in both repositories", async () => {
      // Create repairs in both repositories
      const prismaRepair = await prismaRepo.create({
        ...testRepair,
        id: undefined, // Let the repo generate the ID
      });

      // Save the ID for further tests
      testRepairId = prismaRepair.id!;

      // Create a repair with the same data in Drizzle repo
      const drizzleRepair = await drizzleRepo.create({
        ...testRepair,
        id: undefined, // Let the repo generate the ID
      });

      // Verify both repairs have required properties
      expect(prismaRepair).toHaveProperty("id");
      expect(drizzleRepair).toHaveProperty("id");
      expect(prismaRepair.description).toBe(testRepair.description);
      expect(drizzleRepair.description).toBe(testRepair.description);
      expect(prismaRepair.price).toBe(testRepair.price);
      expect(drizzleRepair.price).toBe(testRepair.price);
    });

    it("should find all repairs with both repositories", async () => {
      const prismaRepairs = await prismaRepo.findAllAsync();
      const drizzleRepairs = await drizzleRepo.findAll();

      // Verify both repositories return repairs
      expect(prismaRepairs.length).toBeGreaterThan(0);
      expect(drizzleRepairs.length).toBeGreaterThan(0);

      // Verify both contain our test repair
      const prismaTestRepair = prismaRepairs.find((repair) => repair.description === testRepair.description);
      const drizzleTestRepair = drizzleRepairs.find((repair) => repair.description === testRepair.description);

      expect(prismaTestRepair).toBeTruthy();
      expect(drizzleTestRepair).toBeTruthy();
    });

    it("should find repair by ID with both repositories", async () => {
      const prismaRepair = await prismaRepo.findByIdAsync(testRepairId);
      expect(prismaRepair).not.toBeNull();
      expect(prismaRepair!.id).toBe(testRepairId);

      // Now find the same repair using Drizzle repository
      const drizzleRepair = await drizzleRepo.findById(testRepairId);
      expect(drizzleRepair).not.toBeNull();
      expect(drizzleRepair!.id).toBe(testRepairId);

      // Compare properties
      expect(drizzleRepair!.description).toBe(prismaRepair!.description);
      expect(drizzleRepair!.repair_type).toBe(prismaRepair!.repair_type);
      expect(drizzleRepair!.price).toBe(prismaRepair!.price);
      expect(drizzleRepair!.tax_rate).toBe(prismaRepair!.tax_rate);
    });

    it("should update repair with both repositories", async () => {
      // Update using Prisma repo
      const updatedPrismaRepair = await prismaRepo.update(testRepairId, {
        description: "Updated Description (Prisma)",
        price: 59.99,
      });

      expect(updatedPrismaRepair).not.toBeNull();
      expect(updatedPrismaRepair!.description).toBe("Updated Description (Prisma)");
      expect(updatedPrismaRepair!.price).toBe(59.99);

      // Update using Drizzle repo
      const updatedDrizzleRepair = await drizzleRepo.update(testRepairId, {
        description: "Updated Description (Drizzle)",
        price: 69.99,
      });

      expect(updatedDrizzleRepair).not.toBeNull();
      expect(updatedDrizzleRepair!.description).toBe("Updated Description (Drizzle)");
      expect(updatedDrizzleRepair!.price).toBe(69.99);
    });

    it("should delete repairs with both repositories", async () => {
      // Create a new repair to delete
      const tempRepair = await prismaRepo.create({
        ...testRepair,
        description: "Temp Repair for Deletion Test",
      });

      expect(tempRepair).not.toBeNull();
      const tempRepairId = tempRepair.id!;

      // Delete using Drizzle repo
      const deletedRepair = await drizzleRepo.delete(tempRepairId);
      expect(deletedRepair).not.toBeNull();

      // Verify repair is deleted in both repositories
      const prismaRepair = await prismaRepo.findByIdAsync(tempRepairId);
      expect(prismaRepair).toBeNull();

      const drizzleRepair = await drizzleRepo.findById(tempRepairId);
      expect(drizzleRepair).toBeNull();
    });
  });

  describe("Repair-specific operations", () => {
    it("should assign and unassign repairs with both repositories", async () => {
      const userId = "test-user-id";

      // Assign using Prisma repo
      const assignedPrismaRepair = await prismaRepo.assignRepair(testRepairId, userId);
      expect(assignedPrismaRepair).not.toBeNull();
      expect(assignedPrismaRepair!.assigned_to).toBe(userId);

      // Verify assignment in Drizzle repo
      const drizzleRepair = await drizzleRepo.findById(testRepairId);
      expect(drizzleRepair!.assigned_to).toBe(userId);

      // Unassign using Drizzle repo
      const unassignedDrizzleRepair = await drizzleRepo.unassignRepair(testRepairId);
      expect(unassignedDrizzleRepair).not.toBeNull();
      expect(unassignedDrizzleRepair!.assigned_to).toBeNull();

      // Verify unassignment in Prisma repo
      const prismaRepair = await prismaRepo.findByIdAsync(testRepairId);
      expect(prismaRepair!.assigned_to).toBeNull();
    });

    it("should complete and uncomplete repairs with both repositories", async () => {
      // Complete using Prisma repo
      const completedPrismaRepair = await prismaRepo.completeRepair(testRepairId);
      expect(completedPrismaRepair).not.toBeNull();
      expect(completedPrismaRepair!.complete).toBe(true);
      expect(completedPrismaRepair!.status).toBe("COMPLETED");

      // Verify completion in Drizzle repo
      const drizzleRepair = await drizzleRepo.findById(testRepairId);
      expect(drizzleRepair!.complete).toBe(true);
      expect(drizzleRepair!.status).toBe("COMPLETED");

      // Uncomplete using Drizzle repo
      const uncompletedDrizzleRepair = await drizzleRepo.uncompleteRepair(testRepairId);
      expect(uncompletedDrizzleRepair).not.toBeNull();
      expect(uncompletedDrizzleRepair!.complete).toBe(false);
      expect(uncompletedDrizzleRepair!.status).toBe("IN_PROGRESS");

      // Verify uncompletion in Prisma repo
      const prismaRepair = await prismaRepo.findByIdAsync(testRepairId);
      expect(prismaRepair!.complete).toBe(false);
      expect(prismaRepair!.status).toBe("IN_PROGRESS");
    });

    it("should update status with both repositories", async () => {
      // Update status using Prisma repo
      const updatedPrismaRepair = await prismaRepo.updateStatus(testRepairId, "ON_HOLD");
      expect(updatedPrismaRepair).not.toBeNull();
      expect(updatedPrismaRepair!.status).toBe("ON_HOLD");

      // Verify status in Drizzle repo
      const drizzleRepair = await drizzleRepo.findById(testRepairId);
      expect(drizzleRepair!.status).toBe("ON_HOLD");

      // Update status using Drizzle repo
      const updatedDrizzleRepair = await drizzleRepo.updateStatus(testRepairId, "READY_FOR_PICKUP");
      expect(updatedDrizzleRepair).not.toBeNull();
      expect(updatedDrizzleRepair!.status).toBe("READY_FOR_PICKUP");

      // Verify status in Prisma repo
      const prismaRepair = await prismaRepo.findByIdAsync(testRepairId);
      expect(prismaRepair!.status).toBe("READY_FOR_PICKUP");
    });
  });

  // Clean up test data after all tests
  afterAll(async () => {
    try {
      await prismaRepo.delete(testRepairId);
    } catch (error) {
      console.log("Clean up error:", error);
    }
  });
});
