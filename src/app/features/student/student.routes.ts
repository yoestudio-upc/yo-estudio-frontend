import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { beforeLeaveGuard } from '../../core/layout/before-leave.guard';
import { LastCourse } from '../../core/layout/last-course';
import { Shell } from '../../core/layout/shell/shell';
import { NavItem } from '../../shared/ui/sidebar/nav-item';

// Como en el diseño: dentro de un curso o de una evaluación se marca "Evaluaciones"
const STUDENT_NAV: NavItem[] = [
  {
    label: 'Cursos',
    icon: 'books',
    tone: 'blue',
    path: '/estudiante/cursos',
    activeWhen: (url) => url === '/estudiante/cursos',
  },
  {
    label: 'Evaluaciones',
    icon: 'pencil',
    tone: 'orange',
    path: '/estudiante/evaluaciones',
    activeWhen: (url) =>
      url.startsWith('/estudiante/cursos/') || url.startsWith('/estudiante/evaluaciones'),
  },
  { label: 'Mis metas', icon: 'flag', tone: 'yellow', path: '/estudiante/metas' },
  { label: 'Mi avance', icon: 'trophy', tone: 'green', path: '/estudiante/avance' },
];

export const STUDENT_ROUTES: Routes = [
  // 04 sin barra lateral; al salir por cualquier camino se guarda el avance
  {
    path: 'evaluaciones/:evaluationId',
    title: 'Evaluación · YoEstudio',
    loadComponent: () => import('./take-evaluation/take-evaluation').then((m) => m.TakeEvaluation),
    canDeactivate: [beforeLeaveGuard],
  },
  {
    path: '',
    component: Shell,
    data: { nav: STUDENT_NAV },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'cursos' },
      {
        path: 'cursos',
        title: 'Cursos · YoEstudio',
        loadComponent: () => import('./classes/classes').then((m) => m.StudentClasses),
      },
      {
        path: 'cursos/:classId',
        title: 'Evaluaciones del curso · YoEstudio',
        loadComponent: () =>
          import('./class-evaluations/class-evaluations').then((m) => m.ClassEvaluations),
      },
      // "Evaluaciones" del menú: al último curso abierto
      { path: 'evaluaciones', pathMatch: 'full', redirectTo: () => inject(LastCourse).url() },
      {
        path: 'evaluaciones/:evaluationId/resultado',
        title: '¡Terminaste! · YoEstudio',
        loadComponent: () => import('./result/result').then((m) => m.EvaluationResult),
      },
      {
        path: 'metas',
        title: 'Mis metas · YoEstudio',
        loadComponent: () => import('./goals/goals').then((m) => m.Goals),
      },
      {
        path: 'avance',
        title: 'Mi avance · YoEstudio',
        loadComponent: () => import('./progress/progress').then((m) => m.Progress),
      },
    ],
  },
];
