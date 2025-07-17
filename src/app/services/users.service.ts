import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// Customer interfaces
export interface CustomerResource {
  id: string;
  name: string;
  phone_number: string;
  gender: string;
  is_verified: boolean | string;
  vehicle_count: string;
  avatar_url: string;
}

export interface CustomersMeta {
  current_page: string;
  last_page: string;
  per_page: string;
  total: string;
  next_page_url: string | null;
  prev_page_url: string | null;
}

export interface CustomerCollection {
  customers: CustomerResource[];
  meta: CustomersMeta;
}

export interface ListCustomersResponse {
  success: boolean;
  message: string;
  data: CustomerCollection;
}

export interface UpdateCustomerRequest {
  name: string;
  phone_number: string | null;
  gender: 'male' | 'female' | 'other';
  is_verified: boolean;
}

export interface UpdateCustomerResponse {
  success: boolean;
  message: string;
  data: {
    customer: CustomerResource;
  };
}

export interface DeleteCustomerResponse {
  success: boolean;
  message: string;
  data: string[];
}

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private apiUrl = 'https://13.60.228.234/api';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(token: string): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  /**
   * List customers
   * @param token Bearer token
   * @param page Page number (default 1)
   * @param perPage Items per page (default 0 = all)
   */
  listCustomers(
    token: string,
    page: number = 1,
    perPage: number = 0
  ): Observable<ListCustomersResponse> {
    const headers = this.getAuthHeaders(token);
    const params = new URLSearchParams();
    if (page > 1) params.append('page', page.toString());
    params.append('per_page', perPage.toString());
    const url = `${this.apiUrl}/admins/customers${
      params.toString() ? '?' + params.toString() : ''
    }`;
    return this.http.get<ListCustomersResponse>(url, { headers });
  }

  /**
   * Update a customer
   * @param id Customer ID
   * @param data Update payload
   * @param token Bearer token
   */
  updateCustomer(
    id: string,
    data: UpdateCustomerRequest,
    token: string
  ): Observable<UpdateCustomerResponse> {
    const headers = this.getAuthHeaders(token);
    const url = `${this.apiUrl}/admins/customers/${id}`;
    return this.http.put<UpdateCustomerResponse>(url, data, { headers });
  }

  /**
   * Delete a customer
   * @param id Customer ID
   * @param token Bearer token
   */
  deleteCustomer(
    id: string,
    token: string
  ): Observable<DeleteCustomerResponse> {
    const headers = this.getAuthHeaders(token);
    const url = `${this.apiUrl}/admins/customers/${id}`;
    return this.http.delete<DeleteCustomerResponse>(url, { headers });
  }
}
