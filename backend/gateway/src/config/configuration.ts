import { join } from "path";

export const configuration = () => ({
  gateway: {
    port: process.env.GATEWAY_PORT ?? "3000",
  },
  auth: {
    grpcUrl: process.env.AUTH_GRPC_URL ?? "auth-service:50053",
    protoPath:
      process.env.AUTH_PROTO_PATH ?? join(process.cwd(), "proto", "auth.proto"),
  },
  order: {
    grpcUrl: process.env.ORDER_GRPC_URL ?? "order-service:50052",
    protoPath:
      process.env.ORDER_PROTO_PATH ?? join(process.cwd(), "proto", "order.proto"),
  },
  inventory: {
    grpcUrl: process.env.INVENTORY_GRPC_URL ?? "inventory-service:50051",
    protoPath:
      process.env.INVENTORY_PROTO_PATH ??
      join(process.cwd(), "proto", "inventory.proto"),
  },
  nats: {
    url: process.env.NATS_URL ?? "nats://nats:4222",
    reservedSubject: process.env.INVENTORY_RESERVED_SUBJECT ?? "inventory.reserved",
    createdSubject: process.env.INVENTORY_CREATED_SUBJECT ?? "inventory.created",
    healthSubject: process.env.HEALTH_PING_SUBJECT ?? "health.ping",
  },
  redis: {
    url: process.env.REDIS_URL ?? "redis://redis:6379",
    ttlSeconds: Number(process.env.CACHE_TTL_SECONDS ?? "10"),
  },
  cors: {
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  },
  health: {
    timeoutMs: process.env.HEALTH_TIMEOUT_MS ?? "15000",
    services:
      process.env.HEALTH_SERVICES ??
      "auth-service,inventory-service,order-service",
  },
});
