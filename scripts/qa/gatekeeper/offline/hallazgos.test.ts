// scripts/qa/gatekeeper/offline/hallazgos.test.ts
// =============================================================================
// Regresiones de la auditoria del Gatekeeper (GK-02 a GK-06) y variantes de
// bypass que no estaban cubiertas por rutas.test.ts.
// =============================================================================

import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Hono } from 'hono';
import {
  limpiarRutaParaAnalitica,
  redactarMetadata,
  redactarSecretosEnTexto,
} from '../../../../app/_lib/utils/redactarSecretos';
import { origenesCors, origenesLocales } from '../../../../app/_lib/origenes';
import { EDAD_MAXIMA_SESION_ADMIN_MS, evaluarAccesoAdmin } from '../../../../app/_lib/auth-hardening';

let app: Hono;
const eventos = () => (globalThis as Record<string, unknown>).__eventosAnaliticos as Array<{ metadata?: unknown }>;

before(async () => {
  ({ app } = await import('../../../../app/api/[[...route]]/app'));
});

describe('GK-02: secretos fuera de analiticas', () => {
  it('TC-LEAK-01: el page view de /restablecer-contrasena no lleva el token', () => {
    const ruta = limpiarRutaParaAnalitica('/restablecer-contrasena?token=AbC123xyz.firma&error=');
    assert.equal(ruta, '/restablecer-contrasena?token=REDACTADO&error=');
    assert.equal(
      limpiarRutaParaAnalitica('/buscar?q=leche&categoria=lacteos'),
      '/buscar?q=leche&categoria=lacteos',
      'los parametros normales no se tocan',
    );
    assert.equal(limpiarRutaParaAnalitica('/x?Token=a&CODE=b'), '/x?Token=REDACTADO&CODE=REDACTADO');
    assert.equal(
      redactarSecretosEnTexto('Error 400 en https://app/api/auth/reset-password/tok3n?callbackURL=/r'),
      'Error 400 en https://app/api/auth/reset-password/REDACTADO?callbackURL=/r',
    );
  });

  it('TC-LEAK-02: POST /api/analytics redacta en el servidor aunque el cliente mande el token', async () => {
    eventos().length = 0;
    const res = await app.request('/api/analytics', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'http://localhost:3000' },
      body: JSON.stringify({
        eventName: 'page_view',
        metadata: { path: '/restablecer-contrasena?token=secreto-de-reset-123', token: 'x', anidado: { url: '/a?otp=999999' } },
      }),
    });
    assert.equal(res.status, 200);
    const guardado = JSON.stringify(eventos().at(-1));
    assert.ok(!guardado.includes('secreto-de-reset-123'), `se guardo el token: ${guardado}`);
    assert.ok(!guardado.includes('999999'), `se guardo el otp: ${guardado}`);
    assert.ok(guardado.includes('token=REDACTADO'));
  });

  it('TC-LEAK-03: redactarMetadata no rompe tipos ni valores no-string', () => {
    const entrada = { n: 1, b: true, nada: null, lista: ['/a?token=t', 2], password: 'hunter2' };
    assert.deepEqual(redactarMetadata(entrada), {
      n: 1, b: true, nada: null, lista: ['/a?token=REDACTADO', 2], password: 'REDACTADO',
    });
  });
});

describe('GK-03: origenes de confianza', () => {
  it('TC-ORIG-01: en produccion localhost no es origen confiable (Better Auth)', () => {
    assert.deepEqual(origenesLocales('production'), []);
    assert.ok(origenesLocales('development').includes('http://localhost:3000'));
  });

  it('TC-ORIG-02: en produccion CORS no habilita localhost con credenciales', async () => {
    const permitidos = origenesCors({ appUrl: 'https://lalista.app/', nodeEnv: 'production', vercelUrl: 'lalista-abc.vercel.app' });
    assert.ok(permitidos.has('https://lalista.app'));
    assert.ok(permitidos.has('https://lalista-abc.vercel.app'));
    assert.ok(!permitidos.has('http://localhost:3000'));

    // Contra la app real, simulando produccion.
    const previo = process.env.NODE_ENV;
    const previaUrl = process.env.NEXT_PUBLIC_APP_URL;
    Object.assign(process.env, { NODE_ENV: 'production', NEXT_PUBLIC_APP_URL: 'https://lalista.app' });
    try {
      for (const origen of ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://evil.example', 'null']) {
        const res = await app.request('/api/listas', { headers: { origin: origen } });
        assert.notEqual(res.headers.get('access-control-allow-origin'), origen, `CORS acepta ${origen}`);
      }
      const ok = await app.request('/api/listas', { headers: { origin: 'https://lalista.app' } });
      assert.equal(ok.headers.get('access-control-allow-origin'), 'https://lalista.app');
    } finally {
      Object.assign(process.env, { NODE_ENV: previo, NEXT_PUBLIC_APP_URL: previaUrl });
    }
  });
});

describe('GK-04: sesiones de admin con edad maxima', () => {
  const ahora = Date.UTC(2026, 9, 16, 12);
  const sesion = (role: string, haceMs: number) => ({ user: { role }, session: { createdAt: new Date(ahora - haceMs) } });

  it('TC-VERT-05: admin con sesion reciente entra; vieja o con fecha rara tiene que reautenticar', () => {
    assert.equal(evaluarAccesoAdmin(sesion('admin', 60_000), ahora), 'ok');
    assert.equal(evaluarAccesoAdmin(sesion('admin', EDAD_MAXIMA_SESION_ADMIN_MS + 1), ahora), 'reautenticar');
    assert.equal(evaluarAccesoAdmin(sesion('admin', -60_000), ahora), 'reautenticar', 'createdAt en el futuro');
    assert.equal(evaluarAccesoAdmin({ user: { role: 'admin' }, session: { createdAt: 'basura' } }, ahora), 'reautenticar');
  });

  it('TC-VERT-06: el rol se compara exacto (sin mayusculas, espacios ni null)', () => {
    for (const role of ['user', 'Admin', 'ADMIN', 'admin ', ' admin', 'administrator', '']) {
      assert.equal(evaluarAccesoAdmin(sesion(role, 1000), ahora), 'no-admin', JSON.stringify(role));
    }
    assert.equal(evaluarAccesoAdmin({ user: { role: null }, session: { createdAt: new Date(ahora) } }, ahora), 'no-admin');
    assert.equal(evaluarAccesoAdmin(null, ahora), 'sin-sesion');
  });
});

describe('Bypass por variantes de ruta, metodo y headers', () => {
  it('TC-GUARD-06: ninguna variante llega a un handler privado sin sesion', async () => {
    const casos: Array<[string, string, Record<string, string>?]> = [
      ['GET', '/api/%61dmin/metrics'],
      ['GET', '/api/admin/%6detrics'],
      ['GET', '/api/ADMIN/metrics'],
      ['GET', '/api/./admin/metrics'],
      ['GET', '/api/listas/../admin/metrics'],
      ['GET', '/api/admin;/metrics'],
      ['GET', '/api/listas%2F..%2Fadmin%2Fmetrics'],
      ['HEAD', '/api/admin/metrics'],
      ['HEAD', '/api/listas'],
      ['GET', '/api/listas/'],
      ['GET', '/api//listas'],
      ['GET', '/api/LISTAS'],
      ['GET', '/api/usuarios/?email=aaaaa'],
      // CVE-2025-29927 (bypass de middleware de Next via este header).
      ['GET', '/api/admin/metrics', { 'x-middleware-subrequest': 'middleware:middleware:middleware:middleware:middleware' }],
      ['GET', '/api/listas', { 'x-middleware-subrequest': 'proxy:proxy:proxy:proxy:proxy' }],
      // Better Auth no acepta Bearer sin el plugin bearer.
      ['GET', '/api/listas', { authorization: 'Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiJ4In0.' }],
      ['GET', '/api/admin/metrics', { authorization: 'Bearer x.y.z' }],
      // Headers que un proxy mal configurado podria usar para reescribir la ruta.
      ['GET', '/api/listas', { 'x-original-url': '/api/productos', 'x-rewrite-url': '/api/productos' }],
    ];
    const fallas: string[] = [];
    for (const [metodo, ruta, headers] of casos) {
      const res = await app.request(ruta, { method: metodo, headers });
      if (![401, 403, 404].includes(res.status)) fallas.push(`${metodo} ${ruta} ${JSON.stringify(headers ?? {})} -> ${res.status}`);
    }
    assert.deepEqual(fallas, [], fallas.join('\n'));
  });
});
