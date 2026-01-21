import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { Order } from "../entities/order.entity";

@Injectable()
export class OrderRepository {
  constructor(
    @InjectRepository(Order) private readonly repository: Repository<Order>,
    private readonly dataSource: DataSource
  ) {}

  async create(order: Order): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.save(Order, order);
    });
  }

  async findById(orderId: string): Promise<Order | null> {
    return this.repository.findOne({ where: { id: orderId } });
  }

  async findByIdempotencyKey(
    userId: string,
    key: string
  ): Promise<Order | null> {
    return this.repository.findOne({
      where: { user_id: userId, idempotency_key: key },
    });
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
