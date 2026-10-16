// Stub de "next/server" para las suites offline. auth.ts solo usa after() para
// mandar mails en segundo plano; fuera de Next se ejecuta en el momento.
// (El paquete "next" no expone next/server como modulo ESM resoluble por Node.)
export function after(tarea: (() => unknown) | Promise<unknown>): void {
  void (typeof tarea === 'function' ? tarea() : tarea);
}
