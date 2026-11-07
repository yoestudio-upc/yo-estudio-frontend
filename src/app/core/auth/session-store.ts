import { Injectable } from '@angular/core';
import { SessionUser } from '../api/auth.api';

export interface Session {
  accessToken: string;
  user: SessionUser;
}

const KEY = 'ye.session';

// sessionStorage: en las computadoras compartidas del colegio, cerrar el navegador cierra la sesión
@Injectable({ providedIn: 'root' })
export class SessionStore {
  read(): Session | null {
    try {
      const raw = sessionStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      return null;
    }
  }

  write(session: Session): void {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(session));
    } catch {
      // Sin almacenamiento la sesión vive solo en memoria
    }
  }

  clear(): void {
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      // nada que limpiar
    }
  }
}
