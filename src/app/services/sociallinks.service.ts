import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url';

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

export interface SocialMediaMeta {
  current_page: number | string;
  last_page: number | string;
  per_page: number | string;
  total: number | string;
  next_page_url: string | null;
  prev_page_url: string | null;
}

export interface SocialMediaLinkCollection {
  social_media: SocialMediaLinkResource[];
  meta: SocialMediaMeta;
}

export interface SocialMediaLinksResponse {
  success: boolean;
  message: string;
  data: SocialMediaLinkCollection;
}

@Injectable({
  providedIn: 'root',
})
export class SocialLinksService {
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

  // Social media links cache with expiration
  private socialLinksCache: {
    data: SocialMediaLinksResponse;
    timestamp: number;
    expiresAt: number;
  } | null = null;

  // Cache configuration
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_AGE = 10 * 60 * 1000; // 10 minutes

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

  getSocialMediaLinks(
    token: string,
    per_page: string = '15',
    forceRefresh: boolean = false
  ): Observable<SocialMediaLinksResponse> {
    // Only cache default request (per_page = '15', no forceRefresh)
    if (this.isCacheValid() && per_page === '15' && !forceRefresh) {
      return new Observable<SocialMediaLinksResponse>((observer) => {
        observer.next(this.socialLinksCache!.data);
        observer.complete();
      });
    }
    const headers = this.getAuthHeaders(token);
    const params = new HttpParams().set('per_page', per_page);
    return new Observable<SocialMediaLinksResponse>((observer) => {
      this.http
        .get<SocialMediaLinksResponse>(
          `${this.apiBaseUrl}/content/social-media-links`,
          { headers, params }
        )
        .subscribe({
          next: (res) => {
            if (per_page === '15' && !forceRefresh) {
              this.setCache(res);
            }
            observer.next(res);
            observer.complete();
          },
          error: (err) => {
            // If API fails and we have valid cache, return cached data as fallback
            if (this.isCacheValid() && per_page === '15' && !forceRefresh) {
              observer.next(this.socialLinksCache!.data);
              observer.complete();
            } else {
              observer.error(err);
            }
          },
        });
    });
  }

  updateSocialMediaLink(
    token: string,
    id: number,
    data: {
      type: string;
      title: string;
      url: string;
      username: string | null;
      description: string | null;
      is_active: boolean;
    }
  ): Observable<SocialMediaLinksResponse> {
    const headers = this.getAuthHeaders(token);
    const url = `${this.apiBaseUrl}/content/social-media-links/${id}`;
    // Invalidate cache after successful update
    return new Observable<SocialMediaLinksResponse>((observer) => {
      this.http
        .put<SocialMediaLinksResponse>(url, data, { headers })
        .subscribe({
          next: (res) => {
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
}
