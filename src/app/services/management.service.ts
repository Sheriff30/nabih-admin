import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaces for API responses
export interface Permission {
  id: number;
  name: string;
}

export interface Role {
  id: number;
  name: string;
  permissions: Permission[];
}

export interface RoleResource {
  id: string;
  name: string;
  permissions: Permission[];
}

export interface AdminUserResource {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  roles: Role[];
  direct_permissions: Permission[];
  all_permissions: Permission[];
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  next_page_url: string | null;
  prev_page_url: string | null;
}

export interface AdminsResponse {
  success: boolean;
  message: string;
  data: {
    admins: AdminUserResource[];
    meta: PaginationMeta;
  };
}

export interface CreateAdminRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  roles?: string[] | null;
  permissions?: string[] | null;
}

export interface CreateAdminResponse {
  success: boolean;
  message: string;
  data: {
    admin: AdminUserResource;
  };
}

export interface AssignRolesRequest {
  roles: string[];
}

export interface AssignPermissionsRequest {
  permissions: string[];
}

export interface AssignRolesResponse {
  success: boolean;
  message: string;
  data: {
    admin: AdminUserResource;
  };
}

export interface AssignPermissionsResponse {
  success: boolean;
  message: string;
  data: {
    admin: AdminUserResource;
  };
}

export interface ListRolesResponse {
  success: boolean;
  message: string | null;
  data: {
    roles: RoleResource[];
  };
}

export interface DeleteAdminResponse {
  success: boolean;
  message: string;
  data: string[];
}

export interface ListPermissionsResponse {
  success: boolean;
  message: string | null;
  data: {
    permissions: Permission[];
  };
}

export interface UpdateAdminRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
}

export interface UpdateAdminResponse {
  success: boolean;
  message: string;
  data: {
    admin: AdminUserResource;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ManagementService {
  private apiUrl = 'https://13.60.228.234/api';

  // Improved cache structure with expiration
  private adminsCache: {
    data: AdminsResponse;
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
    if (!this.adminsCache) return false;

    const now = Date.now();
    return (
      now < this.adminsCache.expiresAt &&
      now - this.adminsCache.timestamp < this.MAX_CACHE_AGE
    );
  }

  /**
   * Set cache data with expiration
   */
  private setCache(data: AdminsResponse): void {
    const now = Date.now();
    this.adminsCache = {
      data,
      timestamp: now,
      expiresAt: now + this.CACHE_DURATION,
    };
  }

  /**
   * Clear cache (called after mutations)
   */
  private invalidateCache(): void {
    this.adminsCache = null;
  }

  /**
   * Get list of admin users (with improved cache)
   * @param token - Bearer token for authentication
   * @param page - Page number for pagination
   * @param perPage - Number of items per page
   * @param search - Search term for filtering
   * @param forceRefresh - If true, bypass cache and fetch from API
   * @returns Observable of admins response
   */
  listAdmins(
    token: string,
    page: number = 1,
    perPage: number = 10,
    search: string = '',
    forceRefresh: boolean = false
  ): Observable<AdminsResponse> {
    // Check cache validity for first page without search
    if (this.isCacheValid() && !forceRefresh && page === 1 && search === '') {
      return new Observable<AdminsResponse>((observer) => {
        observer.next(this.adminsCache!.data);
        observer.complete();
      });
    }

    const headers = this.getAuthHeaders(token);

    // Build query parameters
    const params = new URLSearchParams();
    if (page > 1) params.append('page', page.toString());
    params.append('per_page', perPage.toString());
    if (search.trim()) params.append('search', search.trim());

    const url = `${this.apiUrl}/admins${
      params.toString() ? '?' + params.toString() : ''
    }`;

    return new Observable<AdminsResponse>((observer) => {
      this.http.get<AdminsResponse>(url, { headers }).subscribe({
        next: (res) => {
          // Only cache the first page without search
          if (page === 1 && search === '') {
            this.setCache(res);
          }
          observer.next(res);
          observer.complete();
        },
        error: (err) => {
          // If API fails and we have valid cache, return cached data as fallback
          if (this.isCacheValid() && page === 1 && search === '') {
            console.warn('API request failed, returning cached data:', err);
            observer.next(this.adminsCache!.data);
            observer.complete();
          } else {
            observer.error(err);
          }
        },
      });
    });
  }

  /**
   * Create a new admin user
   * @param token - Bearer token for authentication
   * @param adminData - Admin user data
   * @returns Observable of create admin response
   */
  createAdmin(
    token: string,
    adminData: CreateAdminRequest
  ): Observable<CreateAdminResponse> {
    const headers = this.getAuthHeaders(token);
    const url = `${this.apiUrl}/admins`;

    return new Observable<CreateAdminResponse>((observer) => {
      this.http
        .post<CreateAdminResponse>(url, adminData, { headers })
        .subscribe({
          next: (res) => {
            // Invalidate cache after successful creation
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
   * Assign roles to an admin user
   * @param token - Bearer token for authentication
   * @param adminId - ID of the admin user
   * @param roles - Array of role names to assign
   * @returns Observable of assign roles response
   */
  assignRoles(
    token: string,
    adminId: number,
    roles: string[]
  ): Observable<AssignRolesResponse> {
    const headers = this.getAuthHeaders(token);
    const url = `${this.apiUrl}/admins/${adminId}/roles`;
    const requestData: AssignRolesRequest = { roles };

    return new Observable<AssignRolesResponse>((observer) => {
      this.http
        .post<AssignRolesResponse>(url, requestData, { headers })
        .subscribe({
          next: (res) => {
            // Invalidate cache after successful role assignment
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
   * Assign permissions to an admin user
   * @param token - Bearer token for authentication
   * @param adminId - ID of the admin user
   * @param permissions - Array of permission names to assign
   * @returns Observable of assign permissions response
   */
  assignPermissions(
    token: string,
    adminId: number,
    permissions: string[]
  ): Observable<AssignPermissionsResponse> {
    const headers = this.getAuthHeaders(token);
    const url = `${this.apiUrl}/admins/${adminId}/permissions`;
    const requestData: AssignPermissionsRequest = { permissions };

    return new Observable<AssignPermissionsResponse>((observer) => {
      this.http
        .post<AssignPermissionsResponse>(url, requestData, {
          headers,
        })
        .subscribe({
          next: (res) => {
            // Invalidate cache after successful permission assignment
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
   * Get list of available roles
   * @param token - Bearer token for authentication
   * @returns Observable of roles response
   */
  listRoles(token: string): Observable<ListRolesResponse> {
    const headers = this.getAuthHeaders(token);
    const url = `${this.apiUrl}/admins/roles`;

    return this.http.get<ListRolesResponse>(url, { headers });
  }

  /**
   * Get list of available permissions
   * @param token - Bearer token for authentication
   * @returns Observable of permissions response
   */
  listPermissions(token: string): Observable<ListPermissionsResponse> {
    const headers = this.getAuthHeaders(token);
    const url = `${this.apiUrl}/admins/permissions`;
    return this.http.get<ListPermissionsResponse>(url, { headers });
  }

  /**
   * Delete an admin user
   * @param token - Bearer token for authentication
   * @param adminId - ID of the admin user
   * @returns Observable of delete admin response
   */
  deleteAdmin(token: string, adminId: number): Observable<DeleteAdminResponse> {
    const headers = this.getAuthHeaders(token);
    const url = `${this.apiUrl}/admins/${adminId}`;

    return new Observable<DeleteAdminResponse>((observer) => {
      this.http.delete<DeleteAdminResponse>(url, { headers }).subscribe({
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
   * Update an admin user's basic info (name, email, password)
   * @param token - Bearer token for authentication
   * @param adminId - ID of the admin user
   * @param updateData - Fields to update
   * @returns Observable of update admin response
   */
  updateAdmin(
    token: string,
    adminId: number,
    updateData: UpdateAdminRequest
  ): Observable<UpdateAdminResponse> {
    const headers = this.getAuthHeaders(token);
    const url = `${this.apiUrl}/admins/${adminId}`;

    return new Observable<UpdateAdminResponse>((observer) => {
      this.http
        .put<UpdateAdminResponse>(url, updateData, { headers })
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
   * Clear the admins cache manually
   */
  clearAdminsCache() {
    this.invalidateCache();
  }

  /**
   * Get cache status for debugging
   */
  getCacheStatus() {
    if (!this.adminsCache) {
      return { hasCache: false };
    }

    const now = Date.now();
    return {
      hasCache: true,
      isValid: this.isCacheValid(),
      age: now - this.adminsCache.timestamp,
      expiresIn: this.adminsCache.expiresAt - now,
      dataAge: Math.floor((now - this.adminsCache.timestamp) / 1000) + 's',
    };
  }
}
