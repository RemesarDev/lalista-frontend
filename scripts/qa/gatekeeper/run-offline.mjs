// scripts/qa/gatekeeper/run-offline.mjs
// =============================================================================
// Corre las suites offline del Gatekeeper: no necesitan base, Redis ni SMTP.
//   npm run test:gatekeeper
//
// 1. Compila offline/*.test.ts con esbuild (respeta el alias "@/" de
//    tsconfig.json). Tres modulos se reemplazan por stubs: el rate limit
//    (Upstash), el registro de analiticas (Supabase DB2) y next/server.
// 2. Ejecuta los .mjs resultantes con el runner nativo de Node (node --test).
//
// La salida va a node_modules/.cache para que los imports de paquetes
// (better-auth, hono, pg...) resuelvan contra el node_modules del proyecto.
// =============================================================================

import { build } from 'esbuild';
import { readdirSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, '../../..');
const dirTests = path.join(aqui, 'offline');
const salida = path.join(raiz, 'node_modules/.cache/qa-gatekeeper');

const stubs = {
  '@/app/_lib/rate-limit': path.join(dirTests, 'stubs/rate-limit.ts'),
  '@/app/_lib/utils/analytics': path.join(dirTests, 'stubs/analytics.ts'),
  'next/server': path.join(dirTests, 'stubs/next-server.ts'),
};

const entradas = readdirSync(dirTests)
  .filter((f) => f.endsWith('.test.ts'))
  .map((f) => path.join(dirTests, f));

rmSync(salida, { recursive: true, force: true });

await build({
  entryPoints: entradas,
  outdir: salida,
  outExtension: { '.js': '.mjs' },
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  packages: 'external',
  sourcemap: 'inline',
  logLevel: 'warning',
  tsconfig: path.join(raiz, 'tsconfig.json'),
  plugins: [
    {
      name: 'stubs-infra',
      setup(b) {
        b.onResolve({ filter: /^(@\/app\/_lib\/(rate-limit|utils\/analytics)|next\/server)$/ }, (args) => ({
          path: stubs[args.path],
        }));
      },
    },
  ],
});

// Variables ficticias: los modulos de la app validan que existan al importarse.
// Ningun test se conecta a estos hosts (puerto 9, "discard").
const entornoFicticio = {
  DATABASE_URL: 'postgres://qa:qa@127.0.0.1:9/qa',
  BETTER_AUTH_SECRET: 'qa-gatekeeper-secret-no-usar-en-produccion-0123456789',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:9',
  SERVICE_ROLE_KEY_SUPABASE: 'qa',
  NEXT_PUBLIC_SUPABASE_ANALYTICS_URL: 'http://127.0.0.1:9',
  SUPABASE_ANALYTICS_URL: 'http://127.0.0.1:9',
  SUPABASE_ANALYTICS_SERVICE_ROLE_KEY: 'qa',
  SUPABASE_TEST_URL: 'http://127.0.0.1:9',
  SUPABASE_TEST_PUB_KEY: 'qa',
  UPSTASH_REDIS_REST_URL: 'http://127.0.0.1:9',
  UPSTASH_REDIS_REST_TOKEN: 'qa',
  GMAIL_USER: 'qa@example.com',
  GMAIL_APP_PASS: 'qa',
};

const archivos = readdirSync(salida)
  .filter((f) => f.endsWith('.test.mjs'))
  .map((f) => path.join(salida, f));

const resultado = spawnSync(process.execPath, ['--test', '--test-reporter=spec', ...archivos], {
  stdio: 'inherit',
  env: { ...process.env, ...entornoFicticio },
});

process.exit(resultado.status ?? 1);
