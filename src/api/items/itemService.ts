import { StatusCodes } from "http-status-codes";

import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";
import type { Item } from "./itemModel";
import { ItemsRepository } from "./itemRepository";

export class ItemsService {
  private ItemsRepository: ItemsRepository;

  constructor(repository: ItemsRepository = new ItemsRepository()) {
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
        return ServiceResponse.failure("User not found", null, StatusCodes.NOT_FOUND);
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
        "An error occurred while retrieving items.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const itemsService = new ItemsService();
