import { Observable } from 'rxjs';
import { Role } from '../models/user';

export interface TestAccountRequest {
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  role: Role;
}

export interface TestAccount {
  id: string;
  username: string;
  name: string;
  role: Role;
}

// Cuentas de prueba (docente o estudiante), solo para probar la plataforma: no existe en el
// piloto, donde el docente crea las cuentas de sus estudiantes. El backend la apaga en Railway.
export abstract class TestAccountsApi {
  // Si el backend permite crearlas
  abstract enabled(): Observable<boolean>;
  // 400 si el usuario ya existe; 404 si está apagado en el backend
  abstract create(request: TestAccountRequest): Observable<TestAccount>;
}
