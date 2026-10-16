// scripts/qa/gatekeeper/blackbox.test.mjs
// =============================================================================
// Suite de caja negra del Gatekeeper contra un deploy real (preview o local)
// =============================================================================
// Ataca la app como lo haria un usuario malicioso con una cuenta comun:
// bypass de autenticacion, IDOR horizontal entre dos usuarios, escalacion
// vertical a admin, sesiones y recuperacion de clave.
//
//   QA_BASE_URL=https://lalista-git-xxx.vercel.app \
//   QA_A_EMAIL=... QA_A_PASSWORD=... \
//   QA_B_EMAIL=... QA_B_PASSWORD=... \
//   [QA_ADMIN_EMAIL=... QA_ADMIN_PASSWORD=...] \
//   npm run test:gatekeeper:remoto
//
// Requisitos: A y B son cuentas VERIFICADAS con rol "user", creadas para QA.
// Correr contra un preview o staging, no contra produccion: la suite crea y
// borra listas y direcciones de B, y pide un mail de reset para A.
//
// Opcionales (apagados por defecto porque escriben o bloquean):
//   QA_REGISTRO=1      registra cuentas basura (qa+<random>@example.com)
//   QA_FUERZA_BRUTA=1  6 logins fallidos contra un email inexistente
//   QA_RPM=40          requests por minuto (el limite global es 50/min/IP)
// =============================================================================

import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const BASE = (process.env.QA_BASE_URL ?? '').replace(/\/$/, '');
const A = { email: process.env.QA_A_EMAIL, password: process.env.QA_A_PASSWORD };
const B = { email: process.env.QA_B_EMAIL, password: process.env.QA_B_PASSWORD };
const ADMIN = { email: process.env.QA_ADMIN_EMAIL, password: process.env.QA_ADMIN_PASSWORD };
const HAY_ADMIN = Boolean(ADMIN.email && ADMIN.password);
const FALTAN = !BASE || !A.email || !A.password || !B.email || !B.password;
const SKIP = FALTAN ? 'faltan QA_BASE_URL / QA_A_* / QA_B_*' : false;
const ORIGEN_MALO = 'https://evil.example';

// -----------------------------------------------------------------------------
// Cliente HTTP con cookie jar y ritmo controlado
// -----------------------------------------------------------------------------
const intervaloMs = 60_000 / Number(process.env.QA_RPM ?? 40);
let ultimoRequest = 0;
let ultimoLogin = 0;
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

async function ritmo(esLogin) {
  const espera = Math.max(0, ultimoRequest + intervaloMs - Date.now());
  if (espera) await dormir(espera);
  // Better Auth permite 3 /sign-in cada 10 s por IP.
  if (esLogin) {
    const esperaLogin = Math.max(0, ultimoLogin + 3_500 - Date.now());
    if (esperaLogin) await dormir(esperaLogin);
    ultimoLogin = Date.now();
  }
  ultimoRequest = Date.now();
}

class Cliente {
  constructor(nombre) {
    this.nombre = nombre;
    this.jar = new Map();
    this.usuario = null;
  }

  clonar(nombre) {
    const c = new Cliente(nombre);
    c.jar = new Map(this.jar);
    c.usuario = this.usuario;
    return c;
  }

  cookie() {
    return [...this.jar].map(([k, v]) => `${k}=${v}`).join('; ');
  }

  async pedir(metodo, ruta, { body, origin = BASE, headers = {}, crudo = false } = {}) {
    await ritmo(ruta.startsWith('/api/auth/sign-in'));
    const h = { origin, ...headers };
    if (this.jar.size) h.cookie = this.cookie();
    if (body !== undefined) h['content-type'] = 'application/json';
    const inicio = performance.now();
    const res = await fetch(BASE + ruta, {
      method: metodo,
      headers: h,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      redirect: 'manual',
    });
    const ms = performance.now() - inicio;
    for (const linea of res.headers.getSetCookie()) {
      const [par] = linea.split(';');
      const i = par.indexOf('=');
      const k = par.slice(0, i).trim();
      const v = par.slice(i + 1).trim();
      if (!v || /max-age=0/i.test(linea)) this.jar.delete(k);
      else this.jar.set(k, v);
    }
    const texto = crudo ? '' : await res.text();
    let json = null;
    try {
      json = texto ? JSON.parse(texto) : null;
    } catch {
      json = null;
    }
    return { status: res.status, json, headers: res.headers, setCookies: res.headers.getSetCookie(), ms };
  }

  async login({ email, password }) {
    const r = await this.pedir('POST', '/api/auth/sign-in/email', { body: { email, password } });
    assert.equal(r.status, 200, `login de ${this.nombre} fallo (${r.status} ${r.json?.code ?? ''})`);
    this.usuario = r.json.user;
    return r;
  }
}

const anonimo = () => new Cliente('anonimo');
const codigo = (r) => r.json?.code;

// -----------------------------------------------------------------------------
// Estado compartido: A ataca recursos de B
// -----------------------------------------------------------------------------
const a = new Cliente('A');
const b = new Cliente('B');
const admin = new Cliente('admin');
let respuestaLoginA;
let producto; // { id, nombre } de un producto real del catalogo
let listaB; // id de una lista de B con un item
let direccionB; // { id, radio } de una direccion de B
const limpieza = [];

function itemDePrueba() {
  return {
    item_id: randomUUID(),
    cantidad: 1,
    comprado: false,
    nombre_personalizado: null,
    opciones: [{ id_producto: producto.id, descripcion: producto.nombre, imagen: null, es_principal: true, cantidad_opcion: 1 }],
  };
}

describe('Gatekeeper (caja negra)', { skip: SKIP }, () => {
  before(async () => {
    respuestaLoginA = await a.login(A);
    await b.login(B);
    if (HAY_ADMIN) await admin.login(ADMIN);
    assert.notEqual(a.usuario.id, b.usuario.id, 'A y B tienen que ser cuentas distintas');
    assert.equal(a.usuario.role ?? 'user', 'user', 'A tiene que tener rol user');

    const cat = await anonimo().pedir('GET', '/api/catalogo?search=leche&limit=1');
    assert.equal(cat.status, 200, 'no se pudo leer el catalogo');
    producto = cat.json.productos[0];
    assert.ok(producto?.id, 'el catalogo no devolvio productos');

    const nueva = await b.pedir('POST', '/api/listas', { body: { nombre: 'QA IDOR de B', items: [itemDePrueba()] } });
    assert.equal(nueva.status, 201, `B no pudo crear la lista (${nueva.status}: ${JSON.stringify(nueva.json)})`);
    listaB = nueva.json.id;
    limpieza.push(() => b.pedir('DELETE', `/api/listas/${listaB}`));

    const dir = await b.pedir('POST', '/api/direcciones', {
      body: { nombre_lugar: 'QA IDOR', latitud: -34.6537, longitud: -58.6197, radio_busqueda: 2 },
    });
    if (dir.status === 201) {
      const d = Array.isArray(dir.json.direccion) ? dir.json.direccion[0] : dir.json.direccion;
      direccionB = { id: d?.id, radio: d?.radio_busqueda ?? 2 };
      limpieza.push(() => b.pedir('DELETE', `/api/direcciones/${direccionB.id}`));
    }
  });

  after(async () => {
    for (const tarea of limpieza.reverse()) await tarea().catch(() => {});
  });

  // ---------------------------------------------------------------------------
  describe('Autenticacion core', () => {
    it('TC-LOGIN-01: clave incorrecta y email inexistente responden igual', async () => {
      const c = anonimo();
      const mala = await c.pedir('POST', '/api/auth/sign-in/email', { body: { email: A.email, password: 'Incorrecta9' } });
      const nadie = await c.pedir('POST', '/api/auth/sign-in/email', {
        body: { email: `noexiste+${randomUUID().slice(0, 8)}@example.com`, password: 'Incorrecta9' },
      });
      assert.equal(mala.status, 401);
      assert.equal(nadie.status, 401);
      assert.deepEqual(mala.json, nadie.json);
    });

    it('TC-LOGIN-02: cookie de sesion __Secure-, HttpOnly, Secure, SameSite=Lax', () => {
      const cookie = respuestaLoginA.setCookies.find((c) => /session_token=/.test(c));
      assert.ok(cookie, 'el login no seteo cookie de sesion');
      if (BASE.startsWith('https://')) assert.match(cookie, /^__Secure-/);
      assert.match(cookie, /;\s*HttpOnly/i);
      if (BASE.startsWith('https://')) assert.match(cookie, /;\s*Secure/i);
      assert.match(cookie, /;\s*SameSite=Lax/i);
      assert.equal(respuestaLoginA.json.token?.length > 0, true);
    });

    it('TC-LOGIN-03: bloqueo por cuenta tras 5 intentos (QA_FUERZA_BRUTA=1)', { skip: !process.env.QA_FUERZA_BRUTA && 'QA_FUERZA_BRUTA no seteado' }, async () => {
      const c = anonimo();
      const email = `bruta+${randomUUID().slice(0, 8)}@example.com`;
      let ultima;
      for (let i = 1; i <= 6; i++) {
        ultima = await c.pedir('POST', '/api/auth/sign-in/email', { body: { email, password: `Intento${i}x` } });
      }
      assert.equal(ultima.status, 429);
      assert.equal(codigo(ultima), 'TOO_MANY_LOGIN_ATTEMPTS', 'el 429 tiene que venir del limite por cuenta');
      assert.ok(Number(ultima.headers.get('retry-after')) > 0);
    });

    it('TC-REG-01: clave debil rechazada por el servidor (QA_REGISTRO=1)', { skip: !process.env.QA_REGISTRO && 'QA_REGISTRO no seteado' }, async () => {
      const r = await anonimo().pedir('POST', '/api/auth/sign-up/email', {
        body: { email: `qa+${randomUUID().slice(0, 8)}@example.com`, password: 'aaaaaaaa', name: 'QA Debil' },
      });
      assert.equal(r.status, 400);
      assert.equal(codigo(r), 'PASSWORD_TOO_WEAK');
    });

    it('TC-REG-04: email ya registrado devuelve lo mismo que uno nuevo (QA_REGISTRO=1)', { skip: !process.env.QA_REGISTRO && 'QA_REGISTRO no seteado' }, async () => {
      const c = anonimo();
      const nuevo = await c.pedir('POST', '/api/auth/sign-up/email', {
        body: { email: `qa+${randomUUID().slice(0, 8)}@example.com`, password: 'ClaveQa123', name: 'QA Nuevo' },
      });
      await dormir(10_000); // regla de Better Auth: 3 sign-up cada 10 s por IP
      const dup = await c.pedir('POST', '/api/auth/sign-up/email', {
        body: { email: A.email, password: 'ClaveQa123', name: 'QA Nuevo' },
      });
      assert.equal(dup.status, nuevo.status);
      assert.equal(dup.json.token, null);
      assert.deepEqual(Object.keys(dup.json.user).sort(), Object.keys(nuevo.json.user).sort());
      // El mail sale en segundo plano: los tiempos no deberian delatar nada.
      const dif = Math.abs(nuevo.ms - dup.ms);
      assert.ok(dif < 1500, `diferencia de tiempo sospechosa: nuevo ${nuevo.ms.toFixed(0)} ms, existente ${dup.ms.toFixed(0)} ms`);
    });

    it('TC-RST-01: reset con email existente e inexistente responde igual', async () => {
      const c = anonimo();
      const existe = await c.pedir('POST', '/api/auth/request-password-reset', {
        body: { email: A.email, redirectTo: '/restablecer-contrasena' },
      });
      const noExiste = await c.pedir('POST', '/api/auth/request-password-reset', {
        body: { email: `nadie+${randomUUID().slice(0, 8)}@example.com`, redirectTo: '/restablecer-contrasena' },
      });
      assert.equal(existe.status, 200);
      assert.deepEqual(noExiste.json, existe.json);
      const dif = Math.abs(existe.ms - noExiste.ms);
      assert.ok(dif < 1500, `diferencia de tiempo sospechosa: existe ${existe.ms.toFixed(0)} ms, no existe ${noExiste.ms.toFixed(0)} ms`);
    });

    it('TC-RST-05: redirectTo a otro dominio se rechaza', async () => {
      const r = await anonimo().pedir('POST', '/api/auth/request-password-reset', {
        body: { email: `nadie+${randomUUID().slice(0, 8)}@example.com`, redirectTo: `${ORIGEN_MALO}/robar` },
      });
      assert.equal(r.status, 403);
    });

    it('TC-RST-07: un token de reset inventado no sirve', async () => {
      const r = await anonimo().pedir('POST', '/api/auth/reset-password', {
        body: { token: 'TokenInventado123456789012', newPassword: 'NuevaClave123' },
      });
      assert.equal(r.status, 400);
      assert.equal(codigo(r), 'INVALID_TOKEN');
    });
  });

  // ---------------------------------------------------------------------------
  describe('Sesiones', () => {
    it('TC-SES-01: despues del logout, la cookie copiada no sirve', async () => {
      const temporal = new Cliente('A-temporal');
      await temporal.login(A);
      const copia = temporal.clonar('A-copia');
      assert.equal((await copia.pedir('GET', '/api/listas')).status, 200);
      const salida = await temporal.pedir('POST', '/api/auth/sign-out', { body: {} });
      assert.equal(salida.status, 200);
      assert.equal((await copia.pedir('GET', '/api/listas')).status, 401);
    });

    it('TC-SES-02: cookie con firma alterada -> 401', async () => {
      const falsa = a.clonar('A-alterada');
      const [nombre, valor] = [...falsa.jar].find(([k]) => k.includes('session_token'));
      const [token, firma] = decodeURIComponent(valor).split('.');
      falsa.jar.set(nombre, encodeURIComponent(`${token}.${firma[0] === 'A' ? 'B' : 'A'}${firma.slice(1)}`));
      assert.equal((await falsa.pedir('GET', '/api/listas')).status, 401);
    });

    it('TC-SES-03: respuestas con datos del usuario no se cachean', async () => {
      const r = await a.pedir('GET', '/api/listas');
      assert.equal(r.status, 200);
      assert.equal(r.headers.get('cache-control'), 'private, no-store');
    });
  });

  // ---------------------------------------------------------------------------
  describe('Bypass de autenticacion', () => {
    const PRIVADAS = [
      ['GET', '/api/listas'],
      ['POST', '/api/listas'],
      ['GET', `/api/listas/${randomUUID()}/items`],
      ['PATCH', `/api/listas/${randomUUID()}`],
      ['DELETE', `/api/listas/${randomUUID()}`],
      ['GET', `/api/listas/${randomUUID()}/miembros`],
      ['POST', `/api/listas/${randomUUID()}/miembros`],
      ['PATCH', `/api/listas/${randomUUID()}/miembros/x`],
      ['DELETE', `/api/listas/${randomUUID()}/miembros/x`],
      ['GET', '/api/direcciones'],
      ['POST', '/api/direcciones'],
      ['PATCH', `/api/direcciones/${randomUUID()}/activar`],
      ['PATCH', `/api/direcciones/${randomUUID()}/radio`],
      ['DELETE', `/api/direcciones/${randomUUID()}`],
      ['GET', '/api/usuarios?email=gmail.com'],
      ['POST', '/api/support'],
    ];

    it('TC-GUARD-01: todas las rutas privadas responden 401 sin cookie', async () => {
      const fallas = [];
      for (const [metodo, ruta] of PRIVADAS) {
        const r = await anonimo().pedir(metodo, ruta, { body: ['POST', 'PATCH'].includes(metodo) ? {} : undefined });
        if (r.status !== 401) fallas.push(`${metodo} ${ruta} -> ${r.status}`);
      }
      assert.deepEqual(fallas, []);
    });

    it('TC-GUARD-02: token vacio, basura o en header Authorization -> 401', async () => {
      for (const headers of [
        { cookie: 'better-auth.session_token=' },
        { cookie: '__Secure-better-auth.session_token=abc.def' },
        { authorization: `Bearer ${respuestaLoginA.json.token}` },
      ]) {
        const r = await anonimo().pedir('GET', '/api/listas', { headers });
        assert.equal(r.status, 401, JSON.stringify(headers).slice(0, 60));
      }
    });

    it('TC-GUARD-03: /admin del front redirige sin sesion de admin (proxy.ts)', async () => {
      const sinSesion = await anonimo().pedir('GET', '/admin/metrics', { crudo: true });
      assert.ok([307, 308].includes(sinSesion.status), `anonimo -> ${sinSesion.status}`);
      assert.match(sinSesion.headers.get('location') ?? '', /\/login$/);
      const comun = await a.pedir('GET', '/admin/metrics', { crudo: true });
      assert.ok([307, 308].includes(comun.status), `usuario comun -> ${comun.status}`);
      assert.equal(new URL(comun.headers.get('location'), BASE).pathname, '/');
    });
  });

  // ---------------------------------------------------------------------------
  describe('Escalacion vertical (user -> admin)', () => {
    const ADMIN_API = [
      '/api/admin/metrics?metricName=page_view',
      '/api/admin/metrics/ranking-productos',
      '/api/admin/metrics/ranking-producto-busqueda?keyword=leche',
      '/api/admin/metrics/chart-summary',
      '/api/admin/support-messages',
      '/api/admin/backups',
      '/api/admin/backups/download?filename=x.sql',
    ];

    it('TC-VERT-01: un usuario comun recibe 403 en toda la API de admin', async () => {
      for (const ruta of ADMIN_API) {
        const r = await a.pedir('GET', ruta);
        assert.equal(r.status, 403, ruta);
      }
      const patch = await a.pedir('PATCH', '/api/admin/support-messages/1/status', { body: { status: 'resolved' } });
      assert.equal(patch.status, 403);
    });

    it('TC-VERT-02: el rol no se puede escribir por /update-user (sin escalar de verdad)', async () => {
      // Se manda "user" y no "admin": en un deploy vulnerable la escritura se
      // acepta (200) pero la cuenta de QA no termina siendo admin.
      const r = await a.pedir('POST', '/api/auth/update-user', { body: { role: 'user' } });
      assert.equal(r.status, 400, 'VULNERABLE: /update-user acepta el campo role (ver hallazgo GK-01)');
      assert.equal(codigo(r), 'FIELD_NOT_ALLOWED');
    });

    it('TC-VERT-03: variantes de ruta y metodo no esquivan el guard de admin', async () => {
      for (const ruta of ['/api/admin/metrics/?metricName=x', '/api/admin//metrics?metricName=x', '/api/Admin/metrics?metricName=x']) {
        const r = await a.pedir('GET', ruta);
        assert.ok([403, 404].includes(r.status), `${ruta} -> ${r.status}`);
      }
      const head = await a.pedir('HEAD', '/api/admin/support-messages', { crudo: true });
      assert.ok([403, 404, 405].includes(head.status), `HEAD -> ${head.status}`);
    });

    it('TC-VERT-04: control positivo, el admin si entra', { skip: !HAY_ADMIN && 'sin QA_ADMIN_*' }, async () => {
      const r = await admin.pedir('GET', '/api/admin/metrics?metricName=page_view&limit=1');
      assert.equal(r.status, 200);
      const panel = await admin.pedir('GET', '/admin/metrics', { crudo: true });
      assert.equal(panel.status, 200);
    });
  });

  // ---------------------------------------------------------------------------
  describe('Escalacion horizontal (IDOR: A sobre recursos de B)', () => {
    it('TC-IDOR-01: A no ve los items ni el nombre de la lista de B', async () => {
      const control = await b.pedir('GET', `/api/listas/${listaB}/items`);
      assert.equal(control.json.items.length, 1, 'control: B ve su item');
      const r = await a.pedir('GET', `/api/listas/${listaB}/items`);
      assert.ok([200, 403, 404].includes(r.status));
      if (r.status === 200) {
        assert.deepEqual(r.json.items, [], 'FUGA: A ve items de B');
        assert.equal(r.json.nombre, null, 'FUGA: A ve el nombre de la lista de B');
      }
    });

    it('TC-IDOR-02: A no puede sobrescribir ni renombrar la lista de B', async () => {
      const r = await a.pedir('PATCH', `/api/listas/${listaB}`, { body: { nombre: 'pwned', items: [itemDePrueba(), itemDePrueba()] } });
      assert.equal(r.status, 403);
      const control = await b.pedir('GET', `/api/listas/${listaB}/items`);
      assert.equal(control.json.items.length, 1);
      assert.equal(control.json.nombre, 'QA IDOR de B');
    });

    it('TC-IDOR-03: A no puede borrar la lista de B', async (t) => {
      const r = await a.pedir('DELETE', `/api/listas/${listaB}`);
      // Lo que importa es el efecto: abandonar_lista sobre una lista ajena no
      // tiene que tocar nada. El status esperado es 404 (not_found).
      t.diagnostic(`DELETE ajeno -> ${r.status} ${JSON.stringify(r.json)}`);
      assert.notEqual(r.status, 500, 'error interno: revisar abandonar_lista');
      const listas = await b.pedir('GET', '/api/listas');
      assert.ok(listas.json.listas.some((l) => l.id === listaB), 'la lista de B desaparecio');
      const items = await b.pedir('GET', `/api/listas/${listaB}/items`);
      assert.equal(items.json.items.length, 1);
    });

    it('TC-IDOR-04: A no puede sumarse a la lista de B ni ver/cambiar sus miembros', async () => {
      const unirse = await a.pedir('POST', `/api/listas/${listaB}/miembros`, { body: { userId: a.usuario.id, rol: 'editor' } });
      assert.equal(unirse.status, 403);
      // get_miembros_lista devuelve 0 filas (no NULL) si no sos el dueño, asi
      // que hoy la API responde 200 con []. Ver hallazgo GK-13.
      const ver = await a.pedir('GET', `/api/listas/${listaB}/miembros`);
      assert.ok(ver.status === 403 || (ver.status === 200 && ver.json.miembros.length === 0), 'FUGA: A ve los miembros de B');
      const rol = await a.pedir('PATCH', `/api/listas/${listaB}/miembros/${a.usuario.id}`, { body: { rol: 'editor' } });
      assert.equal(rol.status, 403);
      const echar = await a.pedir('DELETE', `/api/listas/${listaB}/miembros/${b.usuario.id}`);
      assert.equal(echar.status, 403);
      const miembros = await b.pedir('GET', `/api/listas/${listaB}/miembros`);
      assert.equal(miembros.json.miembros.some((m) => m.id === a.usuario.id), false);
    });

    it('TC-IDOR-05: como viewer invitado, A no edita, no renombra ni se sube a editor', async () => {
      const invitar = await b.pedir('POST', `/api/listas/${listaB}/miembros`, { body: { userId: a.usuario.id, rol: 'viewer' } });
      assert.equal(invitar.status, 200);
      limpieza.push(() => b.pedir('DELETE', `/api/listas/${listaB}/miembros/${a.usuario.id}`));

      const ver = await a.pedir('GET', `/api/listas/${listaB}/items`);
      assert.equal(ver.json.items.length, 1, 'control: el viewer ve la lista');

      const editar = await a.pedir('PATCH', `/api/listas/${listaB}`, { body: { items: [itemDePrueba(), itemDePrueba()] } });
      assert.equal(editar.status, 403, 'un viewer pudo modificar la lista');

      const subir = await a.pedir('PATCH', `/api/listas/${listaB}/miembros/${a.usuario.id}`, { body: { rol: 'editor' } });
      assert.equal(subir.status, 403, 'un viewer se cambio el rol');

      const invitarOtro = await a.pedir('POST', `/api/listas/${listaB}/miembros`, { body: { userId: b.usuario.id, rol: 'editor' } });
      assert.equal(invitarOtro.status, 403, 'un miembro no-owner pudo compartir');

      const verMiembros = await a.pedir('GET', `/api/listas/${listaB}/miembros`);
      assert.ok(
        verMiembros.status === 403 || (verMiembros.status === 200 && verMiembros.json.miembros.length === 0),
        'un miembro no-owner ve los emails del resto',
      );

      const control = await b.pedir('GET', `/api/listas/${listaB}/items`);
      assert.equal(control.json.items.length, 1);
    });

    it('TC-IDOR-06: A no puede activar, cambiar ni borrar direcciones de B', async (t) => {
      if (!direccionB?.id) return t.skip('B llego al limite de direcciones o la respuesta cambio de forma');
      // Las RPC filtran por p_user_id; si no lo hicieran, la respuesta puede
      // ser 200 igual. Por eso se compara el estado de B antes y despues.
      const antes = await b.pedir('GET', '/api/direcciones');
      const ataques = [
        await a.pedir('PATCH', `/api/direcciones/${direccionB.id}/activar`),
        await a.pedir('PATCH', `/api/direcciones/${direccionB.id}/radio`, { body: { radio_busqueda: 9 } }),
        await a.pedir('DELETE', `/api/direcciones/${direccionB.id}`),
      ];
      t.diagnostic(`status de los ataques: ${ataques.map((r) => r.status).join(', ')}`);
      const despues = await b.pedir('GET', '/api/direcciones');
      assert.deepEqual(despues.json.direcciones, antes.json.direcciones, 'A modifico direcciones de B');
      const d = despues.json.direcciones.find((x) => x.id === direccionB.id);
      assert.ok(d, 'A borro una direccion de B');
      assert.equal(Number(d.radio_busqueda), direccionB.radio, 'A cambio el radio de una direccion de B');
      const propias = await a.pedir('GET', '/api/direcciones');
      assert.equal(propias.json.direcciones.some((x) => x.id === direccionB.id), false);
    });

    it('TC-IDOR-07: campos de dueño en el body se ignoran (mass assignment)', async () => {
      const r = await a.pedir('POST', '/api/listas', {
        body: { nombre: 'QA mass assignment', owner_id: b.usuario.id, user_id: b.usuario.id, p_user_id: b.usuario.id, items: [itemDePrueba()] },
      });
      if (r.status === 403) return; // A llego al limite de listas
      assert.equal(r.status, 201);
      limpieza.push(() => a.pedir('DELETE', `/api/listas/${r.json.id}`));
      const deB = await b.pedir('GET', '/api/listas');
      assert.equal(deB.json.listas.some((l) => l.id === r.json.id), false, 'la lista quedo a nombre de B');
    });

    it('TC-IDOR-08: la busqueda de usuarios no expone emails completos ni roles', async () => {
      const r = await a.pedir('GET', `/api/usuarios?email=${encodeURIComponent(B.email.slice(0, 6))}`);
      assert.equal(r.status, 200);
      for (const u of r.json.usuarios) {
        assert.match(u.email, /\*{4}@/, 'email sin enmascarar');
        assert.equal('role' in u, false);
      }
    });
  });

  // ---------------------------------------------------------------------------
  describe('CSRF / origen', () => {
    it('TC-CSRF-01: Better Auth rechaza mutaciones con Origin ajeno', async () => {
      const r = await a.pedir('POST', '/api/auth/update-user', { body: { name: 'Nombre Csrf' }, origin: ORIGEN_MALO });
      assert.equal(r.status, 403);
    });

    it('TC-CSRF-02: CORS no habilita origenes ajenos con credenciales', async () => {
      const r = await anonimo().pedir('OPTIONS', '/api/listas', {
        origin: ORIGEN_MALO,
        headers: { 'access-control-request-method': 'POST', 'access-control-request-headers': 'content-type' },
        crudo: true,
      });
      assert.notEqual(r.headers.get('access-control-allow-origin'), ORIGEN_MALO);
      assert.notEqual(r.headers.get('access-control-allow-origin'), '*');
    });
  });
});
