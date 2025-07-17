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

export interface PaginationMeta {
  current_page: string;
  last_page: string;
  per_page: string;
  total: string;
  next_page_url: string | null;
  prev_page_url: string | null;
}

export interface SupportRequestCollection {
  support_requests: SupportRequest[];
  meta: PaginationMeta;
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
  private apiUrl = 'https://13.60.228.234/api';

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
   * Get list of support requests (with improved cache)
   * @param token - Bearer token for authentication
   * @param page - Page number for pagination
   * @param perPage - Number of items per page
   * @param search - Search term for filtering
   * @param status - Filter by status
   * @param issueType - Filter by issue type
   * @param forceRefresh - If true, bypass cache and fetch from API
   * @returns Observable of support requests response
   */
  listSupportRequests(
    token: string,
    page: number = 1,
    perPage: number = 0
  ): Observable<SupportRequestsResponse> {
    // Check cache validity for first page without filters

    const headers = this.getAuthHeaders(token);

    // Build query parameters
    const params = new URLSearchParams();
    if (page > 1) params.append('page', page.toString());
    params.append('per_page', perPage.toString());

    const url = `${this.apiUrl}/admins/support-requests${
      params.toString() ? '?' + params.toString() : ''
    }`;

    return new Observable<SupportRequestsResponse>((observer) => {
      this.http.get<SupportRequestsResponse>(url, { headers }).subscribe({
        next: (res) => {
          // Only cache the first page without filters

          observer.next(res);
          observer.complete();
        },
        error: (err) => {
          // If API fails and we have valid cache, return cached data as fallback
        },
      });
    });
  }

  /**
   * Update a support request with admin response and status
   * @param token - Bearer token for authentication
   * @param id - Support request ID
   * @param admin_response - Admin response string
   * @param status - Status string (pending, open, closed)
   * @returns Observable of the updated support request
   */
  updateSupportRequest(
    token: string,
    id: number,
    admin_response: string,
    status: 'pending' | 'open' | 'closed'
  ): Observable<any> {
    const headers = this.getAuthHeaders(token);
    const url = `${this.apiUrl}/admins/support-requests/${id}`;
    const body = {
      admin_response,
      status,
    };
    // Invalidate cache after update
    this.invalidateCache();
    return this.http.put(url, body, { headers });
  }

  /**
   * Delete a support request by ID
   * @param token - Bearer token for authentication
   * @param id - Support request ID
   * @returns Observable of the delete response
   */
  deleteSupportRequest(token: string, id: number): Observable<any> {
    const headers = this.getAuthHeaders(token);
    const url = `${this.apiUrl}/admins/support-requests/${id}`;
    // Invalidate cache after delete
    this.invalidateCache();
    return this.http.delete(url, { headers });
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
