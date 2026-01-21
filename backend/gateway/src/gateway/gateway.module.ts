import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { ConfigService } from "@nestjs/config";
import { join } from "path";
import { GatewayController } from "./gateway.controller";
import { GatewayService } from "./gateway.service";
import { AuthClient } from "./clients/auth.client";
import { OrderClient } from "./clients/order.client";
import { InventoryClient } from "./clients/inventory.client";
import { AuthGuard } from "./guards/auth.guard";
import { RolesGuard } from "./guards/roles.guard";
import { CacheService } from "../common/cache/cache.service";
import { NatsSubscriberService } from "../common/events/nats-subscriber.service";
import { HealthController } from "../health/health.controller";
import { HealthService } from "../health/health.service";
import { HealthGateway } from "../health/health.gateway";

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: "AUTH_GRPC",
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            url: config.get<string>("auth.grpcUrl", "auth-service:50053"),
            package: "auth",
            protoPath: config.get<string>(
              "auth.protoPath",
              join(process.cwd(), "proto", "auth.proto")
            ),
            loader: {
              keepCase: true,
            },
          },
        }),
      },
      {
        name: "ORDER_GRPC",
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            url: config.get<string>("order.grpcUrl", "order-service:50052"),
            package: "orders",
            protoPath: config.get<string>(
              "order.protoPath",
              join(process.cwd(), "proto", "order.proto")
            ),
            loader: {
              keepCase: true,
            },
          },
        }),
      },
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
            loader: {
              keepCase: true,
            },
          },
        }),
      },
    ]),
  ],
  controllers: [GatewayController, HealthController],
  providers: [
    AuthClient,
    OrderClient,
    InventoryClient,
    GatewayService,
    AuthGuard,
    RolesGuard,
    CacheService,
    NatsSubscriberService,
    HealthService,
    HealthGateway,
  ],
})
export class GatewayModule {}
