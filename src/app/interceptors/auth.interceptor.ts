import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from '../services/toast.service';
import { catchError } from 'rxjs/operators';
import { of, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  const handle401 = () => {
    localStorage.removeItem('token');

    window.location.href = '/login';
  };
  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(authReq).pipe(
      catchError((error) => {
        if (error.status === 401) {
          handle401();
        }
        return throwError(() => error);
      })
    );
  }
  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        handle401();
      }
      return throwError(() => error);
    })
  );
};
