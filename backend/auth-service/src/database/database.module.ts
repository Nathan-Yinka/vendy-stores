import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { User } from "../users/user.entity";
import { RevokedToken } from "../auth/entities/revoked-token.entity";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        url: config.get<string>("database.url"),
        entities: [User, RevokedToken],
        synchronize: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
