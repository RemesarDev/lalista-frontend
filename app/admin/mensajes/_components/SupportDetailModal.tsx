import { SupportMessage } from './SupportTable';

interface SupportDetailModalProps {
  message: SupportMessage;
  onClose: () => void;
  onUpdateStatus: (id: number, newStatus: 'pending' | 'read' | 'resolved') => void;
}

export default function SupportDetailModal({ message, onClose, onUpdateStatus }: SupportDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 capitalize">
            Consulta sobre: {message.subject_category}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 font-bold text-sm"
          >
            ✕
          </button>
        </div>

        <div className="my-4 space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div>
              <span className="block text-xs font-semibold text-slate-400">Remitente:</span>
              <span className="font-semibold text-slate-800">{message.user_name}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-400">Email:</span>
              <a href={`mailto:${message.user_email}`} className="text-orange-600 hover:underline font-medium">
                {message.user_email}
              </a>
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-400">Fecha:</span>
              <span className="text-slate-700">{new Date(message.created_at).toLocaleString()}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-400">Región:</span>
              <span className="text-slate-700">{message.region || 'No especificada'}</span>
            </div>
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-400 mb-1">Mensaje completo:</span>
            <div className="p-4 rounded-xl bg-slate-50 text-slate-700 border border-slate-100 whitespace-pre-wrap max-h-48 overflow-y-auto">
              {message.message}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-semibold text-slate-500">Cambiar Estado:</span>
            <div className="flex gap-2">
              <button
                onClick={() => onUpdateStatus(message.id, 'pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  message.status === 'pending' ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Pendiente
              </button>
              <button
                onClick={() => onUpdateStatus(message.id, 'read')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  message.status === 'read' ? 'bg-blue-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Leído
              </button>
              <button
                onClick={() => onUpdateStatus(message.id, 'resolved')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  message.status === 'resolved' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Resuelto
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <a
            href={`mailto:${message.user_email}?subject=Respuesta a tu consulta de soporte - LALIsta`}
            className="px-4 py-2 rounded-xl bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 transition shadow-sm inline-flex items-center gap-2"
          >
            Responder por Correo
          </a>
        </div>
      </div>
    </div>
  );
}