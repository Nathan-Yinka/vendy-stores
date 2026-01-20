import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { connect, NatsConnection, StringCodec } from "nats";
import { CacheService } from "../cache/cache.service";
import { HealthService } from "../../health/health.service";

@Injectable()
export class NatsSubscriberService implements OnModuleInit, OnModuleDestroy {
  private connection?: NatsConnection;
  private readonly logger = new Logger(NatsSubscriberService.name);
  private readonly codec = StringCodec();

  constructor(
    private readonly cache: CacheService,
    private readonly config: ConfigService,
    private readonly health: HealthService
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      this.connection = await connect({
        servers: this.config.get<string>("nats.url", "nats://nats:4222"),
      });
      this.logger.log("NATS connected");
      this.subscribe(
        this.config.get<string>("nats.reservedSubject", "inventory.reserved")
      );
      this.subscribe(
        this.config.get<string>("nats.createdSubject", "inventory.created")
      );
      this.subscribe(this.config.get<string>("nats.healthSubject", "health.ping"));
    } catch (error) {
      this.logger.error("NATS connection failed", error as Error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.connection?.drain();
  }

  private subscribe(subject: string) {
    const subscription = this.connection?.subscribe(subject);
    if (!subscription) {
      return;
    }

    (async () => {
      for await (const message of subscription) {
        let payload: {
          productId?: string;
          name?: string;
          remaining?: number;
          stock?: number;
          service?: string;
          at?: number;
        };
        try {
          payload = JSON.parse(this.codec.decode(message.data));
        } catch (error) {
          this.logger.warn(`Invalid NATS payload on ${subject}`);
          continue;
        }

        if (payload.service) {
          this.health.update(payload.service, payload.at);
          continue;
        }

        if (!payload.productId) {
          continue;
        }

        const cacheKey = `product:${payload.productId}`;
        await this.cache.del(cacheKey);

        if (payload.name && (payload.remaining !== undefined || payload.stock !== undefined)) {
          const stock = payload.remaining ?? payload.stock ?? 0;
          await this.cache.set(cacheKey, {
            product_id: payload.productId,
            name: payload.name,
            stock,
          });
        }
      }
    })().catch((error) =>
      this.logger.error(`NATS subscription error (${subject})`, error as Error)
    );
  }
}
