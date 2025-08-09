import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private http: HttpClient,
    @Inject(API_BASE_URL) private apiBaseUrl: string
  ) {}

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

  login(email: string, password: string): Observable<any> {
    const url = `${this.apiBaseUrl}/auth/admin/login`;
    const body = { email, password };
    return this.http.post(url, body, {
      headers: this.getCommonHeaders(),
    });
  }

  logout(token: string): Observable<any> {
    const url = `${this.apiBaseUrl}/auth/admin/logout`;
    return this.http.post(
      url,
      {},
      {
        headers: this.getAuthHeaders(token),
      }
    );
  }
}
