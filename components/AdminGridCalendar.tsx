'use client';

import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Plus, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Hourglass, 
  Coffee, 
  X,
  Phone,
  MessageSquare,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { Booking, Professional, AvailabilityConfig, ServiceItem } from '@/types';
import { formatDatePtBr, formatPhoneMask, cleanPhone } from '@/lib/whatsapp-utils';
import { useAppStore } from '@/lib/use-app-store';

interface Props {
  professional: Professional;
  bookings: Booking[];
  availability: AvailabilityConfig;
}

const START_HOUR = 8; // 08:00
const END_HOUR = 21;  // 21:00
const HOUR_HEIGHT = 88; // pixels por hora cheia

export default function AdminGridCalendar({ professional, bookings, availability }: Props) {
  const { createManualBooking, services } = useAppStore();
  const profServices = services.filter(s => s.professionalId === professional.id);

  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Modal para Criar Encaixe / Agendamento Rápido no horário clicado
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState<{ date: string; time: string } | null>(null);
  const [manualClientName, setManualClientName] = useState('');
  const [manualClientPhone, setManualClientPhone] = useState('');
  const [manualStartTime, setManualStartTime] = useState('');
  const [manualServiceId, setManualServiceId] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [showConflictConfirmModal, setShowConflictConfirmModal] = useState(false);

  // Faixa de horas cheias (08:00 às 21:00)
  const hoursList = useMemo(() => {
    const hours: { hour: number; label: string }[] = [];
    for (let h = START_HOUR; h <= END_HOUR; h++) {
      hours.push({
        hour: h,
        label: `${String(h).padStart(2, '0')}:00`
      });
    }
    return hours;
  }, []);

  const totalHeight = (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT;

  // Datas da semana atual
  const weekDays = useMemo(() => {
    const [y, m, d] = currentDate.split('-').map(Number);
    const curr = new Date(y, m - 1, d);
    const dayOfWeek = curr.getDay(); // 0 = Domingo
    
    // Início da semana (Segunda-feira)
    const diff = curr.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(curr.setDate(diff));

    const days: { dateStr: string; dayNumber: number; weekDayName: string; isToday: boolean }[] = [];
    const todayStr = new Date().toISOString().split('T')[0];
    const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        dateStr,
        dayNumber: d.getDate(),
        weekDayName: dayNames[i],
        isToday: dateStr === todayStr
      });
    }
    return days;
  }, [currentDate]);

  // Navegação
  const handlePrev = () => {
    const [y, m, d] = currentDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    if (viewMode === 'day') {
      date.setDate(date.getDate() - 1);
    } else {
      date.setDate(date.getDate() - 7);
    }
    setCurrentDate(date.toISOString().split('T')[0]);
  };

  const handleNext = () => {
    const [y, m, d] = currentDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    if (viewMode === 'day') {
      date.setDate(date.getDate() + 1);
    } else {
      date.setDate(date.getDate() + 7);
    }
    setCurrentDate(date.toISOString().split('T')[0]);
  };

  const handleGoToday = () => {
    setCurrentDate(new Date().toISOString().split('T')[0]);
  };

  // Calcula posição vertical (top) e altura (height) com base no horário
  const calculateCardPosition = (timeStr: string, durationMinutes: number) => {
    const [h, m] = (timeStr || '08:00').split(':').map(Number);
    const minutesFromStart = (h - START_HOUR) * 60 + m;
    const top = Math.max(0, (minutesFromStart / 60) * HOUR_HEIGHT);
    const height = Math.max(38, (durationMinutes / 60) * HOUR_HEIGHT);
    return { top, height };
  };

  // Detecção de conflito / choque de horário
  const conflictDetails = useMemo(() => {
    if (!manualStartTime || !manualServiceId || !selectedSlotForBooking) return null;
    const serv = profServices.find(s => s.id === manualServiceId);
    if (!serv) return null;
    const [h, m] = manualStartTime.split(':').map(Number);
    const startMins = h * 60 + m;
    const endMins = startMins + serv.durationMinutes;

    // Conflito com agendamento
    const overlappingBooking = bookings.find(b => {
      if (b.status === 'cancelled') return false;
      if (b.date !== selectedSlotForBooking.date) return false;
      const [bh, bm] = (b.time || '00:00').split(':').map(Number);
      const bStart = bh * 60 + bm;
      const bEnd = bStart + (b.serviceDuration || 60);
      return startMins < bEnd && endMins > bStart;
    });

    // Conflito com intervalo de almoço
    let lunchConflict = false;
    if (availability.hasLunchBreak && availability.lunchStart && availability.lunchEnd) {
      const [lh1, lm1] = availability.lunchStart.split(':').map(Number);
      const [lh2, lm2] = availability.lunchEnd.split(':').map(Number);
      const lStart = lh1 * 60 + lm1;
      const lEnd = lh2 * 60 + lm2;
      lunchConflict = startMins < lEnd && endMins > lStart;
    }

    // Conflito com bloqueio avulso
    const overlappingBlock = (availability?.blockedTimeSlots || []).find((bl: any) => {
      if (bl.date !== selectedSlotForBooking.date) return false;
      const [bh, bm] = bl.startTime.split(':').map(Number);
      const [eh, em] = bl.endTime.split(':').map(Number);
      const bStart = bh * 60 + bm;
      const bEnd = eh * 60 + em;
      return startMins < bEnd && endMins > bStart;
    });

    if (overlappingBooking || lunchConflict || overlappingBlock) {
      return {
        hasConflict: true,
        booking: overlappingBooking,
        lunch: lunchConflict,
        block: overlappingBlock
      };
    }
    return null;
  }, [manualStartTime, manualServiceId, selectedSlotForBooking, bookings, availability, profServices]);

  // Criação do Agendamento Manual
  const executeSaveManualBooking = () => {
    if (!selectedSlotForBooking || !manualClientName.trim() || !manualServiceId || !manualStartTime) return;

    const serv = profServices.find(s => s.id === manualServiceId);
    if (!serv) return;

    // Calcular horário de término
    const [h, m] = manualStartTime.split(':').map(Number);
    const totalMins = h * 60 + m + serv.durationMinutes;
    const endH = String(Math.floor(totalMins / 60)).padStart(2, '0');
    const endM = String(totalMins % 60).padStart(2, '0');
    const endTime = `${endH}:${endM}`;

    createManualBooking({
      professionalId: professional.id,
      clientName: manualClientName.trim(),
      clientPhone: manualClientPhone.trim() || '(11) 90000-0000',
      serviceId: serv.id,
      serviceName: serv.name,
      serviceDuration: serv.durationMinutes,
      totalPrice: serv.price,
      date: selectedSlotForBooking.date,
      time: manualStartTime,
      endTime: endTime,
      status: 'confirmed',
      depositRequired: false,
      depositPaid: false,
      depositAmount: 0,
      notes: manualNotes.trim()
    });

    setSelectedSlotForBooking(null);
    setShowConflictConfirmModal(false);
    setManualClientName('');
    setManualClientPhone('');
    setManualServiceId('');
    setManualStartTime('');
    setManualNotes('');
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (conflictDetails?.hasConflict) {
      setShowConflictConfirmModal(true);
      return;
    }
    executeSaveManualBooking();
  };

  // Obter agendamentos para uma data específica
  const getBookingsForDate = (dateStr: string) => {
    return bookings.filter(b => b.date === dateStr && b.status !== 'cancelled');
  };

  // Obter bloqueios de horários para uma data específica
  const getBlocksForDate = (dateStr: string) => {
    return (availability.blockedTimeSlots || []).filter(b => b.date === dateStr);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-[#E9E2D7] dark:border-zinc-700 shadow-xs space-y-6">
      
      {/* Top Header da Agenda em Grade */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E9E2D7] dark:border-zinc-700 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5A5A40] dark:text-zinc-300 bg-[#EEF1EB] px-3 py-1 rounded-full">
              Grade Proporcional por Horário
            </span>
            <span className="text-xs text-[#706B5F] dark:text-zinc-400">
              Ocupa o espaço exato da duração (ex: 10:30 inicia no meio da linha das 10h)
            </span>
          </div>
          <h2 className="serif text-xl sm:text-2xl font-bold text-[#2D2D2A] dark:text-zinc-100 mt-1">
            Grade de Atendimentos & Linha do Tempo
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Alternar Dia / Semana */}
          <div className="flex bg-[#F8F6F2] dark:bg-zinc-800 p-1 rounded-xl border border-[#E9E2D7] dark:border-zinc-700">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                viewMode === 'day' 
                  ? 'bg-white dark:bg-zinc-900 text-[#2D2D2A] dark:text-zinc-100 shadow-2xs' 
                  : 'text-[#706B5F] dark:text-zinc-400 hover:text-[#2D2D2A]'
              }`}
            >
              Dia
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                viewMode === 'week' 
                  ? 'bg-white dark:bg-zinc-900 text-[#2D2D2A] dark:text-zinc-100 shadow-2xs' 
                  : 'text-[#706B5F] dark:text-zinc-400 hover:text-[#2D2D2A]'
              }`}
            >
              Semana
            </button>
          </div>

          {/* Navegação de Datas */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-2 border border-[#E9E2D7] dark:border-zinc-700 rounded-xl text-[#706B5F] dark:text-zinc-400 hover:text-[#2D2D2A] hover:bg-[#F8F6F2] dark:hover:bg-zinc-800 cursor-pointer"
              title="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleGoToday}
              className="px-3 py-2 border border-[#E9E2D7] dark:border-zinc-700 rounded-xl text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 hover:bg-[#F8F6F2] dark:hover:bg-zinc-800 cursor-pointer"
            >
              Hoje
            </button>

            <button
              onClick={handleNext}
              className="p-2 border border-[#E9E2D7] dark:border-zinc-700 rounded-xl text-[#706B5F] dark:text-zinc-400 hover:text-[#2D2D2A] hover:bg-[#F8F6F2] dark:hover:bg-zinc-800 cursor-pointer"
              title="Próximo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Legenda de Status */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
          <span className="text-[#706B5F] dark:text-zinc-400">Confirmado</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500"></span>
          <span className="text-[#706B5F] dark:text-zinc-400">Aguardando Sinal</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#8C4E46]"></span>
          <span className="text-[#706B5F] dark:text-zinc-400">Concluído</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-stone-400"></span>
          <span className="text-[#706B5F] dark:text-zinc-400">Horário Bloqueado / Almoço</span>
        </span>
      </div>

      {/* ===================================================================== */}
      {/* MODO DIA (LINHA DO TEMPO PROPORCIONAL) */}
      {/* ===================================================================== */}
      {viewMode === 'day' && (
        <div className="space-y-3">
          <div className="bg-[#F8F6F2] dark:bg-zinc-800/80 p-4 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 flex items-center justify-between">
            <span className="font-bold text-sm sm:text-base text-[#2D2D2A] dark:text-zinc-100">
              📅 {formatDatePtBr(currentDate)}
            </span>
            <span className="text-xs font-semibold text-[#5A5A40] dark:text-zinc-300 bg-[#EEF1EB] dark:bg-zinc-700 px-2.5 py-1 rounded-full">
              {getBookingsForDate(currentDate).length} agendamento(s) neste dia
            </span>
          </div>

          {/* Grade Proporcional com Posicionamento Absoluto */}
          <div className="relative border border-[#E9E2D7] dark:border-zinc-700 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 flex">
            {/* Coluna da Esquerda: Horas Inteiras */}
            <div className="w-20 sm:w-24 bg-[#F8F6F2] dark:bg-zinc-800/80 border-r border-[#E9E2D7] dark:border-zinc-700 shrink-0 select-none">
              {hoursList.map(h => (
                <div 
                  key={h.hour} 
                  style={{ height: `${HOUR_HEIGHT}px` }}
                  className="border-b border-[#E9E2D7] dark:border-zinc-700/60 p-2.5 text-xs font-mono font-bold text-[#706B5F] dark:text-zinc-400 flex flex-col justify-between"
                >
                  <span>{h.label}</span>
                  <span className="text-[10px] text-stone-400 font-normal">:30</span>
                </div>
              ))}
            </div>

            {/* Coluna Principal da Linha do Tempo */}
            <div 
              className="flex-1 relative"
              style={{ height: `${hoursList.length * HOUR_HEIGHT}px` }}
            >
              {/* Linhas de Fundo das Horas e Meia-Horas */}
              {hoursList.map((h, idx) => (
                <div
                  key={`line-${h.hour}`}
                  style={{ 
                    top: `${idx * HOUR_HEIGHT}px`,
                    height: `${HOUR_HEIGHT}px`
                  }}
                  className="absolute inset-x-0 border-b border-[#E9E2D7]/80 dark:border-zinc-800 group hover:bg-[#FAF8F5]/50 dark:hover:bg-zinc-800/30 transition-colors"
                >
                  {/* Linha pontilhada de meia hora (:30) */}
                  <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-stone-200 dark:border-zinc-800 pointer-events-none" />

                  {/* Botão de Encaixe ao passar o mouse na hora inteira */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSlotForBooking({ date: currentDate, time: h.label });
                      setManualStartTime(h.label);
                    }}
                    className="absolute left-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity text-2xs font-bold text-[#5A5A40] dark:text-zinc-300 bg-white/90 dark:bg-zinc-800 px-2 py-1 rounded-md border border-[#E9E2D7] dark:border-zinc-700 shadow-xs flex items-center gap-1 z-10 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Encaixar às {h.label}
                  </button>

                  {/* Botão de Encaixe na meia hora */}
                  <button
                    type="button"
                    onClick={() => {
                      const halfHour = `${String(h.hour).padStart(2, '0')}:30`;
                      setSelectedSlotForBooking({ date: currentDate, time: halfHour });
                      setManualStartTime(halfHour);
                    }}
                    className="absolute left-2 top-[calc(50%+4px)] opacity-0 group-hover:opacity-100 transition-opacity text-2xs font-bold text-[#5A5A40] dark:text-zinc-300 bg-white/90 dark:bg-zinc-800 px-2 py-1 rounded-md border border-[#E9E2D7] dark:border-zinc-700 shadow-xs flex items-center gap-1 z-10 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Encaixar às {String(h.hour).padStart(2, '0')}:30
                  </button>
                </div>
              ))}

              {/* Faixa de Almoço Proporcional */}
              {availability.hasLunchBreak && availability.lunchStart && availability.lunchEnd && (() => {
                const [lh1, lm1] = availability.lunchStart.split(':').map(Number);
                const [lh2, lm2] = availability.lunchEnd.split(':').map(Number);
                const lunchDuration = (lh2 * 60 + lm2) - (lh1 * 60 + lm1);
                const { top, height } = calculateCardPosition(availability.lunchStart, lunchDuration);

                return (
                  <div
                    style={{ top: `${top}px`, height: `${height}px` }}
                    className="absolute inset-x-2 rounded-xl bg-stone-100/90 dark:bg-zinc-800/90 border-2 border-dashed border-stone-300 dark:border-zinc-700 p-3 flex items-center justify-between text-xs text-stone-600 dark:text-zinc-400 z-10 pointer-events-none shadow-xs"
                  >
                    <div className="flex items-center gap-2 font-bold">
                      <Coffee className="w-4 h-4 text-stone-500" />
                      <span>Intervalo de Almoço ({availability.lunchStart} às {availability.lunchEnd})</span>
                    </div>
                    <span className="text-2xs bg-stone-200 dark:bg-zinc-700 px-2 py-0.5 rounded-full font-semibold">
                      Pausa
                    </span>
                  </div>
                );
              })()}

              {/* Bloqueios de Horário Personalizados */}
              {getBlocksForDate(currentDate).map(blk => {
                const [bh1, bm1] = blk.startTime.split(':').map(Number);
                const [bh2, bm2] = blk.endTime.split(':').map(Number);
                const blockDuration = (bh2 * 60 + bm2) - (bh1 * 60 + bm1);
                const { top, height } = calculateCardPosition(blk.startTime, blockDuration);

                return (
                  <div
                    key={blk.id}
                    style={{ top: `${top}px`, height: `${height}px` }}
                    className="absolute inset-x-2 rounded-xl bg-rose-50/95 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 p-3 flex items-center justify-between text-xs text-rose-900 dark:text-rose-200 z-10 shadow-xs"
                  >
                    <div className="flex items-center gap-2 font-bold truncate">
                      <X className="w-4 h-4 text-rose-600 shrink-0" />
                      <span className="truncate">Bloqueio: {blk.reason} ({blk.startTime} às {blk.endTime})</span>
                    </div>
                    <span className="text-2xs bg-rose-200 dark:bg-rose-900 text-rose-900 px-2 py-0.5 rounded-full font-bold shrink-0">
                      Indisponível
                    </span>
                  </div>
                );
              })}

              {/* Cards de Agendamentos Proporcionais */}
              {getBookingsForDate(currentDate).map((b, idx) => {
                const duration = b.serviceDuration || 60;
                const { top, height } = calculateCardPosition(b.time, duration);

                return (
                  <div
                    key={b.id}
                    style={{ 
                      top: `${top}px`, 
                      height: `${height}px`
                    }}
                    className={`absolute inset-x-2 rounded-2xl border p-3 shadow-md flex flex-col justify-between z-20 transition-all hover:scale-[1.008] hover:shadow-lg ${
                      b.status === 'confirmed'
                        ? 'bg-emerald-50/95 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-100'
                        : b.status === 'awaiting_deposit'
                        ? 'bg-amber-50/95 dark:bg-amber-950/80 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-100'
                        : b.status === 'completed'
                        ? 'bg-[#FDF4EE] dark:bg-stone-900 border-[#8C4E46]/40 text-[#2D2D2A] dark:text-zinc-100'
                        : 'bg-stone-50 dark:bg-zinc-800 border-stone-300 text-stone-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <strong className="text-xs sm:text-sm font-bold flex items-center gap-1.5 truncate">
                            <User className="w-3.5 h-3.5 shrink-0 text-[#8C4E46]" />
                            <span className="truncate">{b.clientName}</span>
                          </strong>
                          <span className="text-2xs font-mono px-1.5 py-0.5 bg-white/80 dark:bg-zinc-900/80 rounded border border-black/10 shrink-0">
                            {b.code}
                          </span>
                        </div>
                        <p className="text-xs opacity-90 truncate mt-0.5 font-medium">
                          {b.serviceName}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-extrabold px-2 py-0.5 bg-black/10 dark:bg-white/10 rounded-md block">
                          {b.time} - {b.endTime || 'fim'}
                        </span>
                        <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block mt-0.5">
                          R$ {b.totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Rodapé do Card se houver altura suficiente */}
                    {height >= 60 && (
                      <div className="flex items-center justify-between text-2xs pt-1 border-t border-black/5 dark:border-white/10 mt-1">
                        <span className="truncate">WhatsApp: <strong>{b.clientPhone}</strong></span>
                        <span className="font-bold uppercase tracking-wider text-[10px]">
                          {b.status === 'confirmed' && '✓ Confirmado'}
                          {b.status === 'awaiting_deposit' && '⏳ Aguardando Sinal Pix'}
                          {b.status === 'completed' && '★ Concluído'}
                          {b.status === 'pending' && 'Aguardando'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODO SEMANA (GRADE COM 7 COLUNAS PROPORCIONAIS) */}
      {/* ===================================================================== */}
      {viewMode === 'week' && (
        <div className="overflow-x-auto">
          <div className="min-w-[900px] border border-[#E9E2D7] dark:border-zinc-700 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900">
            {/* Header da Semana */}
            <div className="grid grid-cols-8 bg-[#F8F6F2] dark:bg-zinc-800 border-b border-[#E9E2D7] dark:border-zinc-700 divide-x divide-[#E9E2D7] dark:divide-zinc-700 sticky top-0 z-30">
              <div className="p-3 text-center text-xs font-bold text-[#706B5F] dark:text-zinc-400 flex items-center justify-center">
                Hora
              </div>
              {weekDays.map(day => (
                <div 
                  key={day.dateStr} 
                  className={`p-2.5 text-center space-y-0.5 cursor-pointer transition-colors ${
                    day.isToday ? 'bg-[#5A5A40] text-white' : 'hover:bg-[#EEF1EB] dark:hover:bg-zinc-700'
                  }`}
                  onClick={() => {
                    setCurrentDate(day.dateStr);
                    setViewMode('day');
                  }}
                >
                  <div className="text-2xs font-semibold uppercase">{day.weekDayName}</div>
                  <div className="text-sm font-extrabold">{day.dayNumber}</div>
                </div>
              ))}
            </div>

            {/* Linha do Tempo da Semana */}
            <div className="grid grid-cols-8 divide-x divide-[#E9E2D7] dark:divide-zinc-700 relative">
              {/* Coluna 1: Marcadores de Horas */}
              <div className="bg-[#F8F6F2] dark:bg-zinc-800/60 select-none">
                {hoursList.map(h => (
                  <div 
                    key={`label-${h.hour}`}
                    style={{ height: `${HOUR_HEIGHT}px` }}
                    className="border-b border-[#E9E2D7] dark:border-zinc-700/60 p-2 text-xs font-mono font-bold text-[#706B5F] dark:text-zinc-400 flex flex-col justify-between text-center"
                  >
                    <span>{h.label}</span>
                    <span className="text-[9px] text-stone-400 font-normal">:30</span>
                  </div>
                ))}
              </div>

              {/* Colunas 2 a 8: Os 7 dias da semana */}
              {weekDays.map(day => {
                const dayBks = getBookingsForDate(day.dateStr);
                const dayBlocks = getBlocksForDate(day.dateStr);

                return (
                  <div 
                    key={day.dateStr} 
                    className="relative bg-white dark:bg-zinc-900"
                    style={{ height: `${hoursList.length * HOUR_HEIGHT}px` }}
                  >
                    {/* Linhas de Fundo */}
                    {hoursList.map((h, idx) => (
                      <div
                        key={`cell-${day.dateStr}-${h.hour}`}
                        style={{ 
                          top: `${idx * HOUR_HEIGHT}px`,
                          height: `${HOUR_HEIGHT}px`
                        }}
                        className="absolute inset-x-0 border-b border-[#E9E2D7]/80 dark:border-zinc-800 group hover:bg-[#FAF8F5]/60 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-stone-200 dark:border-zinc-800 pointer-events-none" />

                        {/* Botão de Encaixe Rápido ao passar mouse */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSlotForBooking({ date: day.dateStr, time: h.label });
                            setManualStartTime(h.label);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity w-full h-full flex items-center justify-center text-stone-400 hover:text-[#5A5A40] cursor-pointer"
                          title={`Encaixar às ${h.label}`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {/* Almoço */}
                    {availability.hasLunchBreak && availability.lunchStart && availability.lunchEnd && (() => {
                      const [lh1, lm1] = availability.lunchStart.split(':').map(Number);
                      const [lh2, lm2] = availability.lunchEnd.split(':').map(Number);
                      const lunchDuration = (lh2 * 60 + lm2) - (lh1 * 60 + lm1);
                      const { top, height } = calculateCardPosition(availability.lunchStart, lunchDuration);

                      return (
                        <div
                          style={{ top: `${top}px`, height: `${height}px` }}
                          className="absolute inset-x-1 rounded-lg bg-stone-100/90 dark:bg-zinc-800/90 border border-stone-300 dark:border-zinc-700 flex items-center justify-center text-[10px] text-stone-500 font-medium z-10 pointer-events-none"
                          title="Intervalo de Almoço"
                        >
                          <Coffee className="w-3.5 h-3.5 mr-1" />
                          <span className="hidden sm:inline">Almoço</span>
                        </div>
                      );
                    })()}

                    {/* Bloqueios */}
                    {dayBlocks.map(blk => {
                      const [bh1, bm1] = blk.startTime.split(':').map(Number);
                      const [bh2, bm2] = blk.endTime.split(':').map(Number);
                      const blockDuration = (bh2 * 60 + bm2) - (bh1 * 60 + bm1);
                      const { top, height } = calculateCardPosition(blk.startTime, blockDuration);

                      return (
                        <div
                          key={blk.id}
                          style={{ top: `${top}px`, height: `${height}px` }}
                          className="absolute inset-x-1 rounded-lg bg-rose-100/90 border border-rose-300 text-rose-900 p-1 text-[10px] font-bold z-10 truncate"
                          title={`Bloqueio: ${blk.reason} (${blk.startTime} às ${blk.endTime})`}
                        >
                          🚫 {blk.reason}
                        </div>
                      );
                    })}

                    {/* Agendamentos */}
                    {dayBks.map(b => {
                      const duration = b.serviceDuration || 60;
                      const { top, height } = calculateCardPosition(b.time, duration);

                      return (
                        <div
                          key={b.id}
                          style={{ top: `${top}px`, height: `${height}px` }}
                          className={`absolute inset-x-1 rounded-xl border p-1.5 shadow-2xs z-20 flex flex-col justify-between transition-all hover:scale-[1.02] hover:shadow-md ${
                            b.status === 'confirmed'
                              ? 'bg-emerald-50/95 border-emerald-300 text-emerald-950'
                              : b.status === 'awaiting_deposit'
                              ? 'bg-amber-50/95 border-amber-300 text-amber-950'
                              : 'bg-blue-50/95 border-blue-300 text-blue-950'
                          }`}
                          title={`${b.clientName} - ${b.serviceName} (${b.time} às ${b.endTime || ''})`}
                        >
                          <div>
                            <div className="font-bold text-[11px] truncate flex items-center gap-1">
                              <span className="truncate">{b.clientName}</span>
                            </div>
                            <div className="text-[10px] truncate opacity-90">{b.serviceName}</div>
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-mono font-bold pt-0.5 border-t border-black/5">
                            <span>{b.time}</span>
                            <span>R$ {b.totalPrice.toFixed(0)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL DE ENCAIXE MANUAL RÁPIDO */}
      {/* ===================================================================== */}
      {selectedSlotForBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full p-6 sm:p-8 border border-[#E9E2D7] dark:border-zinc-700 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#E9E2D7] dark:border-zinc-700 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#5A5A40] dark:text-zinc-300 block">
                  Encaixe Manual na Agenda
                </span>
                <h3 className="serif text-xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                  {formatDatePtBr(selectedSlotForBooking.date)} às {selectedSlotForBooking.time}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSlotForBooking(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:bg-zinc-800/80 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Horário de Início:</label>
                  <input
                    type="time"
                    required
                    value={manualStartTime}
                    onChange={(e) => setManualStartTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-zinc-600 text-sm focus:ring-1 outline-none bg-white dark:bg-zinc-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Fim Previsto:</label>
                  <input
                    type="time"
                    disabled
                    value={(() => {
                      if (!manualStartTime || !manualServiceId) return '';
                      const serv = profServices.find(s => s.id === manualServiceId);
                      if (!serv) return '';
                      const [h, m] = manualStartTime.split(':').map(Number);
                      const totalMins = h * 60 + m + serv.durationMinutes;
                      const endH = String(Math.floor(totalMins / 60)).padStart(2, '0');
                      const endM = String(totalMins % 60).padStart(2, '0');
                      return `${endH}:${endM}`;
                    })()}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 text-sm bg-stone-100 dark:bg-zinc-800 text-stone-500 font-mono"
                  />
                </div>
              </div>

              {/* Alerta Visual Imediato de Conflito / Choque */}
              {conflictDetails?.hasConflict && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl space-y-1 text-rose-900 dark:text-rose-200">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-rose-700 dark:text-rose-400">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>Atenção: Choque de Horário Detectado!</span>
                  </div>
                  <p className="text-2xs text-rose-700 dark:text-rose-300">
                    {conflictDetails.lunch && 'Coincide com o Intervalo de Almoço configurado. '}
                    {conflictDetails.booking && `Coincide com agendamento de ${conflictDetails.booking.clientName} (${conflictDetails.booking.time}). `}
                    {conflictDetails.block && `Coincide com bloqueio: ${conflictDetails.block.reason}. `}
                    O encaixe será permitido após confirmação expressa.
                  </p>
                </div>
              )}

              <div>
                <label className="block font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Nome da Cliente:</label>
                <input
                  type="text"
                  required
                  value={manualClientName}
                  onChange={(e) => setManualClientName(e.target.value)}
                  placeholder="Ex: Camila Rocha"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-zinc-600 text-sm focus:ring-1 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">WhatsApp da Cliente:</label>
                <input
                  type="tel"
                  value={manualClientPhone}
                  onChange={(e) => setManualClientPhone(formatPhoneMask(e.target.value))}
                  placeholder="(11) 90000-0000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-zinc-600 text-sm focus:ring-1 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Serviço a realizar:</label>
                <select
                  required
                  value={manualServiceId}
                  onChange={(e) => setManualServiceId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-zinc-600 text-sm bg-white dark:bg-zinc-900 focus:ring-1 outline-none"
                >
                  <option value="">Selecione o serviço...</option>
                  {profServices.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} - R$ {s.price.toFixed(2)} ({s.durationMinutes} min)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Observações internas / da cliente:</label>
                <input
                  type="text"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="Ex: Encaixe solicitado no balcão"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-zinc-600 text-xs focus:ring-1 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E9E2D7] dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => setSelectedSlotForBooking(null)}
                  className="px-4 py-2 text-stone-600 dark:text-zinc-400 hover:text-black dark:hover:text-white font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Confirmar Encaixe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO EXPRESSA DE CHOQUE DE HORÁRIO */}
      {showConflictConfirmModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-sm w-full p-6 border border-rose-300 dark:border-rose-800 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h4 className="serif text-lg font-bold text-[#2D2D2A] dark:text-zinc-100">
                Confirmar Encaixe com Choque?
              </h4>
              <p className="text-xs text-stone-600 dark:text-zinc-300 leading-relaxed">
                Este horário coincide com 
                {conflictDetails?.lunch ? ' o horário de almoço' : ''}
                {conflictDetails?.booking ? ` o agendamento de ${conflictDetails.booking.clientName}` : ''}
                {conflictDetails?.block ? ` o bloqueio (${conflictDetails.block.reason})` : ''}.
              </p>
              <p className="text-2xs font-semibold text-rose-700 dark:text-rose-400 pt-1">
                Deseja forçar o encaixe deste procedimento na sua agenda mesmo assim?
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={executeSaveManualBooking}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer"
              >
                Sim, Confirmar Encaixe com Choque
              </button>
              <button
                type="button"
                onClick={() => setShowConflictConfirmModal(false)}
                className="w-full py-2 bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Voltar e Ajustar Horário
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
