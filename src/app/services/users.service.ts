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
  private apiUrl = 'http://13.60.228.234/api';

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
   * Get list of customers
   * @param token - Bearer token for authentication
   * @param page - Page number for pagination
   * @param per_page - Number of items per page
   * @param search - Optional search term
   * @returns Observable of customers response
   */
  listCustomers(
    token: string,
    page: number = 1,
    per_page: number = 10,
    search?: string
  ): Observable<CustomersResponse> {
    const headers = this.getAuthHeaders(token);
    const params: any = {
      page: page.toString(),
      per_page: per_page.toString(),
    };
    if (search && search.trim() !== '') {
      params.search = search.trim();
    }
    return this.http.get<CustomersResponse>(`${this.apiUrl}/admins/customers`, {
      headers,
      params,
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
    return this.http.put<any>(`${this.apiUrl}/admins/customers/${id}`, data, {
      headers,
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
    return this.http.delete<any>(`${this.apiUrl}/admins/customers/${id}`, {
      headers,
    });
  }
}
