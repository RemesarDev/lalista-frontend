interface SupportFiltersProps {
  search: string;
  setSearch: (val: string) => void;
  emailFilter: string;
  setEmailFilter: (val: string) => void;
  category: string;
  setCategory: (val: string) => void;
  status: string;
  setStatus: (val: string) => void;
  onFilterSubmit: (e: React.FormEvent) => void;
}

export default function SupportFilters({
  search,
  setSearch,
  emailFilter,
  setEmailFilter,
  category,
  setCategory,
  status,
  setStatus,
  onFilterSubmit,
}: SupportFiltersProps) {
  return (
    <form
      onSubmit={onFilterSubmit}
      className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
    >
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
          Buscar palabra
        </label>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="En el mensaje..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
          Filtrar por Email
        </label>
        <input
          type="text"
          value={emailFilter}
          onChange={(e) => setEmailFilter(e.target.value)}
          placeholder="usuario@correo.com"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
          Categoría
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">Todas</option>
          <option value="precios">Precios / Datos</option>
          <option value="cuenta">Mi Cuenta</option>
          <option value="sugerencia">Sugerencia</option>
          <option value="error">Reportar Error</option>
          <option value="otro">Otro</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
          Estado
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">Todos</option>
          <option value="pending">Pendientes</option>
          <option value="read">Leídos</option>
          <option value="resolved">Resueltos</option>
        </select>
      </div>

      <div className="flex items-end">
        <button
          type="submit"
          className="w-full py-2 rounded-xl bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 transition shadow-sm"
        >
          Filtrar
        </button>
      </div>
    </form>
  );
}