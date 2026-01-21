import { Controller, Logger } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { OrderService } from "./order.service";

interface CreateOrderRequest {
  product_id: string;
  quantity: number;
  user_id: string;
  idempotency_key?: string;
}

interface GetOrderRequest {
  order_id: string;
}

interface ListOrdersRequest {
  user_id: string;
  page: number;
  limit: number;
}

@Controller()
export class OrderController {
  private readonly logger = new Logger(OrderController.name);

  constructor(private readonly service: OrderService) {}

  @GrpcMethod("OrderService", "CreateOrder")
  async createOrder(request: CreateOrderRequest) {
    this.logger.log(`CreateOrder request product=${request.product_id}`);
    const [result, error] = await this.service.createOrder(
      request.product_id,
      request.quantity,
      request.user_id,
      request.idempotency_key
    );
    if (!result) {
      return {
        success: false,
        code: error === "Inventory service unavailable" ? "INVENTORY_UNAVAILABLE" : "ORDER_FAILED",
        message: error ?? "Order failed",
        data: { order_id: "", status: "FAILED", message: error ?? "Order failed" },
      };
    }

    return {
      success: result.status === "CONFIRMED",
      code: result.code,
      message: result.message,
      data: {
        order_id: result.orderId,
        status: result.status,
        message: result.message,
      },
    };
  }

  @GrpcMethod("OrderService", "GetOrder")
  async getOrder(request: GetOrderRequest) {
    this.logger.log(`GetOrder request ${request.order_id}`);
    const [order] = await this.service.getOrder(request.order_id);
    if (!order) {
      return {
        success: false,
        code: "ORDER_NOT_FOUND",
        message: "Order not found",
        data: {
          order_id: request.order_id,
          status: "UNKNOWN",
          product_id: "",
          quantity: 0,
          user_id: "",
        },
      };
    }

    return {
      success: true,
      code: "OK",
      message: "Order fetched",
      data: {
        order_id: order.id,
        status: order.status,
        product_id: order.product_id,
        quantity: order.quantity,
        user_id: order.user_id,
      },
    };
  }

  @GrpcMethod("OrderService", "ListOrders")
  async listOrders(request: ListOrdersRequest) {
    const page = request.page || 1;
    const limit = request.limit || 10;
    this.logger.log(`ListOrders request user=${request.user_id}`);
    const [result, error] = await this.service.listOrders(
      request.user_id,
      page,
      limit
    );
    if (!result) {
      return {
        success: false,
        code: "LIST_FAILED",
        message: error ?? "List orders failed",
        data: { items: [], page, limit, total: 0 },
      };
    }

    return {
      success: true,
      code: "OK",
      message: "Orders fetched",
      data: {
        items: result.items.map((item) => ({
          order_id: item.id,
          status: item.status,
          product_id: item.product_id,
          quantity: item.quantity,
          user_id: item.user_id,
        })),
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
    };
  }
}
