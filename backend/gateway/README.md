# Gateway Service

REST API for clients. Validates auth/roles, calls internal gRPC services, exposes Swagger.

## Run (local)
```bash
npm install
npm run build
npm run start:dev
```

## Env
See `.env.example`.

## Docs
Swagger: `http://localhost:3000/docs`
