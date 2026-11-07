import { formatDateRange, formatDueDate, formatLongDate } from './dates';

describe('formatDateRange', () => {
  it('mismo mes', () => {
    expect(formatDateRange('2026-10-06', '2026-10-08')).toBe('Del 6 al 8 de octubre');
  });

  it('meses distintos', () => {
    expect(formatDateRange('2026-09-29', '2026-10-03')).toBe(
      'Del 29 de septiembre al 3 de octubre',
    );
  });

  it('años distintos', () => {
    expect(formatDateRange('2026-12-28', '2027-01-03')).toBe(
      'Del 28 de diciembre de 2026 al 3 de enero de 2027',
    );
  });

  it('un solo día', () => {
    expect(formatDateRange('2026-10-06', '2026-10-06')).toBe('El 6 de octubre');
  });
});

describe('fechas con día de la semana', () => {
  it('fecha larga y fecha límite', () => {
    expect(formatLongDate('2026-09-28')).toBe('Lunes 28 de septiembre');
    expect(formatDueDate('2026-10-02')).toBe('Hasta el viernes 2 de octubre');
  });
});
