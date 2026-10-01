'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChartBar, Trophy, ListMagnifyingGlass, MagnifyingGlass } from '@phosphor-icons/react/dist/ssr';
import { MetricsFilters } from './components/MetricsFilters';
import { MetricsChart } from './components/MetricsChart';
import { MetricsTable } from './components/MetricsTable';
import { ProductRankingView } from './components/ProductRankingView';
import { ProductSearchAnalytics } from './components/ProductSearchAnalytics';

interface MetricEvent {
    id: number;
    event_name: string;
    region: string | null;
    user_id: string | null;
    metadata: Record<string, any>;
    created_at: string;
}

interface TimelineItem {
    metric_date: string;
    event_count: number;
}

export default function AdminMetricsPage() {
    const [activeTab, setActiveTab] = useState<'audit' | 'ranking' | 'search'>('audit');

    // Estados para Auditoría (Tab 1)
    const [metricName, setMetricName] = useState('page_view');
    const [search, setSearch] = useState('');
    const [field, setField] = useState('path');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    // Estados específicos de la tabla paginada
    const [data, setData] = useState<MetricEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Estados específicos para el gráfico optimizado (timeline histórico completo filtrado)
    const [chartData, setChartData] = useState<TimelineItem[]>([]);
    const [chartLoading, setChartLoading] = useState(false);

    // 1. Petición paginada para la Tabla
    const fetchMetrics = async (targetPage = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                metricName,
                page: targetPage.toString(),
                limit: '15',
                ...(search && { search }),
                ...(field && { field }),
                ...(startDate && { startDate }),
                ...(endDate && { endDate }),
            });

            const res = await fetch(`/api/admin/metrics?${params.toString()}`);
            const json = await res.json();

            if (json.success) {
                setData(json.data);
                setTotalPages(json.pagination.totalPages);
                setTotalItems(json.pagination.totalItems);
                setPage(json.pagination.page);
            } else {
                console.error('Error al cargar métricas:', json.error);
            }
        } catch (err) {
            console.error('Error de red al consultar métricas:', err);
        } finally {
            setLoading(false);
        }
    };

    // 2. Petición optimizada vía RPC para el Gráfico (agrupado por fecha con filtros)
    const fetchChartSummary = useCallback(async () => {
        setChartLoading(true);
        try {
            const params = new URLSearchParams({
                metricName,
                ...(search && { search }),
                ...(field && { field }),
                ...(startDate && { startDate }),
                ...(endDate && { endDate }),
            });

            const res = await fetch(`/api/admin/metrics/chart-summary?${params.toString()}`);
            const json = await res.json();

            if (json.success) {
                setChartData(json.timeline);
            } else {
                console.error('Error al cargar resumen para el gráfico:', json.error);
            }
        } catch (err) {
            console.error('Error de red al consultar el resumen del gráfico:', err);
        } finally {
            setChartLoading(false);
        }
    }, [metricName, search, field, startDate, endDate]);

    // Disparar ambas cargas cuando cambia la métrica principal o se activa la pestaña
    useEffect(() => {
        if (activeTab === 'audit') {
            fetchMetrics(1);
            fetchChartSummary();
        }
    }, [metricName, activeTab, fetchChartSummary]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchMetrics(1);
        fetchChartSummary();
    };

    const metadataKeys = useMemo(() => {
        const keysSet = new Set<string>();
        data.forEach(item => {
            if (item.metadata && typeof item.metadata === 'object') {
                Object.keys(item.metadata).forEach(k => keysSet.add(k));
            }
        });
        return Array.from(keysSet);
    }, [data]);

    return (
        <div className="space-y-6 p-6 max-w-7xl mx-auto">
            {/* Título y Botones de Pestañas */}
            <div className="border-b border-gray-200 pb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-orange-500/10 text-orange-500 rounded-lg border border-orange-500/20">
                        <ChartBar size={24} weight="bold" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-black">Panel de Métricas y Analíticas</h1>
                        <p className="text-sm text-gray-500">
                            Auditoría de eventos e inteligencia de negocio basada en Bases de Datos distribuidas.
                        </p>
                    </div>
                </div>

                {/* Botones de Navegación / Pestañas */}
                <div className="flex flex-wrap bg-gray-100 p-1 rounded-xl border border-gray-200 gap-1">
                    <button
                        onClick={() => setActiveTab('audit')}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            activeTab === 'audit' 
                                ? 'bg-white text-gray-900 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        <ListMagnifyingGlass size={16} />
                        <span>Auditoría Cruda</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('ranking')}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            activeTab === 'ranking' 
                                ? 'bg-white text-gray-900 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        <Trophy size={16} />
                        <span>Top Ranking</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('search')}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            activeTab === 'search' 
                                ? 'bg-white text-gray-900 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        <MagnifyingGlass size={16} />
                        <span>Análisis por Búsqueda</span>
                    </button>
                </div>
            </div>

            {/* Contenido según la Pestaña Activa */}
            {activeTab === 'audit' && (
                <div className="space-y-6">
                    <MetricsFilters 
                        metricName={metricName}
                        setMetricName={setMetricName}
                        field={field}
                        setField={setField}
                        search={search}
                        setSearch={setSearch}
                        startDate={startDate}
                        setStartDate={setStartDate}
                        endDate={endDate}
                        setEndDate={setEndDate}
                        loading={loading || chartLoading}
                        onSubmit={handleSearchSubmit}
                    />
                    <MetricsChart 
                        data={chartData}
                        loading={chartLoading}
                        totalItems={totalItems}
                    />
                    <MetricsTable 
                        data={data}
                        metadataKeys={metadataKeys}
                        loading={loading}
                        page={page}
                        totalPages={totalPages}
                        onPageChange={(newPage) => fetchMetrics(newPage)}
                    />
                </div>
            )}

            {activeTab === 'ranking' && <ProductRankingView />}

            {activeTab === 'search' && <ProductSearchAnalytics />}
        </div>
    );
}