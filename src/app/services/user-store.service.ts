import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserStoreService {
  private profileSubject = new BehaviorSubject<any>(null);
  profile$ = this.profileSubject.asObservable();
  private permissions: string[] = [];

  setProfile(profile: any) {
    this.profileSubject.next(profile);
    this.permissions = (profile?.all_permissions || []).map((p: any) => p.name);
  }

  getProfile() {
    return this.profileSubject.value;
  }

  getPermissions() {
    return this.permissions;
  }

  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }
}
