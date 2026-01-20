import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { connect, NatsConnection, StringCodec } from "nats";

@Injectable()
export class NatsPublisher implements OnModuleInit, OnModuleDestroy {
  private connection?: NatsConnection;
  private readonly codec = StringCodec();

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    this.connection = await connect({
      servers: this.config.get<string>("nats.url", "nats://nats:4222"),
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.connection?.drain();
  }

  async publish(subject: string, payload: unknown): Promise<void> {
    if (!this.connection) {
      return;
    }
    const data = this.codec.encode(JSON.stringify(payload));
    this.connection.publish(subject, data);
  }
}
