import { PrismaClient } from "@prisma/client";
import type { AggOrderRequest, CreateOrderRequests, OrderRequest } from "./orderRequestsModel";

const prisma = new PrismaClient();

export class OrderRequestsRepository {
  async findAllAsync(): Promise<OrderRequest[]> {
    return prisma.orderRequests.findMany();
  }

  async findByIdAgg(transaction_id: string): Promise<AggOrderRequest[] | null> {
    return (
      prisma.orderRequests.findMany({
        where: {
          transaction_id: transaction_id,
        },
        include: {
          Item: true,
          User: true,
        },
      }) || null
    );
  }

  async create(orderRequest: OrderRequest): Promise<OrderRequest> {
    console.log("creating order request", orderRequest);
    return prisma.orderRequests.create({
      data: orderRequest,
    });
  }

  async update(orderRequest: OrderRequest): Promise<OrderRequest> {
    console.log("creating order request", orderRequest);
    return prisma.orderRequests.update({
      where: {
        order_request_id: orderRequest.order_request_id,
      },
      data: orderRequest,
    });
  }
}
