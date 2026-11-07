import { Class } from '../../../models/class';
import { Student } from '../../../models/student';
import { Teacher } from '../../../models/teacher';

// Datos ilustrativos del piloto (un salón de 4.° B). Los nombres son inventados.

export const SEED_TEACHERS: Teacher[] = [{ id: 't-1', userId: 'u-rosa', name: 'Rosa Díaz' }];

const NAMES = [
  'Camila Rojas',
  'Mateo Quispe',
  'Valeria Huamán',
  'Diego Flores',
  'Lucía Mendoza',
  'Thiago Ramos',
  'Ariana Torres',
  'Sebastián Chávez',
  'Sofía Vargas',
  'Santiago Castillo',
  'Isabella Gutiérrez',
  'Gael Mamani',
  'Valentina Sánchez',
  'Adrián Paredes',
  'Mía Cárdenas',
  'Joaquín Espinoza',
  'Luana Salazar',
  'Fabián Ccori',
  'Antonella Ríos',
  'Emiliano Vega',
  'Renata Aguilar',
  'Leonardo Condori',
  'Ximena Navarro',
  'Benjamín Silva',
  'Zoe Palomino',
  'Matías Arias',
];

export const SEED_STUDENTS: Student[] = NAMES.map((name, i) => ({
  id: `s-${i + 1}`,
  userId: `u-s-${i + 1}`,
  name,
  grade: 4,
  section: 'B',
}));

export const SEED_CLASSES: (Class & { topicIds: string[]; studentIds: string[] })[] = [
  {
    id: 'c-mat-4b',
    name: 'Matemática',
    subject: 'matematica',
    grade: 4,
    section: 'B',
    teacherId: 't-1',
    joinCode: 'K7P2QX',
    topicIds: ['tag-fracciones', 'tag-geometria', 'tag-numeros-y-operaciones'],
    studentIds: SEED_STUDENTS.map((s) => s.id),
  },
  {
    id: 'c-com-4b',
    name: 'Comunicación',
    subject: 'comunicacion',
    grade: 4,
    section: 'B',
    teacherId: 't-1',
    joinCode: 'M3R8TW',
    topicIds: ['tag-comprension-lectora', 'tag-gramatica', 'tag-produccion-de-textos'],
    // Mateo (s-2) aún no se unió: sirve para probar "Unirme a un curso" con M3R8TW
    studentIds: SEED_STUDENTS.filter((s) => s.id !== 's-2').map((s) => s.id),
  },
];
