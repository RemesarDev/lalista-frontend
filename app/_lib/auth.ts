import { betterAuth } from "better-auth";
import { Pool } from "pg";

// Definimos la URL base una sola vez
const baseURL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export const auth = betterAuth({
  baseURL, 
  
  // Simplificado: solo confiamos en el origen donde está corriendo la app
  trustedOrigins: [baseURL],
  
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1, 
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
    enabled: true 
  },
});

export type AuthType = typeof auth;