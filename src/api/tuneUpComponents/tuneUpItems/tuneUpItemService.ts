import { StatusCodes } from "http-status-codes";

import type {
  CreateTuneUpItemInput,
  TuneUpItem,
  UpdateTuneUpItemInput,
} from "@/api/tuneUpComponents/tuneUpItems/tuneUpItemModel";
import type { TuneUpItemFilters } from "@/api/tuneUpComponents/tuneUpItems/tuneUpItemRepositoryDrizzle";
import type { TuneUpItemRepositoryDrizzle } from "@/api/tuneUpComponents/tuneUpItems/tuneUpItemRepositoryDrizzle";
import {
  createTuneUpItemRepository,
  createTuneUpItemRepositorySync,
} from "@/api/tuneUpComponents/tuneUpItems/tuneUpItemRepositoryFactory";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { serviceLogger as logger } from "@/common/utils/logger";

export class TuneUpItemService {
  private TuneUpItemRepository: TuneUpItemRepositoryDrizzle;
  private repositoryInitialized = false;

  constructor(repository?: TuneUpItemRepositoryDrizzle) {
    // If repository is provided, use it directly
    if (repository) {
      this.TuneUpItemRepository = repository;
      this.repositoryInitialized = true;
    } else {
      // Otherwise use the sync version to have something immediately available
      this.TuneUpItemRepository = createTuneUpItemRepositorySync();

      // But also initialize the proper repository asynchronously
      this.initializeRepository();
    }
  }

  private async initializeRepository(): Promise<void> {
    try {
      this.TuneUpItemRepository = await createTuneUpItemRepository();
      this.repositoryInitialized = true;
      logger.debug("Tune up item repository initialized successfully");
    } catch (error) {
      logger.error(`Failed to initialize tune up item repository: ${error}`);
      // We already have the sync version, so we can continue
    }
  }

  // Helper method to ensure repository is initialized
  private async ensureRepository(): Promise<void> {
    if (!this.repositoryInitialized) {
      await this.initializeRepository();
    }
  }

  // Retrieves all tune up items with optional filtering
  async findAll(filters?: TuneUpItemFilters): Promise<ServiceResponse<TuneUpItem[] | null>> {
    try {
      await this.ensureRepository();
      const items = await this.TuneUpItemRepository.findAll(filters);
      return ServiceResponse.success<TuneUpItem[]>("Tune up items found", items ?? []);
    } catch (ex) {
      const errorMessage = `Error finding all tune up items: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while retrieving tune up items.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Retrieves a single tune up item by its ID
  async findById(id: string): Promise<ServiceResponse<TuneUpItem | null>> {
    try {
      await this.ensureRepository();
      const item = await this.TuneUpItemRepository.findByIdAsync(id);
      if (!item) {
        return ServiceResponse.failure("Tune up item not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<TuneUpItem>("Tune up item found", item);
    } catch (ex) {
      const errorMessage = `Error finding tune up item with id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while finding tune up item.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Creates a tune up item
  async createTuneUpItem(itemData: CreateTuneUpItemInput): Promise<ServiceResponse<TuneUpItem | null>> {
    try {
      await this.ensureRepository();
      const newItem = await this.TuneUpItemRepository.create(itemData);
      return ServiceResponse.success<TuneUpItem>("Tune up item created successfully", newItem, StatusCodes.CREATED);
    } catch (ex) {
      const errorMessage = `Error creating tune up item: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while creating tune up item.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Updates a tune up item
  async updateTuneUpItem(
    tune_up_item_id: string,
    updateData: UpdateTuneUpItemInput,
  ): Promise<ServiceResponse<TuneUpItem | null>> {
    await this.ensureRepository();
    const oldItem = await this.TuneUpItemRepository.findByIdAsync(tune_up_item_id);
    if (!oldItem) {
      return ServiceResponse.failure("Tune up item not found", null, StatusCodes.NOT_FOUND);
    }
    try {
      const updatedItem = await this.TuneUpItemRepository.update(tune_up_item_id, updateData);
      if (!updatedItem) {
        return ServiceResponse.failure("Tune up item not found", null, StatusCodes.NOT_FOUND);
      }

      return ServiceResponse.success<TuneUpItem>("Tune up item updated successfully", updatedItem);
    } catch (ex) {
      const errorMessage = `Error updating tune up item: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while updating tune up item.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Deletes a tune up item
  async deleteTuneUpItem(tune_up_item_id: string): Promise<ServiceResponse<null>> {
    try {
      await this.ensureRepository();
      const deleted = await this.TuneUpItemRepository.delete(tune_up_item_id);
      if (!deleted) {
        return ServiceResponse.failure("Tune up item not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success("Tune up item deleted successfully", null);
    } catch (ex) {
      const errorMessage = `Error deleting tune up item: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while deleting tune up item.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const tuneUpItemService = new TuneUpItemService();
