import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_URL } from '../api/api-url';
import { AuthService } from './auth.service';

// Agrega el JWT solo a las peticiones hacia nuestra API
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();
  if (!token || !isApiRequest(req.url, inject(API_URL))) return next(req);
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};

export function isApiRequest(url: string, apiUrl: string): boolean {
  return apiUrl !== '' && url.startsWith(apiUrl);
}
