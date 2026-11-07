import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

// Base de la API; inyectable para poder cambiarla en tests
export const API_URL = new InjectionToken<string>('API_URL', {
  providedIn: 'root',
  factory: () => environment.apiUrl,
});
