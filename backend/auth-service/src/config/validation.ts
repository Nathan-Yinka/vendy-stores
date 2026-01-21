import Joi from "joi";

export const validationSchema = Joi.object({
  AUTH_JWT_SECRET: Joi.string().required(),
  AUTH_JWT_EXPIRES_IN: Joi.string().default("1h"),
  AUTH_DATABASE_URL: Joi.string().required(),
  AUTH_GRPC_URL: Joi.string().default("0.0.0.0:50053"),
  AUTH_PROTO_PATH: Joi.string().optional(),
  AUTH_SEED_EMAIL: Joi.string().optional(),
  AUTH_SEED_PASSWORD: Joi.string().optional(),
  AUTH_SEED_ROLE: Joi.string().default("ADMIN"),
  AUTH_SEED_FIRST_NAME: Joi.string().default("Lead"),
  AUTH_SEED_LAST_NAME: Joi.string().default("Engineer"),
  NATS_URL: Joi.string().default("nats://nats:4222"),
  HEALTH_INTERVAL_MS: Joi.number().default(5000),
  HEALTH_GATEWAY_URL: Joi.string().default("http://gateway:3000"),
  HEALTH_PING_SUBJECT: Joi.string().default("health.ping"),
  SERVICE_NAME: Joi.string().default("auth-service"),
});
