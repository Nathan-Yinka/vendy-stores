import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

interface InventoryGrpcService {
  GetProduct(request: { product_id: string }): unknown;
  CreateProduct(request: { name: string; stock: number }): unknown;
  ListProducts(request: { page: number; limit: number }): unknown;
  UpdateStock(request: { product_id: string; stock: number }): unknown;
}

@Injectable()
export class InventoryClient implements OnModuleInit {
  private service?: InventoryGrpcService;

  constructor(@Inject("INVENTORY_GRPC") private readonly client: ClientGrpc) {}

  onModuleInit(): void {
    this.service = this.client.getService<InventoryGrpcService>(
      "InventoryService"
    );
  }

  async getProduct(productId: string) {
    if (!this.service) {
      throw new Error("Inventory service unavailable");
    }

    return firstValueFrom(
      this.service.GetProduct({ product_id: productId }) as any
    ) as Promise<{
      success: boolean;
      code: string;
      message: string;
      data?: { product_id: string; name: string; stock: number };
    }>;
  }

  async createProduct(payload: { name: string; stock: number }) {
    if (!this.service) {
      throw new Error("Inventory service unavailable");
    }

    return firstValueFrom(this.service.CreateProduct(payload) as any) as Promise<{
      success: boolean;
      code: string;
      message: string;
      data?: { product_id: string; name: string; stock: number };
    }>;
  }

  async listProducts(payload: { page: number; limit: number }) {
    if (!this.service) {
      throw new Error("Inventory service unavailable");
    }

    return firstValueFrom(this.service.ListProducts(payload) as any) as Promise<{
      success: boolean;
      code: string;
      message: string;
      data?: {
        items: { product_id: string; name: string; stock: number }[];
        page: number;
        limit: number;
        total: number;
      };
    }>;
  }

  async updateStock(payload: { product_id: string; stock: number }) {
    if (!this.service) {
      throw new Error("Inventory service unavailable");
    }

    return firstValueFrom(this.service.UpdateStock(payload) as any) as Promise<{
      success: boolean;
      code: string;
      message: string;
      data?: { product_id: string; name: string; stock: number };
    }>;
  }
}
