import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaces for API responses
export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export interface SupportRequest {
  id: number;
  request_id: string;
  subject: string;
  issue_type: 'Inquiry' | 'Technical' | 'Billing' | 'Other';
  details: string;
  admin_response: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  date_created: string;
  user: User;
  deleted_at?: string;
}

export interface SupportRequestMeta {
  current_page: string;
  last_page: string;
  per_page: string;
  total: string;
  next_page_url: string;
  prev_page_url: string;
}

export interface SupportRequestCollection {
  support_requests: SupportRequest[];
  meta: SupportRequestMeta;
}

export interface SupportRequestsResponse {
  success: boolean;
  message: string;
  data: SupportRequestCollection;
}

@Injectable({
  providedIn: 'root',
})
export class SupportRequestsService {
  private apiUrl = 'http://13.60.228.234/api';

  // Improved cache structure with expiration
  private supportRequestsCache: {
    data: SupportRequestsResponse;
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
    if (!this.supportRequestsCache) return false;

    const now = Date.now();
    return (
      now < this.supportRequestsCache.expiresAt &&
      now - this.supportRequestsCache.timestamp < this.MAX_CACHE_AGE
    );
  }

  /**
   * Set cache data with expiration
   */
  private setCache(data: SupportRequestsResponse): void {
    const now = Date.now();
    this.supportRequestsCache = {
      data,
      timestamp: now,
      expiresAt: now + this.CACHE_DURATION,
    };
  }

  /**
   * Clear cache (called after mutations)
   */
  private invalidateCache(): void {
    this.supportRequestsCache = null;
  }

  /**
   * Get paginated list of support requests (with improved cache)
   * @param token - Bearer token for authentication
   * @param page - Page number for pagination
   * @param per_page - Number of items per page
   * @param forceRefresh - If true, bypass cache and fetch from API
   * @returns Observable of support requests response
   */
  getSupportRequests(
    token: string,
    page: number = 1,
    per_page: number = 10,
    forceRefresh: boolean = false
  ): Observable<SupportRequestsResponse> {
    // Check cache validity for first page
    if (this.isCacheValid() && !forceRefresh && page === 1) {
      return new Observable<SupportRequestsResponse>((observer) => {
        observer.next(this.supportRequestsCache!.data);
        observer.complete();
      });
    }

    const headers = this.getAuthHeaders(token);
    const params = {
      page: page.toString(),
      per_page: per_page.toString(),
    };

    return new Observable<SupportRequestsResponse>((observer) => {
      this.http
        .get<SupportRequestsResponse>(
          `${this.apiUrl}/admins/support-requests`,
          {
            headers,
            params,
          }
        )
        .subscribe({
          next: (res) => {
            // Only cache the first page
            if (page === 1) {
              this.setCache(res);
            }
            observer.next(res);
            observer.complete();
          },
          error: (err) => {
            // If API fails and we have valid cache, return cached data as fallback
            if (this.isCacheValid() && page === 1) {
              console.warn('API request failed, returning cached data:', err);
              observer.next(this.supportRequestsCache!.data);
              observer.complete();
            } else {
              observer.error(err);
            }
          },
        });
    });
  }

  /**
   * Update support request status
   * @param requestId - Support request ID
   * @param status - New status
   * @param token - Bearer token for authentication
   * @returns Observable of update response
   */
  updateSupportRequestStatus(
    requestId: number,
    status: 'pending' | 'in_progress' | 'resolved' | 'closed',
    token: string
  ): Observable<any> {
    const headers = this.getAuthHeaders(token);
    const url = `${this.apiUrl}/admins/support-requests/${requestId}/status`;

    return new Observable<any>((observer) => {
      this.http.put<any>(url, { status }, { headers }).subscribe({
        next: (res) => {
          // Invalidate cache after successful status update
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
   * Add admin response to support request
   * @param requestId - Support request ID
   * @param response - Admin response text
   * @param token - Bearer token for authentication
   * @returns Observable of response
   */
  addAdminResponse(
    requestId: number,
    response: string,
    token: string
  ): Observable<any> {
    const headers = this.getAuthHeaders(token);
    const url = `${this.apiUrl}/admins/support-requests/${requestId}/response`;

    return new Observable<any>((observer) => {
      this.http.post<any>(url, { response }, { headers }).subscribe({
        next: (res) => {
          // Invalidate cache after successful response
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
   * Delete support request
   * @param requestId - Support request ID
   * @param token - Bearer token for authentication
   * @returns Observable of delete response
   */
  deleteSupportRequest(requestId: number, token: string): Observable<any> {
    const headers = this.getAuthHeaders(token);
    const url = `${this.apiUrl}/admins/support-requests/${requestId}`;

    return new Observable<any>((observer) => {
      this.http.delete<any>(url, { headers }).subscribe({
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
   * Clear the support requests cache manually
   */
  clearSupportRequestsCache() {
    this.invalidateCache();
  }

  /**
   * Get cache status for debugging
   */
  getCacheStatus() {
    if (!this.supportRequestsCache) {
      return { hasCache: false };
    }

    const now = Date.now();
    return {
      hasCache: true,
      isValid: this.isCacheValid(),
      age: now - this.supportRequestsCache.timestamp,
      expiresIn: this.supportRequestsCache.expiresAt - now,
      dataAge:
        Math.floor((now - this.supportRequestsCache.timestamp) / 1000) + 's',
    };
  }
}
