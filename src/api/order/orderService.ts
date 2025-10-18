import { ServiceResponse } from "@/common/models/serviceResponse";
import { serviceLogger as logger } from "@/common/utils/logger";
import { StatusCodes } from "http-status-codes";
import type { Order } from "./orderModel";
import { OrderRepository } from "./orderRepository";

export class OrderService {
  private orderRepository: OrderRepository;

  constructor(repository: OrderRepository) {
    this.orderRepository = repository;
  }

  async findClosestFutureOrder(): Promise<ServiceResponse<Order | null>> {
    try {
      const order = await this.orderRepository.findClosestFutureOrder();
      if (!order) {
        return ServiceResponse.failure("No future order found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Order>("Closest future order found", order);
    } catch (ex) {
      const errorMessage = `Error finding closest future order: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while finding closest future order.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(): Promise<ServiceResponse<Order[] | null>> {
    try {
      const orders = await this.orderRepository.findAll();
      if (!orders || orders.length === 0) {
        return ServiceResponse.failure("No orders found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Order[]>(`Orders found: ${orders.length}`, orders);
    } catch (ex) {
      const errorMessage = `Error finding all orders: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while retrieving orders.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findById(id: string): Promise<ServiceResponse<Order | null>> {
    try {
      const order = await this.orderRepository.findById(id);
      if (!order) {
        return ServiceResponse.failure("Order not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Order>("Order found", order);
    } catch (ex) {
      const errorMessage = `Error finding order with id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while finding order.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async createOrder(orderData: {
    supplier: string;
    ordered_by: string;
    order_date?: Date;
    estimated_delivery?: Date;
  }): Promise<ServiceResponse<Order | null>> {
    try {
      const newOrder = await this.orderRepository.create(orderData);
      logger.debug("Order created:", newOrder);
      return ServiceResponse.success<Order>("Order created", newOrder);
    } catch (ex) {
      const errorMessage = `Error creating order: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while creating order.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateOrder(orderData: Order): Promise<ServiceResponse<Order | null>> {
    try {
      const { order_id, ...data } = orderData;
      const updatedOrder = await this.orderRepository.update(order_id, data);
      return ServiceResponse.success<Order>("Order updated", updatedOrder);
    } catch (ex) {
      const errorMessage = `Error updating order: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while updating order.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteOrder(id: string): Promise<ServiceResponse<Order | null>> {
    try {
      const deletedOrder = await this.orderRepository.delete(id);
      return ServiceResponse.success<Order>("Order deleted", deletedOrder);
    } catch (ex) {
      const errorMessage = `Error deleting order: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while deleting order.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const orderService = new OrderService(new OrderRepository(/* your db connection */));
