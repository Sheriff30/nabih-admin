import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface VehicleOwner {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export interface VehicleServiceRecord {
  id: number;
  service_type: string;
  service_date: string;
  maintenance_time: string;
  mileage: number;
  cost: string;
  review: string;
}

export interface Vehicle {
  id: number;
  name: string;
  phone_number: string;
  make_brand: string;
  model_year: string;
  mileage: number;
  vehicle_type: string;
  plate_number: string;
  vin_number: string;
  chassis_number: string;
  owner: VehicleOwner;
  services: VehicleServiceRecord[];
}

export interface VehiclesMeta {
  current_page: string;
  last_page: string;
  per_page: string;
  total: string;
  next_page_url: string | null;
  prev_page_url: string | null;
}

export interface VehiclesResponse {
  success: boolean;
  message: string;
  data: {
    vehicles: Vehicle[];
    meta: VehiclesMeta;
  };
}

@Injectable({ providedIn: 'root' })
export class VehiclesService {
  private apiUrl = 'https://13.60.228.234/api';

  // Vehicles cache with expiration
  private vehiclesCache: {
    data: VehiclesResponse;
    timestamp: number;
    expiresAt: number;
  } | null = null;

  // Cache configuration
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_AGE = 10 * 60 * 1000; // 10 minutes

  constructor(private http: HttpClient) {}

  private getAuthHeaders(token: string): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  /**
   * Check if cache is valid and not expired
   */
  private isCacheValid(): boolean {
    if (!this.vehiclesCache) return false;
    const now = Date.now();
    return (
      now < this.vehiclesCache.expiresAt &&
      now - this.vehiclesCache.timestamp < this.MAX_CACHE_AGE
    );
  }

  /**
   * Set cache data with expiration
   */
  private setCache(data: VehiclesResponse): void {
    const now = Date.now();
    this.vehiclesCache = {
      data,
      timestamp: now,
      expiresAt: now + this.CACHE_DURATION,
    };
  }

  /**
   * Clear cache (called after mutations)
   */
  private invalidateCache(): void {
    this.vehiclesCache = null;
  }

  /**
   * Get cache status for debugging
   */
  getCacheStatus() {
    if (!this.vehiclesCache) {
      return { hasCache: false };
    }
    const now = Date.now();
    return {
      hasCache: true,
      isValid: this.isCacheValid(),
      age: now - this.vehiclesCache.timestamp,
      expiresIn: this.vehiclesCache.expiresAt - now,
      dataAge: Math.floor((now - this.vehiclesCache.timestamp) / 1000) + 's',
    };
  }

  /**
   * Fetch vehicles with optional sorting and cache for default params
   * @param token - Bearer token for authentication
   * @param sortField - Field to sort by (default: created_at)
   * @param sortDirection - Sort direction (default: desc)
   * @param forceRefresh - If true, bypass cache and fetch from API
   */
  listVehicles(
    token: string,
    sortField: string = 'created_at',
    sortDirection: string = 'desc',
    forceRefresh: boolean = false
  ): Observable<VehiclesResponse> {
    // Only cache first page, default sort, no forceRefresh
    if (
      this.isCacheValid() &&
      !forceRefresh &&
      sortField === 'created_at' &&
      sortDirection === 'desc'
    ) {
      return new Observable<VehiclesResponse>((observer) => {
        observer.next(this.vehiclesCache!.data);
        observer.complete();
      });
    }
    const headers = this.getAuthHeaders(token);
    const params = new URLSearchParams();
    if (sortField) params.append('sort_field', sortField);
    if (sortDirection) params.append('sort_direction', sortDirection);
    const url = `${this.apiUrl}/admins/vehicles${
      params.toString() ? '?' + params.toString() : ''
    }`;
    return new Observable<VehiclesResponse>((observer) => {
      this.http.get<VehiclesResponse>(url, { headers }).subscribe({
        next: (res) => {
          // Only cache default sort
          if (sortField === 'created_at' && sortDirection === 'desc') {
            this.setCache(res);
          }
          observer.next(res);
          observer.complete();
        },
        error: (err) => {
          // If API fails and we have valid cache, return cached data as fallback
          if (
            this.isCacheValid() &&
            sortField === 'created_at' &&
            sortDirection === 'desc'
          ) {
            console.warn('API request failed, returning cached data:', err);
            observer.next(this.vehiclesCache!.data);
            observer.complete();
          } else {
            observer.error(err);
          }
        },
      });
    });
  }

  updateVehicle(
    token: string,
    vehicleId: number,
    data: {
      user_id: number;
      name: string;
      make_brand: string;
      model_year: string | null;
      vin_number: string | null;
      chassis_number: string | null;
      mileage: number | null;
      vehicle_type: string | null;
      plate_number: string | null;
    }
  ): Observable<any> {
    const headers = this.getAuthHeaders(token);
    const url = `${this.apiUrl}/admins/vehicles/${vehicleId}`;
    return this.http.put<any>(url, data, { headers }).pipe(
      // Invalidate cache after successful update
      tap(() => this.invalidateCache())
    );
  }

  deleteVehicle(token: string, vehicleId: number): Observable<any> {
    const headers = this.getAuthHeaders(token);
    const url = `${this.apiUrl}/admins/vehicles/${vehicleId}`;
    return this.http
      .delete<any>(url, { headers })
      .pipe(tap(() => this.invalidateCache()));
  }
}
