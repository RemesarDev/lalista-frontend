export const PAIS_PERMITIDO = 'AR';

export function esDesarrolloLocal(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

export function permiteBypassGeograficoLocal(hostname: string): boolean {
  return (
    esDesarrolloLocal(hostname) &&
    process.env.ALLOW_LOCAL_GEO_BYPASS === 'true'
  );
}

export function paisPermitido(headers: Headers): boolean {
  const pais = headers.get('x-vercel-ip-country')?.trim().toUpperCase();
  return pais === PAIS_PERMITIDO;
}