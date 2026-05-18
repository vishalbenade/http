import { Injectable } from '@angular/core';
import { environment } from '@env/environment';

export interface ServiceConfig {
  baseUrl:   string;
  timeoutMs: number;
}

@Injectable({ providedIn: 'root' })
export class ServiceRegistryService {

  private readonly services: Record<string, ServiceConfig> = {
    orders:    { baseUrl: environment.ordersUrl,    timeoutMs: 10_000 },
    inventory: { baseUrl: environment.inventoryUrl, timeoutMs: 15_000 },
    analytics: { baseUrl: environment.analyticsUrl, timeoutMs: 30_000 },
  };

  get(service: string): ServiceConfig {
    const config = this.services[service];
    if (!config) throw new Error(`Service not registered: "${service}"`);
    return config;
  }
}
