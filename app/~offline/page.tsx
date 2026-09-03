export default function Offline() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="text-2xl font-bold">Estás sin conexión</h1>
      <p className="text-slate-600">
        No pudimos cargar esta página. Revisá tu conexión e intentá de nuevo.
      </p>
      <p className="text-sm text-slate-500">
        Tu lista de compras sigue disponible sin internet.
      </p>
    </main>
  );
}