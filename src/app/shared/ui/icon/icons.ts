// Íconos de trazo del diseño (diseno/fuentes/*.dc.html), viewBox 0 0 24 24.
// Círculos y rectángulos convertidos a path para dibujarlos con un solo @for.
export interface IconDef {
  paths: string[];
  // Partes con relleno (currentColor)
  filled?: string[];
  strokeWidth?: number;
}

const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

const rect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}` +
  `h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}z`;

export const ICONS = {
  // Navegación
  books: {
    paths: [
      'M4 19V5a1 1 0 0 1 1-1h4v16H5a1 1 0 0 1-1-1zM9 4h4v16H9zM14.5 5.5l3.8-1 3.2 14.5-3.8 1z',
    ],
  },
  pencil: { paths: ['M4 20l1-4L16 5l3 3L8 19zM14 7l3 3'] },
  flag: { paths: ['M5 21V4M5 4h12l-2.5 4L17 12H5'] },
  trophy: {
    paths: ['M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8'],
  },
  user: { paths: [circle(12, 8, 4), 'M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6'] },
  logout: { paths: ['M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10'] },

  // Acciones
  'arrow-right': { paths: ['M5 12h14M13 6l6 6-6 6'], strokeWidth: 2.6 },
  'arrow-left': { paths: ['M19 12H5M11 6l-6 6 6 6'], strokeWidth: 2.6 },
  'chevron-right': { paths: ['M9 5l7 7-7 7'], strokeWidth: 3 },
  plus: { paths: ['M12 5v14M5 12h14'], strokeWidth: 2.8 },
  check: { paths: ['M5 12.5l4.5 4.5L19 7.5'], strokeWidth: 3 },
  x: { paths: ['M6 6l12 12M18 6L6 18'], strokeWidth: 2.4 },
  trash: { paths: ['M5 7h14M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3'] },
  search: { paths: [circle(11, 11, 7), 'M20 20l-4-4'], strokeWidth: 2.4 },
  refresh: { paths: ['M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5'] },
  play: { paths: [], filled: ['M7 4.5v15l12-7.5z'], strokeWidth: 0 },

  // Información
  lock: { paths: [rect(5, 11, 14, 10, 2), 'M8 11V8a4 4 0 0 1 8 0v3'] },
  help: {
    paths: [circle(12, 12, 9), 'M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.01'],
  },
  star: { paths: ['M12 3l2.7 5.5 6 .9-4.4 4.2 1.1 6L12 16.8l-5.4 2.8 1.1-6L3.3 9.4l6-.9z'] },
  calendar: { paths: [rect(4, 5, 16, 15, 2), 'M4 10h16M9 3v4M15 3v4'] },
  clock: { paths: [circle(12, 12, 8.5), 'M12 7.5V12l3 2'], strokeWidth: 2.4 },
  grid: {
    paths: [
      rect(3, 3, 7, 7, 1.5),
      rect(14, 3, 7, 7, 1.5),
      rect(3, 14, 7, 7, 1.5),
      rect(14, 14, 7, 7, 1.5),
    ],
  },

  // Cursos y temas
  calculator: {
    paths: ['M7 4v6M4 7h6M14 7h6M5 15l4 4M9 15l-4 4M14 16h6M17 13.5v.01M17 18.5v.01'],
    strokeWidth: 2,
  },
  book: {
    paths: [
      'M12 6c-2-1.5-5-2-8-1.5v14c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-14c-3-.5-6 0-8 1.5zM12 6v14',
    ],
    strokeWidth: 2,
  },
  pie: {
    paths: [circle(12, 12, 8.5), 'M12 12v8.5'],
    filled: ['M12 12V3.5A8.5 8.5 0 0 1 20.5 12Z'],
    strokeWidth: 2,
  },
  shapes: { paths: ['M3 20l6-11 6 11z', rect(14, 4, 7, 7, 1)], strokeWidth: 2 },
  sliders: {
    paths: ['M4 5h16M4 12h16M4 19h16'],
    filled: [circle(8, 5, 2), circle(15, 12, 2), circle(10, 19, 2)],
    strokeWidth: 2,
  },
} satisfies Record<string, IconDef>;

export type IconName = keyof typeof ICONS;
