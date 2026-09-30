'use client';

import React from 'react';
import { MagnifyingGlass, Funnel } from '@phosphor-icons/react/dist/ssr';

interface MetricsFiltersProps {
    metricName: string;
    setMetricName: (val: string) => void;
    field: string;
    setField: (val: string) => void;
    search: string;
    setSearch: (val: string) => void;
    startDate: string;
    setStartDate: (val: string) => void;
    endDate: string;
    setEndDate: (val: string) => void;
    loading: boolean;
    onSubmit: (e: React.FormEvent) => void;
}

export const MetricsFilters: React.FC<MetricsFiltersProps> = ({
    metricName,
    setMetricName,
    field,
    setField,
    search,
    setSearch,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    loading,
    onSubmit,
}) => {
    return (
        <form onSubmit={onSubmit} className="bg-black p-4 rounded-xl border border-gray-700/60 shadow-lg grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            {/* Selector de Métrica */}
            <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Métrica</label>
                <select 
                    value={metricName}
                    onChange={(e) => setMetricName(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                >
                    <optgroup label="📊 Métricas Clásicas">
                        <option value="page_view">Visitas a Página (page_view)</option>
                        <option value="product_searched">Búsquedas de Productos</option>
                        <option value="prices_compared">Comparativas de Precios</option>
                        <option value="api_error">Errores de API</option>
                    </optgroup>
                    <optgroup label="👤 Ciclo de Usuario y Sistema">
                        <option value="user_signup">Registro de Usuario (user_signup)</option>
                        <option value="user_login">Inicio de Sesión (user_login)</option>
                        <option value="user_deleted">Usuario Eliminado (user_deleted)</option>
                        <option value="lista_sharing">Compartir Lista (lista_sharing)</option>
                    </optgroup>
                </select>
            </div>

            {/* Selector de Campo */}
            <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Filtrar por Campo</label>
                <select 
                    value={field}
                    onChange={(e) => setField(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                >
                    <option value="path">Ruta (Path)</option>
                    <option value="region">Región / Ciudad</option>
                    <option value="user_id">ID de Usuario</option>
                </select>
            </div>

            {/* Input de Búsqueda */}
            <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Término de Búsqueda</label>
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                        <MagnifyingGlass size={16} weight="bold" />
                    </span>
                    <input 
                        type="text"
                        placeholder="Ej. /buscar, Buenos Aires..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                    />
                </div>
            </div>

            {/* Rango de Fechas */}
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Desde</label>
                    <input 
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-orange-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Hasta</label>
                    <input 
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-orange-500"
                    />
                </div>
            </div>

            {/* Botón Consultar */}
            <div>
                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 shadow-md shadow-orange-500/20"
                >
                    <Funnel size={16} weight="bold" />
                    <span>{loading ? 'Consultando...' : 'Consultar'}</span>
                </button>
            </div>
        </form>
    );
};