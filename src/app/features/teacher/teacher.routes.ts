import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { LastCourse } from '../../core/layout/last-course';
import { Shell } from '../../core/layout/shell/shell';
import { unsavedChangesGuard } from '../../core/layout/unsaved-changes.guard';
import { NavItem } from '../../shared/ui/sidebar/nav-item';

// Como en el diseño: dentro de un curso o de una evaluación se marca "Evaluaciones"
const TEACHER_NAV: NavItem[] = [
  {
    label: 'Cursos',
    icon: 'books',
    tone: 'blue',
    path: '/docente/cursos',
    activeWhen: (url) => url === '/docente/cursos',
  },
  {
    label: 'Evaluaciones',
    icon: 'pencil',
    tone: 'orange',
    path: '/docente/evaluaciones',
    activeWhen: (url) =>
      url.startsWith('/docente/cursos/') || url.startsWith('/docente/evaluaciones'),
  },
  { label: 'Perfil', icon: 'user', tone: 'green', path: '/docente/perfil' },
];

const evaluationEditor = () =>
  import('./evaluation-editor/evaluation-editor').then((m) => m.EvaluationEditor);
const questionEditor = () =>
  import('./question-editor/question-editor').then((m) => m.QuestionEditor);

export const TEACHER_ROUTES: Routes = [
  {
    path: '',
    component: Shell,
    data: { nav: TEACHER_NAV },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'cursos' },
      {
        path: 'cursos',
        title: 'Cursos · YoEstudio',
        loadComponent: () => import('./classes/classes').then((m) => m.TeacherClasses),
      },
      {
        path: 'cursos/:classId',
        title: 'Curso · YoEstudio',
        loadComponent: () => import('./class-detail/class-detail').then((m) => m.ClassDetail),
      },
      {
        path: 'cursos/:classId/evaluaciones/nueva',
        title: 'Crear evaluación · YoEstudio',
        loadComponent: evaluationEditor,
        canDeactivate: [unsavedChangesGuard],
      },
      {
        path: 'evaluaciones/:evaluationId/editar',
        title: 'Editar evaluación · YoEstudio',
        loadComponent: evaluationEditor,
        canDeactivate: [unsavedChangesGuard],
      },
      // "nueva" antes que ":questionId" para que no se lea como un id
      {
        path: 'evaluaciones/:evaluationId/preguntas/nueva',
        title: 'Crear pregunta · YoEstudio',
        loadComponent: questionEditor,
        canDeactivate: [unsavedChangesGuard],
      },
      {
        path: 'evaluaciones/:evaluationId/preguntas/:questionId',
        title: 'Editar pregunta · YoEstudio',
        loadComponent: questionEditor,
        canDeactivate: [unsavedChangesGuard],
      },
      // Diseño propio (pregunta abierta 4): única pantalla con riesgo y SHAP
      {
        path: 'evaluaciones/:evaluationId/resultados',
        title: 'Resultados · YoEstudio',
        loadComponent: () => import('./results/results').then((m) => m.EvaluationResults),
      },
      // "Evaluaciones" del menú: al último curso abierto
      { path: 'evaluaciones', pathMatch: 'full', redirectTo: () => inject(LastCourse).url() },
      {
        path: 'perfil',
        title: 'Perfil · YoEstudio',
        loadComponent: () => import('./profile/profile').then((m) => m.TeacherProfile),
      },
    ],
  },
];
