import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

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
