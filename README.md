# YoEstudio – Frontend (Angular)

Plataforma web que **orienta** el refuerzo de matemática y comunicación en 4.° de primaria. Este repo es la capa de presentación (Angular SPA); el backend (FastAPI) está en `yoestudio-upc/yo-estudio-backend`.

## Requisitos

- Node `^22.22.3`, `^24.15.0` o `>=26`
- npm 10

## Comandos

```bash
npm install
npm start          # http://localhost:4200 (proxy /api → localhost:8000/api/v1)
npm test           # Vitest, una pasada: npx ng test --watch=false
npm run build      # dist/yoestudio/browser (incluye _redirects para Netlify)
```

## Datos de prueba (sin backend)

Mientras no exista la API, todo funciona con **mocks** (`environment.useMocks = true`). Los datos se guardan en el `localStorage` del navegador, así que sobreviven a una recarga. Para volver al estado inicial: **Perfil del docente → Restablecer datos de ejemplo**.

| Usuario | Contraseña | Rol | Para probar |
|---|---|---|---|
| `rosa.diaz` | `yoyo123` | Docente | Cursos, crear evaluaciones y preguntas, resultados con riesgo |
| `camila.rojas` | `yoyo123` | Estudiante | Tiene historial: metas, avance y una evaluación pendiente |
| `mateo.quispe` | `yoyo123` | Estudiante | Alumno nuevo: unirse a Comunicación con el código `M3R8TW` |

Los nombres y los datos son ilustrativos.

## Estructura

```
src/app/
  core/
    api/        contratos (clases abstractas) + http/ (API real) + mock/ (MockDb y datos)
    auth/       AuthService, JWT, guards por rol, interceptores
    domain/     reglas compartidas (nivel, validación de evaluaciones y preguntas, fechas)
    layout/     Shell con barra lateral, guards de salida
    models/     entidades de la BD y dto/ por portal
  shared/       componentes de UI (botón, tarjeta, Yoyo, estrellas…) y formatos
  features/
    auth/       01 Ingreso
    teacher/    Cursos, D1–D3, Resultados (riesgo + SHAP), Perfil
    student/    02–07 (cursos, evaluaciones, rendir, resultado, metas, avance)
```

Para cambiar a la API real: `useMocks: false` y `apiUrl` en `src/environments/`. Los componentes no cambian. El contrato que el frontend espera son las clases abstractas de `src/app/core/api/*.api.ts`.
