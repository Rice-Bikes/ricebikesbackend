import { StatusCodes } from "http-status-codes";

import { ServiceResponse } from "@/common/models/serviceResponse";
import { serviceLogger as logger } from "@/common/utils/logger";
import type { Repair } from "./repairModel";
import type { RepairRepositoryDrizzle } from "./repairRepositoryDrizzle";
import { createRepairRepository, createRepairRepositorySync } from "./repairRepositoryFactory";
import type { RepairRepository } from "./types";

export class RepairsService {
  private repository: RepairRepository | RepairRepositoryDrizzle;
  private repositoryInitialized = false;

  constructor(repository?: RepairRepository | RepairRepositoryDrizzle) {
    // If repository is provided, use it directly
    if (repository) {
      this.repository = repository;
      this.repositoryInitialized = true;
    } else {
      // Otherwise use the sync version to have something immediately available
      this.repository = createRepairRepositorySync();

      // But also initialize the proper repository asynchronously
      this.initializeRepository();
    }
  }

  private async initializeRepository(): Promise<void> {
    try {
      this.repository = await createRepairRepository();
      this.repositoryInitialized = true;
      logger.debug("Repair repository initialized successfully");
    } catch (error) {
      logger.error(`Failed to initialize repair repository: ${error}`);
      // We already have the sync version, so we can continue
    }
  }

  // Helper method to ensure repository is initialized
  private async ensureRepository(): Promise<void> {
    if (!this.repositoryInitialized) {
      await this.initializeRepository();
    }
  }

  // Retrieves all repairs from the database
  async findAll(): Promise<ServiceResponse<Repair[] | null>> {
    try {
      await this.ensureRepository();
      const repairs = await this.repository.findAll();
      if (!repairs || repairs.length === 0) {
        return ServiceResponse.failure("No repairs found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Repair[]>("repairs found", repairs);
    } catch (ex) {
      const errorMessage = `Error finding all repairs: $${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while retrieving repairs.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Retrieves a single repair by their ID
  async findById(id: string): Promise<ServiceResponse<Repair | null>> {
    try {
      await this.ensureRepository();
      const repair = await this.repository.findById(id);
      if (!repair) {
        return ServiceResponse.failure("User not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Repair>("Repair found", repair);
    } catch (ex) {
      const errorMessage = `Error finding user with id ${id}:, ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while finding user.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  // Creates a repair
  async createRepair(repair: Repair): Promise<ServiceResponse<Repair | null>> {
    try {
      await this.ensureRepository();
      const newRepair = await this.repository.create(repair);
      return ServiceResponse.success<Repair>("Repair created", newRepair);
    } catch (ex) {
      const errorMessage = `Error creating repair: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while creating repair.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
  // Updates a repair
  async updateRepair(id: string, repair: Repair): Promise<ServiceResponse<Repair | null>> {
    try {
      await this.ensureRepository();
      const updatedRepair = await this.repository.update(id, repair);
      if (!updatedRepair) {
        return ServiceResponse.failure("Repair not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Repair>("Repair updated", updatedRepair);
    } catch (ex) {
      const errorMessage = `Error updating repair: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while updating repair.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
  // Deletes a repair
  async deleteRepair(id: string): Promise<ServiceResponse<Repair | null>> {
    try {
      await this.ensureRepository();
      const deleted = await this.repository.delete(id);
      if (!deleted) {
        return ServiceResponse.failure("Repair not found", null, StatusCodes.NOT_FOUND);
      }

      // Since the delete method returns a boolean, we'll create a basic repair object
      // with required fields to satisfy the type system
      const deletedRepair = {
        id,
        repair_id: id,
        name: "Deleted Repair",
        price: 0,
        disabled: true,
      } as Repair;

      return ServiceResponse.success<Repair>("Repair deleted", deletedRepair);
    } catch (ex) {
      const errorMessage = `Error deleting repair: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while deleting repair.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const repairsService = new RepairsService();
