'use client';

import { useState } from 'react';
import { useListaStore } from './_store/store';
import { supabase } from './_lib/supabase';

// 1. Mapeamos exactamente los tipos reales de tu base de datos
interface ProductoBuscado {
  id_producto: string;
  productos_marca: string | null;
  productos_descripcion: string | null;
}

export default function HomePage() {
  // Traemos las acciones y estados de Zustand
  const { 
    lista, 
    ubicacion, 
    agregarProducto, 
    eliminarProducto, 
    actualizarCantidad, 
    limpiarLista,
    obtenerGpsNavegador 
  } = useListaStore();

  // Estados locales para el buscador bruto
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [resultados, setResultados] = useState<ProductoBuscado[]>([]);
  const [cargandoResultados, setCargandoResultados] = useState(false);

  // 2. Función de búsqueda adaptada a la estructura oficial del SEPA
  const manejarBuscar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminoBusqueda.trim()) return;

    setCargandoResultados(true);
    try {
      const { data, error } = await supabase
        .from('productos') // Tu tabla de catálogo único
        .select('id_producto, productos_marca, productos_descripcion')
        .ilike('productos_descripcion', `%${terminoBusqueda}%`) // Buscador parcial ignorando mayúsculas/minúsculas
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
      <h1>🛒 LALIsta de Compras (Esqueleto Funcional)</h1>
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
              <strong>{prod.productos_descripcion ?? 'Sin descripción'}</strong> - <em>{prod.productos_marca ?? 'Genérico'}</em>{' '}
              <button 
                onClick={() => agregarProducto({
                  id: prod.id_producto,
                  nombre: prod.productos_descripcion || 'Producto sin nombre',
                  marca: prod.productos_marca || 'Genérico'
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
        <h2>📋 Carrito en Memoria ({lista.length} ítems)</h2>
        {lista.length > 0 && (
          <button onClick={limpiarLista} style={{ color: 'red', marginBottom: '10px' }}>
            🗑️ Vaciar Todo
          </button>
        )}

        <table border={1} cellPadding={8} style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#eee' }}>
            <tr>
              <th>ID (SEPA)</th>
              <th>Descripción</th>
              <th>Marca</th>
              <th>Cantidad</th>
              <th>Operación</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((item) => (
              <tr key={item.id}>
                <td style={{ fontSize: '12px', fontFamily: 'monospace' }}>{item.id}</td>
                <td>{item.nombre}</td>
                <td>{item.marca}</td>
                <td>
                  <input 
                    type="number" 
                    value={item.cantidad} 
                    min="1"
                    style={{ width: '60px' }}
                    onChange={(e) => actualizarCantidad(item.id, parseInt(e.target.value) || 1)}
                  />
                </td>
                <td>
                  <button onClick={() => eliminarProducto(item.id)} style={{ color: 'red' }}>
                    Quitar
                  </button>
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
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