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

// Only retry errors that are genuinely transient.
// 400, 401, 403, 404, 500 will never succeed on retry — skip them immediately.
const RETRYABLE_STATUS_CODES = new Set([
  0,    // network error / offline
  408,  // request timeout
  429,  // rate limited
  502,  // bad gateway
  503,  // service unavailable
  504,  // gateway timeout
]);

function isRetryable(err: unknown): boolean {
  return err instanceof HttpErrorResponse && RETRYABLE_STATUS_CODES.has(err.status);
}

@Injectable({ providedIn: 'root' })
export class CoreHttpService {

  private readonly http = inject(HttpClient);

  get<T>(url: string, options?: RequestOptions): Observable<T> {
    return this.http
      .get<T>(url, this.buildOptions(options))
      .pipe(
        timeout(options?.timeoutMs ?? 30_000),
        retry({
          count: 2,
          delay: (err, attempt) => {
            if (!isRetryable(err)) return throwError(() => err);  // fail fast
            return timer(attempt * 1000);                          // 1s, then 2s
          }
        }),
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
        retry({
          count: 2,
          delay: (err, attempt) => {
            if (!isRetryable(err)) return throwError(() => err);  // fail fast
            return timer(attempt * 1000);                          // 1s, then 2s
          }
        }),
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
