import { Injectable } from "@nestjs/common";

interface ServiceStatus {
  service: string;
  lastSeen: number;
  isUp: boolean;
}

@Injectable()
export class HealthService {
  private readonly lastSeen = new Map<string, number>();

  update(service: string, at?: number): void {
    this.lastSeen.set(service, at ?? Date.now());
  }

  getStatuses(timeoutMs: number): ServiceStatus[] {
    const now = Date.now();
    return Array.from(this.lastSeen.entries()).map(([service, timestamp]) => ({
      service,
      lastSeen: timestamp,
      isUp: now - timestamp <= timeoutMs,
    }));
  }
}
