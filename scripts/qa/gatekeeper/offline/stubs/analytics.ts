// Stub de app/_lib/utils/analytics.ts: las suites offline no escriben en DB2.
// Guarda lo que se hubiera insertado para que los tests revisen que no viajen
// secretos (hallazgo GK-02).
export const eventosRegistrados: unknown[] = [];
(globalThis as Record<string, unknown>).__eventosAnaliticos = eventosRegistrados;

export async function insertAnalyticsEvent(evento?: unknown): Promise<void> {
  eventosRegistrados.push(evento);
}
