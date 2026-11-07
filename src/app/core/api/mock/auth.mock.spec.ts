import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { decodeJwt } from '../../auth/jwt';
import { AuthMockApi, MOCK_PASSWORD } from './auth.mock';

describe('AuthMockApi', () => {
  const api = new AuthMockApi();

  it('emite un JWT legible con el rol del usuario', async () => {
    const res = await firstValueFrom(
      api.login({ username: 'Rosa.Diaz ', password: MOCK_PASSWORD }),
    );
    expect(res.user.role).toBe('docente');
    expect(decodeJwt(res.accessToken)?.role).toBe('docente');
  });

  it('responde 401 con datos incorrectos', async () => {
    const error = await firstValueFrom(
      api.login({ username: 'camila.rojas', password: 'mala' }),
    ).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HttpErrorResponse);
    expect((error as HttpErrorResponse).status).toBe(401);
  });
});
