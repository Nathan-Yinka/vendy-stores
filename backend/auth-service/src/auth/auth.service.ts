import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { sign, verify, type Secret, type SignOptions } from "jsonwebtoken";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { UserRepository } from "../users/user.repository";
import { Result } from "../common/types/result";
import { RevokedTokenRepository } from "./repositories/revoked-token.repository";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly repository: UserRepository,
    private readonly config: ConfigService,
    private readonly revokedTokens: RevokedTokenRepository
  ) {}

  /**
   * Validate credentials and issue a JWT for the user.
   */
  async login(
    email: string,
    password: string
  ): Promise<
    Result<{
      token: string;
      userId: string;
      email: string;
      role: string;
      firstName: string;
      lastName: string;
    }>
  > {
    this.logger.log(`Login attempt for ${email}`);
    const user = await this.repository.findByEmail(email);
    if (!user) {
      this.logger.warn(`Login failed for ${email}: user not found`);
      return [null, "Invalid credentials"];
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      this.logger.warn(`Login failed for ${email}: invalid password`);
      return [null, "Invalid credentials"];
    }

    const expiresIn = this.config.get<string>("auth.jwtExpiresIn", "1h") as
      SignOptions["expiresIn"];
    const token = sign(
      { sub: user.id, email: user.email },
      this.config.getOrThrow<string>("auth.jwtSecret") as Secret,
      { expiresIn }
    );

    this.logger.log(`Login success for ${email}`);
    return [
      {
        token,
        userId: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
      },
      null,
    ];
  }

  /**
   * Register a new user with a hashed password.
   */
  async register(payload: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }): Promise<
    Result<{
      userId: string;
      email: string;
      role: string;
      firstName: string;
      lastName: string;
    }>
  > {
    const existing = await this.repository.findByEmail(payload.email);
    if (existing) {
      this.logger.warn(`Registration failed: ${payload.email} already exists`);
      return [null, "Email already exists"];
    }

    const hashedPassword = await bcrypt.hash(payload.password, 10);
    let user;
    try {
      user = await this.repository.createUser({
        id: randomUUID(),
        email: payload.email,
        role: "USER",
        first_name: payload.first_name,
        last_name: payload.last_name,
        password: hashedPassword,
      });
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === "23505") {
        this.logger.warn(`Registration conflict for ${payload.email}`);
        return [null, "Email already exists"];
      }
      this.logger.error(`Registration error for ${payload.email}`, error as Error);
      return [null, "Registration failed"];
    }

    this.logger.log(`Registration success for ${payload.email}`);
    return [
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
      },
      null,
    ];
  }

  /**
   * Validate a JWT and return the associated user role.
   */
  async validateToken(
    token: string
  ): Promise<Result<{ valid: boolean; userId: string; email: string; role: string }>> {
    try {
      const payload = verify(
        token,
        this.config.getOrThrow<string>("auth.jwtSecret") as Secret
      ) as { sub: string; email: string };

      const revoked = await this.revokedTokens.isRevoked(token);
      if (revoked) {
        this.logger.warn("Token validation failed: token revoked");
        return [
          { valid: false, userId: "", email: "", role: "" },
          "Invalid token",
        ];
      }

      const user = await this.repository.findById(payload.sub);
      if (!user) {
        this.logger.warn("Token validation failed: user not found");
        return [
          { valid: false, userId: "", email: "", role: "" },
          "Invalid token",
        ];
      }
      this.logger.log(`Token validated for ${user.email}`);
      return [
        {
          valid: true,
          userId: user.id,
          email: user.email,
          role: user.role ?? "USER",
        },
        null,
      ];
    } catch {
      this.logger.warn("Token validation failed");
      return [
        { valid: false, userId: "", email: "", role: "" },
        "Invalid token",
      ];
    }
  }

  /**
   * Revoke an access token (logout).
   */
  async logout(token: string): Promise<Result<{ revoked: boolean }>> {
    try {
      const payload = verify(
        token,
        this.config.getOrThrow<string>("auth.jwtSecret") as Secret
      ) as { exp?: number };
      const expiresAt = payload.exp
        ? new Date(payload.exp * 1000)
        : new Date(Date.now() + 60 * 60 * 1000);

      await this.revokedTokens.revoke(token, expiresAt);
      return [{ revoked: true }, null];
    } catch {
      return [null, "Invalid token"];
    }
  }
}
