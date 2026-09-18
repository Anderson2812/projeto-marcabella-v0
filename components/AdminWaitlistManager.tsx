'use client';

import React, { useState } from 'react';
import { 
  Hourglass, 
  MessageCircle, 
  CheckCircle2, 
  Trash2, 
  User, 
  Calendar as CalendarIcon, 
  Clock, 
  Search, 
  Sparkles,
  Plus,
  X
} from 'lucide-react';
import { Professional, WaitlistEntry } from '@/types';
import { formatDatePtBr, formatPhoneMask } from '@/lib/whatsapp-utils';
import { useAppStore } from '@/lib/use-app-store';

interface Props {
  professional: Professional;
}

export default function AdminWaitlistManager({ professional }: Props) {
  const { 
    getWaitlistForProf, 
    updateWaitlistStatus, 
    deleteWaitlistEntry,
    createManualBooking,
    services
  } = useAppStore();

  const waitlistEntries = getWaitlistForProf(professional.id);
  const profServices = services.filter(s => s.professionalId === professional.id);

  const [filterDate, setFilterDate] = useState<string>('');
  const [encaixeModalEntry, setEncaixeModalEntry] = useState<WaitlistEntry | null>(null);
  const [encaixeTime, setEncaixeTime] = useState('14:00');
  const [encaixeServiceId, setEncaixeServiceId] = useState('');

  // Filtragem
  const filteredEntries = waitlistEntries.filter(w => {
    if (filterDate && w.desiredDate !== filterDate) return false;
    return true;
  });

  const handleOpenEncaixe = (w: WaitlistEntry) => {
    setEncaixeModalEntry(w);
    // Tenta pré-selecionar o primeiro serviço
    if (w.serviceIds && w.serviceIds.length > 0) {
      setEncaixeServiceId(w.serviceIds[0]);
    } else if (profServices.length > 0) {
      setEncaixeServiceId(profServices[0].id);
    }
  };

  const handleConfirmEncaixe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!encaixeModalEntry || !encaixeServiceId) return;

    const serv = profServices.find(s => s.id === encaixeServiceId);
    if (!serv) return;

    createManualBooking({
      professionalId: professional.id,
      clientName: encaixeModalEntry.clientName,
      clientPhone: encaixeModalEntry.clientPhone,
      serviceId: serv.id,
      serviceName: serv.name,
      serviceDuration: serv.durationMinutes,
      totalPrice: serv.price,
      date: encaixeModalEntry.desiredDate,
      time: encaixeTime,
      depositRequired: false,
      depositAmount: 0,
      notes: `Encaixe realizado a partir da Fila de Espera (Turno: ${encaixeModalEntry.preferredPeriod})`
    });

    updateWaitlistStatus(encaixeModalEntry.id, 'scheduled');
    setEncaixeModalEntry(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-[#E9E2D7] dark:border-zinc-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-3 py-1 rounded-full">
              Fila Inteligente & Encaixes
            </span>
            <span className="text-xs text-[#706B5F] dark:text-zinc-400">
              Clientes aguardando vagas de cancelamentos ou desistências
            </span>
          </div>
          <h2 className="serif text-xl sm:text-2xl font-bold text-[#2D2D2A] dark:text-zinc-100 mt-1">
            Lista de Espera da Profissional
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-xs text-[#2D2D2A] dark:text-zinc-100 bg-[#F8F6F2]"
          />
          {filterDate && (
            <button
              onClick={() => setFilterDate('')}
              className="px-2.5 py-2 text-xs font-semibold text-stone-500 dark:text-zinc-500 hover:text-black dark:hover:text-white cursor-pointer"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Lista de Espera */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-[#E9E2D7] dark:border-zinc-700 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="serif text-lg font-bold text-[#2D2D2A] dark:text-zinc-100">
            Clientes Cadastradas na Fila ({filteredEntries.length})
          </h3>
          <span className="text-xs text-[#706B5F] dark:text-zinc-400">
            Notifique com 1 clique no WhatsApp assim que surgir um horário vago!
          </span>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="p-12 text-center text-stone-500 dark:text-zinc-500 space-y-2">
            <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-zinc-800/80 flex items-center justify-center mx-auto text-stone-400">
              <Hourglass className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-[#2D2D2A] dark:text-zinc-100">
              Nenhuma cliente aguardando na fila de espera no momento.
            </p>
            <p className="text-xs text-[#706B5F] dark:text-zinc-400 max-w-md mx-auto">
              Quando seus horários de um dia estiverem todos preenchidos, suas clientes verão a opção de entrar na lista de espera inteligente!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEntries.map(w => {
              const waText = encodeURIComponent(
                `Olá, ${w.clientName}! Tudo bem? Sou ${professional.name}. Surgiu um horário disponível para o dia ${formatDatePtBr(w.desiredDate)}! Você ainda tem interesse no serviço de ${w.serviceNames}? Podemos confirmar?`
              );
              const waUrl = `https://wa.me/55${w.clientPhone.replace(/\D/g, '')}?text=${waText}`;

              return (
                <div 
                  key={w.id} 
                  className={`p-5 rounded-2xl border transition-all space-y-3 flex flex-col justify-between ${
                    w.status === 'booked' 
                      ? 'bg-emerald-50 border-emerald-200 opacity-75' 
                      : 'bg-white dark:bg-zinc-900 border-[#E9E2D7] dark:border-zinc-700 shadow-2xs hover:border-[#5A5A40] dark:border-zinc-600'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-base font-bold text-[#2D2D2A] dark:text-zinc-100 flex items-center gap-1.5">
                        <User className="w-4 h-4 text-[#5A5A40] dark:text-zinc-300" />
                        {w.clientName}
                      </strong>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        w.status === 'booked' || w.status === 'scheduled'
                          ? 'bg-emerald-200 text-emerald-900'
                          : w.status === 'notified'
                          ? 'bg-blue-100 text-blue-900'
                          : 'bg-amber-100 text-amber-900'
                      }`}>
                        {w.status === 'booked' || w.status === 'scheduled' ? '✓ Encaixada' : w.status === 'notified' ? 'Notificada' : '⏳ Aguardando'}
                      </span>
                    </div>

                    <div className="text-xs text-[#706B5F] dark:text-zinc-400 space-y-1">
                      <p>
                        📅 Data Desejada: <strong className="text-[#2D2D2A] dark:text-zinc-100">{formatDatePtBr(w.desiredDate)}</strong>
                      </p>
                      <p>
                        ⏰ Turno de preferência:{' '}
                        <strong className="text-[#2D2D2A] dark:text-zinc-100 capitalize">
                          {w.preferredPeriod === 'any' ? 'Qualquer Turno' : w.preferredPeriod === 'morning' ? 'Manhã' : w.preferredPeriod === 'afternoon' ? 'Tarde' : 'Noite'}
                        </strong>
                      </p>
                      <p>
                        💅 Serviços desejados: <strong className="text-[#2D2D2A] dark:text-zinc-100">{w.serviceNames}</strong>
                      </p>
                      <p>
                        📱 WhatsApp: <strong className="text-[#2D2D2A] dark:text-zinc-100">{w.clientPhone}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E9E2D7] dark:border-zinc-700 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => updateWaitlistStatus(w.id, 'notified')}
                        className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Avisar Vaga no WhatsApp
                      </a>

                      {w.status !== 'booked' && (
                        <button
                          onClick={() => handleOpenEncaixe(w)}
                          className="px-3 py-1.5 bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Encaixar
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        if (confirm(`Remover ${w.clientName} da lista de espera?`)) {
                          deleteWaitlistEntry(w.id);
                        }
                      }}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg cursor-pointer transition-colors"
                      title="Remover da lista"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Encaixe */}
      {encaixeModalEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full p-6 sm:p-8 border border-[#E9E2D7] dark:border-zinc-700 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#E9E2D7] dark:border-zinc-700 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#5A5A40] dark:text-zinc-300 block">
                  Encaixar Cliente na Agenda
                </span>
                <h3 className="serif text-xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                  {encaixeModalEntry.clientName}
                </h3>
              </div>
              <button
                onClick={() => setEncaixeModalEntry(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:bg-zinc-800/80 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmEncaixe} className="space-y-4 text-xs">
              <div className="p-3 bg-[#F8F6F2] rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-xs">
                <p>Data: <strong>{formatDatePtBr(encaixeModalEntry.desiredDate)}</strong></p>
                <p>Turno desejado: <strong>{encaixeModalEntry.preferredPeriod}</strong></p>
                <p>WhatsApp: <strong>{encaixeModalEntry.clientPhone}</strong></p>
              </div>

              <div>
                <label className="block font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Horário do Encaixe:</label>
                <input
                  type="time"
                  required
                  value={encaixeTime}
                  onChange={(e) => setEncaixeTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-zinc-600 text-sm font-bold bg-white dark:bg-zinc-900"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Serviço:</label>
                <select
                  required
                  value={encaixeServiceId}
                  onChange={(e) => setEncaixeServiceId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-zinc-600 text-sm bg-white dark:bg-zinc-900 font-medium"
                >
                  {profServices.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} - R$ {s.price.toFixed(2)} ({s.durationMinutes} min)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E9E2D7] dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => setEncaixeModalEntry(null)}
                  className="px-4 py-2 text-stone-600 dark:text-zinc-400 hover:text-black dark:hover:text-white font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Salvar Encaixe na Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
