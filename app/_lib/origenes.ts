// =============================================================================
// Origenes de confianza (hallazgo GK-03)
// =============================================================================
// Antes, http://localhost:3000 y http://127.0.0.1:3000 se sumaban siempre a
// trustedOrigins de Better Auth y a la lista de CORS (con credentials: true),
// tambien en produccion. Consecuencias en prod:
//   - CORS: cualquier pagina servida desde localhost:3000 en la compu de un
//     usuario (otro proyecto en dev, una extension, malware local) podia leer
//     con su cookie las respuestas de /api/listas, /api/direcciones, etc.
//   - Better Auth: aceptaba http://localhost:3000/... como callbackURL /
//     redirectTo y como Origin valido para las mutaciones.
// Ahora los origenes locales solo se agregan fuera de produccion.
//
// Sin imports de infraestructura: lo prueban las suites offline.
// =============================================================================

const ORIGENES_LOCALES = ['http://localhost:3000', 'http://127.0.0.1:3000'];

export function origenesLocales(nodeEnv: string | undefined = process.env.NODE_ENV): string[] {
    return nodeEnv === 'production' ? [] : [...ORIGENES_LOCALES];
}

type EntornoCors = {
    appUrl: string;
    nodeEnv?: string;
    vercelUrl?: string;
    vercelBranchUrl?: string;
};

/** Origenes que CORS acepta con credenciales. */
export function origenesCors({ appUrl, nodeEnv, vercelUrl, vercelBranchUrl }: EntornoCors): Set<string> {
    return new Set([
        appUrl.replace(/\/$/, ''),
        ...origenesLocales(nodeEnv),
        ...(vercelUrl ? [`https://${vercelUrl}`] : []),
        ...(vercelBranchUrl ? [`https://${vercelBranchUrl}`] : []),
    ]);
}
