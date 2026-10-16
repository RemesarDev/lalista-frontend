// proxy.ts (Next 16: reemplaza a middleware.ts)
// =============================================================================
// Guard server-side del panel /admin
// =============================================================================
// Hasta ahora el unico control de /admin era app/admin/layout.tsx, un componente
// cliente que espera a checkAuth() y devuelve null si el rol no es admin. Eso es
// cosmetico: el HTML y el JS del panel se sirven igual a cualquiera, y la guia
// de autenticacion de Next desaconseja explicitamente el patron "return null en
// el layout" (node_modules/next/dist/docs/01-app/02-guides/authentication.md).
//
// Los datos ya estaban protegidos (adminGuard en app/api/[[...route]]/admin.ts
// responde 403). Esto agrega la barrera del lado de las paginas: sin sesion de
// admin, el request ni llega a renderizar.
//
// Normalmente Proxy solo deberia leer la cookie (chequeo optimista) para no ir a
// la base en cada request. Aca el matcher es solo /admin, que usan pocas
// personas, y el rol no esta en la cookie: hace falta la sesion completa. Proxy
// corre en Node.js por defecto en Next 16, asi que Better Auth funciona igual
// que en las rutas de la API.
// =============================================================================

import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/app/_lib/auth';
import { evaluarAccesoAdmin } from '@/app/_lib/auth-hardening';

export default async function proxy(request: NextRequest) {
  const session = await auth.api
    .getSession({ headers: request.headers })
    .catch(() => null);

  // Misma regla que adminGuard en la API (rol + sesion de menos de 12 h).
  const veredicto = evaluarAccesoAdmin(session);

  if (veredicto === 'sin-sesion' || veredicto === 'reautenticar') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (veredicto !== 'ok') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const respuesta = NextResponse.next();
  respuesta.headers.set('Cache-Control', 'private, no-store');
  return respuesta;
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
