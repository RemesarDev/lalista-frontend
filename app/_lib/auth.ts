import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000", 
  
  // Feature nativa: Autorización explícita para orígenes cruzados en desarrollo y producción
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:5000",
    "https://lalista-frontend.vercel.app"
  ],
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
    // Limitamos el pool a 1 porque Vercel levanta múltiples lambdas (Serverless Functions) concurrentes
    max: 1, 
  }),
  // Le dice a Better Auth que lea las cabeceras de Next.js/Vercel para deducir su propia URL.
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
    enabled: true 
  },
});
export type AuthType = typeof auth;