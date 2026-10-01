export interface SupportMessage {
  id: number;
  user_id: string;
  user_name: string;
  user_email: string;
  subject_category: string;
  message: string;
  region: string | null;
  status: 'pending' | 'read' | 'resolved';
  created_at: string;
}

interface SupportTableProps {
  messages: SupportMessage[];
  loading: boolean;
  onSelectMessage: (msg: SupportMessage) => void;
}

export default function SupportTable({ messages, loading, onSelectMessage }: SupportTableProps) {
  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'pending':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Pendiente</span>;
      case 'read':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">Leído</span>;
      case 'resolved':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">Resuelto</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {loading ? (
        <div className="p-8 text-center text-slate-500">Cargando mensajes...</div>
      ) : messages.length === 0 ? (
        <div className="p-8 text-center text-slate-500">No se encontraron mensajes con los filtros seleccionados.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="p-4">Fecha</th>
                <th className="p-4">Usuario</th>
                <th className="p-4">Categoría</th>
                <th className="p-4">Mensaje</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {messages.map((msg) => (
                <tr
                  key={msg.id}
                  className="hover:bg-slate-50/50 transition cursor-pointer"
                  onClick={() => onSelectMessage(msg)}
                >
                  <td className="p-4 text-slate-500 whitespace-nowrap">
                    {new Date(msg.created_at).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-slate-800">{msg.user_name}</div>
                    <div className="text-xs text-slate-400">{msg.user_email}</div>
                  </td>
                  <td className="p-4">
                    <span className="capitalize font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg text-xs">
                      {msg.subject_category}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600 max-w-xs truncate">{msg.message}</td>
                  <td className="p-4 whitespace-nowrap">{getStatusBadge(msg.status)}</td>
                  <td className="p-4 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectMessage(msg);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition"
                    >
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}