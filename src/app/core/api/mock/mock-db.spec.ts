import { TestBed } from '@angular/core/testing';
import { MockDb } from './mock-db';

describe('MockDb', () => {
  it('guarda los cambios y los recupera al volver a abrir la app', () => {
    const first = TestBed.inject(MockDb);
    first.classes.find((c) => c.id === 'c-com-4b')!.studentIds.push('s-2');
    first.save();

    TestBed.resetTestingModule();
    const reopened = TestBed.inject(MockDb);
    expect(reopened.classes.find((c) => c.id === 'c-com-4b')!.studentIds).toContain('s-2');
    expect(reopened.results.length).toBe(first.results.length);
  });

  it('restablecer vuelve a los datos de ejemplo', () => {
    const db = TestBed.inject(MockDb);
    const seeded = db.results.length;
    db.results.push({ evaluationId: 'x', studentId: 's-2', answers: {}, submittedAt: '' });
    db.save();
    db.reset();
    expect(db.results.length).toBe(seeded);

    TestBed.resetTestingModule();
    expect(TestBed.inject(MockDb).results.length).toBe(seeded);
  });

  it('si lo guardado está dañado, empieza con los datos de ejemplo', () => {
    localStorage.setItem('ye.mock.v1', '{no es json');
    expect(TestBed.inject(MockDb).evaluations.length).toBeGreaterThan(0);
  });
});
