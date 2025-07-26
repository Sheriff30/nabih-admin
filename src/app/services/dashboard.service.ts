import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private apiUrl = 'https://dev.nabih.sa/api';

  // Maintenance logs cache with expiration
  private maintenanceLogsCache: {
    data: any;
    timestamp: number;
    expiresAt: number;
  } | null = null;

  // Cache configuration
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_AGE = 10 * 60 * 1000; // 10 minutes

  // Statistics cache with expiration
  private statisticsCache: {
    data: any;
    timestamp: number;
    expiresAt: number;
  } | null = null;

  // Cache configuration for statistics (reuse CACHE_DURATION and MAX_CACHE_AGE)

  constructor(private http: HttpClient) {}

  private getAuthHeaders(token: string): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  private isCacheValid(): boolean {
    if (!this.maintenanceLogsCache) return false;
    const now = Date.now();
    return (
      now < this.maintenanceLogsCache.expiresAt &&
      now - this.maintenanceLogsCache.timestamp < this.MAX_CACHE_AGE
    );
  }

  private setCache(data: any): void {
    const now = Date.now();
    this.maintenanceLogsCache = {
      data,
      timestamp: now,
      expiresAt: now + this.CACHE_DURATION,
    };
  }

  invalidateCache(): void {
    this.maintenanceLogsCache = null;
  }

  getCacheStatus() {
    if (!this.maintenanceLogsCache) {
      return { hasCache: false };
    }
    const now = Date.now();
    return {
      hasCache: true,
      isValid: this.isCacheValid(),
      age: now - this.maintenanceLogsCache.timestamp,
      expiresIn: this.maintenanceLogsCache.expiresAt - now,
      dataAge:
        Math.floor((now - this.maintenanceLogsCache.timestamp) / 1000) + 's',
    };
  }

  getMaintenanceLogs(
    token: string,
    per_page: string = '10',
    sort_direction: string = 'desc',
    sort_field: string = 'service_date',
    page?: number,
    search?: string
  ): Observable<any> {
    // Only cache first page, default sort, no forceRefresh, no search
    if (
      this.isCacheValid() &&
      per_page === '10' &&
      sort_direction === 'desc' &&
      sort_field === 'service_date' &&
      (!page || page === 1) &&
      (!search || search === '')
    ) {
      return new Observable<any>((observer) => {
        observer.next(this.maintenanceLogsCache!.data);
        observer.complete();
      });
    }
    const headers = this.getAuthHeaders(token);
    const params = new URLSearchParams();
    if (per_page) params.append('per_page', per_page);
    if (sort_direction) params.append('sort_direction', sort_direction);
    if (sort_field) params.append('sort_field', sort_field);
    if (page) params.append('page', page.toString());
    if (search) params.append('search', search);
    const url = `${this.apiUrl}/admins/dashboard/maintenance-logs${
      params.toString() ? '?' + params.toString() : ''
    }`;
    return new Observable<any>((observer) => {
      this.http.get<any>(url, { headers }).subscribe({
        next: (res) => {
          // Only cache default sort, first page, no search
          if (
            per_page === '10' &&
            sort_direction === 'desc' &&
            sort_field === 'service_date' &&
            (!page || page === 1) &&
            (!search || search === '')
          ) {
            this.setCache(res);
          }
          observer.next(res);
          observer.complete();
        },
        error: (err) => {
          // If API fails and we have valid cache, return cached data as fallback
          if (
            this.isCacheValid() &&
            per_page === '10' &&
            sort_direction === 'desc' &&
            sort_field === 'service_date' &&
            (!page || page === 1) &&
            (!search || search === '')
          ) {
            observer.next(this.maintenanceLogsCache!.data);
            observer.complete();
          } else {
            observer.error(err);
          }
        },
      });
    });
  }

  private isStatisticsCacheValid(): boolean {
    if (!this.statisticsCache) return false;
    const now = Date.now();
    return (
      now < this.statisticsCache.expiresAt &&
      now - this.statisticsCache.timestamp < this.MAX_CACHE_AGE
    );
  }

  private setStatisticsCache(data: any): void {
    const now = Date.now();
    this.statisticsCache = {
      data,
      timestamp: now,
      expiresAt: now + this.CACHE_DURATION,
    };
  }

  invalidateStatisticsCache(): void {
    this.statisticsCache = null;
  }

  getStatistics(token: string): Observable<any> {
    // Only cache default request (no params)
    if (this.isStatisticsCacheValid()) {
      return new Observable<any>((observer) => {
        observer.next(this.statisticsCache!.data);
        observer.complete();
      });
    }
    const headers = this.getAuthHeaders(token);
    const url = `${this.apiUrl}/admins/dashboard/statistics`;
    return new Observable<any>((observer) => {
      this.http.get<any>(url, { headers }).subscribe({
        next: (res) => {
          this.setStatisticsCache(res);
          observer.next(res);
          observer.complete();
        },
        error: (err) => {
          // If API fails and we have valid cache, return cached data as fallback
          if (this.isStatisticsCacheValid()) {
            observer.next(this.statisticsCache!.data);
            observer.complete();
          } else {
            observer.error(err);
          }
        },
      });
    });
  }

  getMonthlyMaintenanceCount(
    token: string,
    months: number = 12
  ): Observable<any> {
    const headers = this.getAuthHeaders(token);
    const params: { [param: string]: string } = {};
    if (months !== undefined && months !== null) {
      params['months'] = months.toString();
    }
    const url = `${this.apiUrl}/admins/dashboard/monthly-maintenance-count`;
    return this.http.get<any>(url, { headers, params });
  }
}
