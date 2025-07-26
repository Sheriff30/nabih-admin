import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private apiUrl = 'https://dev.nabih.sa/api/content/static-content';

  constructor(private http: HttpClient) {}

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
    return this.http.post(this.apiUrl, payload, {
      headers: this.getAuthHeaders(token),
    });
  }

  getContentByType(type: string, userType: string): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    const url = `${this.apiUrl}/type/${type}/user-type/${userType}`;
    return this.http.get(url, {
      headers: this.getAuthHeaders(token),
    });
  }
}
