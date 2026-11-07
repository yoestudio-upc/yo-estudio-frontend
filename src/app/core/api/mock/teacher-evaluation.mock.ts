import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { evaluationProblems } from '../../domain/evaluation-rules';
import { TRUE_FALSE_LABELS, questionProblems } from '../../domain/question-rules';
import {
  EvaluationDraft,
  QuestionDraft,
  TeacherEvaluationDetail,
  TeacherEvaluationSummary,
  TeacherQuestion,
} from '../../models/dto/teacher.dto';
import { TeacherEvaluationApi } from '../teacher-evaluation.api';
import { MockEvaluation, MockQuestion } from './data/evaluations';
import { todayIso } from './mock-clock';
import { MockDb, fail, respond } from './mock-db';

// Simula las reglas del backend: solo el dueño del curso accede, solo se editan
// borradores y programadas, y para publicar la evaluación debe estar completa.
@Injectable()
export class TeacherEvaluationMockApi extends TeacherEvaluationApi {
  private readonly db = inject(MockDb);
  private readonly auth = inject(AuthService);

  listByClass(classId: string): Observable<TeacherEvaluationSummary[]> {
    const owned = this.ownClass(classId);
    if (!owned) return fail(404);
    const list = this.db.evaluations
      .filter((e) => e.classId === classId)
      .map((e) => ({
        id: e.id,
        classId: e.classId,
        name: e.name,
        startDate: e.startDate,
        endDate: e.endDate,
        readingTitle: e.readingTitle,
        readingText: e.readingText,
        status: this.db.statusOf(e),
        topic: this.db.tagRef(e.topicId),
        questionCount: e.questions.length,
        completedCount: this.db.completedCount(e),
        studentCount: owned.studentIds.length,
      }));
    return respond(list);
  }

  get(evaluationId: string): Observable<TeacherEvaluationDetail> {
    const found = this.ownEvaluation(evaluationId);
    return found ? respond(this.toDetail(found)) : fail(404);
  }

  create(classId: string, draft: EvaluationDraft): Observable<TeacherEvaluationDetail> {
    if (!this.ownClass(classId)) return fail(404);
    const problems = evaluationProblems(draft, [], 'draft', [], todayIso());
    if (problems.length) return fail(422, { problems });
    const created: MockEvaluation = {
      id: this.db.newId('e'),
      classId,
      ...this.clean(draft),
      published: false,
      questions: [],
      completedBy: [],
    };
    this.db.evaluations.push(created);
    this.db.save();
    return respond(this.toDetail(created));
  }

  update(evaluationId: string, draft: EvaluationDraft): Observable<TeacherEvaluationDetail> {
    const found = this.ownEvaluation(evaluationId);
    if (!found) return fail(404);
    if (!this.editable(found)) return fail(409);
    // Una evaluación ya publicada (programada) debe seguir completa
    const check = found.published ? 'publish' : 'draft';
    const problems = evaluationProblems(
      draft,
      found.questions,
      check,
      this.db.tagRefs(draft.subtopicIds),
      todayIso(),
    );
    if (problems.length) return fail(422, { problems });
    Object.assign(found, this.clean(draft));
    this.db.save();
    return respond(this.toDetail(found));
  }

  publish(evaluationId: string): Observable<TeacherEvaluationDetail> {
    const found = this.ownEvaluation(evaluationId);
    if (!found) return fail(404);
    if (!this.editable(found)) return fail(409);
    const problems = evaluationProblems(
      found,
      found.questions,
      'publish',
      this.db.tagRefs(found.subtopicIds),
      todayIso(),
    );
    if (problems.length) return fail(422, { problems });
    found.published = true;
    this.db.save();
    return respond(this.toDetail(found));
  }

  addQuestion(evaluationId: string, draft: QuestionDraft): Observable<TeacherQuestion> {
    const found = this.ownEvaluation(evaluationId);
    if (!found) return fail(404);
    if (!this.editable(found)) return fail(409);
    const problems = questionProblems(draft, found.subtopicIds);
    if (problems.length) return fail(422, { problems });
    const question = this.toQuestion(this.db.newId('q'), draft);
    found.questions.push(question);
    this.db.save();
    return respond(this.toTeacherQuestion(question));
  }

  updateQuestion(
    evaluationId: string,
    questionId: string,
    draft: QuestionDraft,
  ): Observable<TeacherQuestion> {
    const found = this.ownEvaluation(evaluationId);
    const index = found?.questions.findIndex((q) => q.id === questionId) ?? -1;
    if (!found || index < 0) return fail(404);
    if (!this.editable(found)) return fail(409);
    const problems = questionProblems(draft, found.subtopicIds);
    if (problems.length) return fail(422, { problems });
    found.questions[index] = this.toQuestion(questionId, draft);
    this.db.save();
    return respond(this.toTeacherQuestion(found.questions[index]));
  }

  deleteQuestion(evaluationId: string, questionId: string): Observable<void> {
    const found = this.ownEvaluation(evaluationId);
    if (!found || !found.questions.some((q) => q.id === questionId)) return fail(404);
    if (!this.editable(found)) return fail(409);
    found.questions = found.questions.filter((q) => q.id !== questionId);
    this.db.save();
    return respond(undefined);
  }

  private ownClass(classId: string) {
    const teacherId = this.auth.user()?.id;
    return this.db.classes.find((c) => c.id === classId && c.teacherId === teacherId);
  }

  private ownEvaluation(evaluationId: string): MockEvaluation | undefined {
    const found = this.db.evaluations.find((e) => e.id === evaluationId);
    return found && this.ownClass(found.classId) ? found : undefined;
  }

  // Ya empezada o cerrada: no se edita (cambiaría lo que rindieron los alumnos)
  private editable(e: MockEvaluation): boolean {
    const status = this.db.statusOf(e);
    return status === 'draft' || status === 'scheduled';
  }

  private clean(draft: EvaluationDraft) {
    return {
      name: draft.name.trim(),
      topicId: draft.topicId,
      subtopicIds: [...draft.subtopicIds],
      startDate: draft.startDate || null,
      endDate: draft.endDate || null,
      readingTitle: draft.readingTitle?.trim() || null,
      readingText: draft.readingText?.trim() || null,
    };
  }

  // Igual que el backend: V/F con textos fijos y respuestas aceptadas como opciones correctas
  private toQuestion(id: string, draft: QuestionDraft): MockQuestion {
    const options =
      draft.type === 'short'
        ? draft.acceptedAnswers.filter((a) => a.trim()).map((a) => ({ text: a.trim(), correct: true }))
        : draft.type === 'truefalse'
          ? TRUE_FALSE_LABELS.map((text, i) => ({ text, correct: !!draft.options[i]?.correct }))
          : draft.options.map((o) => ({ text: o.text.trim(), correct: o.correct }));
    return {
      id,
      type: draft.type,
      subtopicId: draft.subtopicId!,
      text: draft.text.trim(),
      points: draft.points!,
      options: options.map((o, i) => ({ id: `${id}-o${i}`, ...o })),
    };
  }

  private toTeacherQuestion(q: MockQuestion): TeacherQuestion {
    const short = q.type === 'short';
    return {
      ...q,
      options: short ? [] : q.options,
      acceptedAnswers: short ? q.options.map((o) => o.text) : [],
    };
  }

  private toDetail(e: MockEvaluation): TeacherEvaluationDetail {
    return {
      id: e.id,
      classId: e.classId,
      name: e.name,
      startDate: e.startDate,
      endDate: e.endDate,
      status: this.db.statusOf(e),
      topic: this.db.tagRef(e.topicId),
      subtopics: this.db.tagRefs(e.subtopicIds),
      questions: e.questions.map((q) => this.toTeacherQuestion(q)),
      readingTitle: e.readingTitle,
      readingText: e.readingText,
    };
  }
}
