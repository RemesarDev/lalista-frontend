import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { AuthType } from "@/app/_lib/auth";

export const authClient = createAuthClient({
  // Tomamos la URL del entorno de forma directa
  baseURL: process.env.NEXT_PUBLIC_APP_URL, 
  
  plugins: [
    inferAdditionalFields<AuthType>()
  ],
});

export type User = typeof authClient.$Infer.Session.user;