import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { Pool } from "pg";

const appUrl = (
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
).replace(/\/$/, "");
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

const isPreview = process.env.VERCEL_ENV === "preview";

export const auth = betterAuth({
  baseURL: appUrl,
  secret: authSecret,
  trustedOrigins,
  database: pool,
  trustedProxyHeaders: true,
  logger: {
    disabled: false,
    level: isPreview ? "debug" : "error",
  },
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