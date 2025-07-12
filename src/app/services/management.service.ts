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
    // For search and pagination, always bypass cache
    if (this.adminsCache && !forceRefresh && page === 1 && search === '') {
      // Return cached data as observable
      return new Observable<AdminsResponse>((observer) => {
        observer.next(this.adminsCache!);
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
            this.adminsCache = res;
          }
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

    return this.http.post<CreateAdminResponse>(url, adminData, { headers });
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

    return this.http.post<AssignRolesResponse>(url, requestData, { headers });
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

    return this.http.post<AssignPermissionsResponse>(url, requestData, {
      headers,
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
    return this.http.delete<DeleteAdminResponse>(url, { headers });
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
    return this.http.put<UpdateAdminResponse>(url, updateData, { headers });
  }

  // Optionally, a method to clear the cache
  clearAdminsCache() {
    this.adminsCache = null;
  }
}
