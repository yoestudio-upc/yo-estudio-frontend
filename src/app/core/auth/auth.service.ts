import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { AuthApi, LoginRequest, SessionUser } from '../api/auth.api';
import { Role } from '../models/user';
import { JwtClaims, decodeJwt, isExpired } from './jwt';
import { Session, SessionStore } from './session-store';

interface ActiveSession extends Session {
  claims: JwtClaims;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AuthApi);
  private readonly store = inject(SessionStore);
  private readonly session = signal<ActiveSession | null>(this.restore());

  readonly user = computed<SessionUser | null>(() => this.session()?.user ?? null);
  // El rol sale del JWT, no de los datos del usuario
  readonly role = computed<Role | null>(() => this.session()?.claims.role ?? null);
  readonly token = computed<string | null>(() => this.session()?.accessToken ?? null);

  login(request: LoginRequest): Observable<SessionUser> {
    return this.api.login(request).pipe(
      map(({ accessToken, user }) => {
        const claims = decodeJwt(accessToken);
        if (!claims) throw new Error('Token inválido');
        return { accessToken, user, claims };
      }),
      tap((active) => {
        this.store.write({ accessToken: active.accessToken, user: active.user });
        this.session.set(active);
      }),
      map(({ user }) => user),
    );
  }

  logout(): void {
    this.store.clear();
    this.session.set(null);
  }

  // Revisa el vencimiento en cada llamada; si venció, cierra la sesión
  isAuthenticated(): boolean {
    const active = this.session();
    if (!active) return false;
    if (isExpired(active.claims)) {
      this.logout();
      return false;
    }
    return true;
  }

  private restore(): ActiveSession | null {
    const saved = this.store.read();
    const claims = saved ? decodeJwt(saved.accessToken) : null;
    if (!saved || !claims || isExpired(claims)) {
      this.store.clear();
      return null;
    }
    return { ...saved, claims };
  }
}
