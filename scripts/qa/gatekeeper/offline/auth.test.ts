// scripts/qa/gatekeeper/offline/auth.test.ts
// =============================================================================
// Suite offline de autenticacion (registro, login, sesiones, reset, privilegios)
// =============================================================================
// Monta Better Auth 1.6 real sobre el adapter en memoria, con las MISMAS piezas
// de endurecimiento que usa produccion (camposAdicionalesUsuario y
// crearHooksBefore de app/_lib/auth-hardening.ts) y la misma configuracion de
// emailAndPassword / emailVerification que app/_lib/auth.ts. Los requests
// pasan por auth.handler(), o sea por el mismo camino HTTP que /api/auth/*.
//
// Los IDs (TC-REG-xx, TC-LOGIN-xx...) son los del informe de auditoria.
// =============================================================================

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import {
  camposAdicionalesUsuario,
  crearHooksBefore,
  type LimitadorLogin,
} from '../../../../app/_lib/auth-hardening';

const BASE = 'http://localhost:3000';
const COOKIE_SESION = '__Secure-better-auth.session_token';
const CLAVE_OK = 'ClaveSegura1';

type Correo = { tipo: 'verificacion' | 'reset'; to: string; url: string; token: string };
type Fila = Record<string, unknown>;
type Db = { user: Fila[]; session: Fila[]; account: Fila[]; verification: Fila[] };
type Jar = Map<string, string>;

function crearEntorno(opciones: { limitador?: LimitadorLogin; sinHardening?: boolean } = {}) {
  const db: Db = { user: [], session: [], account: [], verification: [] };
  const correos: Correo[] = [];

  const auth = betterAuth({
    baseURL: BASE,
    secret: 'qa-gatekeeper-secret-no-usar-en-produccion-0123456789',
    trustedOrigins: [BASE],
    database: memoryAdapter(db),
    user: {
      additionalFields: opciones.sinHardening
        ? // Configuracion de main (db5b1db): role sin input:false.
          ({ role: { type: 'string', required: false, defaultValue: 'user' } } as const)
        : camposAdicionalesUsuario,
      deleteUser: { enabled: true },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url, token }) => {
        correos.push({ tipo: 'reset', to: user.email, url, token });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url, token }) => {
        correos.push({ tipo: 'verificacion', to: user.email, url, token });
      },
    },
    hooks: opciones.sinHardening
      ? undefined
      : { before: crearHooksBefore({ limitarIntentosLogin: opciones.limitador }) },
    // Igual que produccion: cookies con prefijo __Secure- y flag Secure.
    advanced: { useSecureCookies: true },
    logger: { disabled: true },
  });

  return { auth, db, correos };
}

type Entorno = ReturnType<typeof crearEntorno>;

type Respuesta = {
  status: number;
  json: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  setCookies: string[];
  headers: Headers;
};

function guardarCookies(jar: Jar | undefined, setCookies: string[]) {
  if (!jar) return;
  for (const linea of setCookies) {
    const [par] = linea.split(';');
    const i = par.indexOf('=');
    const nombre = par.slice(0, i).trim();
    const valor = par.slice(i + 1).trim();
    if (!valor || /max-age=0/i.test(linea)) jar.delete(nombre);
    else jar.set(nombre, valor);
  }
}

function cabeceraCookie(jar: Jar) {
  return [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
}

async function pedir(
  { auth }: Entorno,
  metodo: string,
  ruta: string,
  opciones: { body?: unknown; jar?: Jar; headers?: Record<string, string> } = {},
): Promise<Respuesta> {
  const headers = new Headers({ origin: BASE, ...(opciones.headers ?? {}) });
  if (opciones.body !== undefined) headers.set('content-type', 'application/json');
  if (opciones.jar?.size) headers.set('cookie', cabeceraCookie(opciones.jar));
  const url = ruta.startsWith('http') ? ruta : `${BASE}/api/auth${ruta}`;
  const res = await auth.handler(
    new Request(url, {
      method: metodo,
      headers,
      body: opciones.body !== undefined ? JSON.stringify(opciones.body) : undefined,
    }),
  );
  const setCookies = res.headers.getSetCookie();
  guardarCookies(opciones.jar, setCookies);
  const texto = await res.text();
  let json = null;
  try {
    json = JSON.parse(texto);
  } catch {
    json = null;
  }
  return { status: res.status, json, setCookies, headers: res.headers };
}

const codigo = (r: Respuesta) => r.json?.code;

async function registrar(e: Entorno, email: string, extra: Record<string, unknown> = {}) {
  return pedir(e, 'POST', '/sign-up/email', {
    body: { email, password: CLAVE_OK, name: 'Usuaria Prueba', ...extra },
  });
}

async function verificarPorMail(e: Entorno, email: string, jar: Jar = new Map()) {
  const correo = [...e.correos].reverse().find((c) => c.to === email && c.tipo === 'verificacion');
  assert.ok(correo, `no se envio mail de verificacion a ${email}`);
  await pedir(e, 'GET', correo.url, { jar });
  return jar;
}

/** Usuario registrado, verificado y con la sesion del autologin en el jar. */
async function usuarioConSesion(e: Entorno, email: string) {
  const r = await registrar(e, email);
  assert.equal(r.status, 200);
  const jar = await verificarPorMail(e, email);
  assert.ok(jar.get(COOKIE_SESION), 'el autologin de la verificacion no dejo cookie');
  return jar;
}

async function sesionActual(e: Entorno, jar: Jar) {
  const r = await pedir(e, 'GET', '/get-session', { jar });
  return r.json as { user: { id: string; role: string; name: string } } | null;
}

function usuarioEnDb(e: Entorno, email: string) {
  return e.db.user.find((u) => u.email === email);
}

// -----------------------------------------------------------------------------
describe('1. Registro', () => {
  it('TC-REG-01: rechaza claves debiles en el servidor, no solo en el formulario', async () => {
    const e = crearEntorno();
    // Politica actual (reglasPassword.ts): 8+ caracteres, una mayuscula y un numero.
    const debiles = ['aaaaaaaa', 'Aaaaaaaa', 'aaaaaaa1', '12345678', 'Aa1', 'A1' + 'a'.repeat(127)];
    for (const password of debiles) {
      const r = await pedir(e, 'POST', '/sign-up/email', {
        body: { email: `debil-${password.length}-${password[0]}@qa.test`, password, name: 'Ana Prueba' },
      });
      assert.equal(r.status, 400, `"${password.slice(0, 12)}" deberia rechazarse`);
      assert.equal(codigo(r), 'PASSWORD_TOO_WEAK');
    }
    assert.equal(e.db.user.length, 0, 'no se tiene que crear ningun usuario');
  });

  it('TC-REG-02: valida el nombre (sin URLs, numeros ni markup, 2 a 50 caracteres)', async () => {
    const e = crearEntorno();
    const invalidos = ['A', 'Ganaste en premio.com', 'Juan 123', 'x'.repeat(51), '<script>', 'http://evil'];
    for (const name of invalidos) {
      const r = await pedir(e, 'POST', '/sign-up/email', {
        body: { email: `n${invalidos.indexOf(name)}@qa.test`, password: CLAVE_OK, name },
      });
      assert.equal(r.status, 400, `"${name.slice(0, 20)}" deberia rechazarse`);
      assert.equal(codigo(r), 'INVALID_NAME');
    }
    for (const name of ['María José', "O'Neil", 'J. Pérez', 'Ana-Lía']) {
      const r = await pedir(e, 'POST', '/sign-up/email', {
        body: { email: `ok-${name.length}-${name.charCodeAt(0)}@qa.test`, password: CLAVE_OK, name },
      });
      assert.equal(r.status, 200, `"${name}" deberia aceptarse`);
    }
  });

  it('TC-REG-03: "role":"admin" en el body del registro se ignora (queda "user")', async () => {
    const e = crearEntorno();
    const r = await registrar(e, 'escalada@qa.test', { role: 'admin' });
    assert.equal(r.status, 200);
    assert.equal(usuarioEnDb(e, 'escalada@qa.test')?.role, 'user');
  });

  it('TC-REG-04: email duplicado devuelve la misma respuesta que uno nuevo (sin enumeracion)', async () => {
    const e = crearEntorno();
    const nuevo = await registrar(e, 'dup@qa.test');
    const repetido = await registrar(e, 'dup@qa.test');
    const repetidoMayus = await registrar(e, 'DUP@qa.test');
    // "image" se ignora: el usuario sintetico la trae en null y el adapter en
    // memoria no guarda claves undefined. Con Postgres la fila nueva tambien la
    // devuelve en null; la suite black-box compara la forma completa.
    const claves = (o: Record<string, unknown>) => Object.keys(o).filter((k) => k !== 'image').sort();
    for (const r of [repetido, repetidoMayus]) {
      assert.equal(r.status, nuevo.status);
      assert.equal(r.json.token, null);
      assert.deepEqual(Object.keys(r.json).sort(), Object.keys(nuevo.json).sort());
      assert.deepEqual(claves(r.json.user), claves(nuevo.json.user));
    }
    assert.equal(e.db.user.length, 1, 'no se crea un segundo usuario');
    assert.notEqual(repetido.json.user.id, nuevo.json.user.id, 'no expone el id real');
  });

  it('TC-REG-05: no permite fijar una imagen de perfil arbitraria', async () => {
    const e = crearEntorno();
    const r = await registrar(e, 'img@qa.test', { image: 'https://tracker.example/pixel.png' });
    assert.equal(r.status, 400);
    assert.equal(codigo(r), 'IMAGE_NOT_ALLOWED');
  });

  it('TC-REG-06: sin verificar no entra, y el error no revela si la clave era correcta', async () => {
    const e = crearEntorno();
    await registrar(e, 'sinverificar@qa.test');
    const claveOk = await pedir(e, 'POST', '/sign-in/email', {
      body: { email: 'sinverificar@qa.test', password: CLAVE_OK },
    });
    assert.equal(claveOk.status, 403);
    assert.equal(codigo(claveOk), 'EMAIL_NOT_VERIFIED');
    assert.equal(claveOk.setCookies.some((c) => c.startsWith(COOKIE_SESION)), false);

    const claveMal = await pedir(e, 'POST', '/sign-in/email', {
      body: { email: 'sinverificar@qa.test', password: 'OtraClave9' },
    });
    assert.equal(claveMal.status, 401);
    assert.equal(codigo(claveMal), 'INVALID_EMAIL_OR_PASSWORD');
  });

  it('TC-REG-07: el link de verificacion solo inicia sesion una vez', async () => {
    const e = crearEntorno();
    await registrar(e, 'link@qa.test');
    const correo = e.correos.find((c) => c.to === 'link@qa.test')!;
    const primera = await pedir(e, 'GET', correo.url);
    assert.ok(primera.setCookies.some((c) => c.startsWith(COOKIE_SESION)));
    const segunda = await pedir(e, 'GET', correo.url);
    assert.equal(segunda.setCookies.some((c) => c.startsWith(COOKIE_SESION)), false);
  });

  it('TC-REG-08: un token de verificacion alterado no verifica ni loguea', async () => {
    const e = crearEntorno();
    await registrar(e, 'tamper@qa.test');
    const correo = e.correos.find((c) => c.to === 'tamper@qa.test')!;
    const alterado = correo.url.replace(/token=([^&]+)/, (_m, t: string) => `token=${t.slice(0, -2)}xx`);
    const r = await pedir(e, 'GET', alterado);
    assert.equal(r.setCookies.some((c) => c.startsWith(COOKIE_SESION)), false);
    assert.equal(usuarioEnDb(e, 'tamper@qa.test')?.emailVerified, false);
  });
});

// -----------------------------------------------------------------------------
describe('2. Login', () => {
  it('TC-LOGIN-01: clave incorrecta y email inexistente dan el mismo error', async () => {
    const e = crearEntorno();
    await usuarioConSesion(e, 'existe@qa.test');
    const malaClave = await pedir(e, 'POST', '/sign-in/email', {
      body: { email: 'existe@qa.test', password: 'Incorrecta1' },
    });
    const noExiste = await pedir(e, 'POST', '/sign-in/email', {
      body: { email: 'noexiste@qa.test', password: 'Incorrecta1' },
    });
    assert.equal(malaClave.status, 401);
    assert.equal(noExiste.status, 401);
    assert.equal(codigo(malaClave), codigo(noExiste));
    assert.equal(malaClave.json.message, noExiste.json.message);
  });

  it('TC-LOGIN-02: la cookie de sesion sale HttpOnly, Secure, SameSite=Lax y Path=/', async () => {
    const e = crearEntorno();
    await usuarioConSesion(e, 'cookie@qa.test');
    const r = await pedir(e, 'POST', '/sign-in/email', {
      body: { email: 'cookie@qa.test', password: CLAVE_OK },
    });
    assert.equal(r.status, 200);
    const cookie = r.setCookies.find((c) => c.startsWith(`${COOKIE_SESION}=`));
    assert.ok(cookie, 'falta la cookie de sesion');
    assert.match(cookie, /;\s*HttpOnly/i);
    assert.match(cookie, /;\s*Secure/i);
    assert.match(cookie, /;\s*SameSite=Lax/i);
    assert.match(cookie, /;\s*Path=\//i);
    // El valor es token.firma (HMAC): sin el secreto no se puede fabricar.
    const valor = decodeURIComponent(cookie.split(';')[0].split('=').slice(1).join('='));
    assert.match(valor, /^[^.]+\..+$/);
  });

  it('TC-LOGIN-03: limita intentos por cuenta y responde 429 con Retry-After', async () => {
    const intentos = new Map<string, number>();
    const vistos: Array<{ email: string; ip: string | null }> = [];
    const limitador: LimitadorLogin = async ({ email, ip }) => {
      vistos.push({ email, ip });
      const clave = `${email}|${ip}`;
      const n = (intentos.get(clave) ?? 0) + 1;
      intentos.set(clave, n);
      return n <= 5 ? { permitido: true } : { permitido: false, reintentarEnSeg: 900 };
    };
    const e = crearEntorno({ limitador });
    await usuarioConSesion(e, 'victima@qa.test');
    const ip = { 'x-forwarded-for': '203.0.113.7' };

    for (let i = 1; i <= 5; i++) {
      const r = await pedir(e, 'POST', '/sign-in/email', {
        body: { email: 'Victima@qa.test', password: `Intento${i}x` },
        headers: ip,
      });
      assert.equal(r.status, 401, `intento ${i}`);
    }
    const bloqueado = await pedir(e, 'POST', '/sign-in/email', {
      body: { email: 'victima@qa.test', password: CLAVE_OK },
      headers: ip,
    });
    assert.equal(bloqueado.status, 429);
    assert.equal(codigo(bloqueado), 'TOO_MANY_LOGIN_ATTEMPTS');
    assert.equal(bloqueado.headers.get('retry-after'), '900');
    assert.equal(bloqueado.setCookies.some((c) => c.startsWith(COOKIE_SESION)), false);

    assert.equal(vistos[0].email, 'victima@qa.test', 'el email se normaliza antes de contar');
    assert.equal(vistos[0].ip, '203.0.113.7', 'la IP llega al limitador');

    const otraIp = await pedir(e, 'POST', '/sign-in/email', {
      body: { email: 'victima@qa.test', password: CLAVE_OK },
      headers: { 'x-forwarded-for': '198.51.100.20' },
    });
    assert.equal(otraIp.status, 200, 'el dueño desde otra IP sigue pudiendo entrar');
  });
});

// -----------------------------------------------------------------------------
describe('3. Sesiones', () => {
  it('TC-SES-01: el logout invalida la sesion en el servidor (la cookie copiada deja de servir)', async () => {
    const e = crearEntorno();
    const jar = await usuarioConSesion(e, 'logout@qa.test');
    const robada: Jar = new Map(jar);
    assert.ok(await sesionActual(e, robada));
    const r = await pedir(e, 'POST', '/sign-out', { jar, body: {} });
    assert.equal(r.status, 200);
    assert.equal(await sesionActual(e, robada), null);
    assert.equal(e.db.session.length, 0);
  });

  it('TC-SES-02: una cookie con la firma alterada no autentica', async () => {
    const e = crearEntorno();
    const jar = await usuarioConSesion(e, 'firma@qa.test');
    const [token, firma] = decodeURIComponent(jar.get(COOKIE_SESION)!).split('.');
    const firmaAlterada = (firma[0] === 'A' ? 'B' : 'A') + firma.slice(1);
    const alterada: Jar = new Map([[COOKIE_SESION, encodeURIComponent(`${token}.${firmaAlterada}`)]]);
    assert.ok(await sesionActual(e, jar), 'control: la cookie original funciona');
    assert.equal(await sesionActual(e, alterada), null);
  });

  it('TC-SES-03: el token crudo de la base, sin firma o con firma inventada, no autentica', async () => {
    const e = crearEntorno();
    await usuarioConSesion(e, 'crudo@qa.test');
    const token = String(e.db.session[0].token);
    assert.equal(await sesionActual(e, new Map([[COOKIE_SESION, token]])), null);
    assert.equal(await sesionActual(e, new Map([[COOKIE_SESION, `${token}.firmaInventada`]])), null);
    assert.equal(await sesionActual(e, new Map([['better-auth.session_token', token]])), null);
  });

  it('TC-SES-04: una sesion vencida se rechaza aunque la cookie sea valida', async () => {
    const e = crearEntorno();
    const jar = await usuarioConSesion(e, 'vencida@qa.test');
    e.db.session[0].expiresAt = new Date(Date.now() - 1000);
    assert.equal(await sesionActual(e, jar), null);
  });

  it('TC-SES-05: restablecer la clave corta todas las sesiones abiertas', async () => {
    const e = crearEntorno();
    const jar = await usuarioConSesion(e, 'reset-sesiones@qa.test');
    const otroDispositivo: Jar = new Map();
    await pedir(e, 'POST', '/sign-in/email', {
      body: { email: 'reset-sesiones@qa.test', password: CLAVE_OK },
      jar: otroDispositivo,
    });
    assert.ok(await sesionActual(e, otroDispositivo));

    await pedir(e, 'POST', '/request-password-reset', {
      body: { email: 'reset-sesiones@qa.test', redirectTo: '/restablecer-contrasena' },
    });
    const { token } = e.correos.find((c) => c.tipo === 'reset')!;
    const r = await pedir(e, 'POST', '/reset-password', { body: { token, newPassword: 'NuevaClave2' } });
    assert.equal(r.status, 200);
    assert.equal(await sesionActual(e, jar), null);
    assert.equal(await sesionActual(e, otroDispositivo), null);
  });
});

// -----------------------------------------------------------------------------
describe('4. Recuperacion de clave', () => {
  it('TC-RST-01: la respuesta es identica exista o no el email', async () => {
    const e = crearEntorno();
    await usuarioConSesion(e, 'real@qa.test');
    const existe = await pedir(e, 'POST', '/request-password-reset', {
      body: { email: 'real@qa.test', redirectTo: '/restablecer-contrasena' },
    });
    const noExiste = await pedir(e, 'POST', '/request-password-reset', {
      body: { email: 'fantasma@qa.test', redirectTo: '/restablecer-contrasena' },
    });
    assert.equal(existe.status, 200);
    assert.equal(noExiste.status, existe.status);
    assert.deepEqual(noExiste.json, existe.json);
    assert.equal(e.correos.filter((c) => c.tipo === 'reset').length, 1);
  });

  it('TC-RST-02: el token de reset es de un solo uso', async () => {
    const e = crearEntorno();
    await usuarioConSesion(e, 'unuso@qa.test');
    await pedir(e, 'POST', '/request-password-reset', { body: { email: 'unuso@qa.test' } });
    const { token } = e.correos.find((c) => c.tipo === 'reset')!;
    const primera = await pedir(e, 'POST', '/reset-password', { body: { token, newPassword: 'Primera123' } });
    const segunda = await pedir(e, 'POST', '/reset-password', { body: { token, newPassword: 'Segunda123' } });
    assert.equal(primera.status, 200);
    assert.equal(segunda.status, 400);
    assert.equal(codigo(segunda), 'INVALID_TOKEN');
    const login = await pedir(e, 'POST', '/sign-in/email', { body: { email: 'unuso@qa.test', password: 'Primera123' } });
    assert.equal(login.status, 200, 'vale la clave del primer uso');
  });

  it('TC-RST-03: el token vencido no sirve', async () => {
    const e = crearEntorno();
    await usuarioConSesion(e, 'vence@qa.test');
    await pedir(e, 'POST', '/request-password-reset', { body: { email: 'vence@qa.test' } });
    const { token } = e.correos.find((c) => c.tipo === 'reset')!;
    const fila = e.db.verification.find((v) => String(v.identifier).endsWith(token))!;
    fila.expiresAt = new Date(Date.now() - 1000);
    const r = await pedir(e, 'POST', '/reset-password', { body: { token, newPassword: 'NuevaClave3' } });
    assert.equal(r.status, 400);
    assert.equal(codigo(r), 'INVALID_TOKEN');
  });

  it('TC-RST-04: clave nueva debil se rechaza y el token NO se consume', async () => {
    const e = crearEntorno();
    await usuarioConSesion(e, 'debil-reset@qa.test');
    await pedir(e, 'POST', '/request-password-reset', { body: { email: 'debil-reset@qa.test' } });
    const { token } = e.correos.find((c) => c.tipo === 'reset')!;
    const debil = await pedir(e, 'POST', '/reset-password', { body: { token, newPassword: 'aaaaaaaa' } });
    assert.equal(debil.status, 400);
    assert.equal(codigo(debil), 'PASSWORD_TOO_WEAK');
    const buena = await pedir(e, 'POST', '/reset-password', { body: { token, newPassword: 'Correcta123' } });
    assert.equal(buena.status, 200);
  });

  it('TC-RST-05: redirectTo hacia otro dominio se rechaza (sin open redirect del token)', async () => {
    const e = crearEntorno();
    await usuarioConSesion(e, 'redir@qa.test');
    const r = await pedir(e, 'POST', '/request-password-reset', {
      body: { email: 'redir@qa.test', redirectTo: 'https://evil.example/robar' },
    });
    assert.equal(r.status, 403);
    assert.equal(e.correos.filter((c) => c.tipo === 'reset').length, 0);
  });

  it('TC-RST-06: el link del mail redirige al front con el token, y no a otro dominio', async () => {
    const e = crearEntorno();
    await usuarioConSesion(e, 'link-reset@qa.test');
    await pedir(e, 'POST', '/request-password-reset', {
      body: { email: 'link-reset@qa.test', redirectTo: '/restablecer-contrasena' },
    });
    const { token, url } = e.correos.find((c) => c.tipo === 'reset')!;
    const ok = await pedir(e, 'GET', url);
    assert.equal(ok.status, 302);
    const destino = new URL(ok.headers.get('location')!, BASE);
    assert.equal(destino.origin, BASE);
    assert.equal(destino.pathname, '/restablecer-contrasena');
    assert.equal(destino.searchParams.get('token'), token);
    const malo = await pedir(e, 'GET', `${BASE}/api/auth/reset-password/${token}?callbackURL=https%3A%2F%2Fevil.example`);
    assert.equal(malo.status, 403);
  });
});

// -----------------------------------------------------------------------------
describe('5. Escalacion de privilegios via la API de Better Auth', () => {
  it('TC-PRIV-00 (control, config de main): sin input:false un usuario se vuelve admin', async () => {
    // Reproduce la vulnerabilidad de main para dejar evidencia. Si este test
    // falla algun dia es porque Better Auth cambio su default, no porque main
    // este bien.
    const e = crearEntorno({ sinHardening: true });
    const jar = await usuarioConSesion(e, 'atacante@qa.test');
    const r = await pedir(e, 'POST', '/update-user', { jar, body: { role: 'admin' } });
    assert.equal(r.status, 200);
    assert.equal((await sesionActual(e, jar))?.user.role, 'admin');
  });

  it('TC-PRIV-01: con el fix, update-user {"role":"admin"} se rechaza y el rol no cambia', async () => {
    const e = crearEntorno();
    const jar = await usuarioConSesion(e, 'atacante@qa.test');
    for (const role of ['admin', 'ADMIN', ['admin']]) {
      const r = await pedir(e, 'POST', '/update-user', { jar, body: { role } });
      assert.equal(r.status, 400);
      assert.equal(codigo(r), 'FIELD_NOT_ALLOWED');
    }
    const r2 = await pedir(e, 'POST', '/update-user', { jar, body: { name: 'Nombre Nuevo', role: 'admin' } });
    assert.equal(r2.status, 400, 'tampoco colado junto a un campo permitido');
    assert.equal(usuarioEnDb(e, 'atacante@qa.test')?.role, 'user');
    assert.equal((await sesionActual(e, jar))?.user.role, 'user');
  });

  it('TC-PRIV-02: update-user valida nombre e imagen igual que el registro', async () => {
    const e = crearEntorno();
    const jar = await usuarioConSesion(e, 'perfil@qa.test');
    const nombre = await pedir(e, 'POST', '/update-user', { jar, body: { name: 'Entrá a premio.com' } });
    assert.equal(codigo(nombre), 'INVALID_NAME');
    const imagen = await pedir(e, 'POST', '/update-user', { jar, body: { image: 'https://tracker.example/x.png' } });
    assert.equal(codigo(imagen), 'IMAGE_NOT_ALLOWED');
    const valido = await pedir(e, 'POST', '/update-user', { jar, body: { name: 'Nombre Válido' } });
    assert.equal(valido.status, 200);
  });

  it('TC-PRIV-03: no se puede cambiar el email por update-user', async () => {
    const e = crearEntorno();
    const jar = await usuarioConSesion(e, 'email@qa.test');
    const r = await pedir(e, 'POST', '/update-user', { jar, body: { email: 'otro@qa.test' } });
    assert.equal(r.status, 400);
    assert.ok(usuarioEnDb(e, 'email@qa.test'));
  });

  it('TC-PRIV-04: pedir la baja exige la clave aunque la sesion sea reciente', async () => {
    const e = crearEntorno();
    const jar = await usuarioConSesion(e, 'baja@qa.test');
    const sinClave = await pedir(e, 'POST', '/delete-user', { jar, body: {} });
    assert.equal(sinClave.status, 400);
    assert.equal(codigo(sinClave), 'PASSWORD_REQUIRED');
    const claveMal = await pedir(e, 'POST', '/delete-user', { jar, body: { password: 'Incorrecta9' } });
    assert.equal(claveMal.status, 400);
    assert.ok(usuarioEnDb(e, 'baja@qa.test'), 'el usuario sigue existiendo');
  });

  it('TC-PRIV-05: los endpoints de cuenta exigen sesion', async () => {
    const e = crearEntorno();
    const casos: Array<[string, string, unknown?]> = [
      ['POST', '/update-user', { name: 'Hacker Prueba' }],
      ['POST', '/delete-user', { password: CLAVE_OK }],
      ['POST', '/change-password', { currentPassword: CLAVE_OK, newPassword: 'OtraClave1' }],
      ['GET', '/list-sessions'],
      ['POST', '/revoke-sessions', {}],
    ];
    for (const [metodo, ruta, body] of casos) {
      const r = await pedir(e, metodo, ruta, { body });
      assert.equal(r.status, 401, `${metodo} ${ruta} sin sesion`);
    }
  });
});
