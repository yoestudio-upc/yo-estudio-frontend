import { Role } from '../models/user';

export interface JwtClaims {
  sub: string;
  role: Role;
  exp: number;
  iat?: number;
}

// Solo lee el payload; la firma la valida el backend
export function decodeJwt(token: string): JwtClaims | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '='));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const claims = JSON.parse(new TextDecoder().decode(bytes));
    return isJwtClaims(claims) ? claims : null;
  } catch {
    return null;
  }
}

export function isExpired(claims: JwtClaims, nowMs = Date.now()): boolean {
  return claims.exp * 1000 <= nowMs;
}

function isJwtClaims(value: unknown): value is JwtClaims {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c['sub'] === 'string' &&
    (c['role'] === 'estudiante' || c['role'] === 'docente') &&
    typeof c['exp'] === 'number'
  );
}
