import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UserStoreService {
  private profile: any = null;
  private permissions: string[] = [];

  constructor() {
    // Load profile from localStorage if available
    const stored = localStorage.getItem('userProfile');
    if (stored) {
      try {
        this.profile = JSON.parse(stored);
        this.permissions = (this.profile?.all_permissions || []).map(
          (p: any) => p.name
        );
      } catch {
        this.profile = null;
        this.permissions = [];
      }
    }
  }

  setProfile(profile: any) {
    this.profile = profile;
    this.permissions = (profile?.all_permissions || []).map((p: any) => p.name);
    localStorage.setItem('userProfile', JSON.stringify(profile));
  }

  getProfile() {
    return this.profile;
  }

  getPermissions() {
    return this.permissions;
  }

  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }
}
