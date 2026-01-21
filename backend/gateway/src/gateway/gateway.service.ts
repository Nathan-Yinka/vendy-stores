import {
  HttpException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { CacheService } from "../common/cache/cache.service";
import { assertGrpcSuccess } from "../common/grpc-response";
import { successResponse } from "../common/response";
import { AuthClient } from "./clients/auth.client";
import { InventoryClient } from "./clients/inventory.client";
import { OrderClient } from "./clients/order.client";

@Injectable()
export class GatewayService {
  private readonly logger = new Logger(GatewayService.name);

  constructor(
    private readonly inventoryClient: InventoryClient,
    private readonly orderClient: OrderClient,
    private readonly authClient: AuthClient,
    private readonly cache: CacheService
  ) {}

  async login(email: string, password: string) {
    this.logger.log(`Login request for ${email}`);
    try {
      const result = await this.authClient.login(email, password);
      const data = assertGrpcSuccess(result);
      return successResponse(
        {
          token: data.token,
          userId: data.user_id,
          email: data.email,
          firstName: data.first_name,
          lastName: data.last_name,
          role: data.role,
        },
        "Login successful"
      );
    } catch (error) {
      this.logger.warn(`Login failed for ${email}`);
      this.logger.error(`Auth service error on login for ${email}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new ServiceUnavailableException("Auth service unavailable");
    }
  }

  async register(payload: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }) {
    this.logger.log(`Register request for ${payload.email}`);
    try {
      const result = await this.authClient.register(payload);
      const data = assertGrpcSuccess(result);
      return successResponse(
        {
          userId: data.user_id,
          email: data.email,
          firstName: data.first_name,
          lastName: data.last_name,
          role: data.role,
        },
        "Registration successful"
      );
    } catch (error) {
      this.logger.warn(`Register failed for ${payload.email}`);
      this.logger.error(`Auth service error on register for ${payload.email}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new ServiceUnavailableException("Auth service unavailable");
    }
  }

  async logout(authorization?: string) {
    if (!authorization) {
      throw new UnauthorizedException("Missing Authorization header");
    }

    const token = authorization.replace("Bearer ", "");
    try {
      const response = await this.authClient.logout(token);
      const data = assertGrpcSuccess(response);
      return successResponse({ revoked: data.revoked }, "Logout successful");
    } catch (error) {
      this.logger.error("Auth service error on logout");
      if (error instanceof HttpException) {
        throw error;
      }
      throw new ServiceUnavailableException("Auth service unavailable");
    }
  }

  async getProduct(id: string) {
    this.logger.log(`Get product ${id}`);
    try {
      const cacheKey = `product:${id}`;
      const cached = await this.cache.get<{
        product_id: string;
        name: string;
        stock: number;
      }>(cacheKey);
      if (cached) {
        return successResponse(cached, "Product fetched");
      }

      const response = await this.inventoryClient.getProduct(id);
      const product = assertGrpcSuccess(response);
      await this.cache.set(cacheKey, product);
      return successResponse(product, "Product fetched");
    } catch (error) {
      this.logger.error(`Inventory service error on get product ${id}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new ServiceUnavailableException("Inventory service unavailable");
    }
  }

  async listProducts(page: number, limit: number) {
    try {
      const response = await this.inventoryClient.listProducts({ page, limit });
      const data = assertGrpcSuccess(response);
      return successResponse(data, "Products fetched");
    } catch (error) {
      this.logger.error("Inventory service error on list products");
      if (error instanceof HttpException) {
        throw error;
      }
      throw new ServiceUnavailableException("Inventory service unavailable");
    }
  }

  async createProduct(payload: { name: string; stock: number }) {
    this.logger.log(`Create product request ${payload.name}`);
    try {
      const response = await this.inventoryClient.createProduct(payload);
      const product = assertGrpcSuccess(response);
      return successResponse(
        {
          productId: product.product_id,
          name: product.name,
          stock: product.stock,
        },
        "Product created"
      );
    } catch (error) {
      this.logger.error(`Inventory service error on create product ${payload.name}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new ServiceUnavailableException("Inventory service unavailable");
    }
  }

  async updateStock(id: string, stock: number) {
    this.logger.log(`Update stock request product=${id}`);
    try {
      const response = await this.inventoryClient.updateStock({
        product_id: id,
        stock,
      });
      const product = assertGrpcSuccess(response);
      await this.cache.del(`product:${id}`);
      return successResponse(
        {
          productId: product.product_id,
          name: product.name,
          stock: product.stock,
        },
        "Stock updated"
      );
    } catch (error) {
      this.logger.error(`Inventory service error on update stock ${id}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new ServiceUnavailableException("Inventory service unavailable");
    }
  }

  async createOrder(payload: {
    productId: string;
    quantity: number;
    userId: string;
  }) {
    this.logger.log(
      `Create order request product=${payload.productId} user=${payload.userId}`
    );
    try {
      const response = await this.orderClient.createOrder(
        payload.productId,
        payload.quantity,
        payload.userId
      );
      const result = assertGrpcSuccess(response);
      return successResponse(
        {
          orderId: result.order_id,
          status: result.status,
          message: result.message,
        },
        "Order processed"
      );
    } catch (error) {
      this.logger.error(
        `Order service error on create order product=${payload.productId}`
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new ServiceUnavailableException("Order service unavailable");
    }
  }

  async listOrders(payload: { userId: string; page: number; limit: number }) {
    try {
      const response = await this.orderClient.listOrders({
        user_id: payload.userId,
        page: payload.page,
        limit: payload.limit,
      });
      const data = assertGrpcSuccess(response);
      const itemsWithNames = await Promise.all(
        (data.items ?? []).map(async (item) => {
          const cacheKey = `product:${item.product_id}`;
          const cached = await this.cache.get<{
            product_id: string;
            name: string;
            stock: number;
          }>(cacheKey);
          if (cached?.name) {
            return { ...item, product_name: cached.name };
          }

          try {
            const productResponse = await this.inventoryClient.getProduct(
              item.product_id
            );
            const product = assertGrpcSuccess(productResponse);
            await this.cache.set(cacheKey, product);
            return { ...item, product_name: product.name };
          } catch {
            return { ...item, product_name: "" };
          }
        })
      );
      return successResponse(
        {
          items: itemsWithNames,
          page: data.page,
          limit: data.limit,
          total: data.total,
        },
        "Orders fetched"
      );
    } catch (error) {
      this.logger.error(`Order service error on list orders user=${payload.userId}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new ServiceUnavailableException("Order service unavailable");
    }
  }
}
