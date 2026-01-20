import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AuthUserPayload } from "../../gateway/guards/auth.guard";

export const AuthUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUserPayload | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as AuthUserPayload | undefined;
  }
);
