import { levelFromMastery, mastery } from '../../domain/level-rules';
import { ShapFactor } from '../../models/dto/teacher.dto';
import { Level, RiskLevel, TEACHER_LEVEL_LABEL } from '../../models/level';
import { MockDb } from './mock-db';

export interface MockDiagnostic {
  topicLevel: Level;
  prediction: { level: Level; risk: RiskLevel };
  factors: ShapFactor[];
}

// Valor base de la explicación (promedio esperado del salón)
const BASELINE = 0.6;
const RISK_BY_LEVEL: Record<Level, RiskLevel> = { 1: 'high', 2: 'medium', 3: 'low' };

// Simulación del Componente 1 para el docente: el backend usa Random Forest + SHAP.
// Aquí: dominio por subtema + penalizaciones de telemetría → nivel previsto y factores.
export function diagnose(
  db: MockDb,
  studentId: string,
  classId: string,
  topicId: string,
): MockDiagnostic | null {
  const tally = db.tallyOf(studentId, classId);
  const subtopics = db.tags.filter((t) => t.parentId === topicId && tally.has(t.id));
  if (!subtopics.length) return null;

  const masteries = subtopics.map((s) => {
    const t = tally.get(s.id)!;
    return { name: s.name, m: mastery(t.correct, t.attempts) };
  });
  const topicMastery = masteries.reduce((sum, s) => sum + s.m, 0) / masteries.length;

  // Telemetría del alumno en las evaluaciones de este tema
  const evaluationIds = new Set(
    db.evaluations.filter((e) => e.classId === classId && e.topicId === topicId).map((e) => e.id),
  );
  const events = [...db.events]
    .filter(([key]) => {
      const [evaluationId, student] = key.split(':');
      return student === studentId && evaluationIds.has(evaluationId);
    })
    .map(([, e]) => e);
  const n = events.length || 1;
  const skips = events.filter((e) => e.skipped).length;
  const avgSeconds = events.reduce((s, e) => s + e.timeMs, 0) / n / 1000;
  const changes = events.reduce((s, e) => s + e.optionChanges, 0) / n;

  const factors: ShapFactor[] = masteries.map((s) => ({
    label: `Nivel en ${s.name}: ${TEACHER_LEVEL_LABEL[levelFromMastery(s.m)]}`,
    weight: (s.m - BASELINE) / masteries.length,
  }));
  if (skips) {
    factors.push({
      label: `Dejó ${skips} de ${events.length} preguntas para después`,
      weight: -0.15 * (skips / n),
    });
  }
  if (events.length && avgSeconds < 8) {
    factors.push({
      label: `Responde muy rápido (≈ ${Math.round(avgSeconds)} s por pregunta)`,
      weight: -0.05,
    });
  }
  if (changes >= 0.5) {
    factors.push({ label: 'Cambia de opción con frecuencia', weight: -0.03 });
  }

  const score = BASELINE + factors.reduce((s, f) => s + f.weight, 0);
  // Cortes del mock: con pocas preguntas por subtema el dominio suavizado rara vez pasa de 0.7
  const predicted: Level = score < 0.45 ? 1 : score < 0.6 ? 2 : 3;
  return {
    topicLevel: levelFromMastery(topicMastery),
    prediction: { level: predicted, risk: RISK_BY_LEVEL[predicted] },
    factors: factors
      .map((f) => ({ ...f, weight: Math.round(f.weight * 1000) / 1000 }))
      .filter((f) => f.weight !== 0)
      .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
      .slice(0, 5),
  };
}
