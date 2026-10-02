'use client';

import React, { useEffect, useState } from 'react';

interface BackupFile {
  id: string;
  name: string;
  updated_at: string;
  created_at: string;
  metadata?: {
    size: number;
    mimetype: string;
  };
}

export default function BackupAdminPage() {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/backups');
      const data = await res.json();

      if (data.success) {
        setBackups(data.backups || []);
      } else {
        setError(data.error || 'Error al obtener los respaldos');
      }
    } catch (err) {
      setError('Error de red al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleDownload = async (filename: string) => {
    try {
      setDownloadingFile(filename);
      const res = await fetch(`/api/admin/backups/download?filename=${encodeURIComponent(filename)}`);
      const data = await res.json();

      if (data.success && data.downloadUrl) {
        // Abre la URL firmada temporal en una nueva pestaña para disparar la descarga
        window.open(data.downloadUrl, '_blank');
      } else {
        alert('No se pudo generar el enlace de descarga: ' + (data.error || 'Error desconocido'));
      }
    } catch (err) {
      alert('Error al intentar descargar el archivo.');
    } finally {
      setDownloadingFile(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Panel de Respaldos Estructurales</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestión y descarga de los respaldos DDL semanales de las bases de datos (Main y Test).
          </p>
        </div>
        <button
          onClick={fetchBackups}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          Actualizar lista
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 text-red-700 text-sm rounded-r-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20 text-gray-500 bg-white rounded-xl border border-gray-100 shadow-sm">
          Cargando respaldos desde Supabase Storage...
        </div>
      ) : backups.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
          No hay respaldos disponibles en este momento.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th className="p-4">Archivo</th>
                  <th className="p-4">Base de Datos</th>
                  <th className="p-4">Fecha de Creación</th>
                  <th className="p-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {backups.map((file) => {
                  const isMain = file.name.includes('_main_');
                  return (
                    <tr key={file.id || file.name} className="hover:bg-gray-50/50 transition">
                      <td className="p-4 font-mono text-gray-800 text-xs md:text-sm">
                        {file.name}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isMain
                              ? 'bg-blue-50 text-blue-700 border border-blue-100'
                              : 'bg-purple-50 text-purple-700 border border-purple-100'
                          }`}
                        >
                          {isMain ? 'Main' : 'Test'}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500 text-xs">
                        {new Date(file.created_at || file.updated_at).toLocaleString()}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDownload(file.name)}
                          disabled={downloadingFile === file.name}
                          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium transition shadow-sm inline-flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                        >
                          {downloadingFile === file.name ? 'Generando...' : 'Descargar .sql'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}