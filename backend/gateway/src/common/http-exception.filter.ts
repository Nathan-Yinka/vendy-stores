import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";
import { StandardResponse } from "./response";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();

    const { status, message } = this.resolveException(exception);
    const payload: StandardResponse<null> = {
      success: false,
      message,
      data: null,
    };

    response.status(status).json(payload);
  }

  private resolveException(exception: unknown): { status: number; message: string } {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const message =
        typeof response === "string"
          ? response
          : Array.isArray((response as { message?: string | string[] }).message)
            ? (response as { message: string[] }).message.join(", ")
            : (response as { message?: string }).message ?? exception.message;
      return { status: exception.getStatus(), message };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
    };
  }
}
