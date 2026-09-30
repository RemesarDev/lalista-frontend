'use client';

import React from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react/dist/ssr';

interface MetricEvent {
    id: number;
    event_name: string;
    region: string | null;
    user_id: string | null;
    metadata: Record<string, any>;
    created_at: string;
}

interface MetricsTableProps {
    data: MetricEvent[];
    metadataKeys: string[];
    loading: boolean;
    page: number;
    totalPages: number;
    onPageChange: (newPage: number) => void;
}

export const MetricsTable: React.FC<MetricsTableProps> = ({
    data,
    metadataKeys,
    loading,
    page,
    totalPages,
    onPageChange,
}) => {
    return (
        <div className="bg-black rounded-xl border border-gray-700/60 shadow-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center">
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Detalle de Registros</h2>
                <span className="text-xs text-gray-400">Página {page} de {totalPages || 1}</span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                        <tr className="bg-gray-900/60 text-gray-400 text-xs uppercase border-b border-gray-700">
                            <th className="p-3">ID</th>
                            <th className="p-3">Evento</th>
                            {metadataKeys.map(key => (
                                <th key={key} className="p-3 text-orange-300">{key}</th>
                            ))}
                            <th className="p-3">Región</th>
                            <th className="p-3">Usuario</th>
                            <th className="p-3">Fecha</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50 text-sm text-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={5 + metadataKeys.length} className="text-center py-8 text-gray-400">Cargando datos analíticos...</td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={5 + metadataKeys.length} className="text-center py-8 text-gray-500">No se encontraron registros para los filtros seleccionados.</td>
                            </tr>
                        ) : (
                            data.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-700/30 transition-colors">
                                    <td className="p-3 font-mono text-xs text-gray-400">#{item.id}</td>
                                    <td className="p-3 font-medium text-orange-400">{item.event_name}</td>
                                    
                                    {metadataKeys.map(key => {
                                        const val = item.metadata?.[key];
                                        return (
                                            <td key={key} className="p-3 font-mono text-xs text-gray-300">
                                                {val !== undefined && val !== null 
                                                    ? (typeof val === 'object' ? JSON.stringify(val) : String(val)) 
                                                    : <span className="text-gray-600">-</span>
                                                }
                                            </td>
                                        );
                                    })}

                                    <td className="p-3 text-xs">{item.region || 'N/D'}</td>
                                    <td className="p-3 font-mono text-xs text-gray-400">
                                        {item.user_id || 'Anónimo'}
                                    </td>
                                    <td className="p-3 text-xs text-gray-400">
                                        {new Date(item.created_at).toLocaleString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Controles de Paginación */}
            <div className="px-5 py-3 bg-gray-900/40 border-t border-gray-700 flex items-center justify-between">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1 || loading}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 text-white rounded-lg text-xs flex items-center space-x-1 transition-colors"
                >
                    <CaretLeft size={14} weight="bold" />
                    <span>Anterior</span>
                </button>
                <span className="text-xs text-gray-400">
                    Página <strong>{page}</strong> de <strong>{totalPages || 1}</strong>
                </span>
                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages || loading}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 text-white rounded-lg text-xs flex items-center space-x-1 transition-colors"
                >
                    <span>Siguiente</span>
                    <CaretRight size={14} weight="bold" />
                </button>
            </div>
        </div>
    );
};