import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, RedirectFunction, Router } from '@angular/router';
import { Role } from '../models/user';
import { AuthService } from './auth.service';
import { LOGIN_PATH, ROLE_HOME } from './role-home';

// canMatch: si el rol no coincide, el chunk del otro portal ni se descarga
export function roleGuard(role: Role): CanMatchFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isAuthenticated()) return router.parseUrl(LOGIN_PATH);
    const current = auth.role()!;
    return current === role ? true : router.parseUrl(ROLE_HOME[current]);
  };
}

// Con sesión activa, /ingreso lleva al inicio del rol
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? router.parseUrl(ROLE_HOME[auth.role()!]) : true;
};

// Ruta raíz: decide a dónde ir según la sesión
export const redirectToHome: RedirectFunction = () => {
  const auth = inject(AuthService);
  return auth.isAuthenticated() ? ROLE_HOME[auth.role()!] : LOGIN_PATH;
};
