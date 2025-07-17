import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SocialMediaLinkResource {
  id: number;
  type: string;
  type_label: string;
  title: string;
  url: string;
  username: string;
  description: string;
  is_active: boolean;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface SocialMediaLinkCollection {
  social_media: SocialMediaLinkResource[];
  meta: {
    current_page: string;
    last_page: string;
    per_page: string;
    total: string;
    next_page_url: string;
    prev_page_url: string;
  };
}

export interface SocialMediaLinksResponse {
  success: boolean;
  message: string;
  data: SocialMediaLinkCollection;
}

@Injectable({ providedIn: 'root' })
export class SocialLinksService {
  private apiUrl = 'https://13.60.228.234/api';

  private socialLinksCache: {
    data: SocialMediaLinksResponse;
    timestamp: number;
    expiresAt: number;
  } | null = null;

  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_AGE = 10 * 60 * 1000; // 10 minutes

  constructor(private http: HttpClient) {}

  private getAuthHeaders(token: string): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  private isCacheValid(): boolean {
    if (!this.socialLinksCache) return false;
    const now = Date.now();
    return (
      now < this.socialLinksCache.expiresAt &&
      now - this.socialLinksCache.timestamp < this.MAX_CACHE_AGE
    );
  }

  private setCache(data: SocialMediaLinksResponse): void {
    const now = Date.now();
    this.socialLinksCache = {
      data,
      timestamp: now,
      expiresAt: now + this.CACHE_DURATION,
    };
  }

  invalidateCache(): void {
    this.socialLinksCache = null;
  }

  getCacheStatus() {
    if (!this.socialLinksCache) {
      return { hasCache: false };
    }
    const now = Date.now();
    return {
      hasCache: true,
      isValid: this.isCacheValid(),
      age: now - this.socialLinksCache.timestamp,
      expiresIn: this.socialLinksCache.expiresAt - now,
      dataAge: Math.floor((now - this.socialLinksCache.timestamp) / 1000) + 's',
    };
  }

  getSocialMediaLinks(token: string): Observable<SocialMediaLinksResponse> {
    // Always fetch all data (no pagination)
    const headers = this.getAuthHeaders(token);
    const params = new URLSearchParams();
    params.append('per_page', '0');
    const url = `${
      this.apiUrl
    }/content/social-media-links?${params.toString()}`;
    return this.http.get<SocialMediaLinksResponse>(url, { headers });
  }
}
