import { betterAuth } from "better-auth";
import { Pool } from "pg";

const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
const localOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];
const trustedOrigins = Array.from(
  new Set([appUrl, ...localOrigins].filter(Boolean))
);

const databaseUrl = process.env.DATABASE_URL;
const authSecret = process.env.BETTER_AUTH_SECRET;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for Better Auth");
}

if (!authSecret) {
  throw new Error("BETTER_AUTH_SECRET is required for Better Auth");
}

export const auth = betterAuth({
  baseURL: appUrl,
  secret: authSecret,
  trustedOrigins,
  database: new Pool({
    connectionString: databaseUrl,
    max: 1,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
  }),
  trustedProxyHeaders: true,
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
      },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
});

export type AuthType = typeof auth;