'use client';

import { useState } from 'react';
import { useListaStore } from '../../_store/store';
import { supabase } from '../../_lib/supabase';

interface ProductoBuscado {
  id_producto: string;
  productos_descripcion: string | null;
}

export default function DebugPage() {
  const { 
    lista, 
    ubicacion, 
    agregarProducto, 
    eliminarGrupo,
    actualizarCantidadGrupo,
    limpiarLista,
    obtenerGpsNavegador 
  } = useListaStore();

  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [resultados, setResultados] = useState<ProductoBuscado[]>([]);
  const [cargandoResultados, setCargandoResultados] = useState(false);

  const manejarBuscar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminoBusqueda.trim()) return;

    setCargandoResultados(true);
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('id_producto, productos_descripcion')
        .ilike('productos_descripcion', `%${terminoBusqueda}%`)
        .limit(15);

      if (error) throw error;
      setResultados(data || []);
    } catch (err) {
      console.error('Error al buscar productos:', err);
      alert('Hubo un error al buscar en la base de datos de Supabase.');
    } finally {
      setCargandoResultados(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>🛒 LALIsta de Compras (Entorno de Debug)</h1>
      <p style={{ color: '#666' }}>Entorno de prueba directo contra base de datos activa.</p>
      <hr />

      {/* SECCIÓN 1: UBICACIÓN Y GPS */}
      <section style={{ marginBottom: '30px' }}>
        <h2>📍 Sensor de Ubicación</h2>
        <button onClick={obtenerGpsNavegador} disabled={ubicacion.cargandoUbicacion}>
          {ubicacion.cargandoUbicacion ? '⌛ Solicitando coordenadas...' : '🔄 Disparar GPS del Navegador'}
        </button>
        
        <p><strong>Latitud actual:</strong> {ubicacion.latitud ?? 'No capturada'}</p>
        <p><strong>Longitud actual:</strong> {ubicacion.longitud ?? 'No capturada'}</p>
        <p><strong>Precisión del sensor:</strong> {ubicacion.precision ? `${ubicacion.precision} metros` : 'N/C'}</p>
        <p><strong>Radio configurado:</strong> {ubicacion.radioBusqueda} km</p>
      </section>

      <hr />

      {/* SECCIÓN 2: BUSCADOR CONTRA TABLA PRODUCTOS */}
      <section style={{ marginBottom: '30px' }}>
        <h2>🔍 Consultar Catálogo Único</h2>
        <form onSubmit={manejarBuscar}>
          <input 
            type="text" 
            placeholder="Ej: Leche, Yerba, Fideos..." 
            value={terminoBusqueda}
            onChange={(e) => setTerminoBusqueda(e.target.value)}
          />
          <button type="submit">Consultar</button>
        </form>

        {cargandoResultados && <p style={{ color: 'blue' }}>Conectando a Supabase...</p>}

        <ul>
          {resultados.map((prod) => (
            <li key={prod.id_producto} style={{ margin: '12px 0' }}>
              <strong>{prod.productos_descripcion ?? 'Sin descripción'}</strong> - {' '}
              <button 
                onClick={() => agregarProducto({
                  id: prod.id_producto,
                  nombre: prod.productos_descripcion || 'Producto sin nombre',
                  url_imagen: null,
                  sucursales: [],
                  cantidadOpcion: 1, // Fix para TypeScript
                })}
              >
                ➕ Agregar a mi Lista
              </button>
            </li>
          ))}
          {!cargandoResultados && resultados.length === 0 && terminoBusqueda && (
            <p style={{ color: 'red' }}>No se encontraron coincidencias.</p>
          )}
        </ul>
      </section>

      <hr />

      {/* SECCIÓN 3: RENDIMIENTO DEL STORE DE ZUSTAND */}
      <section>
        <h2>📋 Carrito en Memoria ({lista.length} grupos disyuntivos)</h2>
        {lista.length > 0 && (
          <button onClick={limpiarLista} style={{ color: 'red', marginBottom: '10px' }}>
            🗑️ Vaciar Todo
          </button>
        )}

        <table border={1} cellPadding={8} style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#eee' }}>
            <tr>
              <th>ID Grupo</th>
              <th>Opciones (Principal + Alternativas)</th>
              <th>Cant. Grupo</th>
              <th>Operación</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((item) => (
              <tr key={item.grupoId}>
                <td style={{ fontSize: '12px', fontFamily: 'monospace' }}>{item.grupoId}</td>
                <td>
                  <ul style={{ margin: 0, paddingLeft: '18px' }}>
                    {item.opciones.map((op, idx) => (
                      <li key={op.id}>
                        {idx === 0 ? <strong>[Principal] </strong> : <span>[Alt] </span>}
                        {op.nombre} (x{op.cantidadOpcion || 1})
                      </li>
                    ))}
                  </ul>
                </td>
                <td>
                  <input 
                    type="number" 
                    value={item.cantidad} 
                    min="1"
                    style={{ width: '60px' }}
                    onChange={(e) => actualizarCantidadGrupo(item.grupoId, parseInt(e.target.value) || 1)}
                  />
                </td>
                <td>
                  <button onClick={() => eliminarGrupo(item.grupoId)} style={{ color: 'red' }}>
                    Quitar
                  </button>
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>
                  El store local está vacío. Usá el buscador de arriba.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}