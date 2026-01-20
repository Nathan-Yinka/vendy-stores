import Joi from "joi";

export const validationSchema = Joi.object({
  ORDER_DATABASE_URL: Joi.string().required(),
  ORDER_GRPC_URL: Joi.string().default("0.0.0.0:50052"),
  ORDER_PROTO_PATH: Joi.string().optional(),
  ORDER_CREATED_SUBJECT: Joi.string().default("order.created"),
  NATS_URL: Joi.string().default("nats://nats:4222"),
  INVENTORY_GRPC_URL: Joi.string().default("inventory-service:50051"),
  INVENTORY_PROTO_PATH: Joi.string().optional(),
  HEALTH_INTERVAL_MS: Joi.number().default(5000),
  HEALTH_GATEWAY_URL: Joi.string().default("http://gateway:3000"),
  HEALTH_PING_SUBJECT: Joi.string().default("health.ping"),
  SERVICE_NAME: Joi.string().default("order-service"),
});
