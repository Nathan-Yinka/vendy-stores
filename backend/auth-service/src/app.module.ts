import { Module, OnModuleInit } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { UserModule } from "./users/user.module";
import { DatabaseModule } from "./database/database.module";
import { UserRepository } from "./users/user.repository";
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
    UserModule,
    AuthModule,
  ],
  providers: [HeartbeatService],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly repository: UserRepository) {}

  async onModuleInit(): Promise<void> {
    await this.repository.seedDefault();
  }
}
