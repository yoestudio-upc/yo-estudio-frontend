import { addDays, todayIso } from '../mock-clock';

export interface MockQuestion {
  id: string;
  type: 'single';
  subtopicId: string;
  text: string;
  points: number;
  options: { id: string; text: string; correct: boolean }[];
}

// Evaluación guardada en el mock. El estado se calcula con las fechas (ver MockDb).
export interface MockEvaluation {
  id: string;
  classId: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  published: boolean;
  topicId: string | null;
  subtopicIds: string[];
  questions: MockQuestion[];
  readingTitle: string | null;
  readingText: string | null;
  // Semilla: alumnos que ya la rindieron. MockDb les genera respuestas y telemetría
  // de ejemplo (data/synthetic.ts); lo que se rinde en la demo se suma a MockDb.results.
  completedBy: string[];
}

// s-3 … s-(n+2): el resto del salón (Camila es s-1 y Mateo s-2, los usuarios de prueba)
const others = (n: number) => Array.from({ length: n }, (_, i) => `s-${i + 3}`);
// Todos menos Mateo, que empieza sin evaluaciones rendidas
const everyone = () => ['s-1', ...others(24)];

const LUCIA_TITLE = 'La semilla de Lucía';
const LUCIA_TEXT =
  'Lucía sembró una semilla en una maceta. Cada mañana la regaba y la ponía junto a la ventana. ' +
  'Después de dos semanas salió un brote verde. Lucía saltó de alegría.';

// Arma una pregunta de elección única; `correct` es el índice de la opción correcta
function q(
  evaluationId: string,
  n: number,
  subtopicId: string,
  text: string,
  points: number,
  options: string[],
  correct: number,
): MockQuestion {
  const id = `${evaluationId}-q${n}`;
  return {
    id,
    type: 'single',
    subtopicId,
    text,
    points,
    options: options.map((option, i) => ({
      id: `${id}-o${i}`,
      text: option,
      correct: i === correct,
    })),
  };
}

const EQUIV = 'tag-fracciones-equivalentes';
const COMPARE = 'tag-comparar-fracciones';
const SIMPLIFY = 'tag-simplificar-fracciones';
const ADD = 'tag-sumar-fracciones';
const PERIMETER = 'tag-perimetro';
const AREA = 'tag-area-de-figuras';
const MULT = 'tag-multiplicacion';
const DECIMALS = 'tag-numeros-decimales';
const MAIN_IDEA = 'tag-encontrar-la-idea-principal';
const INFER = 'tag-hacer-inferencias';
const ORDER = 'tag-ordenar-los-hechos';

const FR = 'e-fracciones-u3';
const GEO = 'e-perimetro-area';
const DEC = 'e-decimales';
const READ = 'e-cuentos-cortos';

// Fechas relativas a hoy para que siempre haya una publicada, una programada y una cerrada
export function seedEvaluations(today = todayIso()): MockEvaluation[] {
  return [
    {
      id: FR,
      classId: 'c-mat-4b',
      name: 'Fracciones – Unidad 3',
      startDate: addDays(today, -3),
      endDate: addDays(today, 2),
      published: true,
      topicId: 'tag-fracciones',
      subtopicIds: [EQUIV, COMPARE, SIMPLIFY, ADD],
      completedBy: others(18),
      readingTitle: null,
      readingText: null,
      questions: [
        q(FR, 1, EQUIV, '¿Qué fracción es equivalente a 2/4?', 1, ['1/2', '2/8', '4/2', '1/4'], 0),
        q(FR, 2, COMPARE, '¿Cuál es mayor: 3/5 o 2/5?', 1, ['3/5', '2/5', 'Son iguales'], 0),
        q(FR, 3, SIMPLIFY, 'Simplifica la fracción 6/8.', 2, ['3/4', '2/3', '6/4', '1/2'], 0),
        q(
          FR,
          4,
          ADD,
          'Ana comió 1/4 de una pizza y Luis comió 2/4 de la misma pizza. ¿Qué fracción de la pizza comieron entre los dos?',
          2,
          ['3/8', '3/4', '2/8', '1/2'],
          1,
        ),
        q(FR, 5, EQUIV, '¿Qué fracción es equivalente a 1/3?', 1, ['3/1', '2/6', '1/6', '2/3'], 1),
        q(
          FR,
          6,
          COMPARE,
          '¿Cuál de estas fracciones es la menor?',
          1,
          ['1/2', '1/3', '1/4', '1/8'],
          3,
        ),
        q(FR, 7, ADD, '¿Cuánto es 2/7 + 3/7?', 1, ['5/14', '5/7', '6/7', '1/7'], 1),
        q(
          FR,
          8,
          SIMPLIFY,
          'Escribe 4/12 en su forma más simple.',
          1,
          ['1/4', '2/6', '1/3', '4/3'],
          2,
        ),
        q(
          FR,
          9,
          ADD,
          'Mateo leyó 2/6 de un libro el lunes y 3/6 el martes. ¿Qué parte del libro leyó en total?',
          2,
          ['5/12', '5/6', '1/6', '6/6'],
          1,
        ),
        q(FR, 10, EQUIV, '¿Qué fracción es equivalente a 3/4?', 1, ['6/8', '3/8', '4/3', '6/4'], 0),
      ],
    },
    {
      id: GEO,
      classId: 'c-mat-4b',
      name: 'Perímetro y área',
      startDate: addDays(today, 5),
      endDate: addDays(today, 7),
      published: true,
      topicId: 'tag-geometria',
      subtopicIds: [PERIMETER, AREA],
      completedBy: [],
      readingTitle: null,
      readingText: null,
      questions: [
        q(
          GEO,
          1,
          PERIMETER,
          'Un cuadrado tiene lados de 5 cm. ¿Cuál es su perímetro?',
          1,
          ['10 cm', '20 cm', '25 cm', '15 cm'],
          1,
        ),
        q(
          GEO,
          2,
          PERIMETER,
          'Un rectángulo mide 6 cm de largo y 3 cm de ancho. ¿Cuál es su perímetro?',
          1,
          ['9 cm', '18 cm', '12 cm', '24 cm'],
          1,
        ),
        q(
          GEO,
          3,
          PERIMETER,
          'Un triángulo tiene lados de 4 cm, 5 cm y 6 cm. ¿Cuál es su perímetro?',
          1,
          ['15 cm', '20 cm', '11 cm', '120 cm'],
          0,
        ),
        q(
          GEO,
          4,
          AREA,
          '¿Cuál es el área de un rectángulo de 4 cm de largo y 2 cm de ancho?',
          1,
          ['6 cm²', '8 cm²', '12 cm²', '16 cm²'],
          1,
        ),
        q(
          GEO,
          5,
          AREA,
          'Un cuadrado tiene 3 cm de lado. ¿Cuál es su área?',
          1,
          ['6 cm²', '9 cm²', '12 cm²', '3 cm²'],
          1,
        ),
        q(
          GEO,
          6,
          PERIMETER,
          'Don Julio quiere cercar su jardín cuadrado de 7 m de lado. ¿Cuántos metros de cerca necesita?',
          2,
          ['14 m', '28 m', '49 m', '21 m'],
          1,
        ),
        q(
          GEO,
          7,
          AREA,
          'Una alfombra rectangular mide 5 m por 3 m. ¿Cuánto mide su área?',
          2,
          ['8 m²', '15 m²', '16 m²', '30 m²'],
          1,
        ),
        q(
          GEO,
          8,
          AREA,
          '¿Qué mide el área de una figura?',
          1,
          ['Su borde', 'La superficie que ocupa', 'Su altura', 'Cuántos lados tiene'],
          1,
        ),
      ],
    },
    {
      id: DEC,
      classId: 'c-mat-4b',
      name: 'Números decimales',
      startDate: addDays(today, -14),
      endDate: addDays(today, -10),
      published: true,
      topicId: 'tag-numeros-y-operaciones',
      subtopicIds: [MULT, DECIMALS],
      completedBy: everyone(),
      readingTitle: null,
      readingText: null,
      questions: [
        q(DEC, 1, DECIMALS, 'Escribe 0,5 como fracción.', 1, ['1/5', '5/10', '5/100', '1/50'], 1),
        q(DEC, 2, DECIMALS, '¿Qué número es mayor?', 1, ['0,7', '0,07', '0,5', '0,25'], 0),
        q(DEC, 3, DECIMALS, '¿Cuánto es 0,3 + 0,4?', 1, ['0,7', '0,07', '7', '0,12'], 0),
        q(
          DEC,
          4,
          DECIMALS,
          '¿Cómo se lee 2,5?',
          1,
          [
            'Dos enteros y cinco décimos',
            'Veinticinco',
            'Dos enteros y cinco centésimos',
            'Cinco enteros y dos décimos',
          ],
          0,
        ),
        q(DEC, 5, MULT, '¿Cuánto es 6 × 7?', 1, ['42', '36', '48', '13'], 0),
        q(DEC, 6, MULT, '¿Cuánto es 8 × 9?', 1, ['72', '64', '81', '17'], 0),
        q(
          DEC,
          7,
          MULT,
          'Una caja tiene 6 filas de 4 chocolates. ¿Cuántos chocolates hay?',
          2,
          ['10', '24', '20', '64'],
          1,
        ),
        q(DEC, 8, MULT, '¿Cuánto es 12 × 3?', 1, ['15', '36', '33', '39'], 1),
      ],
    },
    {
      id: READ,
      classId: 'c-com-4b',
      name: 'Leemos cuentos cortos',
      startDate: addDays(today, -1),
      endDate: addDays(today, 4),
      published: true,
      topicId: 'tag-comprension-lectora',
      subtopicIds: [MAIN_IDEA, INFER, ORDER],
      completedBy: others(9),
      readingTitle: LUCIA_TITLE,
      readingText: LUCIA_TEXT,
      questions: [
        q(
          READ,
          1,
          MAIN_IDEA,
          '¿De qué trata principalmente el cuento?',
          2,
          [
            'De una niña que cuida una planta hasta que crece',
            'De una ventana rota',
            'De un viaje al campo',
            'De un perro que salta',
          ],
          0,
        ),
        q(
          READ,
          2,
          INFER,
          '¿Por qué Lucía ponía la maceta junto a la ventana?',
          1,
          [
            'Para que la planta reciba luz',
            'Para que nadie la vea',
            'Porque hacía frío',
            'Para regalarla',
          ],
          0,
        ),
        q(
          READ,
          3,
          ORDER,
          'En el cuento, ¿qué pasó primero?',
          1,
          [
            'Salió un brote verde',
            'Lucía sembró una semilla',
            'Lucía saltó de alegría',
            'Pasaron dos semanas',
          ],
          1,
        ),
        q(
          READ,
          4,
          INFER,
          '¿Cómo se sintió Lucía al ver el brote?',
          1,
          ['Feliz', 'Triste', 'Enojada', 'Aburrida'],
          0,
        ),
        q(
          READ,
          5,
          ORDER,
          '¿Qué pasó después de dos semanas?',
          1,
          [
            'Lucía sembró la semilla',
            'Salió un brote verde',
            'Lucía compró una maceta',
            'La planta se secó',
          ],
          1,
        ),
        q(
          READ,
          6,
          MAIN_IDEA,
          '¿Qué título le queda mejor al cuento?',
          1,
          ['La semilla de Lucía', 'El perro saltarín', 'La ventana mágica', 'Un día de lluvia'],
          0,
        ),
      ],
    },
  ];
}
