import { PracticeKind, ResponseProfile } from '../../../models/dto/student.dto';
import { Level } from '../../../models/level';
import { Subject } from '../../../models/tag';

// Simulación del DSS: "cómo practicar" según área y nivel (el backend usa reglas Q + DSS)
const PRACTICE: Record<PracticeKind, string> = {
  written: 'Ejercicios escritos, paso a paso, en tu cuaderno.',
  concrete: 'Problemas con dibujos o con material para contar, como tapitas o regletas.',
  reading: 'Lee cuentos cortos en voz alta y cuenta con tus palabras de qué tratan.',
};

export function practiceFor(subject: Subject, level: Level): { kind: PracticeKind; text: string } {
  const kind: PracticeKind =
    subject === 'comunicacion' ? 'reading' : level === 1 ? 'concrete' : 'written';
  return { kind, text: PRACTICE[kind] };
}

// Lectura del perfil para el docente (más directa que la del alumno)
export const TEACHER_PROFILE_NOTE: Record<string, string> = {
  calm: 'Se toma su tiempo y revisa antes de responder.',
  explorer: 'Cambia de opción con frecuencia; puede indicar dudas en el tema.',
  quick: 'Responde muy rápido; puede no estar leyendo con calma.',
};

// Perfiles de respuesta (K-means). Nombres provisionales y sin género (pregunta abierta 7);
// siempre en positivo para el alumno.
export const PROFILES: Record<'calm' | 'explorer' | 'quick', ResponseProfile> = {
  calm: {
    code: 'calm',
    name: 'Paso a paso',
    description: 'Te tomas tu tiempo y revisas antes de responder. ¡Eso te ayuda a acertar!',
  },
  explorer: {
    code: 'explorer',
    name: 'Con muchas ideas',
    description: 'Pruebas varias opciones antes de decidir. ¡Pensar en todas te ayuda a elegir!',
  },
  quick: {
    code: 'quick',
    name: 'Con buen ritmo',
    description: 'Respondes con rapidez. Cuando dudes, vuelve a leer con calma.',
  },
};
