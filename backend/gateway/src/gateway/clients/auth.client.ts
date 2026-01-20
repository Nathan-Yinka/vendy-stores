import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

interface AuthGrpcService {
  Login(request: { email: string; password: string }): unknown;
  Register(request: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }): unknown;
  Logout(request: { token: string }): unknown;
  ValidateToken(request: { token: string }): unknown;
}

@Injectable()
export class AuthClient implements OnModuleInit {
  private service?: AuthGrpcService;

  constructor(@Inject("AUTH_GRPC") private readonly client: ClientGrpc) {}

  onModuleInit(): void {
    this.service = this.client.getService<AuthGrpcService>("AuthService");
  }

  async login(email: string, password: string) {
    if (!this.service) {
      throw new Error("Auth service unavailable");
    }

    return firstValueFrom(
      this.service.Login({ email, password }) as any
    ) as Promise<{
      success: boolean;
      code: string;
      message: string;
      data?: {
        token: string;
        user_id: string;
        email: string;
        first_name: string;
        last_name: string;
        role: string;
      };
    }>;
  }

  async register(payload: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }) {
    if (!this.service) {
      throw new Error("Auth service unavailable");
    }

    return firstValueFrom(this.service.Register(payload) as any) as Promise<{
      success: boolean;
      code: string;
      message: string;
      data?: {
        user_id: string;
        email: string;
        first_name: string;
        last_name: string;
        role: string;
      };
    }>;
  }

  async logout(token: string) {
    if (!this.service) {
      throw new Error("Auth service unavailable");
    }

    return firstValueFrom(this.service.Logout({ token }) as any) as Promise<{
      success: boolean;
      code: string;
      message: string;
      data?: { revoked: boolean };
    }>;
  }

  async validateToken(token: string) {
    if (!this.service) {
      return {
        success: false,
        code: "AUTH_UNAVAILABLE",
        message: "Auth service unavailable",
        data: undefined,
      };
    }

    return firstValueFrom(
      this.service.ValidateToken({ token }) as any
    ) as Promise<{
      success: boolean;
      code: string;
      message: string;
      data?: { valid: boolean; user_id: string; email: string; role: string };
    }>;
  }
}
