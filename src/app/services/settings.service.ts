import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  constructor(
    private http: HttpClient,
    @Inject(API_BASE_URL) private apiBaseUrl: string
  ) {}

  private getAuthHeaders(token: string): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  postStaticContent(payload: any): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return this.http.post(
      `${this.apiBaseUrl}/content/static-content`,
      payload,
      {
        headers: this.getAuthHeaders(token),
      }
    );
  }

  getContentByType(type: string, userType: string): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    const url = `${this.apiBaseUrl}/content/static-content/type/${type}/user-type/${userType}`;
    return this.http.get(url, {
      headers: this.getAuthHeaders(token),
    });
  }
}
