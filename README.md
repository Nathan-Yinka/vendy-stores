# Vendyz Flash Sale

Microservices-based flash sale system built with NestJS, gRPC, NATS, Postgres, Redis cache, and a Vite + React frontend.

## How to Run

```bash
docker-compose up --build
```

- Gateway: http://localhost:3000
- Swagger: http://localhost:3000/docs
- Frontend: http://localhost:5173

Seeded user:
```
email: lead@vendyz.dev
password: flashsale
```

## Architecture (ADR)

**Database choice:** Postgres
- Strong transactions and row-level locking for inventory safety.

**Race condition handling:** Atomic update inside transaction
- `UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1`.
- Prevents oversell under high concurrency.

**REST vs Event-driven:**
- REST at the Gateway for browser clients.
- gRPC for service-to-service calls (typed, fast, internal).
- NATS for async events (audit, analytics, cache invalidation).

**Why gRPC:**
- Strict contracts with proto files; low-latency internal calls.

**Why a Gateway:**
- Single entry point for auth, validation, and response formatting.
- Central place for rate limits, auth, and API documentation.

## Services
- Auth Service (JWT + roles)
- Inventory Service (stock source of truth)
- Order Service (order creation + inventory reservation)
- Gateway Service (REST API + Swagger)
- Frontend (Vite + React)

## Notes
- Inventory is seeded with `product-1` stock `1`.
- Redis is used for product read caching.
- NATS publishes inventory/order events; gateway subscribes for cache updates.
