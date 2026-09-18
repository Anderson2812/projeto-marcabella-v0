'use client';

import React, { useMemo, useState } from 'react';
import { useAppStore } from '@/lib/use-app-store';
import { Professional, Booking } from '@/types';
import { User, MessageCircle, Calendar, Star, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { openWhatsAppSafely } from '@/lib/validation-utils';
import { formatDatePtBr } from '@/lib/calendar-utils';

interface AdminCRMProps {
  professional: Professional;
}

export default function AdminCRM({ professional }: AdminCRMProps) {
  const { bookings } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');

  // Generate unique client profiles from bookings
  const clientProfiles = useMemo(() => {
    const profBookings = bookings.filter(b => b.professionalId === professional.id);
    const clientsMap = new Map<string, any>();

    profBookings.forEach(b => {
      const phone = b.clientPhone.replace(/\D/g, ''); // Normalize phone as ID
      if (!phone) return;

      if (!clientsMap.has(phone)) {
        clientsMap.set(phone, {
          name: b.clientName,
          phone: b.clientPhone,
          firstVisit: b.date,
          lastVisit: b.date,
          totalSpent: 0,
          totalBookings: 0,
          completedBookings: 0,
          cancelledBookings: 0,
          noShows: 0, // In this model, cancelled could be no-show
          favoriteServices: new Map<string, number>()
        });
      }

      const c = clientsMap.get(phone)!;
      c.totalBookings += 1;
      
      // Track dates
      if (b.date < c.firstVisit) c.firstVisit = b.date;
      if (b.date > c.lastVisit) c.lastVisit = b.date;

      // Track status and spend
      if (b.status === 'completed') {
        c.completedBookings += 1;
        c.totalSpent += b.totalPrice;
      } else if (b.status === 'cancelled') {
        c.cancelledBookings += 1;
      }

      // Track services
      const svcCount = c.favoriteServices.get(b.serviceName) || 0;
      c.favoriteServices.set(b.serviceName, svcCount + 1);
    });

    const clientsArray = Array.from(clientsMap.values()).map(c => {
      // Find top service
      let topSvc = '';
      let maxCount = 0;
      c.favoriteServices.forEach((count: number, name: string) => {
        if (count > maxCount) {
          maxCount = count;
          topSvc = name;
        }
      });
      c.topService = topSvc;
      return c;
    });

    // Sort by last visit descending
    return clientsArray.sort((a, b) => b.lastVisit.localeCompare(a.lastVisit));
  }, [bookings, professional.id]);

  const filteredClients = useMemo(() => {
    if (!searchTerm) return clientProfiles;
    const q = searchTerm.toLowerCase();
    return clientProfiles.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q));
  }, [clientProfiles, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="serif text-2xl font-bold text-[#2D2D2A] dark:text-zinc-100 tracking-tight">
            Gestão de Clientes (CRM)
          </h2>
          <p className="text-[#706B5F] dark:text-zinc-400 text-sm mt-1">
            Conheça o comportamento, histórico e fidelidade da sua base de clientes.
          </p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nome ou celular..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-[#E9E2D7] dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:border-[#5A5A40] dark:focus:border-zinc-500 shadow-xs"
          />
          <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700">
          <div className="flex items-center gap-2 text-[#706B5F] dark:text-zinc-400 mb-1">
            <User className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Total de Clientes</span>
          </div>
          <p className="text-2xl font-black text-[#2D2D2A] dark:text-zinc-100">{clientProfiles.length}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Média Atend.</span>
          </div>
          <p className="text-2xl font-black text-[#2D2D2A] dark:text-zinc-100">
            {clientProfiles.length > 0 ? (clientProfiles.reduce((acc, c) => acc + c.completedBookings, 0) / clientProfiles.length).toFixed(1) : 0}
          </p>
        </div>
      </div>

      {/* Clients List */}
      <div className="bg-white dark:bg-zinc-900 border border-[#E9E2D7] dark:border-zinc-700 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#F8F6F2] dark:bg-zinc-800 text-[#706B5F] dark:text-zinc-400 text-xs font-bold uppercase tracking-wider border-b border-[#E9E2D7] dark:border-zinc-700">
              <tr>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Última Visita</th>
                <th className="px-6 py-4">Agendamentos</th>
                <th className="px-6 py-4">Taxa Cancel.</th>
                <th className="px-6 py-4">Total Gasto</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9E2D7] dark:divide-zinc-800">
              {filteredClients.map((c, i) => {
                const cancelRate = c.totalBookings > 0 ? (c.cancelledBookings / c.totalBookings) * 100 : 0;
                
                return (
                  <tr key={i} className="hover:bg-stone-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#2D2D2A] dark:text-zinc-100">{c.name}</span>
                        <span className="text-xs text-[#706B5F] dark:text-zinc-400">{c.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#706B5F] dark:text-zinc-300">
                      {formatDatePtBr(c.lastVisit)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">{c.completedBookings} concluídos</span>
                        <span className="text-[10px] text-stone-500">de {c.totalBookings} no total</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        cancelRate > 30 ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' :
                        cancelRate > 10 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                      }`}>
                        {cancelRate > 30 && <AlertTriangle className="w-3 h-3" />}
                        {cancelRate.toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-[#2D2D2A] dark:text-zinc-100">
                      R$ {c.totalSpent.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openWhatsAppSafely(c.phone, `Olá ${c.name}! Aqui é da ${professional.name}.`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Mensagem
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#706B5F] dark:text-zinc-400">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
