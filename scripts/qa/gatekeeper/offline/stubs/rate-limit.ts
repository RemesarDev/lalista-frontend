// Stub de app/_lib/rate-limit.ts para las suites offline: sin Upstash, todo
// permitido. El comportamiento del limitador de login se prueba aparte, con un
// limitador falso inyectado en crearHooksBefore (auth.test.ts).
import type { BetterAuthRateLimitStorage } from 'better-auth';
import type { LimitadorLogin } from '../../../../../app/_lib/auth-hardening';

export const ratelimit = {
  limit: async () => ({ success: true, limit: 50, remaining: 49, reset: Date.now() + 60_000, pending: Promise.resolve() }),
};

export const limitarIntentosLogin: LimitadorLogin = async () => ({ permitido: true });

export const almacenRateLimitAuth: BetterAuthRateLimitStorage = {
  get: async () => null,
  set: async () => {},
  consume: async () => ({ allowed: true, retryAfter: null }),
};
