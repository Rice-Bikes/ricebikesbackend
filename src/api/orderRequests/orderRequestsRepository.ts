import { PrismaClient } from "@prisma/client";
import type { CreateOrderRequests, OrderRequest } from "./orderRequestsModel";

const prisma = new PrismaClient();

export class OrderRequestsRepository {
  async findAllAsync(): Promise<OrderRequest[]> {
    return prisma.orderRequests.findMany();
  }

  async findByIdAsync(transaction_id: string): Promise<OrderRequest | null> {
    return (
      prisma.orderRequests.findFirst({
        where: {
          transaction_id: transaction_id,
        },
      }) || null
    );
  }

  async create(orderRequest: OrderRequest): Promise<OrderRequest> {
    return prisma.orderRequests.create({
      data: orderRequest,
    });
  }
}
