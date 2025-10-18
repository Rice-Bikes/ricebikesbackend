# Plan: Add Order Date and Estimated Delivery Time

## 1. Database Changes


**Prisma Schema Example (`prisma/schema.prisma`):**
```prisma
model Order {
  order_id           String   @id @default(uuid())
  orderDate          DateTime @default(now())
  estimatedDelivery  DateTime
  supplier           String
  ordered_by         String 
}
```

```sql
CREATE TABLE "order" (
  order_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_date         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estimated_delivery TIMESTAMP NOT NULL,
  supplier           TEXT NOT NULL,
  ordered_by         TEXT NOT NULL
);
```
- Add `orderDate` (default to now) and `estimatedDelivery` (required, set in code).
- Apply the sql change using psql

## 2. Backend Code Changes

### Model Layer (`src/api/order/orderModel.ts`)
```typescript
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

export type Order = z.infer<typeof OrderSchema>;
export type CreateOrder = z.infer<typeof CreateOrderSchema>;

export const OrderSchema = z.object({
  order_id: z.string().uuid(),
  order_date: z.date(),
  estimated_delivery: z.date(),
  supplier: z.string(),
  ordered_by: z.string(),
});

export const CreateOrderSchema = z.object({
  body: z.object({
    supplier: z.string(),
    ordered_by: z.string(),
    order_date: z.date().optional(),
  }),
});

export const GetOrderSchema = z.object({
  params: z.object({ id: z.string() }),
});
```

### Repository Layer (`src/api/order/orderRepository.ts`)
```typescript
import type { Order } from "./orderModel";

export class OrderRepository {
  private db: any; // Your DB connection

  constructor(db: any) {
    this.db = db;
  }

  async findAll(): Promise<Order[]> {
    const query = `SELECT * FROM orders`;
    const result = await this.db.query(query);
    return result.rows;
  }

  async findById(id: string): Promise<Order | null> {
    const query = `SELECT * FROM orders WHERE order_id = $1`;
    const result = await this.db.query(query, [id]);
    return result.rows[0] || null;
  }

  async create(orderData: Partial<Order>): Promise<Order> {
    const order_date = orderData.order_date || new Date();
    const estimated_delivery = new Date(order_date);
    estimated_delivery.setDate(order_date.getDate() + 5);

    const query = `
      INSERT INTO orders (order_date, estimated_delivery, supplier, ordered_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [order_date, estimated_delivery, orderData.supplier, orderData.ordered_by];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async update(orderData: Order): Promise<Order> {
    const query = `
      UPDATE orders
      SET order_date = $1, estimated_delivery = $2, supplier = $3, ordered_by = $4
      WHERE order_id = $5
      RETURNING *
    `;
    const values = [orderData.order_date, orderData.estimated_delivery, orderData.supplier, orderData.ordered_by, orderData.order_id];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async delete(id: string): Promise<Order> {
    const query = `DELETE FROM orders WHERE order_id = $1 RETURNING *`;
    const result = await this.db.query(query, [id]);
    return result.rows[0];
  }
}
```

### Service Layer (`src/api/order/orderService.ts`)
```typescript
import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";
import type { Order } from "./orderModel";
import { OrderRepository } from "./orderRepository";

export class OrderService {
  private orderRepository: OrderRepository;

  constructor(repository: OrderRepository) {
    this.orderRepository = repository;
  }

  async findAll(): Promise<ServiceResponse<Order[] | null>> {
    try {
      const orders = await this.orderRepository.findAll();
      if (!orders || orders.length === 0) {
        return ServiceResponse.failure("No orders found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Order[]>("Orders found", orders);
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

  async createOrder(orderData: Partial<Order>): Promise<ServiceResponse<Order | null>> {
    try {
      const newOrder = await this.orderRepository.create(orderData);
      return ServiceResponse.success<Order>("Order created", newOrder);
    } catch (ex) {
      const errorMessage = `Error creating order: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while creating order.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async updateOrder(orderData: Order): Promise<ServiceResponse<Order | null>> {
    try {
      const updatedOrder = await this.orderRepository.update(orderData);
      return ServiceResponse.success<Order>("Order updated", updatedOrder);
    } catch (ex) {
      const errorMessage = `Error updating order: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while updating order.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteOrder(id: string): Promise<ServiceResponse<Order | null>> {
    try {
      const deletedOrder = await this.orderRepository.delete(id);
      return ServiceResponse.success<Order>("Order deleted", deletedOrder);
    } catch (ex) {
      const errorMessage = `Error deleting order: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while deleting order.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}

export const orderService = new OrderService(new OrderRepository(/* your db connection */));
```

### Controller/Router Layer (`src/api/order/orderController.ts` / `src/api/order/orderRouter.ts`)
```typescript
// Controller
import type { Request, RequestHandler, Response } from "express";
import { handleServiceResponse } from "@/common/utils/httpHandlers";
import { orderService } from "./orderService";
import type { Order } from "./orderModel";

class OrderController {
  public getOrders: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await orderService.findAll();
    return handleServiceResponse(serviceResponse, res);
  };

  public getOrder: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const serviceResponse = await orderService.findById(id);
    return handleServiceResponse(serviceResponse, res);
  };

  public createOrder: RequestHandler = async (req: Request, res: Response) => {
    const orderData = {
      ...req.body,
      order_date: req.body.order_date ? new Date(req.body.order_date) : new Date(),
    } as Partial<Order>;
    const serviceResponse = await orderService.createOrder(orderData);
    return handleServiceResponse(serviceResponse, res);
  };

  public updateOrder: RequestHandler = async (req: Request, res: Response) => {
    const orderData = {
      ...req.body,
    } as Order;
    const serviceResponse = await orderService.updateOrder(orderData);
    return handleServiceResponse(serviceResponse, res);
  };

  public deleteOrder: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const serviceResponse = await orderService.deleteOrder(id);
    return handleServiceResponse(serviceResponse, res);
  };
}

const orderController = new OrderController();

export default orderController;
```

```typescript
// Router
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import orderController from "./orderController";
import { CreateOrderSchema, GetOrderSchema, OrderSchema } from "./orderModel";

export const OrderRegistry = new OpenAPIRegistry();
export const OrderRouter: Router = express.Router();

OrderRegistry.register("Order", OrderSchema);

// GET /orders
OrderRegistry.registerPath({
  method: "get",
  path: "/orders",
  summary: "Get all orders from the database",
  tags: ["Orders"],
  responses: createApiResponse(OrderSchema.array(), "Success"),
});
OrderRouter.get("/", orderController.getOrders);

// GET /orders/:id
OrderRegistry.registerPath({
  method: "get",
  path: "/orders/{id}",
  summary: "Get an order from the database based on its uuid",
  tags: ["Orders"],
  request: { params: GetOrderSchema.shape.params },
  responses: createApiResponse(OrderSchema, "Success"),
});
OrderRouter.get("/:id", [validateRequest(GetOrderSchema)], orderController.getOrder);

// POST /orders
OrderRegistry.registerPath({
  method: "post",
  path: "/orders",
  summary: "Create an order in the database",
  tags: ["Orders"],
  request: {
    body: {
      description: "Order object",
      content: {
        "application/json": { schema: CreateOrderSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(OrderSchema, "Success"),
});
OrderRouter.post("/", [validateRequest(CreateOrderSchema)], orderController.createOrder);

// PUT /orders/:id
OrderRegistry.registerPath({
  method: "put",
  path: "/orders/{id}",
  summary: "Update an order in the database",
  tags: ["Orders"],
  request: {
    body: {
      description: "Order object",
      content: {
        "application/json": { schema: CreateOrderSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(OrderSchema, "Success"),
});
OrderRouter.put("/:id", [validateRequest(CreateOrderSchema)], orderController.updateOrder);

// DELETE /orders/:id
OrderRegistry.registerPath({
  method: "delete",
  path: "/orders/{id}",
  summary: "Delete an order from the database",
  tags: ["Orders"],
  request: {
    params: GetOrderSchema.shape.params,
  },
  responses: createApiResponse(OrderSchema, "Success"),
});
OrderRouter.delete("/:id", orderController.deleteOrder);

export default OrderRouter;
```

## 3. API Changes

- **Order Creation Request Example:**
  ```json
  {
    "customerId": "abc123",
    // ...other fields...
    "orderDate": "2025-08-28T12:00:00Z" // optional
  }
  ```
- **Order Response Example:**
  ```json
  {
    "id": "order123",
    // ...other fields...
    "orderDate": "2025-08-28T12:00:00Z",
    "estimatedDelivery": "2025-09-02T12:00:00Z"
  }
  ```

## 4. Testing

- Add tests for:
  - Order creation with/without `orderDate`.
  - Correct calculation of `estimatedDelivery`.
  - Retrieval of orders includes both fields.

## 5. Documentation

- Update OpenAPI spec:
  ```yaml
  Order:
    type: object
    properties:
      id:
        type: string
      orderDate:
        type: string
        format: date-time
      estimatedDelivery:
        type: string
        format: date-time
      # ...other fields...
  ```

---

### Potential Downsides

- **Migration Risk**: Adding required fields may cause downtime if not handled with defaults.
- **Data Consistency**: Calculation logic for `estimatedDelivery` must handle weekends/holidays if needed.
- **Legacy Data**: Existing orders will have null/empty `estimatedDelivery` unless backfilled.
- **Frontend Impact**: Frontend must be updated to handle/display these new fields.
