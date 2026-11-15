import { StatusCodes } from "http-status-codes";

import type { TransactionDetailsWithForeignKeys } from "@/api/transactionComponents/transactionDetails/transactionDetailsModel";
import type { CreateTuneUpInput, TuneUp, UpdateTuneUpInput } from "@/api/tuneUpComponents/tuneUps/tuneUpModel";
import type { TuneUpRepositoryDrizzle } from "@/api/tuneUpComponents/tuneUps/tuneUpRepositoryDrizzle";
import {
  createTuneUpRepository,
  createTuneUpRepositorySync,
} from "@/api/tuneUpComponents/tuneUps/tuneUpRepositoryFactory";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { serviceLogger as logger } from "@/common/utils/logger";
import { tuneUpAppliedEntry } from "@/common/utils/transactionLogging";
import { transactionHistoryService } from "@/services/transactionHistoryService";

export class TuneUpService {
  private TuneUpRepository: TuneUpRepositoryDrizzle;
  private repositoryInitialized = false;

  constructor(repository?: TuneUpRepositoryDrizzle) {
    // If repository is provided, use it directly
    if (repository) {
      this.TuneUpRepository = repository;
      this.repositoryInitialized = true;
    } else {
      // Otherwise use the sync version to have something immediately available
      this.TuneUpRepository = createTuneUpRepositorySync();

      // But also initialize the proper repository asynchronously
      this.initializeRepository();
    }
  }

  private async initializeRepository(): Promise<void> {
    try {
      this.TuneUpRepository = await createTuneUpRepository();
      this.repositoryInitialized = true;
      logger.debug("Tune up repository initialized successfully");
    } catch (error) {
      logger.error(`Failed to initialize tune up repository: ${error}`);
      // We already have the sync version, so we can continue
    }
  }

  // Helper method to ensure repository is initialized
  private async ensureRepository(): Promise<void> {
    if (!this.repositoryInitialized) {
      await this.initializeRepository();
    }
  }

  // Retrieves all tune ups
  async findAll(): Promise<ServiceResponse<TuneUp[] | null>> {
    try {
      await this.ensureRepository();
      const tuneUps = await this.TuneUpRepository.findAll();
      return ServiceResponse.success<TuneUp[]>("Tune ups found", tuneUps ?? []);
    } catch (ex) {
      const errorMessage = `Error finding all tune ups: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while retrieving tune ups.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Retrieves a single tune up by its ID
  async findById(id: string): Promise<ServiceResponse<TuneUp | null>> {
    try {
      await this.ensureRepository();
      const tuneUp = await this.TuneUpRepository.findByIdAsync(id);
      if (!tuneUp) {
        return ServiceResponse.failure("Tune up not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<TuneUp>("Tune up found", tuneUp);
    } catch (ex) {
      const errorMessage = `Error finding tune up with id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while finding tune up.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Creates a tune up
  async createTuneUp(tuneUpData: CreateTuneUpInput): Promise<ServiceResponse<TuneUp | null>> {
    try {
      await this.ensureRepository();
      const newTuneUp = await this.TuneUpRepository.create(tuneUpData);
      return ServiceResponse.success<TuneUp>("Tune up created successfully", newTuneUp, StatusCodes.CREATED);
    } catch (ex) {
      const errorMessage = `Error creating tune up: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while creating tune up.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Updates a tune up
  async updateTuneUp(tune_up_id: string, updateData: UpdateTuneUpInput): Promise<ServiceResponse<TuneUp | null>> {
    await this.ensureRepository();
    const oldTuneUp = await this.TuneUpRepository.findByIdAsync(tune_up_id);
    if (!oldTuneUp) {
      return ServiceResponse.failure("Tune up not found", null, StatusCodes.NOT_FOUND);
    }
    try {
      const updatedTuneUp = await this.TuneUpRepository.update(tune_up_id, updateData);
      if (!updatedTuneUp) {
        return ServiceResponse.failure("Tune up not found", null, StatusCodes.NOT_FOUND);
      }

      return ServiceResponse.success<TuneUp>("Tune up updated successfully", updatedTuneUp);
    } catch (ex) {
      const errorMessage = `Error updating tune up: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while updating tune up.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Copies every step in the tune up into the given transaction as new repairs
  async applyToTransaction(
    tune_up_id: string,
    changed_by: string | null,
    transaction_id: string,
  ): Promise<ServiceResponse<TransactionDetailsWithForeignKeys[] | null>> {
    try {
      await this.ensureRepository();

      const tuneUp = await this.TuneUpRepository.findByIdAsync(tune_up_id);
      if (!tuneUp) {
        return ServiceResponse.failure("Tune up not found", null, StatusCodes.NOT_FOUND);
      }

      const transactionExists = await this.TuneUpRepository.transactionExists(transaction_id);
      if (!transactionExists) {
        return ServiceResponse.failure("Transaction not found", null, StatusCodes.NOT_FOUND);
      }

      const createdRepairs = await this.TuneUpRepository.applyToTransaction(tune_up_id, changed_by, transaction_id);

      // One entry for the tune up as a whole rather than one per repair it
      // copied in: applying a tune up is a single action, and the repairs it
      // brings are visible on the transaction itself.
      await transactionHistoryService.recordByTransactionId(transaction_id, changed_by ?? undefined, [
        tuneUpAppliedEntry(tuneUp.name, createdRepairs.length),
      ]);

      return ServiceResponse.success<TransactionDetailsWithForeignKeys[]>(
        "Tune up applied successfully",
        createdRepairs,
        StatusCodes.CREATED,
      );
    } catch (ex) {
      const errorMessage = `Error applying tune up: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while applying tune up.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Deletes a tune up
  async deleteTuneUp(tune_up_id: string): Promise<ServiceResponse<null>> {
    try {
      await this.ensureRepository();
      const deleted = await this.TuneUpRepository.delete(tune_up_id);
      if (!deleted) {
        return ServiceResponse.failure("Tune up not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success("Tune up deleted successfully", null);
    } catch (ex) {
      const errorMessage = `Error deleting tune up: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while deleting tune up.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const tuneUpService = new TuneUpService();
