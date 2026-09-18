'use client';

import React, { useState, useMemo } from 'react';
import { 
  Booking, 
  Professional, 
  ReminderVariationType, 
  ServiceItem 
} from '@/types';
import { 
  REMINDER_VARIATIONS_LIST, 
  generateReminderMessageText, 
  generateReminderWhatsAppUrl, 
  formatDatePtBr 
} from '@/lib/whatsapp-utils';
import { 
  Bell, 
  Send, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  MessageSquare, 
  Users, 
  Calendar as CalendarIcon, 
  Filter, 
  ChevronRight, 
  Edit3, 
  RefreshCw, 
  ArrowRight, 
  AlertCircle, 
  FileText, 
  DollarSign, 
  Sliders, 
  X,
  Layers
} from 'lucide-react';

interface Props {
  professional: Professional;
  bookings: Booking[];
  services: ServiceItem[];
  onMarkReminderSent: (bookingId: string, templateUsed?: string) => void;
  onMarkAllRemindersSent: (bookingIds: string[], templateUsed?: string) => void;
}

export default function RemindersManager({
  professional,
  bookings,
  services,
  onMarkReminderSent,
  onMarkAllRemindersSent
}: Props) {
  // Helpers para cálculo de amanhã e hoje
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Estado da data selecionada (Padrão: Amanhã / D-1)
  const [selectedDate, setSelectedDate] = useState<string>(tomorrowStr);
  const isTargetingTomorrow = selectedDate === tomorrowStr;
  const isTargetingToday = selectedDate === todayStr;

  // Estado da variação do lembrete selecionada
  const [selectedVariation, setSelectedVariation] = useState<ReminderVariationType>('standard');
  const [customTemplateText, setCustomTemplateText] = useState<string>(
    '💖 Olá {cliente}, passando para lembrar do seu horário {dia} às {horario} comigo no {endereco}!\n\n' +
    '💅 Procedimento: {servico}\n' +
    '💰 Saldo a acertar no local: {saldo}\n\n' +
    'Estou preparando tudo para te receber com muito carinho! Se precisar de algo, só me responder aqui. Te espero! 🥰'
  );

  // Seleção múltipla para disparo em massa (gerenciado sem useEffect para evitar cascading render)
  const [deselectedBookingIds, setDeselectedBookingIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  // Modal de Pré-visualização / Edição Individual
  const [previewBooking, setPreviewBooking] = useState<Booking | null>(null);
  const [individualCustomText, setIndividualCustomText] = useState<string>('');

  // Modal de Fila de Disparo Sequencial Guiado (Bulk Queue)
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
  const [queueIndex, setQueueIndex] = useState(0);

  // Feedback de envio
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtrar agendamentos da profissional na data selecionada
  const dayBookings = useMemo(() => {
    return bookings
      .filter(b => b.professionalId === professional.id && b.date === selectedDate && b.status !== 'cancelled')
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [bookings, professional.id, selectedDate]);

  // Contadores
  const totalCount = dayBookings.length;
  const sentCount = dayBookings.filter(b => b.reminderSent).length;
  const pendingCount = totalCount - sentCount;

  // Lista derivada de IDs selecionados para disparo em lote
  const selectedBookingIds = useMemo(() => {
    return dayBookings
      .map(b => b.id)
      .filter(id => !deselectedBookingIds.includes(id));
  }, [dayBookings, deselectedBookingIds]);

  // Troca de data limpa desmarcações manuais
  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    setDeselectedBookingIds([]);
  };

  // Toggle seleção individual
  const toggleSelect = (id: string) => {
    setDeselectedBookingIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Toggle selecionar todos
  const toggleSelectAll = () => {
    if (selectedBookingIds.length === dayBookings.length) {
      setDeselectedBookingIds(dayBookings.map(b => b.id));
    } else {
      setDeselectedBookingIds([]);
    }
  };

  // Disparar lembrete individual
  const handleSendSingleReminder = (booking: Booking, customMsg?: string) => {
    const url = generateReminderWhatsAppUrl(
      booking, 
      professional, 
      selectedVariation, 
      customMsg || (selectedVariation === 'custom' ? customTemplateText : undefined)
    );
    
    // Abrir WhatsApp Web ou App
    window.open(url, '_blank', 'noopener,noreferrer');
    
    // Marcar como enviado
    onMarkReminderSent(booking.id, selectedVariation);
    showToast(`WhatsApp aberto para ${booking.clientName}! Lembrete registrado como enviado.`);

    if (previewBooking) {
      setPreviewBooking(null);
    }
  };

  // Copiar texto individual
  const handleCopySingleText = (booking: Booking) => {
    const text = generateReminderMessageText(
      booking, 
      professional, 
      selectedVariation, 
      selectedVariation === 'custom' ? customTemplateText : undefined
    );
    navigator.clipboard.writeText(text);
    setCopiedId(booking.id);
    showToast(`Mensagem copiada para a área de transferência!`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Copiar todos os lembretes formatados
  const handleCopyAllTexts = () => {
    const targetBookings = dayBookings.filter(b => selectedBookingIds.includes(b.id));
    if (targetBookings.length === 0) return;

    const consolidated = targetBookings.map((b, idx) => {
      const text = generateReminderMessageText(
        b, 
        professional, 
        selectedVariation, 
        selectedVariation === 'custom' ? customTemplateText : undefined
      );
      return `----------------------------------------\n[#${idx + 1}] CLIENTE: ${b.clientName} (${b.clientPhone}) | HORÁRIO: ${b.time}\n----------------------------------------\n${text}\n`;
    }).join('\n');

    navigator.clipboard.writeText(consolidated);
    setCopiedAll(true);
    showToast(`Todos os ${targetBookings.length} lembretes copiados de uma vez só!`);
    setTimeout(() => setCopiedAll(false), 3000);
  };

  // Abrir modal de fila guiada
  const handleStartQueue = () => {
    const targetBookings = dayBookings.filter(b => selectedBookingIds.includes(b.id));
    if (targetBookings.length === 0) return;
    setQueueIndex(0);
    setIsQueueModalOpen(true);
  };

  // Disparar cliente atual da fila e avançar
  const handleQueueSendAndNext = () => {
    const targetBookings = dayBookings.filter(b => selectedBookingIds.includes(b.id));
    const current = targetBookings[queueIndex];
    if (!current) return;

    handleSendSingleReminder(current);

    if (queueIndex < targetBookings.length - 1) {
      setQueueIndex(queueIndex + 1);
    } else {
      setIsQueueModalOpen(false);
      showToast('🎉 Todos os lembretes da fila foram disparados com sucesso!');
    }
  };

  // Abrir abas sequenciais para todos
  const handleOpenAllSequential = () => {
    const targetBookings = dayBookings.filter(b => selectedBookingIds.includes(b.id));
    if (targetBookings.length === 0) return;

    targetBookings.forEach((b, index) => {
      setTimeout(() => {
        const url = generateReminderWhatsAppUrl(
          b, 
          professional, 
          selectedVariation, 
          selectedVariation === 'custom' ? customTemplateText : undefined
        );
        window.open(url, '_blank', 'noopener,noreferrer');
      }, index * 400);
    });

    onMarkAllRemindersSent(targetBookings.map(b => b.id), selectedVariation);
    showToast(`🚀 Abrindo ${targetBookings.length} conversas no WhatsApp e marcando todas como enviadas!`);
  };

  
  // Obter serviço correspondente para ver possíveis variações
  const getServiceForBooking = (booking: Booking) => {
    return services.find(s => s.id === booking.serviceId);
  };

  return (
    <div className="space-y-6">

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#2D2D2A] text-white px-5 py-3.5 rounded-2xl shadow-xl border border-stone-700 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <Sparkles className="w-4 h-4 text-[#D4A373] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. NOTIFICAÇÃO DE VÉSPERA / HERO BANNER */}
      {/* ========================================================================= */}
      <div className={`p-6 sm:p-7 rounded-3xl border shadow-sm relative overflow-hidden transition-all ${
        isTargetingTomorrow 
          ? pendingCount > 0 
            ? 'bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-stone-50 dark:from-amber-950/40 dark:via-zinc-900 dark:to-zinc-900 border-amber-200 dark:border-amber-800/60'
            : 'bg-gradient-to-br from-emerald-50/90 via-stone-50 to-emerald-50/40 dark:from-emerald-950/40 dark:via-zinc-900 dark:to-zinc-900 border-emerald-200 dark:border-emerald-800/60'
          : 'bg-white dark:bg-zinc-900 border-[#E9E2D7] dark:border-zinc-800'
      }`}>
        {/* Glow de fundo */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#D4A373]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                isTargetingTomorrow
                  ? 'bg-amber-500 text-white shadow-xs'
                  : isTargetingToday
                  ? 'bg-[#5A5A40] dark:bg-zinc-700 text-white'
                  : 'bg-stone-200 dark:bg-zinc-800 text-stone-800 dark:text-zinc-200'
              }`}>
                <Bell className="w-3.5 h-3.5" />
                {isTargetingTomorrow ? 'Notificação de Véspera (D-1)' : isTargetingToday ? 'Atendimentos de Hoje (D-0)' : 'Lembretes por Data'}
              </span>

              <span className="text-xs font-semibold text-[#706B5F] dark:text-zinc-300 bg-white dark:bg-zinc-900/80 dark:bg-zinc-800 px-2.5 py-0.5 rounded-lg border border-stone-200 dark:border-zinc-700">
                {formatDatePtBr(selectedDate)}
              </span>

              {totalCount > 0 && pendingCount === 0 && (
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  100% dos Lembretes Enviados
                </span>
              )}
            </div>

            <h2 className="serif text-xl sm:text-2xl lg:text-3xl font-bold text-[#2D2D2A] dark:text-zinc-100">
              {isTargetingTomorrow ? (
                pendingCount > 0 
                  ? `Lembretes para os Agendamentos de Amanhã (${pendingCount} pendente${pendingCount > 1 ? 's' : ''})`
                  : `Todos os Lembretes de Amanhã já foram Disparados!`
              ) : isTargetingToday ? (
                `Lembretes dos Clientes de Hoje (${totalCount} agendados)`
              ) : (
                `Lembretes para ${formatDatePtBr(selectedDate)}`
              )}
            </h2>

            <p className="text-xs sm:text-sm text-[#706B5F] dark:text-zinc-300 max-w-2xl leading-relaxed">
              Dispare lembretes no WhatsApp para reduzir faltas, avisar sobre tolerância e confirmar a presença das suas clientes. 
              Você pode disparar <strong className="text-[#2D2D2A] dark:text-zinc-100">uma por uma</strong> ou <strong className="text-[#2D2D2A] dark:text-zinc-100">para todos os agendamentos do dia seguinte</strong> com suporte a variações de procedimento e mensagem.
            </p>
          </div>

          {/* Botões de Ação do Topo */}
          {totalCount > 0 && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <button
                onClick={handleStartQueue}
                disabled={selectedBookingIds.length === 0}
                className={`px-5 py-3 rounded-2xl font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  selectedBookingIds.length > 0
                    ? 'bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white hover:scale-[1.02]'
                    : 'bg-stone-300 text-stone-500 dark:text-zinc-500 cursor-not-allowed'
                }`}
                title="Abre fila sequencial guiada para disparar WhatsApp uma a uma com 1 clique"
              >
                <Send className="w-4 h-4 text-[#D4A373]" />
                Disparar para Todos ({selectedBookingIds.length}) &rarr;
              </button>

              <button
                onClick={handleCopyAllTexts}
                className="px-4 py-3 rounded-2xl font-semibold text-xs sm:text-sm bg-white dark:bg-zinc-800 hover:bg-stone-100 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-[#2D2D2A] dark:text-zinc-100 border border-[#E9E2D7] dark:border-zinc-700 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                title="Copia todas as mensagens formatadas para área de transferência"
              >
                {copiedAll ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-stone-500 dark:text-zinc-400" />}
                {copiedAll ? 'Copiados!' : 'Copiar Todos'}
              </button>
            </div>
          )}
        </div>

        {/* Barra de Progresso de Envio dos Lembretes */}
        {totalCount > 0 && (
          <div className="mt-6 pt-5 border-t border-stone-200 dark:border-zinc-700/70 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 flex items-center justify-center text-[#5A5A40] dark:text-amber-400 font-bold text-base shadow-xs">
                {totalCount}
              </div>
              <div>
                <span className="text-xs text-[#706B5F] dark:text-zinc-400 block font-medium">Total de Clientes</span>
                <span className="text-sm font-bold text-[#2D2D2A] dark:text-zinc-100">{totalCount} agendamento{totalCount > 1 ? 's' : ''}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-base shadow-xs">
                {sentCount}
              </div>
              <div>
                <span className="text-xs text-[#706B5F] dark:text-zinc-400 block font-medium">Lembretes Já Enviados</span>
                <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">{sentCount} de {totalCount} ({Math.round((sentCount / totalCount) * 100)}%)</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 flex items-center justify-center font-bold text-base shadow-xs">
                {pendingCount}
              </div>
              <div>
                <span className="text-xs text-[#706B5F] dark:text-zinc-400 block font-medium">Aguardando Disparo</span>
                <span className="text-sm font-bold text-amber-900 dark:text-amber-300">{pendingCount} pendente{pendingCount > 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. BARRA DE SELEÇÃO DE DATA & SELETOR DE VARIAÇÕES */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-zinc-900 p-5 sm:p-6 rounded-3xl border border-[#E9E2D7] dark:border-zinc-800 shadow-xs space-y-6">
        
        {/* Seleção rápida de data */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E9E2D7] dark:border-zinc-800">
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#A09A8E] dark:text-zinc-400 uppercase tracking-wider block">
              1. Escolha a Data dos Atendimentos
            </span>
            <p className="text-xs sm:text-sm text-[#706B5F] dark:text-zinc-300">
              Por padrão, selecionamos <strong>amanhã ({formatDatePtBr(tomorrowStr)})</strong> para a notificação de véspera.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleDateChange(tomorrowStr)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedDate === tomorrowStr
                  ? 'bg-[#5A5A40] dark:bg-zinc-700 text-white shadow-xs'
                  : 'bg-[#F8F6F2] dark:bg-zinc-800 hover:bg-[#EEF1EB] dark:hover:bg-zinc-700 text-[#2D2D2A] dark:text-zinc-200'
              }`}
            >
              <Bell className="w-3.5 h-3.5 text-[#D4A373]" />
              Amanhã ({formatDatePtBr(tomorrowStr)})
            </button>

            <button
              onClick={() => handleDateChange(todayStr)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedDate === todayStr
                  ? 'bg-[#5A5A40] dark:bg-zinc-700 text-white shadow-xs'
                  : 'bg-[#F8F6F2] dark:bg-zinc-800 hover:bg-[#EEF1EB] dark:hover:bg-zinc-700 text-[#2D2D2A] dark:text-zinc-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Hoje ({formatDatePtBr(todayStr)})
            </button>

            <div className="flex items-center gap-1 bg-[#F8F6F2] dark:bg-zinc-800 px-2.5 py-1 rounded-xl border border-[#E9E2D7] dark:border-zinc-700">
              <CalendarIcon className="w-3.5 h-3.5 text-[#706B5F] dark:text-zinc-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#2D2D2A] dark:text-zinc-200 outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* SELETOR DE VARIAÇÕES DE LEMBRETE (esse serviço pode ter variações) */}
        {/* ===================================================================== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#A09A8E] dark:text-zinc-400 uppercase tracking-wider block">
                2. Modelo e Variação do Lembrete
              </span>
              <p className="text-xs text-[#706B5F] dark:text-zinc-300">
                Escolha o tom e as orientações da mensagem enviada no WhatsApp das clientes:
              </p>
            </div>
            <span className="text-2xs font-bold px-2.5 py-1 bg-[#EEF1EB] dark:bg-zinc-800 text-[#5A5A40] dark:text-amber-300 rounded-full">
              2 variações disponíveis
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {REMINDER_VARIATIONS_LIST.map((varItem) => {
              const isSelected = selectedVariation === varItem.id;
              const emojiIcon = varItem.id === 'standard' ? '💬' : '✏️';

              return (
                <button
                  key={varItem.id}
                  onClick={() => setSelectedVariation(varItem.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'border-[#5A5A40] dark:border-amber-400 bg-[#EEF1EB] dark:bg-zinc-800 shadow-xs ring-1 ring-[#5A5A40] dark:ring-amber-400'
                      : 'border-[#E9E2D7] dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-stone-400 dark:hover:border-zinc-700 hover:bg-stone-50 dark:bg-zinc-800/50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xl">{emojiIcon}</span>
                      {isSelected && <Check className="w-4 h-4 text-[#5A5A40] dark:text-amber-400" />}
                    </div>
                    <div className="font-bold text-xs text-[#2D2D2A] dark:text-zinc-100">{varItem.title}</div>
                    <p className="text-[11px] text-[#706B5F] dark:text-zinc-300 line-clamp-2 leading-tight">
                      {varItem.description}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    isSelected ? 'text-[#5A5A40] dark:text-amber-300' : 'text-[#706B5F] dark:text-zinc-400'
                  }`}>
                    {isSelected ? 'Selecionado' : 'Usar este'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Campo de personalização para variação 'custom' */}
          {/* Opção de texto customizado removida */}

          {/* Prévia interativa do WhatsApp do modelo selecionado */}
          <div className="mt-4 p-4 rounded-2xl bg-[#EFEAE2] dark:bg-[#0c1317] border border-stone-300 dark:border-zinc-600/80 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xs font-bold uppercase tracking-wider text-stone-600 dark:text-zinc-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Pré-visualização da Mensagem no WhatsApp:
              </span>
              <span className="text-2xs text-stone-500 dark:text-zinc-400">
                (Exemplo com cliente de amanhã)
              </span>
            </div>

            <div className="whatsapp-chat-bubble bg-white dark:bg-[#1f2c34] rounded-2xl p-4 shadow-xs border border-stone-200 dark:border-zinc-700 max-w-xl text-xs sm:text-sm text-stone-800 dark:text-[#e9edef] whitespace-pre-line font-sans leading-relaxed">
              {dayBookings[0] ? (
                generateReminderMessageText(
                  dayBookings[0], 
                  professional, 
                  selectedVariation, 
                  selectedVariation === 'custom' ? customTemplateText : undefined
                )
              ) : (
                generateReminderMessageText(
                  {
                    id: 'sample',
                    code: '#BL-EXEMPLO',
                    professionalId: professional.id,
                    professionalName: professional.name,
                    professionalPhone: professional.phone,
                    professionalAddress: professional.address,
                    serviceId: services[0]?.id || 's1',
                    serviceName: services[0]?.name || 'Alongamento em Gel Completo',
                    serviceVariation: services[0]?.variations?.[0] || 'Fibra de Vidro Silk',
                    serviceDuration: 120,
                    clientName: 'Dona Maria',
                    clientPhone: '(11) 99999-8888',
                    date: selectedDate,
                    time: '14:00',
                    endTime: '16:00',
                    status: 'confirmed',
                    totalPrice: 160.00,
                    depositRequired: true,
                    depositAmount: 50.00,
                    depositPaid: true,
                    depositStatus: 'paid',
                    createdAt: new Date().toISOString()
                  },
                  professional,
                  selectedVariation,
                  selectedVariation === 'custom' ? customTemplateText : undefined
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. LISTA DE AGENDAMENTOS DO DIA COM DISPARO INDIVIDUAL E EM MASSA */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-[#E9E2D7] dark:border-zinc-700 shadow-xs overflow-hidden">
        
        {/* Cabeçalho da Lista com Seleção Múltipla */}
        <div className="p-5 sm:p-6 border-b border-[#E9E2D7] dark:border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F8F6F2]">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="w-5 h-5 rounded-md border border-stone-400 bg-white dark:bg-zinc-900 flex items-center justify-center cursor-pointer hover:border-[#5A5A40] dark:border-zinc-600"
              title="Selecionar todos"
            >
              {selectedBookingIds.length === dayBookings.length && dayBookings.length > 0 ? (
                <Check className="w-3.5 h-3.5 text-[#5A5A40] dark:text-zinc-300 stroke-[3]" />
              ) : selectedBookingIds.length > 0 ? (
                <div className="w-2 h-2 bg-[#5A5A40] dark:bg-zinc-700 rounded-xs" />
              ) : null}
            </button>

            <div>
              <h3 className="serif font-bold text-lg text-[#2D2D2A] dark:text-zinc-100">
                Clientes Agendadas ({dayBookings.length})
              </h3>
              <p className="text-xs text-[#706B5F] dark:text-zinc-400">
                {selectedBookingIds.length} selecionada(s) para disparo em massa
              </p>
            </div>
          </div>

          {/* Botões de Ação em Massa */}
          {dayBookings.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleStartQueue}
                disabled={selectedBookingIds.length === 0}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                  selectedBookingIds.length > 0
                    ? 'bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white'
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-3.5 h-3.5 text-[#D4A373]" />
                Fila de Disparo 1 a 1 ({selectedBookingIds.length})
              </button>

              <button
                onClick={handleOpenAllSequential}
                disabled={selectedBookingIds.length === 0}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-[#E9E2D7] dark:border-zinc-700 ${
                  selectedBookingIds.length > 0
                    ? 'bg-white dark:bg-zinc-900 hover:bg-stone-50 dark:bg-zinc-800 text-[#2D2D2A] dark:text-zinc-100'
                    : 'bg-stone-100 dark:bg-zinc-800/80 text-stone-400 cursor-not-allowed'
                }`}
                title="Abre todas as abas do WhatsApp com pequenos intervalos"
              >
                <ExternalLink className="w-3.5 h-3.5 text-stone-500 dark:text-zinc-500" />
                Abrir Todas as Abas
              </button>

              
            </div>
          )}
        </div>

        {/* Lista de Clientes */}
        {dayBookings.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <div className="w-14 h-14 rounded-full bg-[#EEF1EB] text-[#5A5A40] dark:text-zinc-300 flex items-center justify-center mx-auto">
              <CalendarIcon className="w-7 h-7" />
            </div>
            <h4 className="serif font-bold text-xl text-[#2D2D2A] dark:text-zinc-100">
              Nenhum agendamento para {formatDatePtBr(selectedDate)}
            </h4>
            <p className="text-xs sm:text-sm text-[#706B5F] dark:text-zinc-400 max-w-md mx-auto">
              Não existem atendimentos confirmados ou pendentes para este dia. Experimente selecionar outra data acima ou compartilhar seu link de agendamento.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setSelectedDate(tomorrowStr)}
                className="px-4 py-2 rounded-xl bg-[#5A5A40] dark:bg-zinc-700 text-white text-xs font-bold hover:bg-[#484832] dark:hover:bg-zinc-600 cursor-pointer"
              >
                Voltar para Amanhã ({formatDatePtBr(tomorrowStr)})
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#E9E2D7]">
            {dayBookings.map((booking) => {
              const isSelected = selectedBookingIds.includes(booking.id);
              const remaining = Math.max(0, booking.totalPrice - (booking.depositPaid ? booking.depositAmount : 0));
              const service = getServiceForBooking(booking);

              return (
                <div 
                  key={booking.id} 
                  className={`p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition-colors ${
                    booking.reminderSent ? 'bg-emerald-50/20' : isSelected ? 'bg-amber-50/15' : 'bg-white dark:bg-zinc-900'
                  }`}
                >
                  {/* Bloco 1: Seleção + Horário + Informações da Cliente e Variação */}
                  <div className="flex items-start gap-3.5 flex-1">
                    <button
                      onClick={() => toggleSelect(booking.id)}
                      className={`w-5 h-5 rounded-md border mt-1 flex items-center justify-center cursor-pointer shrink-0 transition-colors ${
                        isSelected 
                          ? 'bg-[#5A5A40] dark:bg-zinc-700 border-[#5A5A40] dark:border-zinc-600 text-white' 
                          : 'border-stone-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 hover:border-stone-500'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="space-y-1.5 flex-1">
                      {/* Linha 1: Horário, Código e Status */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-1 bg-[#2D2D2A] text-white text-xs font-mono font-bold rounded-lg flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#D4A373]" />
                          {booking.time} {booking.endTime ? `- ${booking.endTime}` : ''}
                        </span>

                        <span className="serif font-bold text-[#2D2D2A] dark:text-zinc-100 text-base">
                          {booking.clientName}
                        </span>

                        <span className="text-xs font-mono text-[#A09A8E] dark:text-zinc-500">
                          {booking.code}
                        </span>

                        {/* Status de Envio do Lembrete */}
                        {booking.reminderSent ? (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Lembrete Enviado
                            {booking.reminderTemplateUsed && (
                              <span className="opacity-75">({booking.reminderTemplateUsed})</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Pendente de Disparo
                          </span>
                        )}
                      </div>

                      {/* Linha 2: Serviço e Variação do Procedimento */}
                      <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#706B5F] dark:text-zinc-400">
                        <span className="font-semibold text-[#2D2D2A] dark:text-zinc-100">
                          {booking.serviceName}
                        </span>

                        {/* BADGE DA VARIAÇÃO DO SERVIÇO */}
                        {booking.serviceVariation ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#EEF1EB] text-[#5A5A40] dark:text-zinc-300 text-xs font-bold rounded-md border border-[#5A5A40] dark:border-zinc-600/20">
                            <Layers className="w-3 h-3" />
                            Variação: {booking.serviceVariation}
                          </span>
                        ) : service?.variations && service.variations.length > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-stone-100 dark:bg-zinc-800/80 text-stone-600 dark:text-zinc-400 text-2xs font-semibold rounded-md">
                            Variações disponíveis: {service.variations.join(', ')}
                          </span>
                        ) : null}

                        <span>• Duração: {booking.serviceDuration} min</span>
                        <span>• WhatsApp: <strong className="text-[#2D2D2A] dark:text-zinc-100">{booking.clientPhone}</strong></span>
                      </div>

                      {/* Linha 3: Financeiro e Sinal */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#706B5F] dark:text-zinc-400 pt-0.5">
                        <span>Total: <strong className="text-[#2D2D2A] dark:text-zinc-100">R$ {booking.totalPrice.toFixed(2)}</strong></span>
                        {booking.depositRequired && (
                          <span className={booking.depositPaid ? 'text-emerald-700 font-semibold' : 'text-amber-700'}>
                            • Sinal: R$ {booking.depositAmount.toFixed(2)} ({booking.depositPaid ? 'Pago via Pix ✅' : 'Pendente ⚠️'})
                          </span>
                        )}
                        <span>• Saldo restante no local: <strong className="text-[#5A5A40] dark:text-zinc-300">R$ {remaining.toFixed(2)}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Bloco 2: Botões de Disparo Individual */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0">
                    <button
                      onClick={() => handleSendSingleReminder(booking)}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                        booking.reminderSent
                          ? 'bg-[#EEF1EB] hover:bg-[#5A5A40] dark:bg-zinc-700 hover:text-white text-[#5A5A40] dark:text-zinc-300'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                      title="Abre WhatsApp Web ou App já com a mensagem preenchida"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {booking.reminderSent ? 'Reenviar WhatsApp' : 'Disparar WhatsApp'}
                    </button>

                    <button
                      onClick={() => {
                        setPreviewBooking(booking);
                        setIndividualCustomText(
                          generateReminderMessageText(
                            booking, 
                            professional, 
                            selectedVariation, 
                            selectedVariation === 'custom' ? customTemplateText : undefined
                          )
                        );
                      }}
                      className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 hover:bg-stone-100 dark:bg-zinc-800/80 text-[#706B5F] dark:text-zinc-400 border border-[#E9E2D7] dark:border-zinc-700 cursor-pointer"
                      title="Ver / Editar mensagem antes de enviar"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleCopySingleText(booking)}
                      className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 hover:bg-stone-100 dark:bg-zinc-800/80 text-[#706B5F] dark:text-zinc-400 border border-[#E9E2D7] dark:border-zinc-700 cursor-pointer"
                      title="Copiar texto da mensagem"
                    >
                      {copiedId === booking.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>

                    
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: FILA DE DISPARO GUIADA 1 A 1 (BULK QUEUE WIZARD) */}
      {/* ========================================================================= */}
      {isQueueModalOpen && (() => {
        const targetBookings = dayBookings.filter(b => selectedBookingIds.includes(b.id));
        const currentBooking = targetBookings[queueIndex];
        if (!currentBooking) return null;

        const currentMsg = generateReminderMessageText(
          currentBooking, 
          professional, 
          selectedVariation, 
          selectedVariation === 'custom' ? customTemplateText : undefined
        );

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-xl w-full border border-[#E9E2D7] dark:border-zinc-700 shadow-2xl overflow-hidden animate-in zoom-in-95">
              
              {/* Topo do Modal */}
              <div className="p-5 sm:p-6 bg-[#2D2D2A] text-white flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase tracking-wider font-bold text-[#D4A373]">
                    Fila de Disparo Guiada ({queueIndex + 1} de {targetBookings.length})
                  </span>
                  <h3 className="serif text-xl font-bold">
                    Enviar Lembrete para {currentBooking.clientName}
                  </h3>
                </div>
                <button
                  onClick={() => setIsQueueModalOpen(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Barra de Progresso */}
              <div className="w-full bg-stone-100 dark:bg-zinc-800/80 h-2">
                <div 
                  className="bg-[#5A5A40] dark:bg-zinc-700 h-full transition-all duration-300"
                  style={{ width: `${((queueIndex + 1) / targetBookings.length) * 100}%` }}
                />
              </div>

              <div className="p-6 space-y-4">
                {/* Dados da Cliente */}
                <div className="p-4 bg-[#F8F6F2] dark:bg-zinc-800 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#2D2D2A] dark:text-zinc-100 text-base">{currentBooking.clientName}</span>
                    <span className="px-2.5 py-1 bg-[#2D2D2A] text-white text-xs font-mono font-bold rounded-lg">
                      {currentBooking.time}
                    </span>
                  </div>
                  <div className="text-xs text-[#706B5F] dark:text-zinc-300 flex flex-wrap gap-2">
                    <span>{currentBooking.serviceName}</span>
                    {currentBooking.serviceVariation && (
                      <span className="font-bold text-[#5A5A40] dark:text-amber-300">• Variação: {currentBooking.serviceVariation}</span>
                    )}
                    <span>• WhatsApp: {currentBooking.clientPhone}</span>
                  </div>
                </div>

                {/* Prévia da Mensagem */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#2D2D2A] dark:text-zinc-200 block">
                    Mensagem que será enviada no WhatsApp:
                  </label>
                  <div className="whatsapp-chat-bubble p-4 bg-[#EFEAE2] dark:bg-[#0c1317] rounded-2xl border border-stone-300 dark:border-zinc-700 text-xs sm:text-sm text-stone-800 dark:text-[#e9edef] whitespace-pre-line max-h-56 overflow-y-auto leading-relaxed">
                    {currentMsg}
                  </div>
                </div>

                {/* Ações da Fila */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    onClick={() => {
                      if (queueIndex < targetBookings.length - 1) {
                        setQueueIndex(queueIndex + 1);
                      } else {
                        setIsQueueModalOpen(false);
                      }
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-stone-300 dark:border-zinc-700 text-stone-700 dark:text-zinc-300 text-xs font-bold hover:bg-stone-50 dark:bg-zinc-800 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    Pular esta Cliente &rarr;
                  </button>

                  <button
                    onClick={handleQueueSendAndNext}
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    Abrir WhatsApp e Avançar ({queueIndex + 1}/{targetBookings.length})
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL 2: PRÉVIA E EDIÇÃO INDIVIDUAL DA MENSAGEM */}
      {/* ========================================================================= */}
      {previewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full border border-[#E9E2D7] dark:border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-5 bg-[#5A5A40] dark:bg-zinc-700 text-white flex items-center justify-between">
              <div>
                <span className="text-xs text-[#D4A373] uppercase tracking-wider font-bold">
                  Personalizar Lembrete
                </span>
                <h3 className="serif text-lg font-bold">
                  {previewBooking.clientName} ({previewBooking.time})
                </h3>
              </div>
              <button
                onClick={() => setPreviewBooking(null)}
                className="p-1 rounded-lg text-white/70 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#2D2D2A] dark:text-zinc-200 block">
                  Edite o texto antes de disparar pelo WhatsApp:
                </label>
                <textarea
                  value={individualCustomText}
                  onChange={(e) => setIndividualCustomText(e.target.value)}
                  rows={8}
                  className="w-full text-xs sm:text-sm p-3.5 rounded-2xl border border-stone-300 dark:border-zinc-700 bg-[#F8F6F2] dark:bg-zinc-800 font-sans text-stone-800 dark:text-[#e9edef] focus:bg-white dark:bg-zinc-900 dark:focus:bg-zinc-900 focus:border-[#5A5A40] dark:border-zinc-600 focus:ring-1 focus:ring-[#5A5A40] dark:ring-zinc-600 outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setPreviewBooking(null)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-zinc-700 text-stone-700 dark:text-zinc-300 text-xs font-bold hover:bg-stone-50 dark:bg-zinc-800 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  onClick={() => handleSendSingleReminder(previewBooking, individualCustomText)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Abrir WhatsApp com este Texto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
