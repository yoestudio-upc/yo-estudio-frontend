// Evaluación rendida por un alumno en el mock
export interface MockResult {
  evaluationId: string;
  studentId: string;
  // questionId → optionId elegida (null = sin responder)
  answers: Record<string, string | null>;
  submittedAt: string;
}

// Historia previa de Camila (s-1): rindió "Números decimales" y falló la pregunta 4
export function seedResults(): MockResult[] {
  const correct = {
    q1: 'o1',
    q2: 'o0',
    q3: 'o0',
    q4: 'o1',
    q5: 'o0',
    q6: 'o0',
    q7: 'o1',
    q8: 'o1',
  };
  return [
    {
      evaluationId: 'e-decimales',
      studentId: 's-1',
      answers: Object.fromEntries(
        Object.entries(correct).map(([q, o]) => [`e-decimales-${q}`, `e-decimales-${q}-${o}`]),
      ),
      submittedAt: '2026-10-12T10:00:00',
    },
  ];
}
