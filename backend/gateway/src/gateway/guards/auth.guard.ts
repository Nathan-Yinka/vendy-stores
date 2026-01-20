import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthClient } from "../clients/auth.client";

export interface AuthUserPayload {
  userId: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(private readonly authClient: AuthClient) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header = request.headers.authorization as string | undefined;

    if (!header) {
      this.logger.warn("Missing Authorization header");
      throw new UnauthorizedException("Missing Authorization header");
    }

    const token = header.replace("Bearer ", "");
    let result;
    try {
      result = await this.authClient.validateToken(token);
    } catch {
      this.logger.error("Auth service unavailable during token validation");
      throw new ServiceUnavailableException("Auth service unavailable");
    }

    if (!result.success) {
      if (result.code === "AUTH_UNAVAILABLE") {
        this.logger.error("Auth service unavailable during token validation");
        throw new ServiceUnavailableException("Auth service unavailable");
      }
      this.logger.warn("Invalid token");
      throw new UnauthorizedException("Invalid token");
    }

    const data = result.data;
    if (!data || !data.valid) {
      this.logger.warn("Invalid token");
      throw new UnauthorizedException("Invalid token");
    }

    request.user = {
      userId: data.user_id,
      email: data.email,
      role: data.role,
    } as AuthUserPayload;
    return true;
  }
}
