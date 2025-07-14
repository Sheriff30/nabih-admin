import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaces for API responses
export interface Customer {
  // Add customer properties as needed based on actual API response
  [key: string]: any;
}

export interface CustomersResponse {
  success: boolean;
  message: string | null;
  data: {
    customers: Customer[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private apiUrl = 'https://13.60.228.234/api';

  // Improved cache structure with expiration
  private customersCache: {
    data: CustomersResponse;
    timestamp: number;
    expiresAt: number;
  } | null = null;

  // Cache configuration
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_AGE = 10 * 60 * 1000; // 10 minutes

  constructor(private http: HttpClient) {}

  private getCommonHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
  }

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
    if (!this.customersCache) return false;

    const now = Date.now();
    return (
      now < this.customersCache.expiresAt &&
      now - this.customersCache.timestamp < this.MAX_CACHE_AGE
    );
  }

  /**
   * Set cache data with expiration
   */
  private setCache(data: CustomersResponse): void {
    const now = Date.now();
    this.customersCache = {
      data,
      timestamp: now,
      expiresAt: now + this.CACHE_DURATION,
    };
  }

  /**
   * Clear cache (called after mutations)
   */
  private invalidateCache(): void {
    this.customersCache = null;
  }

  /**
   * Get list of customers (with improved cache)
   * @param token - Bearer token for authentication
   * @param page - Page number for pagination
   * @param per_page - Number of items per page
   * @param search - Optional search term
   * @param forceRefresh - If true, bypass cache and fetch from API
   * @returns Observable of customers response
   */
  listCustomers(
    token: string,
    page: number = 1,
    per_page: number = 10,
    search?: string,
    forceRefresh: boolean = false
  ): Observable<CustomersResponse> {
    // Check cache validity for first page without search
    if (
      this.isCacheValid() &&
      !forceRefresh &&
      page === 1 &&
      (!search || search.trim() === '')
    ) {
      return new Observable<CustomersResponse>((observer) => {
        observer.next(this.customersCache!.data);
        observer.complete();
      });
    }

    const headers = this.getAuthHeaders(token);
    const params: any = {
      page: page.toString(),
      per_page: per_page.toString(),
    };
    if (search && search.trim() !== '') {
      params.search = search.trim();
    }

    return new Observable<CustomersResponse>((observer) => {
      this.http
        .get<CustomersResponse>(`${this.apiUrl}/admins/customers`, {
          headers,
          params,
        })
        .subscribe({
          next: (res) => {
            // Only cache the first page without search
            if (page === 1 && (!search || search.trim() === '')) {
              this.setCache(res);
            }
            observer.next(res);
            observer.complete();
          },
          error: (err) => {
            // If API fails and we have valid cache, return cached data as fallback
            if (
              this.isCacheValid() &&
              page === 1 &&
              (!search || search.trim() === '')
            ) {
              console.warn('API request failed, returning cached data:', err);
              observer.next(this.customersCache!.data);
              observer.complete();
            } else {
              observer.error(err);
            }
          },
        });
    });
  }

  /**
   * Update a customer by ID
   * @param id - Customer ID
   * @param data - Customer update data (name, phone_number, gender, is_verified)
   * @param token - Bearer token for authentication
   * @returns Observable of update response
   */
  updateCustomer(
    id: number,
    data: {
      name: string;
      phone_number: string | null;
      gender: 'male' | 'female' | 'other';
      is_verified?: boolean;
    },
    token: string
  ): Observable<any> {
    const headers = this.getAuthHeaders(token);

    return new Observable<any>((observer) => {
      this.http
        .put<any>(`${this.apiUrl}/admins/customers/${id}`, data, {
          headers,
        })
        .subscribe({
          next: (res) => {
            // Invalidate cache after successful update
            this.invalidateCache();
            observer.next(res);
            observer.complete();
          },
          error: (err) => {
            observer.error(err);
          },
        });
    });
  }

  /**
   * Delete a customer by ID
   * @param id - Customer ID
   * @param token - Bearer token for authentication
   * @returns Observable of delete response
   */
  deleteCustomer(id: number, token: string): Observable<any> {
    const headers = this.getAuthHeaders(token);

    return new Observable<any>((observer) => {
      this.http
        .delete<any>(`${this.apiUrl}/admins/customers/${id}`, {
          headers,
        })
        .subscribe({
          next: (res) => {
            // Invalidate cache after successful deletion
            this.invalidateCache();
            observer.next(res);
            observer.complete();
          },
          error: (err) => {
            observer.error(err);
          },
        });
    });
  }

  /**
   * Clear the customers cache manually
   */
  clearCustomersCache() {
    this.invalidateCache();
  }

  /**
   * Get cache status for debugging
   */
  getCacheStatus() {
    if (!this.customersCache) {
      return { hasCache: false };
    }

    const now = Date.now();
    return {
      hasCache: true,
      isValid: this.isCacheValid(),
      age: now - this.customersCache.timestamp,
      expiresIn: this.customersCache.expiresAt - now,
      dataAge: Math.floor((now - this.customersCache.timestamp) / 1000) + 's',
    };
  }
}
