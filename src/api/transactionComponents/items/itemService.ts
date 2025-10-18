import { StatusCodes } from "http-status-codes";

import { ServiceResponse } from "@/common/models/serviceResponse";
import { serviceLogger as logger } from "@/common/utils/logger";
import type { Item } from "./itemModel";
import { ItemRepositoryDrizzle } from "./itemRepositoryDrizzle";

export class ItemsService {
  private ItemsRepository: ItemRepositoryDrizzle;

  constructor(repository: ItemRepositoryDrizzle = new ItemRepositoryDrizzle()) {
    this.ItemsRepository = repository;
  }

  // Retrieves all items from the database
  async findAll(): Promise<ServiceResponse<Item[] | null>> {
    try {
      const items = await this.ItemsRepository.findAllAsync();
      if (!items || items.length === 0) {
        return ServiceResponse.failure("No items found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Item[]>("items found", items);
    } catch (ex) {
      const errorMessage = `Error finding all items: $${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while retrieving items.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Retrieves a single item by their ID
  async findById(id: string): Promise<ServiceResponse<Item | null>> {
    try {
      const item = await this.ItemsRepository.findByIdAsync(id);
      if (!item) {
        return ServiceResponse.failure("Item not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Item>("Item found", item);
    } catch (ex) {
      const errorMessage = `Error finding user with id ${id}:, ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while finding user.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  // Creates a item
  async createItem(item: Item): Promise<ServiceResponse<Item | null>> {
    try {
      const newItem = await this.ItemsRepository.create(item);
      return ServiceResponse.success<Item>("Item created", newItem);
    } catch (ex) {
      const errorMessage = `Error creating item: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while creating item.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async enableItem(id: string): Promise<ServiceResponse<Item | null>> {
    try {
      const item = await this.ItemsRepository.enableItem(id);
      if (!item) {
        return ServiceResponse.failure("Item not found", null, StatusCodes.NOT_FOUND);
      }

      return ServiceResponse.success<Item>("item found", item);
    } catch (ex) {
      const errorMessage = `Error enabling item: $${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        `An error occurred while retrieving items. ${errorMessage}`,
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async refreshItems(catalog_file: string): Promise<ServiceResponse<Item[] | null>> {
    try {
      const items = await this.ItemsRepository.refreshItems(catalog_file);
      if (!items || items.length === 0) {
        return ServiceResponse.failure("No items found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Item[]>("items found", items);
    } catch (ex) {
      const errorMessage = `Error finding all items: $${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        `An error occurred while retrieving items. ${errorMessage}`,
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getCategory(category: number): Promise<ServiceResponse<string[] | null>> {
    try {
      const items = await this.ItemsRepository.getCategory(category);
      // logger.info("items", items);
      if (!items || items.length === 0) {
        return ServiceResponse.failure("No items found", null, StatusCodes.NOT_FOUND);
      }
      const categories = items
        .map((result: { [key: string]: any }) => result[`category_${category}`])
        .filter((category): category is string => category !== null && category !== undefined);
      logger.info(`categories [FINAL]${categories}`);
      return ServiceResponse.success<string[]>("categories found", categories);
    } catch (ex) {
      const errorMessage = `Error finding categories: $${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        `An error occurred while retrieving categories. ${errorMessage}`,
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async updateItem(item_id: string, item: Item): Promise<ServiceResponse<Item | null>> {
    try {
      const updatedItem = await this.ItemsRepository.update(item.item_id, item);
      if (!updatedItem) {
        return ServiceResponse.failure("Item not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Item>("Item updated", updatedItem);
    } catch (ex) {
      const errorMessage = `Error updating item: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while updating item.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
  async deleteItem(id: string): Promise<ServiceResponse<Item | null>> {
    try {
      const item = await this.ItemsRepository.delete(id);
      if (!item) {
        return ServiceResponse.failure("Item not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Item>("Item deleted", item);
    } catch (ex) {
      const errorMessage = `Error deleting item: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while deleting item.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}

export const itemsService = new ItemsService();
