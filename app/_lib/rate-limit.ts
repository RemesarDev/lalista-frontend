import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { BetterAuthRateLimitStorage } from 'better-auth';
import type { LimitadorLogin } from '@/app/_lib/auth-hardening';

// ==========================================
// RATE LIMITER CON UPSTASH REDIS
// Límite: 50 requests por IP cada 60 segundos
// Funciona en entornos distribuidos/serverless
// ==========================================

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, '60 s'),
    analytics: false,
    prefix: 'lalista:ratelimit',
});

// ==========================================
// LOGIN: LIMITE POR CUENTA
// ==========================================
// Los dos limites de arriba (Hono y Better Auth) cuentan por IP. Contra un
// ataque distribuido a una misma cuenta no hacen nada. Estos cuentan por email:
//   - email + IP: 5 intentos cada 15 min. Frena al que prueba claves desde una
//     maquina sin afectar al dueño, que entra desde otra IP.
//   - email:      20 intentos por hora, sumando todas las IPs. Techo para el
//     ataque distribuido.
// Trade-off conocido: alguien que conoce tu email puede gastarte el cupo de 20
// por hora y dejarte afuera hasta que venza la ventana. Es el costo habitual
// de un lockout por cuenta; con 20/h hace falta insistir bastante.
const loginPorEmailEIp = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    analytics: false,
    prefix: 'lalista:login:email-ip',
});

const loginPorEmail = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 h'),
    analytics: false,
    prefix: 'lalista:login:email',
});

export const limitarIntentosLogin: LimitadorLogin = async ({ email, ip }) => {
    try {
        const [porIp, total] = await Promise.all([
            loginPorEmailEIp.limit(`${email}|${ip ?? 'sin-ip'}`),
            loginPorEmail.limit(email),
        ]);
        const bloqueado = [porIp, total].find((r) => !r.success);
        if (!bloqueado) return { permitido: true };
        return { permitido: false, reintentarEnSeg: (bloqueado.reset - Date.now()) / 1000 };
    } catch (err) {
        // Mismo criterio que el limitador global: si Redis no responde, no
        // dejamos a nadie sin poder entrar.
        console.error('[RATE LIMIT LOGIN] Redis no disponible, permitiendo intento:', err);
        return { permitido: true };
    }
};

// ==========================================
// STORAGE DEL RATE LIMIT DE BETTER AUTH
// ==========================================
// Por defecto Better Auth guarda sus contadores en memoria. En Vercel cada
// instancia tiene su propia memoria, asi que las reglas "3 intentos cada 10 s"
// de /sign-in y "3 por minuto" de /request-password-reset se multiplican por
// la cantidad de instancias vivas. Con Redis el contador es uno solo.
//
// INCR + EXPIRE en un script Lua: atomico, sin la carrera de leer y escribir
// por separado.
const SCRIPT_CONSUMIR = `
local actual = redis.call('INCR', KEYS[1])
if actual == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
local ttl = redis.call('TTL', KEYS[1])
return {actual, ttl}
`;

const PREFIJO_BETTER_AUTH = 'lalista:ba-rl:';

export const almacenRateLimitAuth: BetterAuthRateLimitStorage = {
    async consume(key, { window, max }) {
        try {
            const [actual, ttl] = await redis.eval<[number], [number, number]>(
                SCRIPT_CONSUMIR,
                [PREFIJO_BETTER_AUTH + key],
                [window],
            );
            if (actual <= max) return { allowed: true, retryAfter: null };
            return { allowed: false, retryAfter: ttl > 0 ? ttl : window };
        } catch (err) {
            console.error('[RATE LIMIT AUTH] Redis no disponible, permitiendo request:', err);
            return { allowed: true, retryAfter: null };
        }
    },
    // get/set solo los usa el camino viejo (sin consume). Quedan para cumplir
    // la interfaz.
    async get(key) {
        try {
            return (await redis.get(PREFIJO_BETTER_AUTH + 'legacy:' + key)) ?? null;
        } catch {
            return null;
        }
    },
    async set(key, value) {
        try {
            await redis.set(PREFIJO_BETTER_AUTH + 'legacy:' + key, value, { ex: 3600 });
        } catch {
            // fail-open
        }
    },
};
