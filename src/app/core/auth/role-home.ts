import { Role } from '../models/user';

// Pantalla de inicio de cada rol después del ingreso
export const ROLE_HOME: Record<Role, string> = {
  docente: '/docente/cursos',
  estudiante: '/estudiante/cursos',
};

export const LOGIN_PATH = '/ingreso';
