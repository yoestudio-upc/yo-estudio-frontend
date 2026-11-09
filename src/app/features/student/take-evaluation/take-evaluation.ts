import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { loadedValue } from '../../../core/api/loaded-value';
import { SendOptions, StudentEvaluationApi } from '../../../core/api/student-evaluation.api';
import { OPTION_LETTERS, isAnswered } from '../../../core/domain/question-rules';
import { BeforeLeave } from '../../../core/layout/before-leave.guard';
import {
  TakeEvaluation as TakeData,
  TakeProgress,
  TakeQuestion,
} from '../../../core/models/dto/student.dto';
import { topicStyle } from '../../../shared/topic/topic-style';
import { Button } from '../../../shared/ui/button/button';
import { Card } from '../../../shared/ui/card/card';
import { Confirm } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { Icon } from '../../../shared/ui/icon/icon';
import { Tone } from '../../../shared/ui/tone';
import { Yoyo } from '../../../shared/ui/yoyo/yoyo';
import { QuestionMap, QuestionState } from './question-map';
import { TelemetryRecorder } from './telemetry-recorder';

// 04 · Rendir evaluación: una pregunta por pantalla, sin cronómetro.
// La telemetría se registra en silencio (TelemetryRecorder).
@Component({
  selector: 'ye-take-evaluation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Button, Card, Icon, QuestionMap, Yoyo],
  templateUrl: './take-evaluation.html',
  styleUrl: './take-evaluation.scss',
  host: {
    '(document:visibilitychange)': 'onVisibilityChange()',
    '(window:pagehide)': 'onPageHide()',
  },
})
export class TakeEvaluation implements BeforeLeave {
  private readonly api = inject(StudentEvaluationApi);
  private readonly router = inject(Router);
  private readonly confirm = inject(Confirm);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  readonly evaluationId = input.required<string>();

  protected readonly data = rxResource({
    params: () => this.evaluationId(),
    stream: ({ params }) => this.api.getForTaking(params),
  });

  protected readonly letters = OPTION_LETTERS;
  protected readonly letterTones: Tone[] = ['blue', 'orange', 'green', 'yellow'];

  protected readonly index = signal(0);
  protected readonly answers = signal<Record<string, string>>({});
  // HU13: opción múltiple y respuesta corta
  protected readonly choices = signal<Record<string, string[]>>({});
  protected readonly texts = signal<Record<string, string>>({});
  protected readonly skipped = signal<string[]>([]);
  private readonly seen = signal<string[]>([]);
  protected readonly hint = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly readingOpen = signal(true);

  protected readonly questions = computed(() => this.data.value()?.questions ?? []);
  protected readonly question = computed(() => this.questions()[this.index()]);
  protected readonly total = computed(() => this.questions().length);
  protected readonly topicIcon = computed(() => topicStyle(this.data.value()?.topic.code).icon);
  protected readonly subtopicName = computed(
    () =>
      this.data.value()?.subtopics.find((s) => s.id === this.question()?.subtopicId)?.name ?? '',
  );
  protected readonly states = computed<QuestionState[]>(() =>
    this.questions().map((q) =>
      this.answered(q)
        ? 'answered'
        : this.skipped().includes(q.id) || this.seen().includes(q.id)
          ? 'later'
          : 'unseen',
    ),
  );
  protected readonly unanswered = computed(
    () => this.questions().filter((q) => !this.answered(q)).length,
  );
  protected readonly loadError = computed(() => {
    const e = this.data.error();
    if (!e) return null;
    return e instanceof HttpErrorResponse && e.status === 409
      ? 'Esta evaluación ya la resolviste o ya no está abierta.'
      : 'No encontramos esta evaluación.';
  });

  private recorder: TelemetryRecorder | null = null;
  // Terminó o guardó: ya no hace falta guardar al salir
  private closed = false;
  // La primera pregunta se abre al cargar: ahí todavía no hay nada que guardar
  private started = false;

  constructor() {
    effect(() => {
      const loaded = loadedValue(this.data);
      if (!loaded || this.recorder) return;
      untracked(() => this.start(loaded));
    });
  }

  async beforeLeave(): Promise<boolean> {
    if (this.closed || !this.recorder) return true;
    try {
      await this.persist();
    } catch {
      // Si no se pudo guardar, igual se deja salir: no se retiene al alumno
    }
    return true;
  }

  protected onVisibilityChange(): void {
    if (document.hidden) this.recorder?.pause();
    else this.recorder?.resume();
  }

  protected onPageHide(): void {
    if (this.closed || !this.recorder) return;
    this.recorder.leave();
    // Sin keepalive, el navegador cancela estas peticiones al salir de la página
    const options = { keepalive: true };
    this.sendTelemetry(options);
    this.api
      .saveProgress(this.evaluationId(), this.progress(), options)
      .subscribe({ error: () => {} });
  }

  protected isChosen(optionId: string): boolean {
    const q = this.question();
    if (!q) return false;
    return q.type === 'multiple'
      ? (this.choices()[q.id] ?? []).includes(optionId)
      : this.answers()[q.id] === optionId;
  }

  // Opción múltiple: marca o desmarca
  protected toggle(optionId: string): void {
    const q = this.question();
    if (!q) return;
    const current = this.choices()[q.id] ?? [];
    const next = current.includes(optionId)
      ? current.filter((id) => id !== optionId)
      : [...current, optionId];
    this.choices.update((c) => ({ ...c, [q.id]: next }));
    if (next.length) this.skipped.update((s) => s.filter((id) => id !== q.id));
    this.recorder?.select(q.id, [...next].sort().join(','));
  }

  // Respuesta corta: se guarda mientras escribe
  protected write(value: string): void {
    const q = this.question();
    if (!q) return;
    this.texts.update((t) => ({ ...t, [q.id]: value }));
    if (value.trim()) this.skipped.update((s) => s.filter((id) => id !== q.id));
  }

  // Al salir del campo cuenta como un cambio de respuesta si escribió algo distinto
  protected commitText(): void {
    const q = this.question();
    if (q) this.recorder?.select(q.id, (this.texts()[q.id] ?? '').trim());
  }

  protected textOf(questionId: string): string {
    return this.texts()[questionId] ?? '';
  }

  protected choose(optionId: string): void {
    const q = this.question();
    if (!q) return;
    this.answers.update((a) => ({ ...a, [q.id]: optionId }));
    this.skipped.update((s) => s.filter((id) => id !== q.id));
    this.recorder?.select(q.id, optionId);
  }

  protected goTo(index: number, focus = true): void {
    const q = this.questions()[index];
    if (!q) return;
    this.recorder?.enter(q.id);
    this.index.set(index);
    this.seen.update((s) => (s.includes(q.id) ? s : [...s, q.id]));
    this.hint.set(null);
    this.sendTelemetry();
    if (this.started) this.autosave();
    if (focus) {
      afterNextRender(
        () => this.host.nativeElement.querySelector<HTMLElement>('#question-text')?.focus(),
        { injector: this.injector },
      );
    }
  }

  protected previous(): void {
    if (this.index() > 0) this.goTo(this.index() - 1);
  }

  protected next(): void {
    if (this.index() < this.total() - 1) {
      this.goTo(this.index() + 1);
      return;
    }
    // En la última: lleva a la primera que falte, o recuerda que puede terminar
    const missing = this.questions().findIndex((q) => !this.answered(q));
    if (missing >= 0 && missing !== this.index()) this.goTo(missing);
    else this.hint.set('¡Llegaste al final! Cuando quieras, pulsa «Terminar evaluación».');
  }

  protected later(): void {
    const q = this.question();
    if (q && !this.answered(q)) {
      this.skipped.update((s) => (s.includes(q.id) ? s : [...s, q.id]));
      this.recorder?.skip(q.id);
    }
    this.next();
  }

  protected async saveAndExit(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      await this.persist();
      this.closed = true;
      void this.router.navigate(['/estudiante/cursos', this.data.value()?.classId]);
    } catch {
      this.error.set('No pudimos guardar tu avance. Revisa tu conexión e intenta otra vez.');
    } finally {
      this.busy.set(false);
    }
  }

  protected async finish(): Promise<void> {
    if (this.busy()) return;
    const missing = this.unanswered();
    if (missing) {
      const ok = await this.confirm.ask({
        title: missing === 1 ? 'Te falta 1 pregunta' : `Te faltan ${missing} preguntas`,
        message: 'Puedes volver a responderlas o terminar así. ¿Qué prefieres?',
        confirmLabel: 'Terminar así',
        cancelLabel: 'Seguir respondiendo',
      });
      if (!ok) return;
    }
    this.busy.set(true);
    this.error.set(null);
    try {
      this.recorder?.leave();
      await this.sendTelemetryNow();
      await firstValueFrom(this.api.submit(this.evaluationId(), this.progress()));
      this.closed = true;
      void this.router.navigate(['/estudiante/evaluaciones', this.evaluationId(), 'resultado'], {
        replaceUrl: true,
      });
    } catch {
      this.error.set('No pudimos enviar tus respuestas. Revisa tu conexión e intenta otra vez.');
    } finally {
      this.busy.set(false);
    }
  }

  private start(loaded: TakeData): void {
    const saved = loaded.progress;
    const seen = [
      ...Object.keys(saved?.answers ?? {}),
      ...Object.keys(saved?.choices ?? {}),
      ...Object.keys(saved?.texts ?? {}),
      ...(saved?.skipped ?? []),
    ];
    this.answers.set({ ...saved?.answers });
    this.choices.set({ ...saved?.choices });
    this.texts.set({ ...saved?.texts });
    this.skipped.set(saved?.skipped ?? []);
    this.seen.set(seen);
    // Última respuesta conocida de cada pregunta, para contar los cambios
    const last = {
      ...saved?.answers,
      ...Object.fromEntries(
        Object.entries(saved?.choices ?? {}).map(([q, ids]) => [q, [...ids].sort().join(',')]),
      ),
      ...Object.fromEntries(Object.entries(saved?.texts ?? {}).map(([q, t]) => [q, t.trim()])),
    };
    this.recorder = new TelemetryRecorder(undefined, seen, last);
    const index = Math.min(saved?.currentIndex ?? 0, loaded.questions.length - 1);
    this.goTo(Math.max(index, 0), false);
    this.started = true;
  }

  private progress(): TakeProgress {
    return {
      answers: this.answers(),
      choices: this.choices(),
      texts: this.texts(),
      skipped: this.skipped(),
      currentIndex: this.index(),
    };
  }

  private answered(q: TakeQuestion): boolean {
    return isAnswered(q, {
      answers: this.answers(),
      choices: this.choices(),
      texts: this.texts(),
      skipped: [],
      currentIndex: 0,
    });
  }

  private async persist(): Promise<void> {
    this.recorder?.leave();
    await this.sendTelemetryNow();
    await firstValueFrom(this.api.saveProgress(this.evaluationId(), this.progress()));
  }

  // Si la pestaña o el equipo fallan, solo se pierde la pregunta que estaba en pantalla
  private autosave(): void {
    this.api.saveProgress(this.evaluationId(), this.progress()).subscribe({ error: () => {} });
  }

  // Envío en segundo plano al cambiar de pregunta
  private sendTelemetry(options?: SendOptions): void {
    const events = this.recorder?.flush() ?? [];
    if (events.length) {
      this.api.sendTelemetry(this.evaluationId(), events, options).subscribe({ error: () => {} });
    }
  }

  private async sendTelemetryNow(): Promise<void> {
    const events = this.recorder?.flush() ?? [];
    if (events.length) await firstValueFrom(this.api.sendTelemetry(this.evaluationId(), events));
  }
}
