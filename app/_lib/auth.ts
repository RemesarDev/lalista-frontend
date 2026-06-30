import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
    // Limitamos el pool a 1 porque Vercel levanta múltiples lambdas (Serverless Functions) concurrentes
    max: 1, 
  }),
  // Le dice a Better Auth que lea las cabeceras de Next.js/Vercel para deducir su propia URL.
  trustedProxyHeaders: true, 
  emailAndPassword: { 
    enabled: true 
  },
});