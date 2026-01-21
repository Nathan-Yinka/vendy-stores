import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";

export interface GrpcResponse<T> {
  success: boolean;
  code: string;
  message: string;
  data?: T;
}

export const assertGrpcSuccess = <T>(response: GrpcResponse<T>): T => {
  if (response.success && response.data) {
    return response.data;
  }

  const message = response.message || "Request failed";

  switch (response.code) {
    case "INVALID_CREDENTIALS":
    case "INVALID_TOKEN":
      throw new UnauthorizedException(message);
    case "FORBIDDEN":
      throw new ForbiddenException(message);
    case "EMAIL_EXISTS":
      throw new ConflictException(message);
    case "ORDER_FAILED":
    case "VALIDATION_FAILED":
      throw new BadRequestException(message);
    case "OUT_OF_STOCK":
      throw new ConflictException(message);
    case "PRODUCT_NOT_FOUND":
    case "ORDER_NOT_FOUND":
      throw new NotFoundException(message);
    case "INVENTORY_UNAVAILABLE":
    case "AUTH_UNAVAILABLE":
    case "ORDER_UNAVAILABLE":
      throw new ServiceUnavailableException(message);
    case "RESERVE_FAILED":
    case "CREATE_FAILED":
    case "LIST_FAILED":
      throw new InternalServerErrorException(message);
    case "UPDATE_FAILED":
      throw new InternalServerErrorException(message);
    default:
      throw new BadRequestException(message);
  }
};
