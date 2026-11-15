import { StatusCodes } from "http-status-codes";

import { ServiceResponse } from "@/common/models/serviceResponse";
import { serviceLogger as logger } from "@/common/utils/logger";
import {
  partOrderRemovedEntry,
  partOrderRequestedEntry,
  partOrderStatusEntry,
} from "@/common/utils/transactionLogging";
import { transactionHistoryService } from "@/services/transactionHistoryService";
import type { AggOrderRequest, CreateOrderRequests, OrderRequest, PatchOrderRequest } from "./orderRequestsModel";
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
  async findById(id: string): Promise<ServiceResponse<AggOrderRequest[] | null>> {
    try {
      const item = await this.OrderRequestsRepository.findByIdAgg(id);
      if (!item) {
        return ServiceResponse.failure("Transaction data not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<AggOrderRequest[]>("OrderRequest found", item);
    } catch (ex) {
      const errorMessage = `Error finding transaction with id ${id}:, ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while finding transaction.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Creates a item
  async createOrderRequest(item: OrderRequest): Promise<ServiceResponse<AggOrderRequest | null>> {
    try {
      const newOrderRequest = await this.OrderRequestsRepository.create(item);

      // Putting a part on order is part of the transaction's story, so it is
      // recorded against the transaction the order was raised from.
      await transactionHistoryService.recordByTransactionId(
        newOrderRequest.transaction_id,
        newOrderRequest.created_by,
        [
          partOrderRequestedEntry({
            item_name: newOrderRequest.Item?.name ?? null,
            quantity: newOrderRequest.quantity,
          }),
        ],
      );

      return ServiceResponse.success<AggOrderRequest>("OrderRequest created", newOrderRequest);
    } catch (ex) {
      const errorMessage = `Error creating item: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while creating item.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async patchOrderRequest(
    order_request_id: string,
    patch: PatchOrderRequest["body"],
  ): Promise<ServiceResponse<AggOrderRequest | null>> {
    try {
      // changed_by names the person for the history row; it is not a column on
      // the order request, so it is kept out of the update.
      const { changed_by, ...fields } = patch;

      // Read the current status first, so that confirming an order that is
      // already confirmed is not recorded as a change.
      let wasOrdered: boolean | null = null;
      if (fields.ordered !== undefined) {
        try {
          wasOrdered = (await this.OrderRequestsRepository.findAggById(order_request_id)).ordered;
        } catch (ex) {
          logger.error(`Could not read order request ${order_request_id} before patching: ${(ex as Error).message}`);
        }
      }

      const updatedOrderRequest = await this.OrderRequestsRepository.patch(order_request_id, fields);

      if (fields.ordered !== undefined && fields.ordered !== wasOrdered) {
        await transactionHistoryService.recordByTransactionId(updatedOrderRequest.transaction_id, changed_by, [
          partOrderStatusEntry({ item_name: updatedOrderRequest.Item?.name ?? null }, fields.ordered),
        ]);
      }

      return ServiceResponse.success<AggOrderRequest>("OrderRequest updated", updatedOrderRequest);
    } catch (ex) {
      const errorMessage = `Error patching order request ${order_request_id}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while updating item.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async updateOrderRequest(item: OrderRequest): Promise<ServiceResponse<OrderRequest | null>> {
    try {
      const newOrderRequest = await this.OrderRequestsRepository.update(item);
      return ServiceResponse.success<OrderRequest>("OrderRequest updated", newOrderRequest);
    } catch (ex) {
      const errorMessage = `Error creating item: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while updating item.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteOrderRequest(id: string, changed_by?: string): Promise<ServiceResponse<OrderRequest | null>> {
    try {
      // Read before deleting: afterwards the item's name and the transaction it
      // belonged to are both gone.
      let previous: AggOrderRequest | null = null;
      try {
        previous = await this.OrderRequestsRepository.findAggById(id);
      } catch (ex) {
        logger.error(`Could not read order request ${id} before deleting: ${(ex as Error).message}`);
      }

      const newOrderRequest = await this.OrderRequestsRepository.delete(id);

      if (previous) {
        await transactionHistoryService.recordByTransactionId(previous.transaction_id, changed_by, [
          partOrderRemovedEntry({ item_name: previous.Item?.name ?? null }),
        ]);
      }

      return ServiceResponse.success<OrderRequest>("OrderRequest deleted", newOrderRequest);
    } catch (ex) {
      const errorMessage = `Error deleting item: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while deleting item.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async extractText(file: Buffer): Promise<ServiceResponse<string[] | null>> {
    try {
      const text = await this.OrderRequestsRepository.extractText(file);
      return ServiceResponse.success<string[]>("Text extracted", text);
    } catch (ex) {
      const errorMessage = `Error extracting text: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while extracting text.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const orderRequestsService = new OrderRequestsService();
