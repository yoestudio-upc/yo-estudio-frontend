import { TagRef } from '../../models/dto/teacher.dto';
import { Subject } from '../../models/tag';

// Formas de curso que devuelve el backend (FastAPI): camelCase con ids numéricos.
// Los adaptadores HTTP las convierten a los DTO del frontend (ids string).

export interface BackendTopicRef {
  id: number;
  code: string;
  name: string;
}

export interface BackendCourse {
  id: number;
  name: string;
  subject: Subject;
  grade: number;
  section: string;
  topics: BackendTopicRef[];
}

export function toTagRefs(topics: BackendTopicRef[]): TagRef[] {
  return topics.map((t) => ({ id: String(t.id), code: t.code, name: t.name }));
}
