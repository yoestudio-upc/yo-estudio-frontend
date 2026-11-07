// Entidad User: solo los dos roles del Charter
export type Role = 'estudiante' | 'docente';

export interface User {
  id: string;
  username: string;
  role: Role;
}
