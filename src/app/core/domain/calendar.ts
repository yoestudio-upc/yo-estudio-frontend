// Fechas locales 'YYYY-MM-DD' (sin desfase por zona horaria)
export function todayIso(now = new Date()): string {
  return toIso(now);
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return toIso(new Date(y, m - 1, d + days));
}

function toIso(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
