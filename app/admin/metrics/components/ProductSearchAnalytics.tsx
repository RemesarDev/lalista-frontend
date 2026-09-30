'use client';

import React, { useState } from 'react';
import { MagnifyingGlass, Funnel, ChartBar, Package } from '@phosphor-icons/react/dist/ssr';

interface SearchRankingItem {
    ean: string;
    productName: string;
    brand: string;
    comparisonCount: number;
}

export function ProductSearchAnalytics() {
    const [keyword, setKeyword] = useState('');
    const [ranking, setRanking] = useState<SearchRankingItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [totalCatalogMatches, setTotalCatalogMatches] = useState(0);

    // Filtros opcionales adicionales para acotar la búsqueda
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [province, setProvince] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!keyword.trim()) return;

        setLoading(true);
        setSearched(true);

        try {
            const params = new URLSearchParams({
                keyword: keyword.trim(),
                limit: '20',
                ...(startDate && { startDate }),
                ...(endDate && { endDate }),
                ...(province && { province }),
            });

            const res = await fetch(`/api/admin/metrics/ranking-producto-busqueda?${params.toString()}`);
            const json = await res.json();

            if (json.success) {
                setRanking(json.ranking);
                setTotalCatalogMatches(json.totalCoincidenciasCatalogo || 0);
            } else {
                console.error('Error en búsqueda analítica:', json.error);
                setRanking([]);
            }
        } catch (err) {
            console.error('Error de red al consultar búsqueda:', err);
            setRanking([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Formulario de Búsqueda Semántica */}
            <form onSubmit={handleSearch} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex items-center space-x-2 text-gray-800 font-semibold text-sm">
                    <MagnifyingGlass size={18} className="text-orange-500" />
                    <span>Análisis de Métricas por Agrupación de Palabra Clave</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Palabra Clave (Catálogo Base 1)</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <Package size={16} />
                            </span>
                            <input 
                                type="text"
                                placeholder="Ej. Leche, Fideos, Harina, Yerba..."
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                className="w-full text-sm border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Provincia (Opcional)</label>
                        <input 
                            type="text"
                            placeholder="Ej. Buenos Aires"
                            value={province}
                            onChange={(e) => setProvince(e.target.value)}
                            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm py-2.5 px-4 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center space-x-2"
                        >
                            <MagnifyingGlass size={16} />
                            <span>{loading ? 'Analizando...' : 'Buscar y Agrupar'}</span>
                        </button>
                    </div>
                </div>
            </form>

            {/* Resultados de la Búsqueda Analítica */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <ChartBar size={20} className="text-orange-500" />
                        <h3 className="font-bold text-gray-900">
                            {searched ? `Resultados para "${keyword}"` : 'Realiza una búsqueda para ver el análisis'}
                        </h3>
                    </div>
                    {searched && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
                            Coincidencias en catálogo: {totalCatalogMatches} | Mostrando con actividad: {ranking.length}
                        </span>
                    )}
                </div>

                {!searched ? (
                    <div className="py-20 text-center text-gray-400 text-sm">
                        Ingresa una palabra clave arriba para asociar los códigos EAN del catálogo y auditar su rendimiento en la Base de Datos 2.
                    </div>
                ) : loading ? (
                    <div className="py-20 text-center text-gray-400 text-sm">Cruzando datos relacionales y de telemetría...</div>
                ) : ranking.length === 0 ? (
                    <div className="py-20 text-center text-gray-400 text-sm">
                        No se registraron eventos de comparación en la Base 2 para los productos que coinciden con esta palabra clave.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                                    <th className="py-3 px-6">#</th>
                                    <th className="py-3 px-6">Descripción del Producto</th>
                                    <th className="py-3 px-6">Marca</th>
                                    <th className="py-3 px-6">Código EAN</th>
                                    <th className="py-3 px-6 text-right">Comparaciones (Base 2)</th>
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