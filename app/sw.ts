/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig, SerwistPlugin } from "serwist";
import { ExpirationPlugin, NetworkFirst, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Si el servidor confirma que la región no está soportada,
// limpiamos las respuestas de API cacheadas y avisamos a las pestañas abiertas.
const CACHES_DE_DATOS = new Set([
  'apis',
]);

const regionGuard: SerwistPlugin = {
  fetchDidSucceed: async ({ response }) => {
    if (response.status !== 403) return response;

    const body = await response.clone().json().catch(() => null);

    if (body?.error !== 'REGION_NOT_SUPPORTED') {
      return response;
    }

    const nombres = await caches.keys();

    await Promise.all(
      nombres
        .filter((nombre) => CACHES_DE_DATOS.has(nombre))
        .map((nombre) => caches.delete(nombre)),
    );

    const clientes = await self.clients.matchAll({ type: 'window' });

    clientes.forEach((cliente) => {
      cliente.postMessage({ type: 'REGION_BLOCKED' });
    });

    return response;
  },
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ sameOrigin, url }) =>
        sameOrigin && url.pathname.startsWith('/api/'),
      handler: new NetworkFirst({
        cacheName: 'apis',
        networkTimeoutSeconds: 10,
        plugins: [
          regionGuard,
          new ExpirationPlugin({
            maxEntries: 16,
            maxAgeSeconds: 86400,
          }),
        ],
      }),
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