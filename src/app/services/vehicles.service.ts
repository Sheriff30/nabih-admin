import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// --- Types ---
export interface VehicleServiceReview {
  ar: string;
  en: string;
}

export interface VehicleServiceResource {
  id: number;
  service_type: string;
  service_date: string;
  maintenance_time: string;
  mileage: number;
  cost: string;
  review: VehicleServiceReview;
}

export interface VehicleOwner {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface VehicleResource {
  id: number;
  name: string;
  phone_number: string | null;
  make_brand: string;
  model_year: string;
  mileage: number | null;
  vehicle_type: string;
  plate_number: string | null;
  vin_number: string | null;
  chassis_number: string | null;
  owner: VehicleOwner;
  services: VehicleServiceResource[];
}

export interface VehicleCollectionMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  next_page_url: string | null;
  prev_page_url: string | null;
}

export interface VehicleCollection {
  vehicles: VehicleResource[];
  meta: VehicleCollectionMeta;
}

export interface ListVehiclesResponse {
  success: boolean;
  message: string;
  data: VehicleCollection;
}

export interface UpdateVehicleRequest {
  user_id: number;
  name: string;
  make_brand: string;
  model_year?: string | null;
  vin_number?: string | null;
  mileage?: number | null;
  chassis_number?: string | null;
  vehicle_type?: string | null;
  plate_number?: string | null;
}

export interface PermanentlyDeleteVehicleResponse {
  success: boolean;
  message: string;
  data: string[];
}

@Injectable({ providedIn: 'root' })
export class VehicleManagementService {
  private apiUrl = 'https://dev.nabih.sa/api/admins/vehicles';

  constructor(private http: HttpClient) {}

  listVehicles(
    token: string,
    current_page: number = 1,
    per_page: number = 10,
    sort_direction: 'asc' | 'desc' = 'desc',
    sort_field: string = 'created_at'
  ): Observable<ListVehiclesResponse> {
    const headers = new HttpHeaders({
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    });
    let params = new HttpParams()
      .set('sort_direction', sort_direction)
      .set('sort_field', sort_field)
      .set('page', current_page.toString())
      .set('per_page', per_page.toString());
    return this.http.get<ListVehiclesResponse>(this.apiUrl, {
      headers,
      params,
    });
  }

  updateVehicle(
    id: number,
    payload: UpdateVehicleRequest,
    token: string
  ): Observable<{ success: boolean; message: string; data: VehicleResource }> {
    const headers = new HttpHeaders({
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
    return this.http.put<{
      success: boolean;
      message: string;
      data: VehicleResource;
    }>(`${this.apiUrl}/${id}`, payload, { headers });
  }

  permanentlyDeleteVehicle(
    id: number,
    token: string
  ): Observable<PermanentlyDeleteVehicleResponse> {
    const headers = new HttpHeaders({
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    });
    return this.http.delete<PermanentlyDeleteVehicleResponse>(
      `${this.apiUrl}/${id}/permanent`,
      { headers }
    );
  }
}
