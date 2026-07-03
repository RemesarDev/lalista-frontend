import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { AuthType } from "@/app/_lib/auth";

export const authClient = createAuthClient({
    plugins: [
    inferAdditionalFields<AuthType>()
  ],
});
export type User = typeof authClient.$Infer.Session.user;