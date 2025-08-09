import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url';

// Interfaces for API responses
export interface WorkshopVendor {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  address: string | null;
  city: string | null;
  is_vendor_account_approved: boolean;
  avatar_url: string;
}

export interface WorkshopServiceResource {
  id: number;
  name: string;
  description: string | { en?: string; [key: string]: any };
  phone_number: string;
  whatsapp: string;
  city: string;
  address: string;
  latitude: string;
  longitude: string;
  is_active: boolean;
  rating: string;
  photo_url: string;
  is_bookmarked: string;
  services: {
    id: number;
    name: string;
  }[];
  working_hours: {
    id: number;
    day_of_week: string;
    start_time: string;
    end_time: string;
    enabled: boolean;
  }[];
  vendor: WorkshopVendor | null;
}

export interface WorkshopsResponse {
  success: boolean;
  message: string;
  data: {
    workshops: WorkshopServiceResource[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class WorkshopService {
  constructor(
    private http: HttpClient,
    @Inject(API_BASE_URL) private apiBaseUrl: string
  ) {}

  // Workshops cache with expiration
  private workshopsCache: {
    data: WorkshopsResponse;
    timestamp: number;
    expiresAt: number;
  } | null = null;

  // Cache configuration
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_AGE = 10 * 60 * 1000; // 10 minutes

  private getAuthHeaders(token: string): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  private isCacheValid(): boolean {
    if (!this.workshopsCache) return false;
    const now = Date.now();
    return (
      now < this.workshopsCache.expiresAt &&
      now - this.workshopsCache.timestamp < this.MAX_CACHE_AGE
    );
  }

  private setCache(data: WorkshopsResponse): void {
    const now = Date.now();
    this.workshopsCache = {
      data,
      timestamp: now,
      expiresAt: now + this.CACHE_DURATION,
    };
  }

  invalidateCache(): void {
    this.workshopsCache = null;
  }

  getCacheStatus() {
    if (!this.workshopsCache) {
      return { hasCache: false };
    }
    const now = Date.now();
    return {
      hasCache: true,
      isValid: this.isCacheValid(),
      age: now - this.workshopsCache.timestamp,
      expiresIn: this.workshopsCache.expiresAt - now,
      dataAge: Math.floor((now - this.workshopsCache.timestamp) / 1000) + 's',
    };
  }

  /**
   * Get list of workshops (with improved cache)
   * @param token - Bearer token for authentication
   * @param forceRefresh - If true, bypass cache and fetch from API
   * @returns Observable of workshops response
   */
  getWorkshops(
    token: string,
    forceRefresh: boolean = false
  ): Observable<WorkshopsResponse> {
    // Only cache default request (no params)
    if (this.isCacheValid() && !forceRefresh) {
      return new Observable<WorkshopsResponse>((observer) => {
        observer.next(this.workshopsCache!.data);
        observer.complete();
      });
    }
    const headers = this.getAuthHeaders(token);
    const url = `${this.apiBaseUrl}/customer/workshops`;
    return new Observable<WorkshopsResponse>((observer) => {
      this.http.get<WorkshopsResponse>(url, { headers }).subscribe({
        next: (res) => {
          this.setCache(res);
          observer.next(res);
          observer.complete();
        },
        error: (err) => {
          // If API fails and we have valid cache, return cached data as fallback
          if (this.isCacheValid()) {
            observer.next(this.workshopsCache!.data);
            observer.complete();
          } else {
            observer.error(err);
          }
        },
      });
    });
  }
}
