'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SupportFilters from './_components/SupportFilters';
import SupportTable, { SupportMessage } from './_components/SupportTable';
import SupportDetailModal from './_components/SupportDetailModal';

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);

  // Estados de filtros
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [emailFilter, setEmailFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category !== 'all') params.append('category', category);
      if (status !== 'all') params.append('status', status);
      if (emailFilter) params.append('email', emailFilter);
      if (regionFilter !== 'all') params.append('region', regionFilter);

      const res = await fetch(`/api/admin/support-messages?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Error al cargar mensajes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [category, status, regionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMessages();
  };

  const updateMessageStatus = async (id: number, newStatus: 'pending' | 'read' | 'resolved') => {
    try {
      const res = await fetch(`/api/admin/support-messages/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
        );
        if (selectedMessage && selectedMessage.id === id) {
          setSelectedMessage((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      }
    } catch (err) {
      console.error('Error al actualizar estado:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin" className="text-sm font-medium text-orange-600 hover:underline mb-1 inline-block">
            ← Volver al Panel Admin
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Mensajes de Soporte</h1>
        </div>
      </div>

      <SupportFilters
        search={search}
        setSearch={setSearch}
        emailFilter={emailFilter}
        setEmailFilter={setEmailFilter}
        category={category}
        setCategory={setCategory}
        status={status}
        setStatus={setStatus}
        onFilterSubmit={handleSearchSubmit}
      />

      <SupportTable
        messages={messages}
        loading={loading}
        onSelectMessage={(msg) => setSelectedMessage(msg)}
      />

      {selectedMessage && (
        <SupportDetailModal
          message={selectedMessage}
          onClose={() => setSelectedMessage(null)}
          onUpdateStatus={updateMessageStatus}
        />
      )}
    </div>
  );
}