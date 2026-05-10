import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

type ParamPrimitive = string | number | boolean;
type ParamValue = ParamPrimitive | readonly ParamPrimitive[];

/**
 * Thin typed wrapper around HttpClient. Feature services should depend on this
 * rather than HttpClient directly so that the API base URL and conventions
 * stay centralized. Generic types should come from `@my-app/shared-types`.
 */
@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  get<T>(path: string, options?: { params?: Record<string, ParamValue> }): Observable<T> {
    const params = options?.params ? this.buildParams(options.params) : undefined;
    return this.http.get<T>(this.url(path), params ? { params } : undefined);
  }

  private buildParams(input: Record<string, ParamValue>): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(input)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        for (const v of value) params = params.append(key, String(v));
      } else {
        params = params.set(key, String(value));
      }
    }
    return params;
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(this.url(path), body);
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(this.url(path), body);
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.http.patch<T>(this.url(path), body);
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(this.url(path));
  }

  private url(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const trimmed = path.startsWith('/') ? path : `/${path}`;
    return `${this.base}${trimmed}`;
  }
}
