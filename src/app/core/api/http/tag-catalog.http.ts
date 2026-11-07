import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CatalogTopic } from '../../models/dto/teacher.dto';
import { Subject } from '../../models/tag';
import { API_URL } from '../api-url';
import { TagCatalogApi } from '../tag-catalog.api';

@Injectable()
export class TagCatalogHttpApi extends TagCatalogApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  getTopics(subject: Subject): Observable<CatalogTopic[]> {
    return this.http.get<CatalogTopic[]>(`${this.apiUrl}/tags`, { params: { subject } });
  }
}
