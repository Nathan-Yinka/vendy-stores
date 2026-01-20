import { Controller, Logger, UsePipes, ValidationPipe } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

interface ValidateTokenRequest {
  token: string;
}

interface LogoutRequest {
  token: string;
}

@Controller()
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly service: AuthService) {}

  @GrpcMethod("AuthService", "Login")
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async login(request: LoginDto) {
    this.logger.log(`Login request received for ${request.email}`);
    const [result, error] = await this.service.login(
      request.email,
      request.password
    );
    if (!result) {
      this.logger.warn(`Login request failed for ${request.email}`);
      return {
        success: false,
        code: "INVALID_CREDENTIALS",
        message: error ?? "Invalid credentials",
        data: { token: "", user_id: "", email: "", first_name: "", last_name: "", role: "" },
      };
    }

    return {
      success: true,
      code: "OK",
      message: "Login successful",
      data: {
        token: result.token,
        user_id: result.userId,
        email: result.email,
        first_name: result.firstName,
        last_name: result.lastName,
        role: result.role,
      },
    };
  }

  @GrpcMethod("AuthService", "Register")
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async register(request: RegisterDto) {
    this.logger.log(`Register request received for ${request.email}`);
    const [result, error] = await this.service.register(request);
    if (!result) {
      this.logger.warn(`Register request failed for ${request.email}`);
      return {
        success: false,
        code: "EMAIL_EXISTS",
        message: error ?? "Email already exists",
        data: { user_id: "", email: "", first_name: "", last_name: "", role: "" },
      };
    }

    return {
      success: true,
      code: "OK",
      message: "Registration successful",
      data: {
        user_id: result.userId,
        email: result.email,
        first_name: result.firstName,
        last_name: result.lastName,
        role: result.role,
      },
    };
  }

  @GrpcMethod("AuthService", "ValidateToken")
  async validateToken(request: ValidateTokenRequest) {
    this.logger.log("ValidateToken request received");
    const [result, error] = await this.service.validateToken(request.token);
    return {
      success: !error,
      code: error ? "INVALID_TOKEN" : "OK",
      message: error ?? "Token validated",
      data: {
        valid: result?.valid ?? false,
        user_id: result?.userId ?? "",
        email: result?.email ?? "",
        role: result?.role ?? "",
      },
    };
  }

  @GrpcMethod("AuthService", "Logout")
  async logout(request: LogoutRequest) {
    const [result, error] = await this.service.logout(request.token);
    if (!result) {
      return {
        success: false,
        code: "INVALID_TOKEN",
        message: error ?? "Invalid token",
        data: { revoked: false },
      };
    }

    return {
      success: true,
      code: "OK",
      message: "Logout successful",
      data: {
        revoked: result.revoked,
      },
    };
  }
}
