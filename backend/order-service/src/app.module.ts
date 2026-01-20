import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { OrdersModule } from "./orders/orders.module";
import { DatabaseModule } from "./database/database.module";
import { configuration } from "./config/configuration";
import { validationSchema } from "./config/validation";
import { HeartbeatService } from "./health/heartbeat.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    DatabaseModule,
    OrdersModule,
  ],
  providers: [HeartbeatService],
})
export class AppModule {}
