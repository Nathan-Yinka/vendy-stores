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
}
