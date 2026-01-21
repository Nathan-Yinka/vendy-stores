import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

interface OrderGrpcService {
  CreateOrder(request: {
    product_id: string;
    quantity: number;
    user_id: string;
    idempotency_key?: string;
  }): unknown;
  ListOrders(request: { user_id: string; page: number; limit: number }): unknown;
}

@Injectable()
export class OrderClient implements OnModuleInit {
  private service?: OrderGrpcService;

  constructor(@Inject("ORDER_GRPC") private readonly client: ClientGrpc) {}

  onModuleInit(): void {
    this.service = this.client.getService<OrderGrpcService>("OrderService");
  }

  async createOrder(
    productId: string,
    quantity: number,
    userId: string,
    idempotencyKey?: string
  ) {
    if (!this.service) {
      return {
        success: false,
        code: "ORDER_UNAVAILABLE",
        message: "Order service unavailable",
      };
    }

    try {
      return (await firstValueFrom(
        this.service.CreateOrder({
          product_id: productId,
          quantity,
          user_id: userId,
          idempotency_key: idempotencyKey,
        }) as any
      )) as {
        success: boolean;
        code: string;
        message: string;
        data?: { order_id: string; status: string; message: string };
      };
    } catch {
      return {
        success: false,
        code: "ORDER_UNAVAILABLE",
        message: "Order service unavailable",
      };
    }
  }

  async listOrders(payload: { user_id: string; page: number; limit: number }) {
    if (!this.service) {
      return {
        success: false,
        code: "ORDER_UNAVAILABLE",
        message: "Order service unavailable",
      };
    }

    try {
      return (await firstValueFrom(this.service.ListOrders(payload) as any)) as {
        success: boolean;
        code: string;
        message: string;
        data?: {
          items: {
            order_id: string;
            status: string;
            product_id: string;
            quantity: number;
            user_id: string;
          }[];
          page: number;
          limit: number;
          total: number;
        };
      };
    } catch {
      return {
        success: false,
        code: "ORDER_UNAVAILABLE",
        message: "Order service unavailable",
      };
    }
  }
}
