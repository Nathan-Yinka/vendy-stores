import Joi from "joi";

export const validationSchema = Joi.object({
  INVENTORY_DATABASE_URL: Joi.string().required(),
  INVENTORY_GRPC_URL: Joi.string().default("0.0.0.0:50051"),
  INVENTORY_PROTO_PATH: Joi.string().optional(),
  INVENTORY_RESERVED_SUBJECT: Joi.string().default("inventory.reserved"),
  INVENTORY_CREATED_SUBJECT: Joi.string().default("inventory.created"),
  NATS_URL: Joi.string().default("nats://nats:4222"),
  HEALTH_INTERVAL_MS: Joi.number().default(5000),
  HEALTH_GATEWAY_URL: Joi.string().default("http://gateway:3000"),
  HEALTH_PING_SUBJECT: Joi.string().default("health.ping"),
  SERVICE_NAME: Joi.string().default("inventory-service"),
});
