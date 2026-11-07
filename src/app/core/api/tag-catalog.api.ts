import { Observable } from 'rxjs';
import { CatalogTopic } from '../models/dto/teacher.dto';
import { Subject } from '../models/tag';

// Catálogo común de temas y subtemas (el docente elige, no escribe)
export abstract class TagCatalogApi {
  abstract getTopics(subject: Subject): Observable<CatalogTopic[]>;
}
