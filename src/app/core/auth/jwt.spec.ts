import { decodeJwt, isExpired } from './jwt';
import { fakeToken } from './testing';

describe('decodeJwt', () => {
  it('lee sub, role y exp del payload', () => {
    const claims = decodeJwt(fakeToken('docente'));
    expect(claims?.role).toBe('docente');
    expect(claims?.sub).toBe('u-1');
  });

  it('devuelve null con un token mal formado', () => {
    expect(decodeJwt('no-es-un-token')).toBeNull();
    expect(decodeJwt('a.%%%.c')).toBeNull();
  });

  it('rechaza un rol que no existe', () => {
    const payload = btoa(JSON.stringify({ sub: 'u', role: 'padre', exp: 9999999999 }));
    expect(decodeJwt(`x.${payload}.y`)).toBeNull();
  });
});

describe('isExpired', () => {
  it('compara exp con la hora actual', () => {
    expect(isExpired(decodeJwt(fakeToken('estudiante', 60))!)).toBe(false);
    expect(isExpired(decodeJwt(fakeToken('estudiante', -60))!)).toBe(true);
  });
});
