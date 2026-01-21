import { Controller, Logger } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { InventoryService } from "./inventory.service";

interface GetProductRequest {
  product_id: string;
}

interface ReserveStockRequest {
  product_id: string;
  quantity: number;
  order_id: string;
}

interface CreateProductRequest {
  name: string;
  stock: number;
}

interface ListProductsRequest {
  page: number;
  limit: number;
}

interface UpdateStockRequest {
  product_id: string;
  stock: number;
}

@Controller()
export class InventoryController {
  private readonly logger = new Logger(InventoryController.name);

  constructor(private readonly service: InventoryService) {}

  @GrpcMethod("InventoryService", "GetProduct")
  async getProduct(request: GetProductRequest) {
    this.logger.log(`GetProduct request ${request.product_id}`);
    const [product] = await this.service.getProduct(request.product_id);
    if (!product) {
      return {
        success: false,
        code: "PRODUCT_NOT_FOUND",
        message: "Product not found",
        data: { product_id: "", name: "", stock: 0 },
      };
    }

    return {
      success: true,
      code: "OK",
      message: "Product fetched",
      data: {
        product_id: product.id,
        name: product.name,
        stock: product.stock,
      },
    };
  }

  @GrpcMethod("InventoryService", "ReserveStock")
  async reserveStock(request: ReserveStockRequest) {
    this.logger.log(`ReserveStock request ${request.order_id}`);
    const [result, error] = await this.service.reserveStock(
      request.product_id,
      request.quantity,
      request.order_id
    );
    if (!result) {
      return {
        success: false,
        code: error === "Product not found" ? "PRODUCT_NOT_FOUND" : "RESERVE_FAILED",
        message: error ?? "Inventory reservation failed",
        data: { remaining_stock: 0, name: "" },
      };
    }

    return {
      success: result.success,
      code: result.success ? "OK" : "OUT_OF_STOCK",
      message: result.message,
      data: {
        remaining_stock: result.remaining,
        name: result.name,
      },
    };
  }

  @GrpcMethod("InventoryService", "CreateProduct")
  async createProduct(request: CreateProductRequest) {
    this.logger.log(`CreateProduct request ${request.name}`);
    const [product, error] = await this.service.createProduct(
      request.name,
      request.stock
    );
    if (!product) {
      return {
        success: false,
        code: "CREATE_FAILED",
        message: error ?? "Create product failed",
        data: { product_id: "", name: "", stock: 0 },
      };
    }

    return {
      success: true,
      code: "OK",
      message: "Product created",
      data: {
        product_id: product.id,
        name: product.name,
        stock: product.stock,
      },
    };
  }

  @GrpcMethod("InventoryService", "ListProducts")
  async listProducts(request: ListProductsRequest) {
    const page = request.page || 1;
    const limit = request.limit || 10;
    const [result, error] = await this.service.listProducts(page, limit);
    if (!result) {
      return {
        success: false,
        code: "LIST_FAILED",
        message: error ?? "List products failed",
        data: { items: [], page, limit, total: 0 },
      };
    }

    return {
      success: true,
      code: "OK",
      message: "Products fetched",
      data: {
        items: result.items.map((item) => ({
          product_id: item.id,
          name: item.name,
          stock: item.stock,
        })),
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
    };
  }

  @GrpcMethod("InventoryService", "UpdateStock")
  async updateStock(request: UpdateStockRequest) {
    this.logger.log(`UpdateStock request ${request.product_id}`);
    const [product, error] = await this.service.updateStock(
      request.product_id,
      request.stock
    );
    if (!product) {
      return {
        success: false,
        code: error === "Product not found" ? "PRODUCT_NOT_FOUND" : "UPDATE_FAILED",
        message: error ?? "Update stock failed",
        data: { product_id: "", name: "", stock: 0 },
      };
    }

    return {
      success: true,
      code: "OK",
      message: "Stock updated",
      data: {
        product_id: product.id,
        name: product.name,
        stock: product.stock,
      },
    };
  }
}
