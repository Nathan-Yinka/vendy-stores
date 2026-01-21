import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard, AuthUserPayload } from "./guards/auth.guard";
import { RolesGuard } from "./guards/roles.guard";
import { AuthUser } from "../common/decorators/auth-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { CreateOrderDto } from "./dto/create-order.dto";
import { CreateProductDto } from "./dto/create-product.dto";
import { ListOrdersDto } from "./dto/list-orders.dto";
import { UpdateStockDto } from "./dto/update-stock.dto";
import { ListProductsDto } from "./dto/list-products.dto";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { GatewayService } from "./gateway.service";

@Controller()
@ApiTags("Gateway")
export class GatewayController {
  constructor(private readonly service: GatewayService) {}

  @Post("/auth/login")
  @ApiOperation({ summary: "Login user" })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: "Login success",
    schema: {
      example: {
        success: true,
        message: "Login successful",
        data: {
          token: "jwt-token",
          userId: "user-1",
          email: "lead@vendyz.dev",
          firstName: "Lead",
          lastName: "Engineer",
          role: "ADMIN",
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Invalid credentials",
    schema: {
      example: { success: false, message: "Invalid credentials", data: null },
    },
  })
  @ApiResponse({
    status: 503,
    description: "Auth service unavailable",
    schema: {
      example: { success: false, message: "Auth service unavailable", data: null },
    },
  })
  async login(@Body() body: LoginDto) {
    return this.service.login(body.email, body.password);
  }

  @Post("/auth/register")
  @ApiOperation({ summary: "Register user" })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 200,
    description: "Registration success",
    schema: {
      example: {
        success: true,
        message: "Registration successful",
        data: {
          userId: "user-2",
          email: "jane@vendyz.dev",
          firstName: "Jane",
          lastName: "Doe",
          role: "USER",
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: "Email already exists",
    schema: {
      example: { success: false, message: "Email already exists", data: null },
    },
  })
  @ApiResponse({
    status: 503,
    description: "Auth service unavailable",
    schema: {
      example: { success: false, message: "Auth service unavailable", data: null },
    },
  })
  async register(@Body() body: RegisterDto) {
    return this.service.register({
      email: body.email,
      password: body.password,
      first_name: body.firstName,
      last_name: body.lastName,
    });
  }

  @Post("/auth/logout")
  @ApiOperation({ summary: "Logout user" })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: "Logout success",
    schema: {
      example: {
        success: true,
        message: "Logout successful",
        data: { revoked: true },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
    schema: {
      example: { success: false, message: "Unauthorized", data: null },
    },
  })
  @ApiResponse({
    status: 503,
    description: "Auth service unavailable",
    schema: {
      example: { success: false, message: "Auth service unavailable", data: null },
    },
  })
  @UseGuards(AuthGuard)
  async logout(@Headers("authorization") authorization?: string) {
    return this.service.logout(authorization);
  }

  @Get("/products/:id")
  @ApiOperation({ summary: "Fetch product" })
  @ApiResponse({
    status: 200,
    description: "Product fetched",
    schema: {
      example: {
        success: true,
        message: "Product fetched",
        data: {
          product_id: "product-1",
          name: "Vendyz Flash Item",
          stock: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Product not found",
    schema: {
      example: { success: false, message: "Product not found", data: null },
    },
  })
  @ApiResponse({
    status: 503,
    description: "Inventory service unavailable",
    schema: {
      example: { success: false, message: "Inventory service unavailable", data: null },
    },
  })
  async getProduct(@Param("id") id: string) {
    return this.service.getProduct(id);
  }

  @Get("/products")
  @ApiOperation({ summary: "List products" })
  @ApiQuery({ type: ListProductsDto })
  @ApiResponse({
    status: 200,
    description: "Products fetched",
    schema: {
      example: {
        success: true,
        message: "Products fetched",
        data: {
          items: [
            { product_id: "product-1", name: "Vendyz Flash Item", stock: 1 },
          ],
          page: 1,
          limit: 10,
          total: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: "Inventory service unavailable",
    schema: {
      example: { success: false, message: "Inventory service unavailable", data: null },
    },
  })
  async listProducts(@Query() query: ListProductsDto) {
    return this.service.listProducts(query.page ?? 1, query.limit ?? 10);
  }

  @Post("/products")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create product (admin only)" })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({
    status: 200,
    description: "Product created",
    schema: {
      example: {
        success: true,
        message: "Product created",
        data: {
          productId: "product-9",
          name: "Vendyz Flash Item",
          stock: 10,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
    schema: {
      example: { success: false, message: "Unauthorized", data: null },
    },
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden",
    schema: {
      example: { success: false, message: "Forbidden", data: null },
    },
  })
  @ApiResponse({
    status: 500,
    description: "Create product failed",
    schema: {
      example: { success: false, message: "Create product failed", data: null },
    },
  })
  async createProduct(
    @AuthUser() _user: AuthUserPayload | undefined,
    @Body() body: CreateProductDto
  ) {
    return this.service.createProduct({ name: body.name, stock: body.stock });
  }

  @Post("/products/:id/stock")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update product stock (admin only)" })
  @ApiBody({ type: UpdateStockDto })
  @ApiResponse({
    status: 200,
    description: "Stock updated",
    schema: {
      example: {
        success: true,
        message: "Stock updated",
        data: {
          productId: "product-1",
          name: "Vendyz Flash Item",
          stock: 20,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
    schema: {
      example: { success: false, message: "Unauthorized", data: null },
    },
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden",
    schema: {
      example: { success: false, message: "Forbidden", data: null },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Product not found",
    schema: {
      example: { success: false, message: "Product not found", data: null },
    },
  })
  @ApiResponse({
    status: 500,
    description: "Update stock failed",
    schema: {
      example: { success: false, message: "Update stock failed", data: null },
    },
  })
  async updateStock(@Param("id") id: string, @Body() body: UpdateStockDto) {
    return this.service.updateStock(id, body.stock);
  }

  @Post("/orders")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create order" })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({
    status: 200,
    description: "Order processed",
    schema: {
      example: {
        success: true,
        message: "Order processed",
        data: {
          orderId: "order-1",
          status: "CONFIRMED",
          message: "Reserved",
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
    schema: {
      example: { success: false, message: "Unauthorized", data: null },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Product not found",
    schema: {
      example: { success: false, message: "Product not found", data: null },
    },
  })
  @ApiResponse({
    status: 409,
    description: "Out of stock",
    schema: {
      example: { success: false, message: "Out of stock", data: null },
    },
  })
  @ApiResponse({
    status: 503,
    description: "Order service unavailable",
    schema: {
      example: { success: false, message: "Order service unavailable", data: null },
    },
  })
  async createOrder(
    @AuthUser() user: AuthUserPayload | undefined,
    @Body() body: CreateOrderDto
  ) {
    return this.service.createOrder({
      productId: body.productId,
      quantity: body.quantity,
      userId: user?.userId ?? "",
    });
  }

  @Get("/orders")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List user orders" })
  @ApiQuery({ type: ListOrdersDto })
  @ApiResponse({
    status: 200,
    description: "Orders fetched",
    schema: {
      example: {
        success: true,
        message: "Orders fetched",
        data: {
          items: [
            {
              order_id: "order-1",
              status: "CONFIRMED",
              product_id: "product-1",
              product_name: "Vendyz Flash Item",
              quantity: 1,
              user_id: "user-1",
            },
          ],
          page: 1,
          limit: 10,
          total: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
    schema: {
      example: { success: false, message: "Unauthorized", data: null },
    },
  })
  @ApiResponse({
    status: 503,
    description: "Order service unavailable",
    schema: {
      example: { success: false, message: "Order service unavailable", data: null },
    },
  })
  async listOrders(
    @AuthUser() user: AuthUserPayload | undefined,
    @Query() query: ListOrdersDto
  ) {
    return this.service.listOrders({
      userId: user?.userId ?? "",
      page: query.page ?? 1,
      limit: query.limit ?? 10,
    });
  }
}
