import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class OffersService {
  private apiUrl = 'https://13.60.228.234/api/admins/offers';

  constructor(private http: HttpClient) {}

  /**
   * Create a new offer (multipart/form-data)
   * @param formData FormData containing offer fields
   * @param token Bearer token for authentication
   */
  createOffer(formData: FormData, token: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      // Do not set Content-Type; let the browser set it for multipart
    });
    return this.http.post<any>(this.apiUrl, formData, { headers });
  }

  /**
   * List all offers with pagination
   * @param token Bearer token for authentication
   * @param page Page number to fetch
   * @param perPage Number of items per page
   */
  getOffers(
    token: string,
    page: number = 1,
    perPage: number = 10
  ): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    });

    let params = new HttpParams().set('page', page.toString());

    if (perPage > 0) {
      params = params.set('per_page', perPage.toString());
    }

    return this.http.get<any>(this.apiUrl, { headers, params });
  }

  /**
   * Update an existing offer (multipart/form-data)
   * @param id Offer ID to update
   * @param formData FormData containing offer fields
   * @param token Bearer token for authentication
   */
  updateOffer(id: number, formData: FormData, token: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      // Do not set Content-Type; let the browser set it for multipart
    });
    return this.http.put<any>(`${this.apiUrl}/${id}`, formData, { headers });
  }

  /**
   * Delete an offer
   * @param id Offer ID to delete
   * @param token Bearer token for authentication
   */
  deleteOffer(id: number, token: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    });
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers });
  }
}
