import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../api-url';
import { AuthApi, LoginRequest, LoginResponse } from '../auth.api';

@Injectable()
export class AuthHttpApi extends AuthApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, request);
  }
}
