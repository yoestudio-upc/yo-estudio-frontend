import { Observable } from 'rxjs';
import { Role } from '../models/user';

export interface LoginRequest {
  username: string;
  password: string;
}

// Datos mínimos del usuario en sesión (Ley 29733: nada más de lo necesario)
export interface SessionUser {
  id: string;
  name: string;
  role: Role;
  grade?: number;
  section?: string;
}

export interface LoginResponse {
  accessToken: string;
  user: SessionUser;
}

// Ruta del login en el backend (FastAPI: /api/v1/auth/sign-in; el proxy agrega /v1)
export const LOGIN_ENDPOINT = '/auth/sign-in';

// Contrato: POST /auth/sign-in (docs/04-contrato-api-propuesto.md)
export abstract class AuthApi {
  abstract login(request: LoginRequest): Observable<LoginResponse>;
}
