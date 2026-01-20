import { Body, Controller, Post } from "@nestjs/common";
import { HealthPingDto } from "./dto/health-ping.dto";
import { HealthService } from "./health.service";
import { successResponse } from "../common/response";

@Controller("/health")
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Post("/ping")
  ping(@Body() body: HealthPingDto) {
    this.health.update(body.service);
    return successResponse({ received: true }, "Ping received");
  }
}
