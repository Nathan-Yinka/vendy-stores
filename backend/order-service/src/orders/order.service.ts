import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";
import { randomUUID } from "crypto";
import { OrderRepository } from "./repositories/order.repository";
import { NatsPublisher } from "../common/events/nats.publisher";
import { Order } from "./entities/order.entity";
import { Result } from "../common/types/result";

interface ReserveStockRequest {
  product_id: string;
  quantity: number;
  order_id: string;
}

interface ReserveStockResponse {
  success: boolean;
  code: string;
  message: string;
  data?: {
    remaining_stock: number;
    name: string;
  };
}

interface InventoryGrpcService {
  ReserveStock(request: ReserveStockRequest): unknown;
}

@Injectable()
export class OrderService {
  private inventoryService?: InventoryGrpcService;
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @Inject("INVENTORY_GRPC") private readonly grpcClient: ClientGrpc,
    private readonly repository: OrderRepository,
    private readonly publisher: NatsPublisher,
    private readonly config: ConfigService
  ) {}

  onModuleInit(): void {
    this.inventoryService = this.grpcClient.getService<InventoryGrpcService>(
      "InventoryService"
    );
  }

  /**
   * Create an order after reserving stock in inventory.
   */
  async createOrder(
    productId: string,
    quantity: number,
    userId: string
  ): Promise<
    Result<{ orderId: string; status: string; message: string; code: string }>
  > {
    const orderId = randomUUID();
    this.logger.log(`Create order ${orderId} product=${productId} user=${userId}`);

    if (!this.inventoryService) {
      this.logger.error(`Inventory service unavailable for order ${orderId}`);
      return [
        {
          orderId,
          status: "FAILED",
          message: "Inventory service unavailable",
          code: "INVENTORY_UNAVAILABLE",
        },
        "Inventory service unavailable",
      ];
    }

    let response: ReserveStockResponse;
    try {
      response = (await firstValueFrom(
        this.inventoryService.ReserveStock({
          product_id: productId,
          quantity,
          order_id: orderId,
        }) as any
      )) as ReserveStockResponse;
    } catch (error) {
      this.logger.error(
        `Reserve stock failed for order ${orderId}`,
        error as Error
      );
      return [
        {
          orderId,
          status: "FAILED",
          message: "Inventory service unavailable",
          code: "INVENTORY_UNAVAILABLE",
        },
        "Inventory service unavailable",
      ];
    }

    if (!response.success) {
      const failureMessage = response.message || "Inventory reservation failed";
      const failureCode = response.code || "RESERVE_FAILED";
      this.logger.warn(
        `Reserve stock failed for order ${orderId}: ${failureCode} ${failureMessage}`
      );

      await this.repository.create({
        id: orderId,
        product_id: productId,
        quantity,
        user_id: userId,
        status: "FAILED",
      });

      await this.publisher.publish(
        this.config.get<string>("order.createdSubject", "order.created"),
        {
          orderId,
          productId,
          quantity,
          userId,
          status: "FAILED",
          reason: failureMessage,
        }
      );

      return [
        {
          orderId,
          status: "FAILED",
          message: failureMessage,
          code: failureCode,
        },
        failureMessage,
      ];
    }

    const status = response.success ? "CONFIRMED" : "FAILED";
    const code = response.success ? "OK" : response.code || "ORDER_FAILED";

    await this.repository.create({
      id: orderId,
      product_id: productId,
      quantity,
      user_id: userId,
      status,
    });

    await this.publisher.publish(
      this.config.get<string>("order.createdSubject", "order.created"),
      {
        orderId,
        productId,
        quantity,
        userId,
        status,
        reason: response.message,
      }
    );

    this.logger.log(`Order ${orderId} status=${status}`);
    return [
      {
        orderId,
        status,
        message: response.message,
        code,
      },
      null,
    ];
  }

  /**
   * Fetch a single order by id.
   */
  async getOrder(orderId: string): Promise<Result<Order>> {
    this.logger.log(`Get order ${orderId}`);
    const order = await this.repository.findById(orderId);
    if (!order) {
      return [null, "Order not found"];
    }
    return [order, null];
  }

  /**
   * List confirmed orders for a user.
   */
  async listOrders(
    userId: string,
    page: number,
    limit: number
  ): Promise<
    Result<{ items: Order[]; total: number; page: number; limit: number }>
  > {
    this.logger.log(`List orders user=${userId}`);
    try {
      const result = await this.repository.listByUser(userId, page, limit);
      return [result, null];
    } catch {
      this.logger.error(`List orders failed user=${userId}`);
      return [null, "List orders failed"];
    }
  }
}
