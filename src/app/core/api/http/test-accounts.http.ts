import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Role } from '../../models/user';
import { API_URL } from '../api-url';
import { TestAccount, TestAccountRequest, TestAccountsApi } from '../test-accounts.api';

const ENDPOINT = '/auth/test-accounts';

@Injectable()
export class TestAccountsHttpApi extends TestAccountsApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  enabled(): Observable<boolean> {
    return this.http
      .get<{ enabled: boolean }>(`${this.apiUrl}${ENDPOINT}`)
      .pipe(map(({ enabled }) => enabled));
  }

  create(request: TestAccountRequest): Observable<TestAccount> {
    return this.http
      .post<{ id: number; username: string; name: string; role: Role }>(
        `${this.apiUrl}${ENDPOINT}`,
        request,
      )
      .pipe(map((account) => ({ ...account, id: String(account.id) })));
  }
}
