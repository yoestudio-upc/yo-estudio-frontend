import { Class } from '../../core/models/class';

// "Matemática · 4.° B"
export function classLabel(c: Pick<Class, 'name' | 'grade' | 'section'>): string {
  return `${c.name} · ${c.grade}.° ${c.section}`;
}

// Búsqueda sin tildes ni mayúsculas
export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}
