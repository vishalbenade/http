import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CoreHttpService } from '../core-http.service';
import { ServiceRegistryService } from '../service-registry.service';

export interface Order {
  id:         string;
  status:     string;
  customerId: string;
  createdAt:  string;
}

export interface CreateOrderDto {
  customerId: string;
  items:      { sku: string; qty: number }[];
}

@Injectable({ providedIn: 'root' })
export class OrdersApiClient {

  private readonly http     = inject(CoreHttpService);
  private readonly config   = inject(ServiceRegistryService).get('orders');
  private readonly base     = this.config.baseUrl;
  private readonly timeout  = this.config.timeoutMs;

  getOrder(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.base}/orders/${id}`, {
      timeoutMs: this.timeout,
    });
  }

  listOrders(status?: string): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.base}/orders`, {
      timeoutMs: this.timeout,
      params: status ? { status } : undefined,
    });
  }

  createOrder(payload: CreateOrderDto): Observable<Order> {
    return this.http.post<Order>(`${this.base}/orders`, payload, {
      timeoutMs: this.timeout,
    });
  }

  cancelOrder(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/orders/${id}`, {
      timeoutMs: this.timeout,
    });
  }
}
