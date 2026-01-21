import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Order } from "../entities/order.entity";

@Injectable()
export class OrderRepository {
  constructor(@InjectRepository(Order) private readonly repository: Repository<Order>) {}

  async create(order: Order): Promise<void> {
    await this.repository.save(order);
  }

  async findById(orderId: string): Promise<Order | null> {
    return this.repository.findOne({ where: { id: orderId } });
  }

  async listByUser(
    userId: string,
    page: number,
    limit: number
  ): Promise<{ items: Order[]; total: number; page: number; limit: number }> {
    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const [items, total] = await this.repository.findAndCount({
      where: { user_id: userId, status: "CONFIRMED" },
      order: { id: "DESC" },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });
    return { items, total, page: safePage, limit: safeLimit };
  }
}
