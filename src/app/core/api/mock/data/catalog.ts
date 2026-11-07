import { Subject, Tag } from '../../../models/tag';

// Catálogo común de temas y subtemas (ilustrativo, 4.° de primaria)
const CATALOG: Record<Subject, Record<string, string[]>> = {
  matematica: {
    Fracciones: [
      'Fracciones equivalentes',
      'Comparar fracciones',
      'Simplificar fracciones',
      'Sumar fracciones',
    ],
    Geometría: ['Perímetro', 'Área de figuras'],
    'Números y operaciones': ['Multiplicación', 'Números decimales'],
  },
  comunicacion: {
    'Comprensión lectora': [
      'Encontrar la idea principal',
      'Hacer inferencias',
      'Ordenar los hechos',
    ],
    Gramática: ['Sustantivos y adjetivos', 'Concordancia', 'Signos de puntuación'],
    'Producción de textos': ['Planificar el texto', 'Usar conectores'],
  },
};

export function slug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const SEED_TAGS: Tag[] = Object.entries(CATALOG).flatMap(([subject, topics]) =>
  Object.entries(topics).flatMap(([topic, subtopics]) => {
    const topicId = `tag-${slug(topic)}`;
    return [
      { id: topicId, code: slug(topic), name: topic, kind: 'topic', subject, parentId: null },
      ...subtopics.map((name) => ({
        id: `tag-${slug(name)}`,
        code: slug(name),
        name,
        kind: 'subtopic',
        subject,
        parentId: topicId,
      })),
    ] as Tag[];
  }),
);
