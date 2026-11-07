import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CatalogTopic } from '../../models/dto/teacher.dto';
import { Subject } from '../../models/tag';
import { TagCatalogApi } from '../tag-catalog.api';
import { MockDb, respond } from './mock-db';

@Injectable()
export class TagCatalogMockApi extends TagCatalogApi {
  private readonly db = inject(MockDb);

  getTopics(subject: Subject): Observable<CatalogTopic[]> {
    const ref = ({ id, code, name }: { id: string; code: string; name: string }) => ({
      id,
      code,
      name,
    });
    const topics = this.db.tags
      .filter((t) => t.kind === 'topic' && t.subject === subject)
      .map((t) => ({
        ...ref(t),
        subject: t.subject,
        subtopics: this.db.tags.filter((s) => s.parentId === t.id).map(ref),
      }));
    return respond(topics);
  }
}
