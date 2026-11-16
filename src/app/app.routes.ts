import { Routes } from '@angular/router';
import { environment } from '../environments/environment';
import { guestGuard, redirectToHome, roleGuard } from './core/auth/auth.guards';

// Solo para probar la plataforma: en el piloto (producción) la ruta no existe
const TEST_ACCOUNTS: Routes = environment.testAccounts
  ? [
      {
        path: 'cuentas-de-prueba',
        title: 'Cuentas de prueba · YoEstudio',
        loadComponent: () =>
          import('./features/auth/test-accounts/test-accounts').then((m) => m.TestAccounts),
      },
    ]
  : [];

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: redirectToHome },
  {
    path: 'ingreso',
    title: 'Ingreso · YoEstudio',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  ...TEST_ACCOUNTS,
  {
    path: 'docente',
    canMatch: [roleGuard('docente')],
    loadChildren: () => import('./features/teacher/teacher.routes').then((m) => m.TEACHER_ROUTES),
  },
  {
    path: 'estudiante',
    canMatch: [roleGuard('estudiante')],
    loadChildren: () => import('./features/student/student.routes').then((m) => m.STUDENT_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
