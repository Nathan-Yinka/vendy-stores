import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "socket.io";
import { ConfigService } from "@nestjs/config";
import { HealthService } from "./health.service";

@WebSocketGateway({ path: "/health/socket" })
export class HealthGateway {
  @WebSocketServer()
  private readonly server!: Server;

  private readonly timeoutMs: number;

  constructor(
    private readonly health: HealthService,
    private readonly config: ConfigService
  ) {
    this.timeoutMs =
      Number(this.config.get<string>("health.timeoutMs", "15000")) || 15000;
    setInterval(() => this.broadcast(), 5000);
  }

  handleConnection() {
    this.broadcast();
  }

  private broadcast() {
    const statuses = this.health.getStatuses(this.timeoutMs);
    this.server.emit("health.status", statuses);
  }
}
