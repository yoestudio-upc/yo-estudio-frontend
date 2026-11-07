import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, firstValueFrom, map, tap } from 'rxjs';
import { AuthApi, LoginRequest, SessionUser } from '../api/auth.api';
import { Role } from '../models/user';
import { JwtClaims, decodeJwt, isExpired } from './jwt';
import { Session, SessionStore } from './session-store';

interface ActiveSession extends Session {
  claims: JwtClaims;
}

// Sesión deslizante: si queda poco para que venza el token y la persona sigue usando
// la plataforma, se renueva en silencio. Una computadora abandonada cierra la sesión sola.
export const REFRESH_WINDOW_MS = 10 * 60 * 1000;
export const ACTIVE_WINDOW_MS = 15 * 60 * 1000;
const CHECK_EVERY_MS = 60 * 1000;
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'touchstart'];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AuthApi);
  private readonly store = inject(SessionStore);
  private readonly session = signal<ActiveSession | null>(this.restore());

  readonly user = computed<SessionUser | null>(() => this.session()?.user ?? null);
  // El rol sale del JWT, no de los datos del usuario
  readonly role = computed<Role | null>(() => this.session()?.claims.role ?? null);
  readonly token = computed<string | null>(() => this.session()?.accessToken ?? null);

  private lastActivity = Date.now();
  private refreshing = false;

  constructor() {
    if (typeof document === 'undefined') return;
    const markActive = () => (this.lastActivity = Date.now());
    ACTIVITY_EVENTS.forEach((type) => document.addEventListener(type, markActive, { passive: true }));
    setInterval(() => void this.refreshIfActive(), CHECK_EVERY_MS);
  }

  // Renueva el token si vence pronto y hubo actividad reciente. Devuelve si lo renovó.
  async refreshIfActive(now = Date.now()): Promise<boolean> {
    const active = this.session();
    if (!active || this.refreshing) return false;
    const left = active.claims.exp * 1000 - now;
    if (left <= 0 || left > REFRESH_WINDOW_MS || now - this.lastActivity > ACTIVE_WINDOW_MS) {
      return false;
    }
    this.refreshing = true;
    try {
      const { accessToken, user } = await firstValueFrom(this.api.refresh());
      const claims = decodeJwt(accessToken);
      if (!claims) return false;
      this.store.write({ accessToken, user });
      this.session.set({ accessToken, user, claims });
      return true;
    } catch {
      // Si no se pudo (sin conexión o ya venció), la sesión sigue hasta que venza
      return false;
    } finally {
      this.refreshing = false;
    }
  }

  // Para los tests: simula la última actividad
  markActiveAt(time: number): void {
    this.lastActivity = time;
  }

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
