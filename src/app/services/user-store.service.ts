import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserStoreService {
  private profileSubject = new BehaviorSubject<any>(null);
  private permissionsSubject = new BehaviorSubject<string[]>([]);

  setProfile(profile: any) {
    this.profileSubject.next(profile);
    // Extract permissions from profile and set them
    const permissions = profile?.all_permissions?.map((p: any) => p.name) || [];
    this.permissionsSubject.next(permissions);
  }

  getProfile(): Observable<any> {
    return this.profileSubject.asObservable();
  }

  getPermissions(): Observable<string[]> {
    return this.permissionsSubject.asObservable();
  }

  hasPermission(permission: string): boolean {
    return this.permissionsSubject.getValue().includes(permission);
  }
}
