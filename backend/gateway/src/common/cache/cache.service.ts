import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, RedisClientType } from "redis";

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private client?: RedisClientType;
  private readonly logger = new Logger(CacheService.name);
  private enabled = false;
  private ttlSeconds = 10;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const url = this.config.get<string>("redis.url", "redis://redis:6379");
    this.ttlSeconds = Number(this.config.get<string>("redis.ttlSeconds", "10"));
    this.client = createClient({ url });
    this.client.on("error", (error) => this.logger.error("Redis error", error));
    try {
      await this.client.connect();
      this.enabled = true;
      this.logger.log("Redis cache connected");
    } catch (error) {
      this.enabled = false;
      this.logger.warn("Redis cache unavailable");
      this.logger.error("Redis connect error", error as Error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.enabled) {
      await this.client?.quit();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.enabled) {
      return null;
    }
    const value = await this.client.get(key);
    if (!value) {
      return null;
    }
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.warn(`Cache parse failed for ${key}`);
      await this.del(key);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (!this.client || !this.enabled) {
      return;
    }
    await this.client.set(key, JSON.stringify(value), {
      EX: ttlSeconds ?? this.ttlSeconds,
    });
  }

  async del(key: string): Promise<void> {
    if (!this.client || !this.enabled) {
      return;
    }
    await this.client.del(key);
  }
}
