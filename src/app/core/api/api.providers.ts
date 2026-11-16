import { Provider } from '@angular/core';
import { AuthApi } from './auth.api';
import { AuthHttpApi } from './http/auth.http';
import { StudentClassHttpApi } from './http/student-class.http';
import { StudentEvaluationHttpApi } from './http/student-evaluation.http';
import { StudentProgressHttpApi } from './http/student-progress.http';
import { TagCatalogHttpApi } from './http/tag-catalog.http';
import { TeacherClassHttpApi } from './http/teacher-class.http';
import { TeacherEvaluationHttpApi } from './http/teacher-evaluation.http';
import { TeacherReportsHttpApi } from './http/teacher-reports.http';
import { TestAccountsHttpApi } from './http/test-accounts.http';
import { StudentClassApi } from './student-class.api';
import { StudentEvaluationApi } from './student-evaluation.api';
import { StudentProgressApi } from './student-progress.api';
import { TagCatalogApi } from './tag-catalog.api';
import { TeacherClassApi } from './teacher-class.api';
import { TeacherEvaluationApi } from './teacher-evaluation.api';
import { TeacherReportsApi } from './teacher-reports.api';
import { TestAccountsApi } from './test-accounts.api';

// Cada contrato usa la API real (backend FastAPI). Los tests proveen sus propios dobles.
export function provideApis(): Provider[] {
  return [
    { provide: AuthApi, useClass: AuthHttpApi },
    { provide: TagCatalogApi, useClass: TagCatalogHttpApi },
    { provide: TeacherClassApi, useClass: TeacherClassHttpApi },
    { provide: TeacherEvaluationApi, useClass: TeacherEvaluationHttpApi },
    { provide: TeacherReportsApi, useClass: TeacherReportsHttpApi },
    { provide: StudentClassApi, useClass: StudentClassHttpApi },
    { provide: StudentEvaluationApi, useClass: StudentEvaluationHttpApi },
    { provide: StudentProgressApi, useClass: StudentProgressHttpApi },
    { provide: TestAccountsApi, useClass: TestAccountsHttpApi },
  ];
}
