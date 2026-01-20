import { join } from "path";

export const configuration = () => ({
  inventory: {
    grpcUrl: process.env.INVENTORY_GRPC_URL ?? "0.0.0.0:50051",
    protoPath:
      process.env.INVENTORY_PROTO_PATH ??
      join(process.cwd(), "proto", "inventory.proto"),
    reservedSubject: process.env.INVENTORY_RESERVED_SUBJECT ?? "inventory.reserved",
    createdSubject: process.env.INVENTORY_CREATED_SUBJECT ?? "inventory.created",
  },
  database: {
    url: process.env.INVENTORY_DATABASE_URL,
  },
  nats: {
    url: process.env.NATS_URL ?? "nats://nats:4222",
  },
  health: {
    intervalMs: process.env.HEALTH_INTERVAL_MS ?? "5000",
    gatewayUrl: process.env.HEALTH_GATEWAY_URL ?? "http://gateway:3000",
    pingSubject: process.env.HEALTH_PING_SUBJECT ?? "health.ping",
  },
  service: {
    name: process.env.SERVICE_NAME ?? "inventory-service",
  },
});
