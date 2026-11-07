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

// Contrato: POST /auth/login (docs/04-contrato-api-propuesto.md)
export abstract class AuthApi {
  abstract login(request: LoginRequest): Observable<LoginResponse>;
}
