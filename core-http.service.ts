import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, retry, throwError, timeout, timer } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface RequestOptions {
  params?:    Record<string, string | number | boolean>;
  headers?:   Record<string, string>;
  timeoutMs?: number;
  skipRetry?: boolean;
}

export interface ApiError {
  status:        number;
  message:       string;
  correlationId: string | null;
  timestamp:     number;
}

@Injectable({ providedIn: 'root' })
export class CoreHttpService {

  private readonly http = inject(HttpClient);

  get<T>(url: string, options?: RequestOptions): Observable<T> {
    return this.http
      .get<T>(url, this.buildOptions(options))
      .pipe(
        timeout(options?.timeoutMs ?? 30_000),
        retry({ count: 2, delay: (_, attempt) => timer(attempt * 1000) }),
        catchError(err => this.handleError(err))
      );
  }

  post<T>(url: string, body: unknown, options?: RequestOptions): Observable<T> {
    return this.http
      .post<T>(url, body, this.buildOptions(options))
      .pipe(
        timeout(options?.timeoutMs ?? 30_000),
        catchError(err => this.handleError(err))   // no retry — not safe to repeat
      );
  }

  put<T>(url: string, body: unknown, options?: RequestOptions): Observable<T> {
    return this.http
      .put<T>(url, body, this.buildOptions(options))
      .pipe(
        timeout(options?.timeoutMs ?? 30_000),
        catchError(err => this.handleError(err))   // no retry — not safe to repeat
      );
  }

  patch<T>(url: string, body: unknown, options?: RequestOptions): Observable<T> {
    return this.http
      .patch<T>(url, body, this.buildOptions(options))
      .pipe(
        timeout(options?.timeoutMs ?? 30_000),
        catchError(err => this.handleError(err))   // no retry — not safe to repeat
      );
  }

  delete<T>(url: string, options?: RequestOptions): Observable<T> {
    return this.http
      .delete<T>(url, this.buildOptions(options))
      .pipe(
        timeout(options?.timeoutMs ?? 30_000),
        retry({ count: 2, delay: (_, attempt) => timer(attempt * 1000) }),
        catchError(err => this.handleError(err))
      );
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private buildOptions(options?: RequestOptions) {
    return {
      headers: options?.headers ? new HttpHeaders(options.headers) : undefined,
      params:  options?.params  ? new HttpParams({ fromObject: options.params as any }) : undefined,
    };
  }

  private handleError(err: HttpErrorResponse): Observable<never> {
    const error: ApiError = {
      status:        err.status,
      message:       err.error?.message ?? err.message,
      correlationId: err.headers?.get('X-Correlation-ID') ?? null,
      timestamp:     Date.now(),
    };
    return throwError(() => error);
  }
}
