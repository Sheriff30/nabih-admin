import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const noAuthGuard: CanActivateFn = () => {
  const token = localStorage.getItem('token');
  const router = inject(Router);
  if (!token) {
    return true;
  } else {
    router.navigate(['/admin/dashboard']);
    return false;
  }
};
