import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class OrderRepository {
  async findAll() {
    return prisma.order.findMany();
  }

  async findClosestFutureOrder() {
    return prisma.order.findFirst({
      where: {
        order_date: {
          gt: new Date(),
        },
      },
      orderBy: {
        order_date: "asc",
      },
    });
  }

  async findById(orderId: string) {
    return prisma.order.findUnique({ where: { order_id: orderId } });
  }

  async create(data: {
    supplier: string;
    ordered_by: string;
    order_date?: Date;
    estimated_delivery?: Date;
  }) {
    // Calculate estimated_delivery if not provided
    const order_date = data.order_date || new Date();
    const estimated_delivery = data.estimated_delivery || new Date(order_date.getTime() + 5 * 24 * 60 * 60 * 1000);
    return prisma.order.create({
      data: {
        supplier: data.supplier,
        ordered_by: data.ordered_by,
        order_date,
        estimated_delivery,
      },
    });
  }

  async update(
    orderId: string,
    data: {
      supplier?: string;
      ordered_by?: string;
      order_date?: Date;
      estimated_delivery?: Date;
    },
  ) {
    return prisma.order.update({
      where: { order_id: orderId },
      data,
    });
  }

  async delete(orderId: string) {
    return prisma.order.delete({ where: { order_id: orderId } });
  }
}
