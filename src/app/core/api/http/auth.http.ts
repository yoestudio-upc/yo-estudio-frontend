import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Role } from '../../models/user';
import { API_URL } from '../api-url';
import { AuthApi, LOGIN_ENDPOINT, LoginRequest, LoginResponse } from '../auth.api';

// Respuesta del backend: snake_case e id numérico
interface SignInResponse {
  access_token: string;
  token_type: string;
  user: { id: number; name: string; role: Role };
}

@Injectable()
export class AuthHttpApi extends AuthApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<SignInResponse>(`${this.apiUrl}${LOGIN_ENDPOINT}`, request).pipe(
      map(({ access_token, user }) => ({
        accessToken: access_token,
        user: { id: String(user.id), name: user.name, role: user.role },
      })),
    );
  }
}
