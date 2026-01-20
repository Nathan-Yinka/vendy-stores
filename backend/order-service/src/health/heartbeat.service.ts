import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { connect, NatsConnection, StringCodec } from "nats";

@Injectable()
export class HeartbeatService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(HeartbeatService.name);
  private connection?: NatsConnection;
  private timer?: NodeJS.Timeout;
  private readonly codec = StringCodec();

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const intervalMs = Number(this.config.get<string>("health.intervalMs", "5000"));
    const natsUrl = this.config.get<string>("nats.url", "nats://nats:4222");
    const subject = this.config.get<string>("health.pingSubject", "health.ping");
    const serviceName = this.config.get<string>("service.name", "order-service");

    try {
      this.connection = await connect({ servers: natsUrl });
      this.timer = setInterval(() => {
        const payload = { service: serviceName, at: Date.now() };
        this.connection?.publish(subject, this.codec.encode(JSON.stringify(payload)));
      }, intervalMs);
    } catch {
      this.logger.warn("Heartbeat NATS connection failed");
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
    }
    await this.connection?.drain();
  }
}
