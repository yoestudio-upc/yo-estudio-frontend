import { MAX_TIME_MS, TelemetryRecorder } from './telemetry-recorder';

describe('TelemetryRecorder', () => {
  let t: number;
  const clock = () => t;
  const byId = (events: ReturnType<TelemetryRecorder['flush']>) =>
    Object.fromEntries(events.map((e) => [e.questionId, e]));

  beforeEach(() => (t = 0));

  it('un lote que no llegó vuelve a la cola y se suma a lo nuevo', () => {
    const r = new TelemetryRecorder(clock);
    r.enter('q1');
    r.select('q1', 'a');
    r.select('q1', 'b');
    r.skip('q1');
    t = 4000;
    const lost = r.flush();
    t = 6000;
    r.restore(lost);
    const [event] = r.flush();
    expect(event).toEqual({ questionId: 'q1', timeMs: 6000, optionChanges: 1, skipped: true, revisits: 0 });
    expect(r.flush()).toEqual([]);
  });

  it('una pregunta abierta más de una hora no pasa del tope que acepta el backend', () => {
    const r = new TelemetryRecorder(clock);
    r.enter('q1');
    t = 3 * MAX_TIME_MS;
    expect(r.flush()[0].timeMs).toBe(MAX_TIME_MS);
  });

  it('si no se pudo salir de la pregunta, su tiempo sigue corriendo sin contar revisita', () => {
    const r = new TelemetryRecorder(clock);
    r.enter('q1');
    t = 1000;
    r.leave();
    r.stay('q1');
    t = 3000;
    const [event] = r.flush();
    expect(event.timeMs).toBe(3000);
    expect(event.revisits).toBe(0);
  });

  it('mide el tiempo de cada pregunta y cuenta revisitas', () => {
    const r = new TelemetryRecorder(clock);
    r.enter('q1');
    t = 5000;
    r.enter('q2');
    t = 8000;
    r.enter('q1');
    t = 9000;
    const events = byId(r.flush());
    expect(events['q1'].timeMs).toBe(6000);
    expect(events['q1'].revisits).toBe(1);
    expect(events['q2']).toEqual({
      questionId: 'q2',
      timeMs: 3000,
      optionChanges: 0,
      skipped: false,
      revisits: 0,
    });
  });

  it('no cuenta el tiempo con la pestaña oculta', () => {
    const r = new TelemetryRecorder(clock);
    r.enter('q1');
    t = 1000;
    r.pause();
    t = 60000;
    r.resume();
    t = 61000;
    expect(r.flush()[0].timeMs).toBe(2000);
  });

  it('cuenta cambios de opción, no la primera elección', () => {
    const r = new TelemetryRecorder(clock);
    r.enter('q1');
    r.select('q1', 'a');
    r.select('q1', 'b');
    r.select('q1', 'b');
    r.select('q1', 'a');
    expect(r.flush()[0].optionChanges).toBe(2);
  });

  it('registra omisiones', () => {
    const r = new TelemetryRecorder(clock);
    r.enter('q1');
    r.skip('q1');
    expect(r.flush()[0].skipped).toBe(true);
  });

  it('cada envío lleva solo lo nuevo desde el anterior', () => {
    const r = new TelemetryRecorder(clock);
    r.enter('q1');
    t = 3000;
    expect(r.flush()[0].timeMs).toBe(3000);
    t = 4000;
    expect(r.flush()[0].timeMs).toBe(1000);
    r.leave();
    expect(r.flush()).toEqual([]);
  });

  it('al retomar, lo visto antes cuenta como revisita y la opción previa como base', () => {
    const r = new TelemetryRecorder(clock, ['q1'], { q1: 'a' });
    r.enter('q1');
    r.select('q1', 'b');
    const [event] = r.flush();
    expect(event.revisits).toBe(1);
    expect(event.optionChanges).toBe(1);
  });
});
