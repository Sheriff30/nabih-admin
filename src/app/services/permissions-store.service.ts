import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private permissionsSubject = new BehaviorSubject<string[]>([]);
  permissions$ = this.permissionsSubject.asObservable();

  setPermissions(permissions: string[]) {
    this.permissionsSubject.next(permissions);
  }

  getPermissions() {
    return this.permissionsSubject.value;
  }

  hasPermission(permission: string): boolean {
    return this.permissionsSubject.value.includes(permission);
  }

  clearPermissions() {
    this.permissionsSubject.next([]);
  }
}
