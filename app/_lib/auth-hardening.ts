// =============================================================================
// Endurecimiento del Gatekeeper (Better Auth)
// =============================================================================
// Todo lo que valida o limita las entradas a /api/auth/* vive aca, separado de
// auth.ts, por dos motivos:
//   1. auth.ts abre el Pool de Postgres y el mailer al importarse; este modulo
//      no toca infraestructura, asi que los tests lo pueden montar sobre una
//      instancia de Better Auth en memoria (scripts/qa/gatekeeper/offline).
//   2. Lo que se prueba es exactamente lo que corre en produccion: auth.ts
//      importa estas mismas piezas, no una copia.
//
// Usa rutas relativas (no "@/") a proposito, para que el bundle de los tests
// no dependa del alias.
// =============================================================================

import { APIError, createAuthMiddleware, getIp, getSessionFromCtx } from "better-auth/api";
import { motivoPasswordInvalida } from "./utils/reglasPassword";
import { motivoNombreInvalido } from "./utils/reglasNombre";

// -----------------------------------------------------------------------------
// Campos extra de "user"
// -----------------------------------------------------------------------------
// input: false es la barrera contra la escalacion vertical. Sin esto, el
// cliente puede mandar "role" en el body de /sign-up/email y de /update-user, y
// Better Auth lo escribe tal cual (parseInputData cae en parsedData[key] =
// data[key]). Un usuario comun quedaba a un POST /api/auth/update-user
// {"role":"admin"} de volverse admin, y ademas el endpoint le refrescaba la
// cookie de sesion con el rol nuevo. Con input:false, en "create" se fuerza el
// defaultValue "user" y en "update" mandar el campo tira FIELD_NOT_ALLOWED. El
// rol solo se cambia por fuera de la API publica (service_role / SQL directo).
export const camposAdicionalesUsuario = {
  role: {
    type: "string",
    required: false,
    defaultValue: "user",
    input: false,
  },
} as const;

// -----------------------------------------------------------------------------
// Acceso al panel de admin (hallazgo GK-04)
// -----------------------------------------------------------------------------
// Las sesiones duran 7 dias y se renuevan solas con el uso (updateAge de 1
// dia), asi que una cookie de admin robada no vencia nunca mientras se usara.
// Para /admin y /api/admin/* ademas del rol se exige que la sesion se haya
// creado (login con clave) hace menos de 12 h. createdAt no cambia cuando
// Better Auth extiende expiresAt, por eso sirve de edad absoluta. Pasado ese
// tiempo el admin sigue logueado como usuario comun; para el panel tiene que
// volver a entrar.
export const EDAD_MAXIMA_SESION_ADMIN_MS = 12 * 60 * 60 * 1000;

export type VeredictoAdmin = "ok" | "sin-sesion" | "no-admin" | "reautenticar";

type SesionMinima = {
  user: { role?: string | null };
  session: { createdAt: Date | string };
} | null | undefined;

export function evaluarAccesoAdmin(sesion: SesionMinima, ahora: number = Date.now()): VeredictoAdmin {
  if (!sesion) return "sin-sesion";
  if (sesion.user.role !== "admin") return "no-admin";
  const creada = new Date(sesion.session.createdAt).getTime();
  // Fecha invalida o en el futuro: se trata como vencida.
  if (!Number.isFinite(creada) || creada > ahora || ahora - creada > EDAD_MAXIMA_SESION_ADMIN_MS) {
    return "reautenticar";
  }
  return "ok";
}

// -----------------------------------------------------------------------------
// Limitador de intentos de login por cuenta
// -----------------------------------------------------------------------------
// El rate limit de Better Auth y el de Hono cuentan por IP: un ataque de
// credential stuffing desde muchas IPs contra una misma cuenta no los toca.
// Este limitador cuenta por email (y por email+IP). Se inyecta desde auth.ts
// para que aca no haya Redis y los tests puedan pasar uno falso.
export type ResultadoLimite = { permitido: boolean; reintentarEnSeg?: number };
export type LimitadorLogin = (claves: { email: string; ip: string | null }) => Promise<ResultadoLimite>;

export type OpcionesHardening = {
  limitarIntentosLogin?: LimitadorLogin;
};

// Codigos propios. El front los traduce en app/_lib/utils/traductorAuth.ts.
export const CODIGOS_GATEKEEPER = {
  PASSWORD_TOO_WEAK: "PASSWORD_TOO_WEAK",
  INVALID_NAME: "INVALID_NAME",
  IMAGE_NOT_ALLOWED: "IMAGE_NOT_ALLOWED",
  PASSWORD_REQUIRED: "PASSWORD_REQUIRED",
  TOO_MANY_LOGIN_ATTEMPTS: "TOO_MANY_LOGIN_ATTEMPTS",
} as const;

function rechazar(code: string, message: string): never {
  throw new APIError("BAD_REQUEST", { code, message });
}

function validarNombreSiViene(body: Record<string, unknown>, obligatorio: boolean) {
  if (!obligatorio && !("name" in body)) return;
  const motivo = motivoNombreInvalido(body.name);
  if (motivo) rechazar(CODIGOS_GATEKEEPER.INVALID_NAME, motivo);
}

function validarPassword(valor: unknown) {
  const motivo = motivoPasswordInvalida(valor);
  if (motivo) rechazar(CODIGOS_GATEKEEPER.PASSWORD_TOO_WEAK, motivo);
}

// La app no tiene subida de avatar: "image" solo serviria para que alguien
// ponga una URL propia que despues se carga en el navegador de los miembros de
// sus listas (tracking de IP). Se acepta null/ausente y nada mas.
function rechazarImagen(body: Record<string, unknown>) {
  if (body.image !== undefined && body.image !== null && body.image !== "") {
    rechazar(CODIGOS_GATEKEEPER.IMAGE_NOT_ALLOWED, "No se puede definir una imagen de perfil");
  }
}

// Los hooks "before" corren antes que el middleware de sesion del endpoint.
// En los endpoints que exigen sesion, se valida la sesion primero para que un
// request anonimo reciba 401 y no el detalle de que campo esta mal (mismo
// criterio que requireAuth en la API de Hono).
const ENDPOINTS_CON_SESION = new Set(["/update-user", "/change-password", "/delete-user"]);

export function crearHooksBefore(opciones: OpcionesHardening = {}) {
  return createAuthMiddleware(async (ctx) => {
    const body = (ctx.body && typeof ctx.body === "object" ? ctx.body : {}) as Record<string, unknown>;

    if (ENDPOINTS_CON_SESION.has(ctx.path) && !(await getSessionFromCtx(ctx))) {
      throw APIError.fromStatus("UNAUTHORIZED");
    }

    switch (ctx.path) {
      case "/sign-up/email": {
        validarNombreSiViene(body, true);
        validarPassword(body.password);
        rechazarImagen(body);
        return;
      }

      case "/update-user": {
        validarNombreSiViene(body, false);
        rechazarImagen(body);
        return;
      }

      case "/reset-password":
      case "/change-password": {
        validarPassword(body.newPassword);
        return;
      }

      case "/delete-user": {
        // Better Auth solo verifica la clave si viene en el body; sin clave
        // alcanza con una sesion de menos de 24 h (freshAge). El front siempre
        // la manda, asi que exigirla no cambia nada para el usuario y cierra
        // la baja con una cookie robada.
        if (typeof body.password !== "string" || body.password.length === 0) {
          rechazar(CODIGOS_GATEKEEPER.PASSWORD_REQUIRED, "Ingresá tu contraseña para eliminar la cuenta");
        }
        return;
      }

      case "/sign-in/email": {
        if (!opciones.limitarIntentosLogin || typeof body.email !== "string") return;
        const email = body.email.trim().toLowerCase();
        const ip = ctx.request ? getIp(ctx.request, ctx.context.options) : null;
        const { permitido, reintentarEnSeg } = await opciones.limitarIntentosLogin({ email, ip });
        if (!permitido) {
          const segundos = Math.max(1, Math.ceil(reintentarEnSeg ?? 60));
          throw new APIError(
            "TOO_MANY_REQUESTS",
            {
              code: CODIGOS_GATEKEEPER.TOO_MANY_LOGIN_ATTEMPTS,
              message: "Demasiados intentos. Esperá unos minutos y volvé a probar.",
            },
            { "Retry-After": String(segundos) },
          );
        }
        return;
      }
    }
  });
}
