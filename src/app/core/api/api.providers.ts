import { AbstractType, Provider, Type } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthApi } from './auth.api';
import { AuthHttpApi } from './http/auth.http';
import { StudentClassHttpApi } from './http/student-class.http';
import { StudentEvaluationHttpApi } from './http/student-evaluation.http';
import { StudentProgressHttpApi } from './http/student-progress.http';
import { TagCatalogHttpApi } from './http/tag-catalog.http';
import { TeacherClassHttpApi } from './http/teacher-class.http';
import { TeacherEvaluationHttpApi } from './http/teacher-evaluation.http';
import { TeacherReportsHttpApi } from './http/teacher-reports.http';
import { AuthMockApi } from './mock/auth.mock';
import { StudentClassMockApi } from './mock/student-class.mock';
import { StudentEvaluationMockApi } from './mock/student-evaluation.mock';
import { StudentProgressMockApi } from './mock/student-progress.mock';
import { TagCatalogMockApi } from './mock/tag-catalog.mock';
import { TeacherClassMockApi } from './mock/teacher-class.mock';
import { TeacherEvaluationMockApi } from './mock/teacher-evaluation.mock';
import { TeacherReportsMockApi } from './mock/teacher-reports.mock';
import { StudentClassApi } from './student-class.api';
import { StudentEvaluationApi } from './student-evaluation.api';
import { StudentProgressApi } from './student-progress.api';
import { TagCatalogApi } from './tag-catalog.api';
import { TeacherClassApi } from './teacher-class.api';
import { TeacherEvaluationApi } from './teacher-evaluation.api';
import { TeacherReportsApi } from './teacher-reports.api';

// Elige mock o HTTP para cada contrato según environment.useMocks
export function provideApis(): Provider[] {
  const pick = <T>(provide: AbstractType<T>, mock: Type<T>, http: Type<T>): Provider => ({
    provide,
    useClass: environment.useMocks ? mock : http,
  });
  return [
    pick(AuthApi, AuthMockApi, AuthHttpApi),
    pick(TagCatalogApi, TagCatalogMockApi, TagCatalogHttpApi),
    pick(TeacherClassApi, TeacherClassMockApi, TeacherClassHttpApi),
    pick(TeacherEvaluationApi, TeacherEvaluationMockApi, TeacherEvaluationHttpApi),
    pick(TeacherReportsApi, TeacherReportsMockApi, TeacherReportsHttpApi),
    pick(StudentClassApi, StudentClassMockApi, StudentClassHttpApi),
    pick(StudentEvaluationApi, StudentEvaluationMockApi, StudentEvaluationHttpApi),
    pick(StudentProgressApi, StudentProgressMockApi, StudentProgressHttpApi),
  ];
}
