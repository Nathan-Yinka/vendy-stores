import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      url: config.get<string>("order.grpcUrl", "0.0.0.0:50052"),
      package: "orders",
      protoPath: config.get<string>("order.protoPath"),
      loader: {
        keepCase: true,
      },
    },
  });

  await app.init();
  await app.startAllMicroservices();
}

bootstrap();
