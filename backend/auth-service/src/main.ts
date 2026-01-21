import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { AppModule } from "./app.module";
import { AllRpcExceptionsFilter } from "./common/rpc-exception.filter";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      url: config.get<string>("auth.grpcUrl", "0.0.0.0:50053"),
      package: "auth",
      protoPath: config.get<string>("auth.protoPath"),
      loader: {
        keepCase: true,
      },
    },
  });

  app.useGlobalFilters(new AllRpcExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  await app.init();
  await app.startAllMicroservices();
}

bootstrap();
