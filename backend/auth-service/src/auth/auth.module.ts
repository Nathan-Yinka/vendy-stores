import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UserModule } from "../users/user.module";
import { RevokedToken } from "./entities/revoked-token.entity";
import { RevokedTokenRepository } from "./repositories/revoked-token.repository";

@Module({
  imports: [UserModule, TypeOrmModule.forFeature([RevokedToken])],
  controllers: [AuthController],
  providers: [AuthService, RevokedTokenRepository],
})
export class AuthModule {}
