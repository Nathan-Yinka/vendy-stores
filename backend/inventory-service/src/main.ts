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
      url: config.get<string>("inventory.grpcUrl", "0.0.0.0:50051"),
      package: "inventory",
      protoPath: config.get<string>("inventory.protoPath"),
    },
  });

  await app.startAllMicroservices();
}

bootstrap();
