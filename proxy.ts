import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  permiteBypassGeograficoLocal,
  paisPermitido,
} from '@/app/_lib/geo';


export function proxy(request: NextRequest) {
  const { hostname, pathname } = request.nextUrl;
  const tienePaisInformado = request.headers.has('x-vercel-ip-country');

  const bypassLocalSinPais =
    permiteBypassGeograficoLocal(hostname) && !tienePaisInformado;

  if (
    pathname === '/acceso-restringido' ||
    paisPermitido(request.headers) ||
    bypassLocalSinPais
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.rewrite(
    new URL('/acceso-restringido', request.url),
  );

  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');

  return response;
}

export const config = {
  matcher: [
    '/((?!api(?:/|$)|_next/static|_next/image|serwist|img|favicon.ico|manifest.webmanifest|robots.txt|sitemap.xml).*)',
  ],
};