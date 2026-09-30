'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, MapPin, Funnel } from '@phosphor-icons/react/dist/ssr';

interface RankingItem {
    ean: string;
    productName: string;
    brand: string;
    comparisonCount: number;
}

export function ProductRankingView() {
    const [ranking, setRanking] = useState<RankingItem[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Filtros específicos para este análisis
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [province, setProvince] = useState('');
    const [dayOfWeek, setDayOfWeek] = useState<string>(''); // '' para todos, '0'-'6' para días
    const [limit, setLimit] = useState(15);

    const fetchRanking = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                limit: limit.toString(),
                ...(startDate && { startDate }),
                ...(endDate && { endDate }),
                ...(province && { province }),
                ...(dayOfWeek !== '' && { dayOfWeek }),
            });

            const res = await fetch(`/api/admin/metrics/ranking-productos?${params.toString()}`);
            const json = await res.json();

            if (json.success) {
                setRanking(json.ranking);
            } else {
                console.error('Error al cargar ranking:', json.error);
            }
        } catch (err) {
            console.error('Error de red al consultar ranking:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRanking();
    }, [province, dayOfWeek, limit]);

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchRanking();
    };

    const diasSemana = [
        { label: 'Todos los días', value: '' },
        { label: 'Domingo', value: '0' },
        { label: 'Lunes', value: '1' },
        { label: 'Martes', value: '2' },
        { label: 'Miércoles', value: '3' },
        { label: 'Jueves', value: '4' },
        { label: 'Viernes', value: '5' },
        { label: 'Sábado', value: '6' },
    ];

    return (
        <div className="space-y-6">
            {/* Contenedor de Filtros Específicos */}
            <form onSubmit={handleFilterSubmit} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex items-center space-x-2 text-gray-800 font-semibold text-sm">
                    <Funnel size={18} className="text-orange-500" />
                    <span>Filtros de Análisis Temporal y Espacial</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Desde</label>
                        <input 
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Hasta</label>
                        <input 
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Día de la Semana</label>
                        <select
                            value={dayOfWeek}
                            onChange={(e) => setDayOfWeek(e.target.value)}
                            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            {diasSemana.map((d) => (
                                <option key={d.value} value={d.value}>{d.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Provincia</label>
                        <input 
                            type="text"
                            placeholder="Ej. Buenos Aires"
                            value={province}
                            onChange={(e) => setProvince(e.target.value)}
                            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm py-2 px-4 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                        >
                            {loading ? 'Analizando...' : 'Aplicar Filtros'}
                        </button>
                    </div>
                </div>
            </form>

            {/* Tabla de Resultados */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Trophy size={20} className="text-orange-500" />
                        <h3 className="font-bold text-gray-900">Productos Más Comparados</h3>
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
                        Mostrando top {ranking.length}
                    </span>
                </div>

                {loading ? (
                    <div className="py-20 text-center text-gray-400 text-sm">Calculando agregaciones en Base 2...</div>
                ) : ranking.length === 0 ? (
                    <div className="py-20 text-center text-gray-400 text-sm">No hay registros de comparaciones con estos filtros.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                                    <th className="py-3 px-6">#</th>
                                    <th className="py-3 px-6">Producto</th>
                                    <th className="py-3 px-6">Marca</th>
                                    <th className="py-3 px-6">EAN / Código</th>
                                    <th className="py-3 px-6 text-right">Comparaciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 text-sm">
                                {ranking.map((item, idx) => (
                                    <tr key={item.ean} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="py-3 px-6 font-medium text-gray-400">{idx + 1}</td>
                                        <td className="py-3 px-6 font-semibold text-gray-900">{item.productName}</td>
                                        <td className="py-3 px-6 text-gray-600">{item.brand}</td>
                                        <td className="py-3 px-6 font-mono text-xs text-gray-500">{item.ean}</td>
                                        <td className="py-3 px-6 text-right font-bold text-orange-600">
                                            {item.comparisonCount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}