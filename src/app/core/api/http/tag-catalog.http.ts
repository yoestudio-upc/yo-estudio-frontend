import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { CatalogTopic } from '../../models/dto/teacher.dto';
import { Subject } from '../../models/tag';
import { API_URL } from '../api-url';
import { TagCatalogApi } from '../tag-catalog.api';
import { BackendTopicRef, toTagRefs } from './course-dto';

interface BackendCatalogTopic extends BackendTopicRef {
  subject: Subject;
  subtopics: BackendTopicRef[];
}

@Injectable()
export class TagCatalogHttpApi extends TagCatalogApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  getTopics(subject: Subject): Observable<CatalogTopic[]> {
    return this.http
      .get<BackendCatalogTopic[]>(`${this.apiUrl}/tags/catalog`, { params: { subject } })
      .pipe(
        map((topics) =>
          topics.map((t) => ({
            id: String(t.id),
            code: t.code,
            name: t.name,
            subject: t.subject,
            subtopics: toTagRefs(t.subtopics),
          })),
        ),
      );
  }
}
