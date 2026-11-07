import { Injectable, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

// Recuerda el último curso abierto para el ítem "Evaluaciones" del menú
@Injectable({ providedIn: 'root' })
export class LastCourse {
  private readonly auth = inject(AuthService);

  remember(classId: string): void {
    try {
      sessionStorage.setItem(this.key(), classId);
    } catch {
      // sin almacenamiento, "Evaluaciones" lleva a Cursos
    }
  }

  id(): string | null {
    try {
      return sessionStorage.getItem(this.key());
    } catch {
      return null;
    }
  }

  // Ruta de evaluaciones del último curso, o la lista de cursos si no abrió ninguno
  url(): string {
    const base = this.auth.role() === 'docente' ? '/docente/cursos' : '/estudiante/cursos';
    const id = this.id();
    return id ? `${base}/${id}` : base;
  }

  private key(): string {
    return `ye.lastCourse.${this.auth.user()?.id ?? ''}`;
  }
}
