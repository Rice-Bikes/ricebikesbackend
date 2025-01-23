import { StatusCodes } from "http-status-codes";

import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";
import type { CreateOrderRequests, OrderRequest } from "./orderRequestsModel";
import { OrderRequestsRepository } from "./orderRequestsRepository";

export class OrderRequestsService {
  private OrderRequestsRepository: OrderRequestsRepository;

  constructor(repository: OrderRequestsRepository = new OrderRequestsRepository()) {
    this.OrderRequestsRepository = repository;
  }

  // Retrieves all items from the database
  async findAll(): Promise<ServiceResponse<OrderRequest[] | null>> {
    try {
      const items = await this.OrderRequestsRepository.findAllAsync();
      if (!items || items.length === 0) {
        return ServiceResponse.failure("No items found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<OrderRequest[]>("items found", items);
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
  async findById(id: string): Promise<ServiceResponse<OrderRequest | null>> {
    try {
      const item = await this.OrderRequestsRepository.findByIdAsync(id);
      if (!item) {
        return ServiceResponse.failure("User not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<OrderRequest>("OrderRequest found", item);
    } catch (ex) {
      const errorMessage = `Error finding user with id ${id}:, ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while finding user.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  // Creates a item
  async createOrderRequest(item: OrderRequest): Promise<ServiceResponse<OrderRequest | null>> {
    try {
      const newOrderRequest = await this.OrderRequestsRepository.create(item);
      return ServiceResponse.success<OrderRequest>("OrderRequest created", newOrderRequest);
    } catch (ex) {
      const errorMessage = `Error creating item: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while creating item.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}

export const orderRequestsService = new OrderRequestsService();
