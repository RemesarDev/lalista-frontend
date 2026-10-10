import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { Pool } from "pg";
import { enviarEmailVerificacion, enviarEmailRestablecerContrasena } from "@/app/_lib/mailer";

// El dominio no se hardcodea: en Vercel lo resuelve la plataforma.
// VERCEL_PROJECT_PRODUCTION_URL trae el dominio de produccion estable (el
// custom mas corto, o el .vercel.app si no hay custom), siempre seteado y sin
// el esquema. No usamos VERCEL_URL porque es unica por deploy y un link de
// verificacion con ese host se podria vencer antes de que lo abran.
function resolverAppUrl(): string {
  const explicita = process.env.NEXT_PUBLIC_APP_URL;
  if (explicita) return explicita.replace(/\/$/, "");

  const produccion = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (produccion) return `https://${produccion.replace(/\/$/, "")}`;

  return "http://localhost:3000";
}

const appUrl = resolverAppUrl();
const localOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];
const trustedOrigins = Array.from(
  new Set([appUrl, ...localOrigins].filter(Boolean))
);

const databaseUrl = process.env.DATABASE_URL;
const authSecret = process.env.BETTER_AUTH_SECRET;

if (!databaseUrl) throw new Error("DATABASE_URL is required for Better Auth");
if (!authSecret) throw new Error("BETTER_AUTH_SECRET is required for Better Auth");

const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// 60s, el estandar de GitHub/Supabase/Auth0. Evita que sendOnSignIn o pedidos
// repetidos de reset bombardeen de mails una cuenta. El rate limit de Better
// Auth no alcanza: cuenta por IP, no por cuenta.
const COOLDOWN_EMAIL_SEGUNDOS = 60;

// Cooldown compartido por todos los mails de cuenta (verificacion y reset):
// "verificationEmailSentAt" guarda el ultimo mail de cuenta enviado, sea cual
// sea. Conserva el nombre de cuando era solo de verificacion.
async function enviarConCooldown(userId: string, enviar: () => Promise<void>) {
  // Check-and-set atomico: Postgres serializa el UPDATE sobre la misma
  // fila, asi que dos requests simultaneos no pasan el cooldown los dos.
  const { rowCount } = await pool.query(
    `update "user"
     set "verificationEmailSentAt" = now()
     where id = $1
       and ("verificationEmailSentAt" is null or "verificationEmailSentAt" < now() - ($2 || ' seconds')::interval)`,
    [userId, COOLDOWN_EMAIL_SEGUNDOS]
  );

  if (rowCount === 0) return; // dentro del cooldown: no se reenvia

  try {
    await enviar();
  } catch (e) {
    // Falla pasajera (timeout, red): liberamos el cooldown para que se pueda
    // reintentar ya. Con la clave rechazada (EAUTH) reintentar no sirve y suma
    // logins fallidos contra Gmail, asi que el cooldown queda puesto.
    if ((e as { code?: string }).code !== "EAUTH") {
      await pool
        .query(`update "user" set "verificationEmailSentAt" = null where id = $1`, [userId])
        .catch(() => {}); // que no tape el error original
    }
    throw e;
  }
}

export const auth = betterAuth({
  baseURL: appUrl,
  secret: authSecret,
  trustedOrigins,
  database: pool,
  trustedProxyHeaders: true,
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
      },
    },
    deleteUser: {
      enabled: true,
      beforeDelete: async (user) => {
        await pool.query(
          `update "user" set "deletionScheduledAt" = now() + interval '7 days' where id = $1`,
          [user.id]
        );
        throw new APIError('BAD_REQUEST', { message: 'DELETION_SCHEDULED' });
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    // El link del mail pasa por /api/auth/reset-password/:token, que valida el
    // token y redirige al redirectTo que manda el cliente con ?token=... El
    // token vence en 1 hora (default) y se consume al usarlo.
    sendResetPassword: async ({ user, url }) => {
      await enviarConCooldown(user.id, () =>
        enviarEmailRestablecerContrasena({ to: user.email, url, nombre: user.name })
      );
    },
    // Abrir el link del reset prueba que el correo es suyo, igual que el de
    // verificacion: sin esto, despues de cambiar la clave le pediriamos otro
    // mail para poder entrar.
    onPasswordReset: async ({ user }) => {
      await pool.query(
        `update "user" set "emailVerified" = true where id = $1 and "emailVerified" = false`,
        [user.id]
      );
    },
    // Si alguien tenia la clave vieja y una sesion abierta, la cortamos.
    revokeSessionsOnPasswordReset: true,
  },
  emailVerification: {
    // Sin esto el mail no se dispara solo: el callback de abajo quedaria
    // colgado del endpoint /send-verification-email nada mas.
    sendOnSignUp: true,
    // Reenvia el mail en login sin verificar; enviarConCooldown lo protege.
    sendOnSignIn: true,
    // Sin esto, el link verifica pero no loguea: cae en / como invitado.
    autoSignInAfterVerification: true,
    // Better Auth arma la url (/api/auth/verify-email?token=...&callbackURL=/)
    // a partir de baseURL, que sale de resolverAppUrl().
    sendVerificationEmail: async ({ user, url }) => {
      await enviarConCooldown(user.id, () =>
        enviarEmailVerificacion({ to: user.email, url, nombre: user.name })
      );
    },
  },
hooks: {
  after: async (ctx) => {
    try {
      const path = (ctx as any).path;
      if (path !== '/sign-in/email') return {};

      const newSession = (ctx as any).context?.newSession;
      if (!newSession?.user?.id) return {};

      await pool.query(
        `update "user" set "deletionScheduledAt" = null where id = $1 and "deletionScheduledAt" is not null`,
        [newSession.user.id]
      );
    } catch {
      // silencioso
    }
    return {};
  },
},
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
});

export type AuthType = typeof auth;