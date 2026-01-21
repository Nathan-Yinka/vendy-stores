import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";
import { ProductRepository } from "./repositories/product.repository";
import { NatsPublisher } from "../common/events/nats.publisher";
import { Product } from "./entities/product.entity";
import { Result } from "../common/types/result";

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    private readonly repository: ProductRepository,
    private readonly publisher: NatsPublisher,
    private readonly config: ConfigService
  ) {}

  /**
   * Fetch a product by id.
   */
  async getProduct(productId: string): Promise<Result<Product>> {
    this.logger.log(`Fetch product ${productId}`);
    const product = await this.repository.findById(productId);
    if (!product) {
      return [null, "Product not found"];
    }
    return [product, null];
  }

  /**
   * Reserve stock using a transactional lock to prevent oversell.
   */
  async reserveStock(
    productId: string,
    quantity: number,
    orderId: string
  ): Promise<
    Result<{ success: boolean; message: string; remaining: number; name: string }>
  > {
    this.logger.log(
      `Reserve stock request product=${productId} qty=${quantity} order=${orderId}`
    );
    let result: { success: boolean; remaining: number; name: string } | null;
    try {
      result = await this.repository.reserveStock(productId, quantity);
    } catch {
      this.logger.error(
        `Reserve stock failed product=${productId} order=${orderId}`
      );
      return [null, "Inventory reservation failed"];
    }

    if (result === null) {
      this.logger.warn(`Product not found: ${productId}`);
      return [null, "Product not found"];
    }

    if (!result.success) {
      this.logger.warn(`Out of stock: ${productId}`);
      return [
        {
          success: false,
          message: "Out of stock",
          remaining: result.remaining,
          name: result.name,
        },
        null,
      ];
    }

    await this.publisher.publish(
      this.config.get<string>("inventory.reservedSubject", "inventory.reserved"),
      {
      orderId,
      productId,
      quantity,
      remaining: result.remaining,
      name: result.name,
      }
    );

    this.logger.log(`Reserved stock product=${productId} remaining=${result.remaining}`);
    return [
      {
        success: true,
        message: "Reserved",
        remaining: result.remaining,
        name: result.name,
      },
      null,
    ];
  }

  /**
   * Create a new product in inventory.
   */
  async createProduct(name: string, stock: number): Promise<Result<Product>> {
    this.logger.log(`Create product name=${name} stock=${stock}`);
    let product;
    try {
      product = await this.repository.createProduct({
        id: randomUUID(),
        name,
        stock,
      });
    } catch {
      this.logger.error(`Create product failed name=${name}`);
      return [null, "Create product failed"];
    }

    this.logger.log(`Created product ${product.id}`);
    await this.publisher.publish(
      this.config.get<string>("inventory.createdSubject", "inventory.created"),
      {
        productId: product.id,
        name: product.name,
        stock: product.stock,
      }
    );
    return [product, null];
  }

  /**
   * Update product stock (admin operation).
   */
  async updateStock(productId: string, stock: number): Promise<Result<Product>> {
    this.logger.log(`Update stock product=${productId} stock=${stock}`);
    let product: Product | null;
    try {
      product = await this.repository.updateStock(productId, stock);
    } catch {
      this.logger.error(`Update stock failed product=${productId}`);
      return [null, "Update stock failed"];
    }

    if (!product) {
      return [null, "Product not found"];
    }

    await this.publisher.publish(
      this.config.get<string>("inventory.createdSubject", "inventory.created"),
      {
        productId: product.id,
        name: product.name,
        stock: product.stock,
      }
    );

    return [product, null];
  }

  /**
   * List products with pagination.
   */
  async listProducts(
    page: number,
    limit: number
  ): Promise<Result<{ items: Product[]; total: number; page: number; limit: number }>> {
    try {
      const { items, total, page: safePage, limit: safeLimit } =
        await this.repository.listProducts(page, limit);
      return [
        {
          items,
          total,
          page: safePage,
          limit: safeLimit,
        },
        null,
      ];
    } catch {
      this.logger.error("List products failed");
      return [null, "List products failed"];
    }
  }
}
