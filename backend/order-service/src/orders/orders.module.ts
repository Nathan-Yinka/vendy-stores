import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { ConfigService } from "@nestjs/config";
import { join } from "path";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OrderController } from "./order.controller";
import { OrderService } from "./order.service";
import { OrderRepository } from "./repositories/order.repository";
import { Order } from "./entities/order.entity";
import { NatsPublisher } from "../common/events/nats.publisher";

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),
    ClientsModule.registerAsync([
      {
        name: "INVENTORY_GRPC",
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            url: config.get<string>("inventory.grpcUrl", "inventory-service:50051"),
            package: "inventory",
            protoPath: config.get<string>(
              "inventory.protoPath",
              join(process.cwd(), "proto", "inventory.proto")
            ),
          },
        }),
      },
    ]),
  ],
  controllers: [OrderController],
  providers: [OrderService, OrderRepository, NatsPublisher],
  exports: [OrderRepository],
})
export class OrdersModule {}
