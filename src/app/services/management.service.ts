import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaces for API responses
export interface AdminUserResource {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  roles: string;
  direct_permissions: Array<{ id: string; name: string }>;
  all_permissions: Array<{ id: string; name: string }>;
}

export interface AdminsResponse {
  success: boolean;
  message: string;
  data: {
    admins: AdminUserResource[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class ManagementService {
  private apiUrl = 'http://13.60.228.234/api';

  // In-memory cache for admins list
  private adminsCache: AdminsResponse | null = null;

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
   * Get list of admin users (with cache)
   * @param token - Bearer token for authentication
   * @param forceRefresh - If true, bypass cache and fetch from API
   * @returns Observable of admins response
   */
  listAdmins(
    token: string,
    forceRefresh: boolean = false
  ): Observable<AdminsResponse> {
    if (this.adminsCache && !forceRefresh) {
      // Return cached data as observable
      return new Observable<AdminsResponse>((observer) => {
        observer.next(this.adminsCache!);
        observer.complete();
      });
    }
    const headers = this.getAuthHeaders(token);
    return new Observable<AdminsResponse>((observer) => {
      this.http
        .get<AdminsResponse>(`${this.apiUrl}/admins`, { headers })
        .subscribe({
          next: (res) => {
            this.adminsCache = res;
            observer.next(res);
            observer.complete();
          },
          error: (err) => {
            observer.error(err);
          },
        });
    });
  }

  // Optionally, a method to clear the cache
  clearAdminsCache() {
    this.adminsCache = null;
  }
}
