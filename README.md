# YoEstudio – Frontend (Angular)

Plataforma web que **orienta** el refuerzo de matemática y comunicación en 4.° de primaria. Este repo es la capa de presentación (Angular SPA); el backend (FastAPI) está en `yoestudio-upc/yo-estudio-backend`.

## Requisitos

- Node `^22.22.3`, `^24.15.0` o `>=26`
- npm 10
- El backend corriendo en `http://localhost:8000` (ver su README)

## Comandos

```bash
npm install
npm start          # http://localhost:4200 (proxy /api → localhost:8000/api/v1)
npm test           # Vitest, una pasada: npx ng test --watch=false
npm run build      # dist/yoestudio/browser (incluye _redirects para Netlify)
```

## Datos de demostración

El frontend siempre usa el backend. Para tener un salón de prueba, en el backend y sobre una base vacía:

```bash
python -m scripts.seed_demo
```

| Usuario | Contraseña | Rol | Para probar |
|---|---|---|---|
| `rosa.diaz` | `yoyo123` | Docente | Cursos, crear evaluaciones y preguntas, resultados con riesgo y SHAP |
| `camila.r` | `yoyo123` | Estudiante | Tiene historial: metas, avance y una evaluación pendiente |
| `mateo.q` | `yoyo123` | Estudiante | Alumno nuevo: unirse a Comunicación con el código que muestra el script |

Los nombres y los datos son ilustrativos.

## Estructura

```
src/app/
  core/
    api/        contratos (clases abstractas) + http/ (adaptadores a la API real)
    auth/       AuthService (con renovación de sesión), JWT, guards por rol, interceptores
    domain/     reglas compartidas (nivel, validación y calificación de preguntas, fechas)
    layout/     Shell con barra lateral, guards de salida
    models/     entidades de la BD y dto/ por portal
  shared/       componentes de UI (botón, tarjeta, Yoyo, estrellas…) y formatos
  features/
    auth/       01 Ingreso
    teacher/    Cursos, D1–D3, Resultados (riesgo + SHAP), Perfil
    student/    02–07 (cursos, evaluaciones, rendir, resultado, metas, avance)
```

El contrato que el frontend espera son las clases abstractas de `src/app/core/api/*.api.ts`; los adaptadores de `http/` convierten las respuestas del backend (ids numéricos, snake_case del login) a esos tipos.
