import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { Product } from "../entities/product.entity";

@Injectable()
export class ProductRepository {
  constructor(
    @InjectRepository(Product) private readonly repository: Repository<Product>,
    private readonly dataSource: DataSource
  ) {}

  async seedDefault(): Promise<void> {
    const products = [
      { id: "product-1", name: "Vendyz Flash Item", stock: 1 },
      { id: "product-2", name: "Vendyz Starter Pack", stock: 5 },
      { id: "product-3", name: "Vendyz Essentials Kit", stock: 10 },
    ];

    for (const product of products) {
      const existing = await this.repository.findOne({
        where: { id: product.id },
      });
      if (!existing) {
        await this.repository.save(product);
      }
    }
  }

  async findById(productId: string): Promise<Product | null> {
    return this.repository.findOne({ where: { id: productId } });
  }

  async reserveStock(
    productId: string,
    quantity: number
  ): Promise<{ success: boolean; remaining: number; name: string } | null> {
    return this.dataSource.transaction(async (manager) => {
      const updated = await manager.query<
        { id: string; name: string; stock: number }[]
      >(
        "UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1 RETURNING id, name, stock",
        [quantity, productId]
      );

      if (updated.length > 0) {
        return {
          success: true,
          remaining: updated[0].stock,
          name: updated[0].name,
        };
      }

      const product = await manager.findOne(Product, {
        where: { id: productId },
      });

      if (!product) {
        return null;
      }

      return { success: false, remaining: product.stock, name: product.name };
    });
  }

  async createProduct(product: { id: string; name: string; stock: number }) {
    return this.repository.save(product);
  }

  async listProducts(
    page: number,
    limit: number
  ): Promise<{ items: Product[]; total: number; page: number; limit: number }> {
    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const [items, total] = await this.repository.findAndCount({
      order: { name: "ASC" },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });
    return { items, total, page: safePage, limit: safeLimit };
  }
}
