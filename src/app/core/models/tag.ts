// Áreas del alcance de la tesis
export type Subject = 'matematica' | 'comunicacion';

// Entidad Tag: tema o subtema del catálogo común (el docente elige, no escribe)
export type TagKind = 'topic' | 'subtopic';

export interface Tag {
  id: string;
  code: string;
  name: string;
  kind: TagKind;
  subject: Subject;
  // Subtema → su tema; tema → null
  parentId: string | null;
}
