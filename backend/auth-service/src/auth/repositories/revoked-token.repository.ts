import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RevokedToken } from "../entities/revoked-token.entity";

@Injectable()
export class RevokedTokenRepository {
  constructor(
    @InjectRepository(RevokedToken)
    private readonly repository: Repository<RevokedToken>
  ) {}

  async isRevoked(token: string): Promise<boolean> {
    const record = await this.repository.findOne({ where: { token } });
    return !!record;
  }

  async revoke(token: string, expiresAt: Date): Promise<void> {
    await this.repository.upsert(
      { token, expires_at: expiresAt },
      { conflictPaths: ["token"] }
    );
  }
}
