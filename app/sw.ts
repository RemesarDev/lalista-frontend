/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// defaultCache guarda TODA respuesta GET de /api/* (salvo /api/auth) en el
// cache "apis" por 24 h con NetworkFirst. Eso incluia listas, direcciones,
// miembros y hasta los mensajes de soporte del panel admin: quedaban en el
// disco despues del logout y, sin red, se le servian al proximo que usara el
// navegador. Estas rutas van siempre a la red y nunca se guardan.
const RUTAS_PRIVADAS = /^\/api\/(listas|direcciones|usuarios|admin|support)(\/|$)/;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ sameOrigin, url: { pathname } }) => sameOrigin && RUTAS_PRIVADAS.test(pathname),
      handler: new NetworkOnly(),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();