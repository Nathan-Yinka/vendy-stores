import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

interface OrderGrpcService {
  CreateOrder(request: { product_id: string; quantity: number; user_id: string }): unknown;
}

@Injectable()
export class OrderClient implements OnModuleInit {
  private service?: OrderGrpcService;

  constructor(@Inject("ORDER_GRPC") private readonly client: ClientGrpc) {}

  onModuleInit(): void {
    this.service = this.client.getService<OrderGrpcService>("OrderService");
  }

  async createOrder(productId: string, quantity: number, userId: string) {
    if (!this.service) {
      throw new Error("Order service unavailable");
    }

    return firstValueFrom(
      this.service.CreateOrder({
        product_id: productId,
        quantity,
        user_id: userId,
      }) as any
    ) as Promise<{
      success: boolean;
      code: string;
      message: string;
      data?: { order_id: string; status: string; message: string };
    }>;
  }
}
