import { Subject } from '../../core/models/tag';
import { IconName } from '../ui/icon/icons';
import { Tone } from '../ui/tone';

export interface TopicStyle {
  icon: IconName;
  tone: Tone;
}

// Color e ícono por área (tarjetas de Cursos)
export const SUBJECT_STYLE: Record<Subject, TopicStyle> = {
  matematica: { icon: 'calculator', tone: 'blue' },
  comunicacion: { icon: 'book', tone: 'orange' },
};

// Color e ícono por tema, según el código del catálogo.
// Pendiente: si el backend los manda en el catálogo, este mapa se elimina.
const TOPIC_STYLE: Record<string, TopicStyle> = {
  fracciones: { icon: 'pie', tone: 'blue' },
  geometria: { icon: 'shapes', tone: 'green' },
  'numeros-y-operaciones': { icon: 'sliders', tone: 'yellow' },
  'comprension-lectora': { icon: 'book', tone: 'orange' },
  gramatica: { icon: 'pencil', tone: 'orange' },
  'produccion-de-textos': { icon: 'pencil', tone: 'orange' },
};

const FALLBACK: TopicStyle = { icon: 'grid', tone: 'blue' };

export function topicStyle(code: string | undefined): TopicStyle {
  return (code && TOPIC_STYLE[code]) || FALLBACK;
}
