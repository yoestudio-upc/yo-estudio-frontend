import { Routes } from '@angular/router';
import { guestGuard, redirectToHome, roleGuard } from './core/auth/auth.guards';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: redirectToHome },
  {
    path: 'ingreso',
    title: 'Ingreso · YoEstudio',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
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
