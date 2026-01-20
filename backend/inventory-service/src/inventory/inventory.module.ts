import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InventoryController } from "./inventory.controller";
import { InventoryService } from "./inventory.service";
import { Product } from "./entities/product.entity";
import { ProductRepository } from "./repositories/product.repository";
import { NatsPublisher } from "../common/events/nats.publisher";

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [InventoryController],
  providers: [InventoryService, ProductRepository, NatsPublisher],
  exports: [ProductRepository],
})
export class InventoryModule {}
