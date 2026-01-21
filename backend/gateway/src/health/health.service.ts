import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

interface ServiceStatus {
  service: string;
  lastSeen: number;
  isUp: boolean;
}

@Injectable()
export class HealthService {
  private readonly lastSeen = new Map<string, number>();

  constructor(private readonly config: ConfigService) {
    const services = this.config
      .get<string>("health.services", "")
      .split(",")
      .map((service) => service.trim())
      .filter((service) => service.length > 0);

    for (const service of services) {
      if (!this.lastSeen.has(service)) {
        this.lastSeen.set(service, 0);
      }
    }
  }

  update(service: string, at?: number): void {
    if (!this.lastSeen.has(service)) {
      this.lastSeen.set(service, 0);
    }
    this.lastSeen.set(service, at ?? Date.now());
  }

  getStatuses(timeoutMs: number): ServiceStatus[] {
    const now = Date.now();
    return Array.from(this.lastSeen.entries()).map(([service, timestamp]) => ({
      service,
      lastSeen: timestamp,
      isUp: timestamp > 0 && now - timestamp <= timeoutMs,
    }));
  }
}
