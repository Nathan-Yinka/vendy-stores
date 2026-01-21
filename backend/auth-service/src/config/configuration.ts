import { join } from "path";

export const configuration = () => ({
  auth: {
    jwtSecret: process.env.AUTH_JWT_SECRET,
    grpcUrl: process.env.AUTH_GRPC_URL ?? "0.0.0.0:50053",
    jwtExpiresIn: process.env.AUTH_JWT_EXPIRES_IN ?? "1h",
    protoPath:
      process.env.AUTH_PROTO_PATH ?? join(process.cwd(), "proto", "auth.proto"),
    seed: {
      email: process.env.AUTH_SEED_EMAIL,
      password: process.env.AUTH_SEED_PASSWORD,
      role: process.env.AUTH_SEED_ROLE ?? "ADMIN",
      firstName: process.env.AUTH_SEED_FIRST_NAME ?? "Lead",
      lastName: process.env.AUTH_SEED_LAST_NAME ?? "Engineer",
    },
  },
  database: {
    url: process.env.AUTH_DATABASE_URL,
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
    name: process.env.SERVICE_NAME ?? "auth-service",
  },
});
