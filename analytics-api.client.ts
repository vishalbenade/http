import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CoreHttpService } from '../core-http.service';
import { ServiceRegistryService } from '../service-registry.service';

export interface MetricResult {
  metricName: string;
  points:     { timestamp: string; value: number }[];
}

export interface ReportRequest {
  reportType: string;
  from:       string;   // ISO 8601
  to:         string;   // ISO 8601
}

export interface ReportResult {
  reportId:     string;
  status:       'pending' | 'ready';
  downloadUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsApiClient {

  private readonly http    = inject(CoreHttpService);
  private readonly config  = inject(ServiceRegistryService).get('analytics');
  private readonly base    = this.config.baseUrl;
  private readonly timeout = this.config.timeoutMs;

  getMetric(name: string): Observable<MetricResult> {
    return this.http.get<MetricResult>(`${this.base}/metrics/${name}`, {
      timeoutMs: this.timeout,
    });
  }

  requestReport(payload: ReportRequest): Observable<ReportResult> {
    return this.http.post<ReportResult>(`${this.base}/reports`, payload, {
      timeoutMs: this.timeout,
    });
  }

  getReport(reportId: string): Observable<ReportResult> {
    return this.http.get<ReportResult>(`${this.base}/reports/${reportId}`, {
      timeoutMs: this.timeout,
    });
  }
}
