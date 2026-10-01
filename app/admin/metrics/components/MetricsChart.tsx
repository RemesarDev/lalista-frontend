'use client';

import React, { useMemo } from 'react';

// 1. Definimos la estructura exacta que entrega el nuevo endpoint y el RPC
interface TimelineItem {
    metric_date: string;
    event_count: number;
}

interface MetricsChartProps {
    data: TimelineItem[]; // Recibe los datos ya agrupados por fecha
    loading: boolean;
    totalItems: number;
}

export const MetricsChart: React.FC<MetricsChartProps> = ({ data, loading, totalItems }) => {
    // 2. Procesamos el array sintetizado para el gráfico
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        return data.map(item => ({
            date: item.metric_date,
            count: Number(item.event_count)
        })).sort((a, b) => a.date.localeCompare(b.date));
    }, [data]);

    const maxChartCount = useMemo(() => {
        if (chartData.length === 0) return 5;
        const max = Math.max(...chartData.map(d => d.count));
        return max === 0 ? 5 : max;
    }, [chartData]);

    const midChartCount = Math.round(maxChartCount / 2);

    return (
        <div className="bg-black p-5 rounded-xl border border-gray-700/60 shadow-lg">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Evolución Temporal de Visitas</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Progreso global según filtros aplicados</p>
                </div>
                <span className="text-xs text-gray-400 bg-gray-900 px-2.5 py-1 rounded-md border border-gray-800">
                    Total analizado: <strong>{totalItems}</strong>
                </span>
            </div>

            {loading ? (
                <div className="h-56 flex items-center justify-center text-gray-400 text-sm">
                    Generando gráfico optimizado...
                </div>
            ) : chartData.length === 0 ? (
                <div className="h-56 flex items-center justify-center border border-dashed border-gray-700 rounded-lg text-gray-500 text-sm">
                    No hay datos suficientes para graficar en este rango o filtro.
                </div>
            ) : (
                <div className="relative pl-10 pr-2 pt-2 pb-6">
                    {/* EJE Y */}
                    <div className="absolute left-0 top-2 bottom-8 w-8 flex flex-col justify-between text-[10px] text-gray-500 font-mono text-right pr-2">
                        <span>{maxChartCount}</span>
                        <span>{midChartCount}</span>
                        <span>0</span>
                    </div>

                    <div className="absolute left-10 right-2 top-2 bottom-8 flex flex-col justify-between pointer-events-none">
                        <div className="border-b border-gray-800 w-full" />
                        <div className="border-b border-gray-800 w-full border-dashed" />
                        <div className="border-b border-gray-700 w-full" />
                    </div>

                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-semibold text-gray-500 tracking-wider uppercase">
                        Visitas
                    </div>

                    {/* ZONA DE BARRAS */}
                    <div className="h-44 w-full flex items-end justify-around gap-4 border-b border-gray-600 relative z-10 pl-2">
                        {chartData.map((item, idx) => {
                            const heightPercentage = Math.max(Math.round((item.count / maxChartCount) * 100), 4);
                            
                            return (
                                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative max-w-[60px]">
                                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[11px] px-2.5 py-1 rounded shadow-md border border-gray-700 whitespace-nowrap z-20 pointer-events-none">
                                        {item.date}: <strong>{item.count}</strong> visitas
                                    </div>

                                    <span className="text-[10px] text-gray-300 font-mono mb-1 font-semibold">
                                        {item.count}
                                    </span>

                                    <div 
                                        style={{ height: `${heightPercentage}%` }}
                                        className="w-full bg-gradient-to-t from-orange-600 to-amber-400 rounded-t-sm transition-all duration-300 group-hover:brightness-120 shadow-sm"
                                    />
                                </div>
                            );
                        })}
                    </div>

                    {/* EJE X */}
                    <div className="flex justify-around pt-3 pl-2 text-[11px] text-gray-400 font-mono">
                        {chartData.map((item, idx) => (
                            <span key={idx} className="truncate text-center flex-1 max-w-[60px]">
                                {item.date}
                            </span>
                        ))}
                    </div>

                    <div className="text-center text-[10px] font-semibold text-gray-500 tracking-wider uppercase mt-2">
                        Fecha (Eje X)
                    </div>
                </div>
            )}
        </div>
    );
};