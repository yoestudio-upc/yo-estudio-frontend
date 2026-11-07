// Formato de fechas para la UI (fechas 'YYYY-MM-DD' en hora local)

const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

function parts(iso: string) {
  const [year, month, day] = iso.split('-').map(Number);
  const weekday = WEEKDAYS[new Date(year, month - 1, day).getDay()];
  return { year, month: MONTHS[month - 1], day, weekday };
}

// "Lunes 29 de septiembre"
export function formatLongDate(iso: string): string {
  const { weekday, day, month } = parts(iso);
  return `${weekday[0].toUpperCase()}${weekday.slice(1)} ${day} de ${month}`;
}

// "Hasta el viernes 3 de octubre"
export function formatDueDate(iso: string): string {
  const { weekday, day, month } = parts(iso);
  return `Hasta el ${weekday} ${day} de ${month}`;
}

// "Del 6 al 8 de octubre" · "Del 29 de septiembre al 3 de octubre"
export function formatDateRange(startIso: string, endIso: string): string {
  const start = parts(startIso);
  const end = parts(endIso);
  if (start.year !== end.year) {
    return `Del ${start.day} de ${start.month} de ${start.year} al ${end.day} de ${end.month} de ${end.year}`;
  }
  if (start.month === end.month) {
    return start.day === end.day
      ? `El ${start.day} de ${start.month}`
      : `Del ${start.day} al ${end.day} de ${end.month}`;
  }
  return `Del ${start.day} de ${start.month} al ${end.day} de ${end.month}`;
}
