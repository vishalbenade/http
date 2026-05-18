import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CoreHttpService } from '../core-http.service';
import { ServiceRegistryService } from '../service-registry.service';

export interface StockLevel {
  sku:       string;
  quantity:  number;
  available: number;
}

export interface AdjustStockDto {
  delta:  number;
  reason: string;
}

@Injectable({ providedIn: 'root' })
export class InventoryApiClient {

  private readonly http    = inject(CoreHttpService);
  private readonly config  = inject(ServiceRegistryService).get('inventory');
  private readonly base    = this.config.baseUrl;
  private readonly timeout = this.config.timeoutMs;

  getStock(sku: string): Observable<StockLevel> {
    return this.http.get<StockLevel>(`${this.base}/stock/${sku}`, {
      timeoutMs: this.timeout,
    });
  }

  listStock(warehouseId: string): Observable<StockLevel[]> {
    return this.http.get<StockLevel[]>(`${this.base}/stock`, {
      timeoutMs: this.timeout,
      params: { warehouseId },
    });
  }

  adjustStock(sku: string, payload: AdjustStockDto): Observable<void> {
    return this.http.patch<void>(`${this.base}/stock/${sku}`, payload, {
      timeoutMs: this.timeout,
    });
  }
}
