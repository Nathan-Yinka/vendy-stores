import { join } from "path";

export const configuration = () => ({
  order: {
    grpcUrl: process.env.ORDER_GRPC_URL ?? "0.0.0.0:50052",
    protoPath:
      process.env.ORDER_PROTO_PATH ?? join(process.cwd(), "proto", "order.proto"),
    createdSubject: process.env.ORDER_CREATED_SUBJECT ?? "order.created",
  },
  database: {
    url: process.env.ORDER_DATABASE_URL,
  },
  nats: {
    url: process.env.NATS_URL ?? "nats://nats:4222",
  },
  inventory: {
    grpcUrl: process.env.INVENTORY_GRPC_URL ?? "inventory-service:50051",
    protoPath:
      process.env.INVENTORY_PROTO_PATH ??
      join(process.cwd(), "proto", "inventory.proto"),
  },
  health: {
    intervalMs: process.env.HEALTH_INTERVAL_MS ?? "5000",
    gatewayUrl: process.env.HEALTH_GATEWAY_URL ?? "http://gateway:3000",
    pingSubject: process.env.HEALTH_PING_SUBJECT ?? "health.ping",
  },
  service: {
    name: process.env.SERVICE_NAME ?? "order-service",
  },
});
