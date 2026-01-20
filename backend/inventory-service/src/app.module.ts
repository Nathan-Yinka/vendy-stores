import { Module, OnModuleInit } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { InventoryModule } from "./inventory/inventory.module";
import { DatabaseModule } from "./database/database.module";
import { ProductRepository } from "./inventory/repositories/product.repository";
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
    InventoryModule,
  ],
  providers: [HeartbeatService],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly repository: ProductRepository) {}

  async onModuleInit(): Promise<void> {
    await this.repository.seedDefault();
  }
}
