import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { API_URL } from '../api/api-url';
import { isApiRequest } from './auth.interceptor';
import { AuthService } from './auth.service';
import { LOGIN_PATH, ROLE_HOME } from './role-home';

// 401: sesión vencida → ingreso. 403: sin permiso → inicio del rol.
// El 401 del propio login lo maneja la pantalla de ingreso.
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const apiUrl = inject(API_URL);
  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && isApiRequest(req.url, apiUrl)) {
        const role = auth.role();
        if (error.status === 401 && !req.url.endsWith('/auth/login')) {
          auth.logout();
          void router.navigateByUrl(LOGIN_PATH);
        } else if (error.status === 403 && role) {
          void router.navigateByUrl(ROLE_HOME[role]);
        }
      }
      return throwError(() => error);
    }),
  );
};
