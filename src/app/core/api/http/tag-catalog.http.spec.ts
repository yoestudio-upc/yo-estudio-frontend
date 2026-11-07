import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CatalogTopic } from '../../models/dto/teacher.dto';
import { API_URL } from '../api-url';
import { TagCatalogHttpApi } from './tag-catalog.http';

describe('TagCatalogHttpApi', () => {
  let api: TagCatalogHttpApi;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TagCatalogHttpApi,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api' },
      ],
    });
    api = TestBed.inject(TagCatalogHttpApi);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('pide los temas de un área y convierte los ids a texto', () => {
    let result: CatalogTopic[] = [];
    api.getTopics('matematica').subscribe((r) => (result = r));
    backend.expectOne('/api/tags/catalog?subject=matematica').flush([
      {
        id: 4,
        code: 'geometria',
        name: 'Geometría',
        subject: 'matematica',
        subtopics: [{ id: 5, code: 'perimetro', name: 'Perímetro' }],
      },
    ]);
    expect(result).toEqual([
      {
        id: '4',
        code: 'geometria',
        name: 'Geometría',
        subject: 'matematica',
        subtopics: [{ id: '5', code: 'perimetro', name: 'Perímetro' }],
      },
    ]);
  });
});
