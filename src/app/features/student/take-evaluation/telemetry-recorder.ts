import { AnswerEvent } from '../../../core/models/answer-event';

interface Pending {
  timeMs: number;
  optionChanges: number;
  skipped: boolean;
  revisits: number;
}

// Topes de un envío por pregunta, los mismos del backend. Sin ellos, una pregunta abierta
// más de una hora (el recreo con la pantalla encendida) haría rechazar todo el lote.
export const MAX_TIME_MS = 60 * 60 * 1000;
export const MAX_COUNT = 1000;

// Telemetría invisible por pregunta (regla 3): tiempo con la pregunta en pantalla,
// cambios de opción, omisiones ("Dejar para después") y revisitas. Sin cronómetro.
// flush() devuelve lo acumulado DESDE el último envío (incrementos), así un
// "Guardar y salir" seguido de otra sesión no pisa lo ya enviado.
export class TelemetryRecorder {
  private readonly pending = new Map<string, Pending>();
  private readonly visited = new Set<string>();
  private readonly lastOption = new Map<string, string>();
  private current: string | null = null;
  // Momento desde el que corre el tiempo de la pregunta actual (null = en pausa)
  private since: number | null = null;

  constructor(
    private readonly now: () => number = () => performance.now(),
    // Preguntas vistas en una sesión anterior (volver a ellas cuenta como revisita)
    seen: Iterable<string> = [],
    answers: Record<string, string> = {},
  ) {
    for (const id of seen) this.visited.add(id);
    for (const [q, o] of Object.entries(answers)) this.lastOption.set(q, o);
  }

  enter(questionId: string): void {
    this.leave();
    if (this.visited.has(questionId)) this.stat(questionId).revisits++;
    this.visited.add(questionId);
    this.current = questionId;
    this.since = this.now();
  }

  leave(): void {
    this.accumulate();
    this.current = null;
    this.since = null;
  }

  // Pestaña oculta: el tiempo no corre
  pause(): void {
    this.accumulate();
    this.since = null;
  }

  resume(): void {
    if (this.current && this.since === null) this.since = this.now();
  }

  select(questionId: string, optionId: string): void {
    const previous = this.lastOption.get(questionId);
    if (previous && previous !== optionId) this.stat(questionId).optionChanges++;
    this.lastOption.set(questionId, optionId);
  }

  skip(questionId: string): void {
    this.stat(questionId).skipped = true;
  }

  flush(): AnswerEvent[] {
    this.accumulate();
    if (this.current && this.since !== null) this.since = this.now();
    const events = [...this.pending]
      .map(([questionId, p]) => ({
        questionId,
        timeMs: Math.min(p.timeMs, MAX_TIME_MS),
        optionChanges: Math.min(p.optionChanges, MAX_COUNT),
        skipped: p.skipped,
        revisits: Math.min(p.revisits, MAX_COUNT),
      }))
      .filter((e) => e.timeMs || e.optionChanges || e.skipped || e.revisits);
    this.pending.clear();
    return events;
  }

  // Un lote que no llegó al servidor vuelve a la cola y sale con el siguiente envío
  restore(events: AnswerEvent[]): void {
    for (const e of events) {
      const p = this.stat(e.questionId);
      p.timeMs += e.timeMs;
      p.optionChanges += e.optionChanges;
      p.revisits += e.revisits;
      p.skipped = p.skipped || e.skipped;
    }
  }

  // Tras un leave() que no terminó en salir (falló el envío): la pregunta sigue en
  // pantalla y su tiempo vuelve a correr, sin contar una revisita
  stay(questionId: string): void {
    if (this.current) return;
    this.current = questionId;
    this.since = this.now();
  }

  private accumulate(): void {
    if (!this.current || this.since === null) return;
    const now = this.now();
    this.stat(this.current).timeMs += Math.round(now - this.since);
    this.since = now;
  }

  private stat(questionId: string): Pending {
    let p = this.pending.get(questionId);
    if (!p) {
      p = { timeMs: 0, optionChanges: 0, skipped: false, revisits: 0 };
      this.pending.set(questionId, p);
    }
    return p;
  }
}
