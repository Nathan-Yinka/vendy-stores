import {
  Controller,
  Get,
  HttpException,
  Logger,
  Param,
  Post,
  UnauthorizedException,
  Body,
  ServiceUnavailableException,
  UseGuards,
  Query,
  Headers,
} from "@nestjs/common";
import { InventoryClient } from "./clients/inventory.client";
import { OrderClient } from "./clients/order.client";
import { AuthClient } from "./clients/auth.client";
import { successResponse } from "../common/response";
import { AuthGuard, AuthUserPayload } from "./guards/auth.guard";
import { RolesGuard } from "./guards/roles.guard";
import { AuthUser } from "../common/decorators/auth-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { CreateOrderDto } from "./dto/create-order.dto";
import { CreateProductDto } from "./dto/create-product.dto";
import { CacheService } from "../common/cache/cache.service";
import { assertGrpcSuccess } from "../common/grpc-response";
import { ListProductsDto } from "./dto/list-products.dto";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";

@Controller()
@ApiTags("Gateway")
export class GatewayController {
  private readonly logger = new Logger(GatewayController.name);

  constructor(
    private readonly inventoryClient: InventoryClient,
    private readonly orderClient: OrderClient,
    private readonly authClient: AuthClient,
    private readonly cache: CacheService
  ) {}

  @Post("/auth/login")
  @ApiOperation({ summary: "Login user" })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: "Login success" })
  async login(@Body() body: LoginDto) {
    this.logger.log(`Login request for ${body.email}`);
    try {
      const result = await this.authClient.login(body.email, body.password);
      const data = assertGrpcSuccess(result);
      return successResponse(
        {
          token: data.token,
          userId: data.user_id,
          email: data.email,
          firstName: data.first_name,
          lastName: data.last_name,
          role: data.role,
        },
        "Login successful"
      );
    } catch (error) {
      this.logger.warn(`Login failed for ${body.email}`);
      this.logger.error(`Auth service error on login for ${body.email}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new ServiceUnavailableException("Auth service unavailable");
    }
  }

  @Post("/auth/register")
  @ApiOperation({ summary: "Register user" })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 200, description: "Registration success" })
  async register(@Body() body: RegisterDto) {
    this.logger.log(`Register request for ${body.email}`);
    try {
      const result = await this.authClient.register({
        email: body.email,
        password: body.password,
        first_name: body.firstName,
        last_name: body.lastName,
      });
      const data = assertGrpcSuccess(result);
      return successResponse(
        {
          userId: data.user_id,
          email: data.email,
          firstName: data.first_name,
          lastName: data.last_name,
          role: data.role,
        },
        "Registration successful"
      );
    } catch (error) {
      this.logger.warn(`Register failed for ${body.email}`);
      this.logger.error(`Auth service error on register for ${body.email}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new ServiceUnavailableException("Auth service unavailable");
    }
  }

  @Post("/auth/logout")
  @ApiOperation({ summary: "Logout user" })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Logout success" })
  @UseGuards(AuthGuard)
  async logout(@Headers("authorization") authorization?: string) {
    if (!authorization) {
      throw new UnauthorizedException("Missing Authorization header");
    }

    const token = authorization.replace("Bearer ", "");
    try {
      const response = await this.authClient.logout(token);
      const data = assertGrpcSuccess(response);
      return successResponse({ revoked: data.revoked }, "Logout successful");
    } catch (error) {
      this.logger.error("Auth service error on logout");
      if (error instanceof HttpException) {
        throw error;
      }
      throw new ServiceUnavailableException("Auth service unavailable");
    }
  }

  @Get("/products/:id")
  @ApiOperation({ summary: "Fetch product" })
  @ApiResponse({ status: 200, description: "Product fetched" })
  async getProduct(@Param("id") id: string) {
    this.logger.log(`Get product ${id}`);
    try {
      const cacheKey = `product:${id}`;
      const cached = await this.cache.get<{
        product_id: string;
        name: string;
        stock: number;
      }>(cacheKey);
      if (cached) {
        return successResponse(cached, "Product fetched");
      }

      const response = await this.inventoryClient.getProduct(id);
      const product = assertGrpcSuccess(response);
      await this.cache.set(cacheKey, product);
      return successResponse(product, "Product fetched");
    } catch (error) {
      this.logger.error(`Inventory service error on get product ${id}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new ServiceUnavailableException("Inventory service unavailable");
    }
  }

  @Get("/products")
  @ApiOperation({ summary: "List products" })
  @ApiQuery({ type: ListProductsDto })
  @ApiResponse({ status: 200, description: "Products fetched" })
  async listProducts(@Query() query: ListProductsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    try {
      const response = await this.inventoryClient.listProducts({ page, limit });
      const data = assertGrpcSuccess(response);
      return successResponse(data, "Products fetched");
    } catch (error) {
      this.logger.error("Inventory service error on list products");
      if (error instanceof HttpException) {
        throw error;
      }
      throw new ServiceUnavailableException("Inventory service unavailable");
    }
  }

  @Post("/products")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create product (admin only)" })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({ status: 200, description: "Product created" })
  async createProduct(
    @AuthUser() user: AuthUserPayload | undefined,
    @Body() body: CreateProductDto
  ) {
    if (!user) {
      throw new UnauthorizedException("Unauthorized");
    }

    this.logger.log(`Create product request by ${user.email}`);
    try {
      const response = await this.inventoryClient.createProduct({
        name: body.name,
        stock: body.stock,
      });
      const product = assertGrpcSuccess(response);

      return successResponse(
        {
          productId: product.product_id,
          name: product.name,
          stock: product.stock,
        },
        "Product created"
      );
    } catch (error) {
      this.logger.error(`Inventory service error on create product ${body.name}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new ServiceUnavailableException("Inventory service unavailable");
    }
  }

  @Post("/orders")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create order" })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({ status: 200, description: "Order processed" })
  async createOrder(
    @AuthUser() user: AuthUserPayload | undefined,
    @Body() body: CreateOrderDto
  ) {
    const userId = user?.userId ?? "";
    this.logger.log(`Create order request product=${body.productId} user=${userId}`);
    try {
      const response = await this.orderClient.createOrder(
        body.productId,
        body.quantity,
        userId
      );
      const result = assertGrpcSuccess(response);

      return successResponse(
        {
          orderId: result.order_id,
          status: result.status,
          message: result.message,
        },
        "Order processed"
      );
    } catch (error) {
      this.logger.error(`Order service error on create order product=${body.productId}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new ServiceUnavailableException("Order service unavailable");
    }
  }
}
