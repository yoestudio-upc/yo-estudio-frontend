import { Role } from '../models/user';

// Arma un JWT sin firma para los tests
export function fakeToken(role: Role, expInSeconds = 3600): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const exp = Math.floor(Date.now() / 1000) + expInSeconds;
  return `${encode({ alg: 'none' })}.${encode({ sub: 'u-1', role, exp })}.x`;
}
