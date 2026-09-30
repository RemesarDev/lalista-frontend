'use client';

import React, { useMemo } from 'react';

interface MetricEvent {
    id: number;
    created_at: string;
}

interface MetricsChartProps {
    data: MetricEvent[];
    loading: boolean;
    totalItems: number;
}

export const MetricsChart: React.FC<MetricsChartProps> = ({ data, loading, totalItems }) => {
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        const counts: Record<string, number> = {};
        data.forEach(item => {
            const dateStr = new Date(item.created_at).toISOString().split('T')[0];
            counts[dateStr] = (counts[dateStr] || 0) + 1;
        });

        return Object.keys(counts)
            .sort()
            .map(date => ({
                date,
                count: counts[date]
            }));
    }, [data]);

    const maxChartCount = useMemo(() => {
        if (chartData.length === 0) return 1;
        return Math.max(...chartData.map(d => d.count));
    }, [chartData]);

    return (
        <div className="bg-black p-5 rounded-xl border border-gray-700/60 shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Evolución Temporal de Visitas</h2>
                <span className="text-xs text-gray-400">Total registros analizados: <strong>{totalItems}</strong></span>
            </div>

            {loading ? (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                    Generando gráfico...
                </div>
            ) : chartData.length === 0 ? (
                <div className="h-48 flex items-center justify-center border border-dashed border-gray-700 rounded-lg text-gray-500 text-sm">
                    No hay datos suficientes en esta página para graficar la evolución temporal.
                </div>
            ) : (
                <div className="h-52 w-full flex flex-col justify-end pt-4 pb-2">
                    <div className="flex items-end justify-between h-36 gap-2 border-b border-gray-700/60 pb-2 px-2">
                        {chartData.map((item, idx) => {
                            const heightPercentage = Math.round((item.count / maxChartCount) * 100);
                            return (
                                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                                    <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow border border-gray-700 whitespace-nowrap z-10 pointer-events-none">
                                        {item.date}: <strong>{item.count}</strong> visitas
                                    </div>
                                    <span className="text-[10px] text-gray-400 mb-1">{item.count}</span>
                                    <div 
                                        style={{ height: `${Math.max(heightPercentage, 8)}%` }}
                                        className="w-full max-w-[40px] bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-md transition-all duration-300 group-hover:brightness-110 shadow-sm"
                                    />
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex justify-between pt-2 px-2 text-[11px] text-gray-400 font-mono">
                        {chartData.map((item, idx) => (
                            <span key={idx} className="truncate text-center flex-1">{item.date}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};