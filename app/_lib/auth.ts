import { betterAuth } from "better-auth";
import { Pool } from "pg";

const baseURL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const databaseUrl = process.env.DATABASE_URL;
const authSecret = process.env.BETTER_AUTH_SECRET;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for Better Auth");
}

if (!authSecret) {
  throw new Error("BETTER_AUTH_SECRET is required for Better Auth");
}

export const auth = betterAuth({
  baseURL,
  secret: authSecret,
  trustedOrigins: [baseURL],
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
});

export type AuthType = typeof auth;