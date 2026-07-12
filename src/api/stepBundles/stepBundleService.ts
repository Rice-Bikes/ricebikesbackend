import { StatusCodes } from "http-status-codes";

import type { CreateStepBundleInput, StepBundle, UpdateStepBundleInput } from "@/api/stepBundles/stepBundleModel";
import type { StepBundleRepositoryDrizzle } from "@/api/stepBundles/stepBundleRepositoryDrizzle";
import {
  createStepBundleRepository,
  createStepBundleRepositorySync,
} from "@/api/stepBundles/stepBundleRepositoryFactory";
import type { Step } from "@/api/steps/stepsModel";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { serviceLogger as logger } from "@/common/utils/logger";

export class StepBundleService {
  private StepBundleRepository: StepBundleRepositoryDrizzle;
  private repositoryInitialized = false;

  constructor(repository?: StepBundleRepositoryDrizzle) {
    // If repository is provided, use it directly
    if (repository) {
      this.StepBundleRepository = repository;
      this.repositoryInitialized = true;
    } else {
      // Otherwise use the sync version to have something immediately available
      this.StepBundleRepository = createStepBundleRepositorySync();

      // But also initialize the proper repository asynchronously
      this.initializeRepository();
    }
  }

  private async initializeRepository(): Promise<void> {
    try {
      this.StepBundleRepository = await createStepBundleRepository();
      this.repositoryInitialized = true;
      logger.debug("Step bundle repository initialized successfully");
    } catch (error) {
      logger.error(`Failed to initialize step bundle repository: ${error}`);
      // We already have the sync version, so we can continue
    }
  }

  // Helper method to ensure repository is initialized
  private async ensureRepository(): Promise<void> {
    if (!this.repositoryInitialized) {
      await this.initializeRepository();
    }
  }

  // Retrieves all step bundles
  async findAll(): Promise<ServiceResponse<StepBundle[] | null>> {
    try {
      await this.ensureRepository();
      const bundles = await this.StepBundleRepository.findAll();
      return ServiceResponse.success<StepBundle[]>("Step bundles found", bundles ?? []);
    } catch (ex) {
      const errorMessage = `Error finding all step bundles: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while retrieving step bundles.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Retrieves a single step bundle by its ID
  async findById(id: string): Promise<ServiceResponse<StepBundle | null>> {
    try {
      await this.ensureRepository();
      const bundle = await this.StepBundleRepository.findByIdAsync(id);
      if (!bundle) {
        return ServiceResponse.failure("Step bundle not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<StepBundle>("Step bundle found", bundle);
    } catch (ex) {
      const errorMessage = `Error finding step bundle with id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while finding step bundle.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Creates a step bundle
  async createStepBundle(bundleData: CreateStepBundleInput): Promise<ServiceResponse<StepBundle | null>> {
    try {
      await this.ensureRepository();
      const newBundle = await this.StepBundleRepository.create(bundleData);
      return ServiceResponse.success<StepBundle>("Step bundle created successfully", newBundle, StatusCodes.CREATED);
    } catch (ex) {
      const errorMessage = `Error creating step bundle: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while creating step bundle.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Updates a step bundle
  async updateStepBundle(
    bundle_id: string,
    updateData: UpdateStepBundleInput,
  ): Promise<ServiceResponse<StepBundle | null>> {
    await this.ensureRepository();
    const oldBundle = await this.StepBundleRepository.findByIdAsync(bundle_id);
    if (!oldBundle) {
      return ServiceResponse.failure("Step bundle not found", null, StatusCodes.NOT_FOUND);
    }
    try {
      const updatedBundle = await this.StepBundleRepository.update(bundle_id, updateData);
      if (!updatedBundle) {
        return ServiceResponse.failure("Step bundle not found", null, StatusCodes.NOT_FOUND);
      }

      return ServiceResponse.success<StepBundle>("Step bundle updated successfully", updatedBundle);
    } catch (ex) {
      const errorMessage = `Error updating step bundle: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while updating step bundle.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Deletes a step bundle
  async deleteStepBundle(bundle_id: string): Promise<ServiceResponse<null>> {
    try {
      await this.ensureRepository();
      const deleted = await this.StepBundleRepository.delete(bundle_id);
      if (!deleted) {
        return ServiceResponse.failure("Step bundle not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success("Step bundle deleted successfully", null);
    } catch (ex) {
      const errorMessage = `Error deleting step bundle: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while deleting step bundle.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Copies every step in the bundle into the given transaction as new steps
  async applyToTransaction(bundle_id: string, transaction_id: string): Promise<ServiceResponse<Step[] | null>> {
    try {
      await this.ensureRepository();

      const bundle = await this.StepBundleRepository.findByIdAsync(bundle_id);
      if (!bundle) {
        return ServiceResponse.failure("Step bundle not found", null, StatusCodes.NOT_FOUND);
      }

      const transactionExists = await this.StepBundleRepository.transactionExists(transaction_id);
      if (!transactionExists) {
        return ServiceResponse.failure("Transaction not found", null, StatusCodes.NOT_FOUND);
      }

      const createdSteps = await this.StepBundleRepository.applyToTransaction(bundle_id, transaction_id);
      return ServiceResponse.success<Step[]>("Step bundle applied successfully", createdSteps, StatusCodes.CREATED);
    } catch (ex) {
      const errorMessage = `Error applying step bundle: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while applying step bundle.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const stepBundleService = new StepBundleService();
