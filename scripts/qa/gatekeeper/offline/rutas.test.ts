// scripts/qa/gatekeeper/offline/rutas.test.ts
// =============================================================================
// Inventario de rutas de la API: ninguna ruta privada responde sin sesion
// =============================================================================
// Importa la app de Hono real (app/api/[[...route]]/app.ts), recorre TODAS las
// rutas registradas y le pega a cada una sin cookie y con cookies falsificadas.
// Toda ruta que no este en PUBLICAS tiene que responder 401 o 403.
//
// Si alguien agrega un endpoint y se olvida del guard, este test falla y lo
// nombra. Si el endpoint es publico a proposito, hay que sumarlo a PUBLICAS:
// esa decision queda escrita y pasa por code review.
//
// No necesita base: sin una sesion valida, Better Auth descarta la cookie antes
// de consultar la tabla session (la firma HMAC no verifica).
// =============================================================================

import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Hono } from 'hono';

// Endpoints publicos por diseño (catalogo, mapas, historico, promos y el
// registro de analiticas anonimas).
const PUBLICAS = new Set([
  'GET /api/productos',
  'GET /api/catalogo',
  'GET /api/precios-por-ids-area',
  'GET /api/categorias',
  'GET /api/producto/:id',
  'GET /api/maps/autocomplete',
  'GET /api/maps/geocode',
  'GET /api/maps/details',
  'GET /api/maps/reverse-geocode',
  'GET /api/maps/sucursales-cercanas',
  'GET /api/historico-precios',
  'GET /api/promociones-bancarias',
  'POST /api/analytics',
]);

// Endpoints de Better Auth que exigen sesion (los publicos, como sign-in, se
// prueban en auth.test.ts).
const AUTH_PRIVADAS: Array<[string, string]> = [
  ['POST', '/api/auth/update-user'],
  ['POST', '/api/auth/delete-user'],
  ['POST', '/api/auth/change-password'],
  ['GET', '/api/auth/list-sessions'],
  ['POST', '/api/auth/revoke-sessions'],
  ['POST', '/api/auth/revoke-other-sessions'],
];

const VALORES_PARAM: Record<string, string> = {
  id: '00000000-0000-4000-8000-000000000000',
  userId: 'usuario-de-otro',
};

const COOKIES_FALSAS: Array<[string, string | null]> = [
  ['sin cookie', null],
  ['token sin firma', 'better-auth.session_token=tokeninventado'],
  ['firma inventada', 'better-auth.session_token=tokeninventado.ZmlybWFpbnZlbnRhZGE%3D'],
  ['prefijo __Secure- falsificado', '__Secure-better-auth.session_token=tokeninventado.ZmlybWFpbnZlbnRhZGE%3D'],
  ['cookie vacia', 'better-auth.session_token='],
];

let app: Hono;
let rutas: Array<{ metodo: string; ruta: string }>;

function concretar(ruta: string) {
  return ruta.replace(/:(\w+)/g, (_m, nombre: string) => VALORES_PARAM[nombre] ?? 'x');
}

async function pedir(metodo: string, ruta: string, cookie: string | null) {
  const headers: Record<string, string> = { origin: 'http://localhost:3000' };
  if (cookie) headers.cookie = cookie;
  const conBody = ['POST', 'PATCH', 'PUT'].includes(metodo);
  if (conBody) headers['content-type'] = 'application/json';
  return app.request(concretar(ruta), { method: metodo, headers, body: conBody ? '{}' : undefined });
}

before(async () => {
  // Import dinamico: el runner ya cargo las variables de entorno ficticias.
  ({ app } = await import('../../../../app/api/[[...route]]/app'));
  const vistas = new Set<string>();
  rutas = [];
  for (const r of app.routes) {
    // "ALL" son middlewares (use) y el catch-all de Better Auth.
    if (r.method === 'ALL') continue;
    const clave = `${r.method} ${r.path}`;
    if (vistas.has(clave)) continue;
    vistas.add(clave);
    rutas.push({ metodo: r.method, ruta: r.path });
  }
});

describe('Inventario de rutas de la API', () => {
  it('TC-GUARD-00: la lista de rutas publicas no tiene entradas viejas', () => {
    const existentes = new Set(rutas.map((r) => `${r.metodo} ${r.ruta}`));
    for (const publica of PUBLICAS) {
      assert.ok(existentes.has(publica), `"${publica}" esta en PUBLICAS pero la ruta ya no existe`);
    }
    assert.ok(rutas.length > PUBLICAS.size, 'no se encontraron rutas privadas: ¿cambio la app?');
  });

  it('TC-GUARD-01: toda ruta privada responde 401/403 sin sesion o con cookie falsificada', async () => {
    const privadas = rutas.filter((r) => !PUBLICAS.has(`${r.metodo} ${r.ruta}`));
    const fallas: string[] = [];
    for (const { metodo, ruta } of privadas) {
      for (const [caso, cookie] of COOKIES_FALSAS) {
        const res = await pedir(metodo, ruta, cookie);
        if (res.status !== 401 && res.status !== 403) {
          fallas.push(`${metodo} ${ruta} [${caso}] -> ${res.status}`);
        }
      }
    }
    assert.deepEqual(fallas, [], `rutas privadas que no cortan sin sesion:\n${fallas.join('\n')}`);
  });

  it('TC-GUARD-02: sin sesion, la autenticacion corre ANTES que la validacion del body', async () => {
    // Body invalido a proposito: si el validador corriera primero, la
    // respuesta seria 400 con el detalle del schema.
    const casos: Array<[string, string, unknown]> = [
      ['POST', '/api/listas', { nombre: 123 }],
      ['PATCH', `/api/listas/${VALORES_PARAM.id}`, { items: 'x' }],
      ['POST', `/api/listas/${VALORES_PARAM.id}/miembros`, {}],
      ['PATCH', `/api/listas/${VALORES_PARAM.id}/miembros/u`, { rol: 'owner' }],
      ['POST', '/api/direcciones', {}],
      ['PATCH', `/api/direcciones/${VALORES_PARAM.id}/radio`, {}],
      ['GET', '/api/usuarios?email=a', undefined],
    ];
    for (const [metodo, ruta, body] of casos) {
      const res = await app.request(ruta, {
        method: metodo,
        headers: body ? { 'content-type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : undefined,
      });
      assert.equal(res.status, 401, `${metodo} ${ruta}`);
      const json = (await res.json()) as Record<string, unknown>;
      assert.equal(json.error, 'No autorizado');
      assert.equal('issues' in json || 'success' in json, false, 'no expone el schema');
    }
  });

  it('TC-GUARD-03: las rutas /api/admin/* responden 403 a quien no es admin', async () => {
    const admin = rutas.filter((r) => r.ruta.startsWith('/api/admin'));
    assert.ok(admin.length >= 8, `se esperaban las 8 rutas de admin, hay ${admin.length}`);
    for (const { metodo, ruta } of admin) {
      const res = await pedir(metodo, ruta, null);
      assert.equal(res.status, 403, `${metodo} ${ruta}`);
    }
    // Variantes de path que no tienen que esquivar el guard.
    for (const ruta of ['/api/admin/metrics/', '/api/admin//metrics', '/api/admin/backups/download?filename=../x']) {
      const res = await app.request(ruta);
      assert.ok([403, 404].includes(res.status), `${ruta} -> ${res.status}`);
    }
  });

  it('TC-GUARD-04: los endpoints de cuenta de Better Auth exigen sesion', async () => {
    for (const [metodo, ruta] of AUTH_PRIVADAS) {
      for (const [caso, cookie] of COOKIES_FALSAS) {
        const res = await pedir(metodo, ruta, cookie);
        assert.equal(res.status, 401, `${metodo} ${ruta} [${caso}]`);
      }
    }
    const sesion = await pedir('GET', '/api/auth/get-session', 'better-auth.session_token=tokeninventado');
    assert.equal(sesion.status, 200);
    assert.equal(await sesion.text(), 'null');
  });

  it('TC-GUARD-05: las respuestas privadas salen con Cache-Control: private, no-store', async () => {
    const muestras: Array<[string, string]> = [
      ['GET', '/api/listas'],
      ['GET', '/api/direcciones'],
      ['GET', '/api/admin/metrics'],
      ['GET', '/api/auth/get-session'],
      ['POST', '/api/support'],
    ];
    for (const [metodo, ruta] of muestras) {
      const res = await pedir(metodo, ruta, null);
      assert.equal(res.headers.get('cache-control'), 'private, no-store', `${metodo} ${ruta}`);
    }
  });
});
