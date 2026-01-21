import Joi from "joi";

export const validationSchema = Joi.object({
  GATEWAY_PORT: Joi.string().default("3000"),
  AUTH_GRPC_URL: Joi.string().default("auth-service:50053"),
  AUTH_PROTO_PATH: Joi.string().optional(),
  ORDER_GRPC_URL: Joi.string().default("order-service:50052"),
  ORDER_PROTO_PATH: Joi.string().optional(),
  INVENTORY_GRPC_URL: Joi.string().default("inventory-service:50051"),
  INVENTORY_PROTO_PATH: Joi.string().optional(),
  NATS_URL: Joi.string().default("nats://nats:4222"),
  INVENTORY_RESERVED_SUBJECT: Joi.string().default("inventory.reserved"),
  INVENTORY_CREATED_SUBJECT: Joi.string().default("inventory.created"),
  HEALTH_PING_SUBJECT: Joi.string().default("health.ping"),
  REDIS_URL: Joi.string().default("redis://redis:6379"),
  CACHE_TTL_SECONDS: Joi.number().default(10),
  CORS_ORIGIN: Joi.string().default("http://localhost:5173"),
  HEALTH_TIMEOUT_MS: Joi.number().default(15000),
  HEALTH_SERVICES: Joi.string().default("auth-service,inventory-service,order-service"),
});
