import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { AuthType } from "@/app/_lib/auth";

const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

export const authClient = createAuthClient({
  baseURL: appUrl,
  fetchOptions: {
    credentials: "include",
  },
  plugins: [
    inferAdditionalFields<AuthType>()
  ],
});

export type User = typeof authClient.$Infer.Session.user;