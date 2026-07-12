import { StatusCodes } from "http-status-codes";

import type { CreateStepInput, Step, UpdateStepInput } from "@/api/steps/stepsModel";
import type { StepFilters } from "@/api/steps/stepsRepositoryDrizzle";
import type { StepsRepositoryDrizzle } from "@/api/steps/stepsRepositoryDrizzle";
import { createStepRepository, createStepRepositorySync } from "@/api/steps/stepsRepositoryFactory";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { serviceLogger as logger } from "@/common/utils/logger";

export class StepsService {
  private StepsRepository: StepsRepositoryDrizzle;
  private repositoryInitialized = false;

  constructor(repository?: StepsRepositoryDrizzle) {
    // If repository is provided, use it directly
    if (repository) {
      this.StepsRepository = repository;
      this.repositoryInitialized = true;
    } else {
      // Otherwise use the sync version to have something immediately available
      this.StepsRepository = createStepRepositorySync();

      // But also initialize the proper repository asynchronously
      this.initializeRepository();
    }
  }

  private async initializeRepository(): Promise<void> {
    try {
      this.StepsRepository = await createStepRepository();
      this.repositoryInitialized = true;
      logger.debug("Step repository initialized successfully");
    } catch (error) {
      logger.error(`Failed to initialize step repository: ${error}`);
      // We already have the sync version, so we can continue
    }
  }

  // Helper method to ensure repository is initialized
  private async ensureRepository(): Promise<void> {
    if (!this.repositoryInitialized) {
      await this.initializeRepository();
    }
  }

  // Retrieves all steps from the database with optional filtering
  async findAll(filters?: StepFilters): Promise<ServiceResponse<Step[] | null>> {
    try {
      await this.ensureRepository();
      const steps = await this.StepsRepository.findAll(filters);
      return ServiceResponse.success<Step[]>("Steps found", steps ?? []);
    } catch (ex) {
      const errorMessage = `Error finding all steps: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while retrieving steps.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Retrieves a single step by its ID
  async findById(id: string): Promise<ServiceResponse<Step | null>> {
    try {
      await this.ensureRepository();
      const step = await this.StepsRepository.findByIdAsync(id);
      if (!step) {
        return ServiceResponse.failure("Step not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Step>("Step found", step);
    } catch (ex) {
      const errorMessage = `Error finding step with id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while finding step.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  // Creates a step
  async createStep(stepData: CreateStepInput): Promise<ServiceResponse<Step | null>> {
    try {
      await this.ensureRepository();
      const newStep = await this.StepsRepository.create(stepData);
      return ServiceResponse.success<Step>("Step created successfully", newStep, StatusCodes.CREATED);
    } catch (ex) {
      const errorMessage = `Error creating step: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while creating step.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  // Updates a step
  async updateStep(step_id: string, updateData: UpdateStepInput): Promise<ServiceResponse<Step | null>> {
    await this.ensureRepository();
    const oldStep = await this.StepsRepository.findByIdAsync(step_id);
    if (!oldStep) {
      return ServiceResponse.failure("Step not found", null, StatusCodes.NOT_FOUND);
    }
    try {
      const updatedStep = await this.StepsRepository.update(step_id, updateData);
      if (!updatedStep) {
        return ServiceResponse.failure("Step not found", null, StatusCodes.NOT_FOUND);
      }

      return ServiceResponse.success<Step>("Step updated successfully", updatedStep);
    } catch (ex) {
      const errorMessage = `Error updating step: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while updating step.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  // Deletes a step
  async deleteStep(step_id: string): Promise<ServiceResponse<null>> {
    try {
      await this.ensureRepository();
      const deleted = await this.StepsRepository.delete(step_id);
      if (!deleted) {
        return ServiceResponse.failure("Step not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success("Step deleted successfully", null);
    } catch (ex) {
      const errorMessage = `Error deleting step: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while deleting step.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}

export const stepsService = new StepsService();
