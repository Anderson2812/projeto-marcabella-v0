'use client';

import React, { use, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAppStore } from '@/lib/use-app-store';
import { formatDatePtBr, formatPhoneMask } from '@/lib/whatsapp-utils';
import { getGoogleCalendarUrl, downloadIcsFile } from '@/lib/calendar-utils';
import { generatePixCopiaECola } from '@/lib/pix-utils';
import { QRCodeSVG } from 'qrcode.react';

function subscribeTime(callback: () => void) {
  const timer = setInterval(callback, 10000);
  return () => clearInterval(timer);
}
function getTimeSnapshot() {
  return Date.now();
}
function getServerTimeSnapshot() {
  return 0;
}
import {
  Clock,
  CheckCircle2,
  MapPin,
  Phone,
  Sparkles,
  ArrowLeft,
  Copy,
  Check,
  ShieldAlert,
  AlertCircle,
  Calendar as CalendarIcon,
  Search,
  ExternalLink,
  Share2,
  CalendarCheck,
  RefreshCw,
  XCircle,
  AlertTriangle,
  Award,
  Gift,
  Star,
  CreditCard
} from 'lucide-react';

interface PageProps {
  params: Promise<{ code: string }>;
}

function formatMinutes(minutes: number): string {
  if (!minutes || minutes <= 0) return '0 min';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export default function BookingStatusPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const rawCode = decodeURIComponent(resolvedParams.code || '').trim();
  const cleanCode = rawCode.replace(/^#/, '').toLowerCase();

  const { bookings, professionals, reviews, addReview, getAvailabilityForProf, rescheduleBooking, getServicesForProf } = useAppStore();

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchCodeInput, setSearchCodeInput] = useState('');
  
  // Estados para Avaliação
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Estados para o Reagendamento
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleSuccessMessage, setRescheduleSuccessMessage] = useState('');

  const now = useSyncExternalStore(subscribeTime, getTimeSnapshot, getServerTimeSnapshot);

  // Localizar o agendamento
  const booking = bookings.find((b) => {
    const bCodeClean = b.code.replace(/^#/, '').toLowerCase();
    const bIdClean = b.id.toLowerCase();
    return bCodeClean === cleanCode || bIdClean === cleanCode || b.code.toLowerCase() === `#${cleanCode}`;
  });

  // Profissional associada
  const professional = booking
    ? professionals.find((p) => p.id === booking.professionalId) || {
        id: booking.professionalId,
        name: booking.professionalName,
        phone: booking.professionalPhone || '(11) 98765-4321',
        address: booking.professionalAddress || 'Espaço de Atendimento',
        category: 'Beleza & Estética',
        pixKey: booking.professionalPhone || '11987654321',
        pixKeyType: 'telefone',
        cancellationHours: 24,
        depositDeadlineHours: 2,
        slug: 'profissional',
        cardPaymentLink: ''
      }
    : null;

  // Código Pix Copia e Cola dinâmico se exigir sinal
  const pixCode =
    booking && professional && booking.depositRequired && !booking.depositPaid
      ? generatePixCopiaECola(
          professional.pixKey || professional.phone || '11987654321',
          professional.name,
          'SAO PAULO',
          booking.depositAmount,
          booking.code.replace(/[^A-Za-z0-9]/g, '')
        )
      : '';

  // Calcular tempo restante para pagamento do sinal
  const deadlineRemaining = (() => {
    if (!booking?.depositDeadlineAt || booking.depositPaid || booking.status !== 'awaiting_deposit' || !now) {
      return null;
    }
    const diff = new Date(booking.depositDeadlineAt).getTime() - now;
    if (diff <= 0) {
      return { expired: true, text: 'Prazo encerrado' };
    }
    const totalMinutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return {
      expired: false,
      text: hours > 0 ? `${hours}h ${mins}min restantes` : `${mins} minutos restantes`
    };
  })();

  // Cartão Fidelidade Exclusivo do Cliente: calcula os atendimentos deste cliente com este profissional
  const clientLoyaltyStats = (() => {
    if (!booking || !professional) return null;
    const clientPhoneClean = (booking.clientPhone || '').replace(/\D/g, '');
    const clientBookingsWithProf = bookings.filter((b) => {
      if (b.professionalId !== booking.professionalId) return false;
      if (b.status === 'cancelled') return false;
      const bPhoneClean = (b.clientPhone || '').replace(/\D/g, '');
      return (clientPhoneClean && bPhoneClean === clientPhoneClean) || 
             (b.clientName && b.clientName.toLowerCase() === booking.clientName.toLowerCase());
    });
    const config = ('loyaltyConfig' in professional ? (professional as any).loyaltyConfig : undefined) || {
      active: true,
      bookingsRequired: 10,
      rewardType: 'discount_percent',
      rewardValue: 20,
      rewardDescription: '20% de desconto no 10º agendamento'
    };
    const totalCount = Math.max(1, clientBookingsWithProf.length);
    const req = config.bookingsRequired || 10;
    const currentStamps = totalCount % req === 0 && totalCount > 0 ? req : totalCount % req;
    const hasCompleted = totalCount >= req;
    return {
      active: config.active !== false,
      bookingsRequired: req,
      rewardDescription: config.rewardDescription || `${config.rewardValue}% de desconto`,
      currentStamps,
      totalCount,
      hasCompleted
    };
  })();

  const handleCopy = (text: string, setCopied: (v: boolean) => void) => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      handleCopy(window.location.href, setCopiedLink);
    }
  };

  const availability = booking ? getAvailabilityForProf(booking.professionalId) : null;

  // Lógica dos dias liberados pela profissional
  const allowedDatesList = (() => {
    if (!availability) return [];
    if (availability.allowedDatesMode === 'specific_dates' && availability.allowedSpecificDates && availability.allowedSpecificDates.length > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      return availability.allowedSpecificDates.filter((d: string) => d >= todayStr).sort();
    }
    const dates: string[] = [];
    const nowD = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(nowD.getFullYear(), nowD.getMonth(), nowD.getDate() + i);
      const dayOfWeek = d.getDay();
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (availability.activeDays.includes(dayOfWeek) && !availability.blockedDates.includes(dateStr)) {
        dates.push(dateStr);
      }
    }
    return dates;
  })();

  const bookingProfId = booking?.professionalId || '';
  const bookingId = booking?.id || '';

  // Horários disponíveis para a data selecionada no reagendamento
  const availableRescheduleSlots = (() => {
    if (!rescheduleDate || !availability) return [];
    const dateObj = new Date(rescheduleDate + 'T00:00:00');
    const dayOfWeek = dateObj.getDay();
    if (!availability.activeDays.includes(dayOfWeek)) return [];

    const [startH, startM] = availability.startTime.split(':').map(Number);
    const [endH, endM] = availability.endTime.split(':').map(Number);
    const step = availability.intervalMinutes || 60;

    let current = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const slots: string[] = [];

    while (current + step <= endMinutes) {
      const h = Math.floor(current / 60);
      const m = current % 60;
      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      
      let inLunch = false;
      if (availability.hasLunchBreak && availability.lunchStart && availability.lunchEnd) {
        const [lh1, lm1] = availability.lunchStart.split(':').map(Number);
        const [lh2, lm2] = availability.lunchEnd.split(':').map(Number);
        const lunchStartMin = lh1 * 60 + lm1;
        const lunchEndMin = lh2 * 60 + lm2;
        if (current >= lunchStartMin && current < lunchEndMin) {
          inLunch = true;
        }
      }

      const isOccupied = bookings.some((b) => 
        b.professionalId === bookingProfId &&
        b.date === rescheduleDate &&
        b.time === timeStr &&
        b.status !== 'cancelled' &&
        b.id !== bookingId
      );

      if (!inLunch && !isOccupied) {
        slots.push(timeStr);
      }
      current += step;
    }
    return slots;
  })();

  const handleConfirmReschedule = () => {
    if (!booking || !rescheduleDate || !rescheduleTime) return;
    rescheduleBooking(booking.id, rescheduleDate, rescheduleTime);
    setRescheduleSuccessMessage(`Agendamento reagendado com sucesso para ${formatDatePtBr(rescheduleDate)} às ${rescheduleTime}!`);
    setIsRescheduleOpen(false);
  };

  // Se o agendamento não for encontrado
  if (!booking) {
    const alternativeBookings = searchCodeInput.trim()
      ? bookings.filter(
          (b) =>
            b.code.toLowerCase().includes(searchCodeInput.toLowerCase()) ||
            b.clientPhone.replace(/\D/g, '').includes(searchCodeInput.replace(/\D/g, '')) ||
            b.clientName.toLowerCase().includes(searchCodeInput.toLowerCase())
        )
      : [];

    return (
      <div className="min-h-[75vh] bg-[#FAF8F5] dark:bg-zinc-950 flex items-center justify-center px-4 py-12 text-[#2D2D2A] dark:text-zinc-100 transition-colors">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-10 max-w-lg w-full text-center border border-[#E9E2D7] dark:border-zinc-800 shadow-lg space-y-6">
          <div className="w-16 h-16 bg-[#FDF4EE] dark:bg-amber-950/40 text-[#D4A373] dark:text-amber-400 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="serif text-2xl font-bold text-[#2D2D2A] dark:text-zinc-100">
              Agendamento não encontrado
            </h1>
            <p className="text-[#706B5F] dark:text-zinc-400 text-sm leading-relaxed">
              Não localizamos nenhuma reserva com o código{' '}
              <span className="font-mono font-bold text-[#5A5A40] dark:text-amber-300 bg-[#EEF1EB] dark:bg-zinc-800 px-2 py-0.5 rounded">
                #{rawCode.replace(/^#/, '')}
              </span>
              . Verifique se o código foi digitado corretamente ou faça uma busca abaixo.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="relative">
              <input
                type="text"
                value={searchCodeInput}
                onChange={(e) => setSearchCodeInput(e.target.value)}
                placeholder="Digite seu código ou WhatsApp..."
                className="w-full pl-10 pr-4 py-3 bg-[#F8F6F2] dark:bg-zinc-800 border border-[#E9E2D7] dark:border-zinc-700 rounded-xl text-sm font-medium text-[#2D2D2A] dark:text-zinc-100 placeholder-[#A09A8E] dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#5A5A40] dark:ring-zinc-600"
              />
              <Search className="w-4 h-4 text-[#A09A8E] dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            {alternativeBookings.length > 0 && (
              <div className="text-left space-y-2 max-h-48 overflow-y-auto pt-1">
                <span className="text-[11px] font-bold text-[#5A5A40] dark:text-amber-300 uppercase tracking-wider block">
                  Agendamentos encontrados:
                </span>
                {alternativeBookings.map((alt) => (
                  <Link
                    key={alt.id}
                    href={`/agendamento/${alt.code.replace('#', '')}`}
                    className="block p-3 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 hover:border-[#5A5A40] dark:border-zinc-600 bg-[#FDFBF7] dark:bg-zinc-800 transition-all"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono font-bold text-[#5A5A40] dark:text-amber-400">{alt.code}</span>
                      <span className="text-[#706B5F] dark:text-zinc-400">{formatDatePtBr(alt.date)} às {alt.time}</span>
                    </div>
                    <div className="text-xs font-semibold text-[#2D2D2A] dark:text-zinc-200 mt-1 truncate">
                      {alt.serviceName} • {alt.professionalName}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#E9E2D7] dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#E8DCCD] dark:border-zinc-700 hover:bg-[#FAF5EF] dark:hover:bg-zinc-800 text-xs font-bold text-[#7A6D65] dark:text-zinc-300 flex items-center justify-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Página Inicial
            </Link>
            <Link
              href="/agendamento"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#8C4E46] hover:bg-[#783F38] dark:bg-rose-700 dark:hover:bg-rose-600 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              Consultar Todas as Reservas
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Definições visuais de status
  const statusConfig = {
    pending: {
      label: 'Aguardando Aprovação',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
      icon: Clock,
      title: 'Solicitação em Análise pelo(a) Profissional',
      description: `O sistema já registrou e notificou ${professional?.name || 'o(a) profissional'} sobre seu pedido. Assim que houver a aprovação, você receberá a notificação no WhatsApp.`
    },
    awaiting_deposit: {
      label: 'Aguardando Sinal Pix',
      badgeClass: 'bg-amber-500 text-white border-amber-600 animate-pulse',
      icon: AlertCircle,
      title: 'Pré-Aprovado! Pagamento do Sinal Pendente',
      description: `Sua solicitação foi aceita por ${professional?.name}! Agora, envie o Pix do sinal para garantir sua vaga em definitivo na agenda.`
    },
    confirmed: {
      label: 'Reserva Confirmada',
      badgeClass: 'bg-emerald-600 text-white border-emerald-700',
      icon: CheckCircle2,
      title: 'Seu Horário está 100% Confirmado!',
      description: `Tudo certo! Sua vaga está garantida com ${professional?.name} para ${formatDatePtBr(booking.date)} às ${booking.time}.`
    },
    completed: {
      label: 'Atendimento Concluído',
      badgeClass: 'bg-stone-700 text-white border-stone-800',
      icon: Check,
      title: 'Procedimento Realizado',
      description: 'Este atendimento foi concluído com sucesso. Esperamos que tenha adorado o resultado!'
    },
    cancelled: {
      label: 'Agendamento Cancelado',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
      icon: XCircle,
      title: 'Agendamento Cancelado',
      description: booking.cancellationReason || 'Este horário foi cancelado e não está mais reservado.'
    }
  }[booking.status];

  // Cálculo da timeline
  const timelineSteps = [
    {
      title: 'Solicitação Enviada',
      desc: 'Recebida pelo sistema',
      done: true,
      active: false
    },
    {
      title: 'Aprovação da Profissional',
      desc: booking.status === 'pending' ? 'Em análise agora' : 'Aprovada',
      done: booking.status !== 'pending' && booking.status !== 'cancelled',
      active: booking.status === 'pending'
    },
    ...(booking.depositRequired
      ? [
          {
            title: 'Sinal Pix de Reserva',
            desc: booking.depositPaid
              ? 'Sinal confirmado'
              : booking.status === 'awaiting_deposit'
              ? 'Aguardando Pix'
              : `R$ ${booking.depositAmount.toFixed(2)}`,
            done: !!booking.depositPaid,
            active: booking.status === 'awaiting_deposit' && !booking.depositPaid
          }
        ]
      : []),
    {
      title: 'Horário Confirmado',
      desc: booking.status === 'confirmed' ? 'Garantido na agenda' : 'Etapa final',
      done: booking.status === 'confirmed' || booking.status === 'completed',
      active: booking.status === 'confirmed'
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-zinc-950 text-[#2D2D2A] dark:text-zinc-100 py-8 sm:py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Barra superior de navegação e compartilhamento */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={professional ? `/${professional.slug}` : '/'}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5A5A40] dark:text-amber-300 hover:text-[#2D2D2A] dark:hover:text-zinc-100 dark:text-zinc-100 dark:hover:text-zinc-100 dark:text-zinc-100 dark:hover:text-zinc-100 bg-white dark:bg-zinc-900 px-3 py-2 rounded-xl border border-[#E9E2D7] dark:border-zinc-800 shadow-2xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {professional ? `Agenda de ${professional.name}` : 'Página Inicial'}
          </Link>

          <div className="flex items-center gap-2">
            {booking.status !== 'cancelled' && booking.status !== 'completed' && (
              <button
                onClick={() => {
                  setIsRescheduleOpen(true);
                  setRescheduleDate(allowedDatesList[0] || booking.date);
                  setRescheduleTime(booking.time);
                  setRescheduleSuccessMessage('');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8C4E46] dark:text-rose-300 bg-[#FAF5EF] dark:bg-zinc-800 hover:bg-[#F2E5D8] dark:hover:bg-zinc-700 px-3 py-2 rounded-xl border border-[#E8DCCD] dark:border-zinc-700 shadow-2xs transition-colors cursor-pointer"
                title="Reagendar data ou horário"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                Reagendar
              </button>
            )}

            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7A6D65] dark:text-zinc-300 bg-white dark:bg-zinc-900 hover:bg-[#FAF5EF] dark:hover:bg-zinc-800 px-3 py-2 rounded-xl border border-[#E8DCCD] dark:border-zinc-800 shadow-2xs transition-colors cursor-pointer"
              title="Copiar link para acompanhar a reserva"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              {copiedLink ? 'Link copiado!' : 'Compartilhar Link'}
            </button>

            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#706B5F] dark:text-zinc-400 hover:text-[#2D2D2A] dark:hover:text-zinc-100 dark:text-zinc-100 dark:hover:text-zinc-100 dark:text-zinc-100 dark:hover:text-zinc-100 bg-white dark:bg-zinc-900 p-2 rounded-xl border border-[#E9E2D7] dark:border-zinc-800 shadow-2xs transition-colors cursor-pointer"
              title="Atualizar status da reserva"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Notificações de Reagendamento */}
        {booking.rescheduledFrom && (
          <div className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5 shadow-2xs">
            <CalendarCheck className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Horário Reagendado</span>
              <p className="text-[#706B5F] dark:text-zinc-300 mt-0.5">
                Esta reserva foi reagendada anteriormente (data anterior: {formatDatePtBr(booking.rescheduledFrom.date)} às {booking.rescheduledFrom.time}). Seu horário oficial agora é <strong>{formatDatePtBr(booking.date)} às {booking.time}</strong>.
              </p>
            </div>
          </div>
        )}

        {rescheduleSuccessMessage && (
          <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-4 text-xs font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-2 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{rescheduleSuccessMessage}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CARD PRINCIPAL: STATUS DA RESERVA EM TEMPO REAL */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-[#E9E2D7] dark:border-zinc-800 shadow-sm space-y-6 transition-colors">
          
          {/* Header do Card com Código e Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E9E2D7] dark:border-zinc-800 pb-5">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-[#A09A8E] dark:text-zinc-400 font-bold block">
                Status da Reserva em Tempo Real
              </span>
              <div className="flex items-center gap-2 mt-1">
                <h1 className="font-mono text-xl sm:text-2xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                  {booking.code}
                </h1>
                <button
                  onClick={() => handleCopy(booking.code, setCopiedCode)}
                  className="p-1.5 text-[#706B5F] dark:text-zinc-400 hover:text-[#5A5A40] dark:text-zinc-300 dark:hover:text-amber-300 hover:bg-[#EEF1EB] dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title="Copiar código da reserva"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border shadow-2xs ${statusConfig.badgeClass}`}
              >
                <statusConfig.icon className="w-4 h-4" />
                {statusConfig.label}
              </span>
            </div>
          </div>

          {/* Mensagem descritiva do status atual */}
          <div className="bg-[#FAF8F5] dark:bg-zinc-800/60 p-4 sm:p-5 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 flex items-start gap-3.5 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-[#E9E2D7] dark:border-zinc-700 text-[#5A5A40] dark:text-amber-300 flex items-center justify-center shrink-0 shadow-2xs">
              <Sparkles className="w-5 h-5 text-[#D4A373] dark:text-amber-400" />
            </div>
            <div className="space-y-1 text-xs sm:text-sm">
              <h2 className="font-bold text-[#2D2D2A] dark:text-zinc-100 text-sm sm:text-base">
                {statusConfig.title}
              </h2>
              <p className="text-[#706B5F] dark:text-zinc-300 leading-relaxed">
                {statusConfig.description}
              </p>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* LINHA DO TEMPO VISUAL DE PROGRESSO (STEPPER) */}
          {/* ======================================================================= */}
          <div className="pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {timelineSteps.map((step, idx) => {
                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-1.5 ${
                      step.active
                        ? 'border-[#5A5A40] dark:border-amber-500 bg-[#EEF1EB]/80 dark:bg-zinc-800 ring-1 ring-[#5A5A40] dark:ring-amber-500'
                        : step.done
                        ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/30'
                        : 'border-[#E9E2D7] dark:border-zinc-800 bg-[#FDFBF7]/60 dark:bg-zinc-800/30 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          step.done
                            ? 'bg-emerald-600 text-white'
                            : step.active
                            ? 'bg-[#5A5A40] dark:bg-amber-500 text-white animate-pulse'
                            : 'bg-stone-200 dark:bg-zinc-700 text-stone-500 dark:text-zinc-400'
                        }`}
                      >
                        {step.done ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                      </span>
                      {step.done && (
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 px-2 py-0.5 rounded-md">
                          Concluído
                        </span>
                      )}
                      {step.active && (
                        <span className="text-[10px] font-bold text-[#5A5A40] dark:text-amber-300 bg-[#EEF1EB] dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                          Atual
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#2D2D2A] dark:text-zinc-100">{step.title}</div>
                      <div className="text-[11px] text-[#706B5F] dark:text-zinc-400">{step.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ======================================================================= */}
          {/* BLOCO DE AÇÃO ESPECÍFICA: SINAL PIX (SE AGUARDANDO PAGAMENTO) */}
          {/* ======================================================================= */}
          {booking.status === 'awaiting_deposit' && !booking.depositPaid && professional && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-3xl p-5 sm:p-7 space-y-5 animate-in fade-in zoom-in-95">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    Pagamento do Sinal Obrigatório
                  </div>
                  <p className="text-xs text-amber-800">
                    Pague o sinal abaixo para confirmar e travar seu horário na agenda.
                  </p>
                </div>

                {deadlineRemaining && (
                  <div className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                    deadlineRemaining.expired
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-200 text-amber-950 shadow-2xs'
                  }`}>
                    <Clock className="w-3.5 h-3.5" />
                    {deadlineRemaining.text}
                  </div>
                )}
              </div>

              {/* Valor e QR Code */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                <div className="space-y-4">
                  <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-amber-200 shadow-2xs space-y-2">
                    <span className="text-xs text-[#706B5F] dark:text-zinc-400 block">Valor do Sinal Pix:</span>
                    <div className="serif text-3xl font-bold text-[#5A5A40] dark:text-zinc-300">
                      R$ {booking.depositAmount.toFixed(2)}
                    </div>
                    <span className="text-[11px] text-[#A09A8E] dark:text-zinc-500 block">
                      Saldo restante no local: R$ {(booking.totalPrice - booking.depositAmount).toFixed(2)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-amber-900 block">
                      Chave Pix da Profissional ({professional.name}):
                    </span>
                    <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-3 rounded-xl border border-amber-200 text-xs">
                      <span className="font-mono font-bold text-[#2D2D2A] dark:text-zinc-100 truncate">
                        {professional.pixKey || professional.phone}
                      </span>
                      <button
                        onClick={() => handleCopy(professional.pixKey || professional.phone, setCopiedPix)}
                        className="p-1 text-[#5A5A40] dark:text-zinc-300 hover:bg-[#EEF1EB] dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                        title="Copiar chave Pix"
                      >
                        {copiedPix ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {pixCode && (
                    <button
                      onClick={() => handleCopy(pixCode, setCopiedPix)}
                      className="w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.01]"
                    >
                      {copiedPix ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                      {copiedPix ? 'Código Pix Copiado com Sucesso!' : 'Copiar Código Pix Copia e Cola'}
                    </button>
                  )}

                  {/* Botão de Pagamento com Cartão de Crédito (se cadastrado link pela profissional) */}
                  {(() => {
                    const profServices = booking.professionalId ? getServicesForProf(booking.professionalId) : [];
                    const activeServiceWithCard = profServices.find(s => s.id === booking.serviceId && s.cardPaymentLink);
                    const cardLink = activeServiceWithCard?.cardPaymentLink || professional.cardPaymentLink || '';

                    if (!cardLink) return null;

                    return (
                      <a
                        href={cardLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.01]"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Pagar Sinal com Cartão de Crédito</span>
                        <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-80" />
                      </a>
                    );
                  })()}
                </div>

                {/* QR Code SVG */}
                <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-amber-200 flex flex-col items-center justify-center text-center shadow-2xs">
                  <div className="bg-white dark:bg-zinc-900 p-2 rounded-xl shadow-inner border border-stone-200 dark:border-zinc-700">
                    <QRCodeSVG
                      value={pixCode || professional.pixKey || professional.phone}
                      size={160}
                      level="M"
                      includeMargin
                    />
                  </div>
                  <span className="text-[11px] text-[#706B5F] dark:text-zinc-400 mt-2 font-medium">
                    Abra o app do seu banco e escaneie o QR Code
                  </span>
                </div>
              </div>

              <div className="text-xs text-amber-900/80 bg-white dark:bg-zinc-900/70 p-3 rounded-xl border border-amber-200 leading-relaxed">
                ℹ️ Assim que o(a) profissional identificar a transferência do sinal, seu agendamento passará para o status <strong>Confirmado</strong> automaticamente nesta tela!
              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* BLOCO DE SUCESSO / HORÁRIO CONFIRMADO COM AÇÕES DE CALENDÁRIO */}
          {/* ======================================================================= */}
          {booking.status === 'confirmed' && (
            <div className="bg-emerald-50/80 border-2 border-emerald-200 rounded-3xl p-5 sm:p-7 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-emerald-950 text-base sm:text-lg">
                    Seu atendimento está agendado e garantido!
                  </h3>
                  <p className="text-xs text-emerald-900/80">
                    Não se esqueça da data e horário. Adicione ao seu calendário com 1 clique abaixo:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <a
                  href={getGoogleCalendarUrl(booking)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-4 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-300 hover:bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-colors"
                >
                  <CalendarIcon className="w-4 h-4 text-emerald-700" />
                  Adicionar ao Google Agenda
                </a>

                <button
                  onClick={() => downloadIcsFile(booking)}
                  className="py-3 px-4 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-300 hover:bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 text-emerald-700" />
                  Baixar Arquivo de Calendário (.ics)
                </button>
              </div>

              {/* Informações financeiras de quitação no local */}
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[#706B5F] dark:text-zinc-400 block">Valor total do serviço:</span>
                  <strong className="text-sm text-[#2D2D2A] dark:text-zinc-100">R$ {booking.totalPrice.toFixed(2)}</strong>
                </div>
                {booking.depositRequired && (
                  <div>
                    <span className="text-emerald-700 dark:text-emerald-300 font-semibold block">Sinal pago:</span>
                    <strong className="text-sm text-emerald-800 dark:text-emerald-200">R$ {booking.depositAmount.toFixed(2)}</strong>
                  </div>
                )}
                <div>
                  <span className="text-[#706B5F] dark:text-zinc-400 block">Saldo a acertar no dia:</span>
                  <strong className="text-base text-[#5A5A40] dark:text-amber-300">
                    R$ {(booking.totalPrice - (booking.depositPaid ? booking.depositAmount : 0)).toFixed(2)}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* BLOCO DE ATENDIMENTO CONCLUÍDO & AVALIAÇÃO REAL DE EXPERIÊNCIA */}
          {/* ======================================================================= */}
          {booking.status === 'completed' && (
            <div className="bg-amber-50/60 dark:bg-zinc-800/80 border-2 border-amber-200 dark:border-zinc-700 rounded-3xl p-5 sm:p-7 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-300 dark:border-amber-800/60">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-bold text-[#2D2D2A] dark:text-zinc-100 text-base sm:text-lg">
                    Como foi seu atendimento com {booking.professionalName}?
                  </h3>
                  <p className="text-xs text-[#706B5F] dark:text-zinc-400 leading-relaxed">
                    Sua avaliação real ajuda a valorizar o trabalho da profissional e orienta outras clientes.
                  </p>
                </div>
              </div>

              {(() => {
                const existingReview = reviews.find(
                  (r) =>
                    r.bookingId === booking.id ||
                    (r.professionalId === booking.professionalId &&
                      r.clientName.trim().toLowerCase() === booking.clientName.trim().toLowerCase() &&
                      r.serviceName === booking.serviceName)
                );

                if (existingReview || reviewSubmitted) {
                  const displayRating = existingReview ? existingReview.rating : reviewRating;
                  const displayComment = existingReview ? existingReview.comment : reviewComment;
                  return (
                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-amber-400">
                          {[...Array(displayRating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          ✓ Avaliação Registrada
                        </span>
                      </div>
                      {displayComment && (
                        <p className="text-xs text-[#444] dark:text-zinc-300 italic">
                          &ldquo;{displayComment}&rdquo;
                        </p>
                      )}
                      <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                        Obrigado por avaliar! Sua opinião é exibida publicamente na página de agendamentos.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 space-y-3.5 shadow-2xs">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-200">
                        Sua Nota:
                      </label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="p-1 cursor-pointer transition-transform hover:scale-110"
                            title={`${star} estrelas`}
                          >
                            <Star
                              className={`w-6 h-6 ${
                                star <= reviewRating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-stone-300 dark:text-zinc-600'
                              }`}
                            />
                          </button>
                        ))}
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 ml-1">
                          {reviewRating} de 5 estrelas
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-200">
                        Comentário ou Elogio:
                      </label>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Conte como foi sua experiência, o que mais gostou no atendimento..."
                        rows={3}
                        className="w-full p-3 bg-[#FAF8F5] dark:bg-zinc-800 border border-[#E9E2D7] dark:border-zinc-700 rounded-xl text-xs text-[#2D2D2A] dark:text-zinc-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        addReview({
                          professionalId: booking.professionalId,
                          bookingId: booking.id,
                          clientName: booking.clientName,
                          rating: reviewRating,
                          comment: reviewComment || 'Atendimento excelente!',
                          serviceName: booking.serviceName
                        });
                        setReviewSubmitted(true);
                      }}
                      className="w-full py-2.5 px-4 bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer transition-colors flex items-center justify-center gap-2"
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                      Publicar Avaliação Real
                    </button>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ======================================================================= */}
          {/* SEÇÃO: DETALHES COMPLETOS DO AGENDAMENTO */}
          {/* ======================================================================= */}
          <div className="space-y-4 pt-2">
            <h3 className="serif font-bold text-lg text-[#2D2D2A] dark:text-zinc-100 flex items-center gap-2 border-b border-[#E9E2D7] dark:border-zinc-800 pb-2">
              <CalendarIcon className="w-4 h-4 text-[#5A5A40] dark:text-amber-400" />
              Detalhes do Procedimento
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Card Esquerda: Procedimentos */}
              <div className="bg-[#FAF8F5] dark:bg-zinc-800/60 p-5 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 space-y-3 transition-colors">
                <span className="text-xs font-bold text-[#5A5A40] dark:text-amber-300 uppercase tracking-wider block">
                  Procedimento(s)
                </span>
                
                <div className="space-y-2">
                  <div className="font-bold text-sm sm:text-base text-[#2D2D2A] dark:text-zinc-100">
                    {booking.serviceName}
                  </div>

                  {booking.serviceVariation && (
                    <div className="text-xs text-[#5A5A40] dark:text-amber-300 font-semibold bg-[#EEF1EB] dark:bg-zinc-800 px-2.5 py-1 rounded-md inline-block">
                      Variação: {booking.serviceVariation}
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs text-[#706B5F] dark:text-zinc-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#5A5A40] dark:text-amber-400" />
                      Duração estimada: <strong className="text-[#2D2D2A] dark:text-zinc-200">{formatMinutes(booking.serviceDuration)}</strong>
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E9E2D7] dark:border-zinc-700 flex items-center justify-between text-xs">
                  <span className="text-[#706B5F] dark:text-zinc-400">Data e Horário:</span>
                  <span className="font-bold text-[#2D2D2A] dark:text-zinc-100">
                    {formatDatePtBr(booking.date)} às {booking.time}
                  </span>
                </div>
              </div>

              {/* Card Direita: Profissional & Local */}
              <div className="bg-[#FAF8F5] dark:bg-zinc-800/60 p-5 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 space-y-3 transition-colors">
                <span className="text-xs font-bold text-[#5A5A40] dark:text-amber-300 uppercase tracking-wider block">
                  Profissional & Local
                </span>

                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#5A5A40] dark:bg-amber-600 text-white flex items-center justify-center font-bold text-base shadow-2xs">
                    {booking.professionalName[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#2D2D2A] dark:text-zinc-100">
                      {booking.professionalName}
                    </h4>
                    <span className="text-xs text-[#706B5F] dark:text-zinc-400">
                      {professional?.category || 'Especialista em Beleza'}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-[#706B5F] dark:text-zinc-400 space-y-1.5 pt-1">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#5A5A40] dark:text-amber-400 shrink-0 mt-0.5" />
                    <span>{booking.professionalAddress || 'Endereço informado na confirmação'}</span>
                  </div>

                  {booking.professionalAddress && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        booking.professionalAddress
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#5A5A40] dark:text-amber-300 hover:underline pt-0.5"
                    >
                      <MapPin className="w-3 h-3" />
                      Como Chegar no Google Maps
                    </a>
                  )}
                </div>
              </div>

            </div>

            {/* Dados do Cliente */}
            <div className="bg-[#FAF8F5] dark:bg-zinc-800/60 p-5 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 flex flex-wrap items-center justify-between gap-4 text-xs transition-colors">
              <div>
                <span className="text-[#A09A8E] dark:text-zinc-400 block">Cliente Agendada:</span>
                <strong className="text-[#2D2D2A] dark:text-zinc-100 text-sm">{booking.clientName}</strong>
              </div>
              <div>
                <span className="text-[#A09A8E] dark:text-zinc-400 block">WhatsApp de Contato:</span>
                <strong className="text-[#2D2D2A] dark:text-zinc-100 text-sm">{formatPhoneMask(booking.clientPhone)}</strong>
              </div>
              <div>
                <span className="text-[#A09A8E] dark:text-zinc-400 block">Tolerância de Atraso:</span>
                <strong className="text-[#5A5A40] dark:text-amber-300 text-sm">Máximo 10 minutos</strong>
              </div>
            </div>

            {booking.notes && (
              <div className="bg-[#FAF8F5] dark:bg-zinc-800/60 p-4 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 text-xs space-y-1 transition-colors">
                <span className="text-[#A09A8E] dark:text-zinc-400 font-bold block">Observações do Agendamento:</span>
                <p className="text-[#706B5F] dark:text-zinc-300 italic">&ldquo;{booking.notes}&rdquo;</p>
              </div>
            )}

            {/* ======================================================================= */}
            {/* CARTÃO FIDELIDADE EXCLUSIVO DO CLIENTE */}
            {/* ======================================================================= */}
            {clientLoyaltyStats && clientLoyaltyStats.active && (
              <div className="bg-gradient-to-br from-[#5A5A40] to-[#383826] dark:from-zinc-900 dark:to-zinc-950 rounded-3xl p-6 sm:p-7 text-white shadow-md border border-white/10 dark:border-zinc-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/20 pb-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-2xs font-bold uppercase tracking-widest text-[#D4A373] bg-black/30 px-2.5 py-0.5 rounded-full">
                        Exclusivo para Você
                      </span>
                      <Award className="w-4 h-4 text-[#D4A373]" />
                    </div>
                    <h4 className="serif text-lg font-bold text-white mt-1">
                      Seu Cartão Fidelidade com {booking.professionalName}
                    </h4>
                    <p className="text-xs text-[#E9E2D7]">
                      Titular: <strong>{booking.clientName}</strong> • {clientLoyaltyStats.currentStamps} de {clientLoyaltyStats.bookingsRequired} selos acumulados
                    </p>
                  </div>

                  {clientLoyaltyStats.hasCompleted && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold self-start sm:self-auto">
                      <Star className="w-3.5 h-3.5 fill-emerald-300" />
                      Prêmio Disponível!
                    </div>
                  )}
                </div>

                {/* Selos da Cartela da Cliente */}
                <div className="space-y-2">
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {[...Array(clientLoyaltyStats.bookingsRequired)].map((_, i) => {
                      const isStamped = i < clientLoyaltyStats.currentStamps;
                      const isLast = i === clientLoyaltyStats.bookingsRequired - 1;
                      return (
                        <div
                          key={i}
                          className={`h-11 rounded-xl flex flex-col items-center justify-center border text-xs transition-all ${
                            isStamped
                              ? 'bg-white dark:bg-zinc-900 text-[#5A5A40] dark:text-zinc-300 border-white shadow-xs font-bold'
                              : isLast
                              ? 'bg-[#D4A373]/30 text-[#D4A373] border-[#D4A373]/60 font-bold'
                              : 'bg-white dark:bg-zinc-900/10 text-white/50 border-white/20'
                          }`}
                          title={`Selo ${i + 1}`}
                        >
                          {isStamped ? (
                            <Check className="w-4 h-4 stroke-[3]" />
                          ) : isLast ? (
                            <Gift className="w-4 h-4" />
                          ) : (
                            <span className="text-[11px] font-bold">{i + 1}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-white/15 text-2xs text-[#E9E2D7]">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#D4A373]" />
                    Recompensa da meta: <strong>{clientLoyaltyStats.rewardDescription}</strong>
                  </span>
                  <span className="text-white/70">
                    O cartão fidelidade serve exclusivamente para os clientes acumularem benefícios.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Botões de Ação Final */}
          <div className="pt-4 border-t border-[#E9E2D7] dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            {professional?.slug && (
              <Link
                href={`/${professional.slug}`}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 hover:border-[#5A5A40] dark:border-zinc-600 dark:hover:border-amber-400 bg-white dark:bg-zinc-800 text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 flex items-center justify-center gap-2 transition-colors"
              >
                Fazer Outro Agendamento
              </Link>
            )}

            <Link
              href="/agendamento"
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#EEF1EB] dark:bg-zinc-800 hover:bg-[#E3E8DE] dark:hover:bg-zinc-700 text-xs font-bold text-[#5A5A40] dark:text-amber-300 flex items-center justify-center gap-2 transition-colors"
            >
              Consultar Todas as Minhas Reservas
            </Link>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* MODAL DE REAGENDAMENTO DE HORÁRIO */}
        {/* ========================================================================= */}
        {isRescheduleOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-[#E9E2D7] dark:border-zinc-800 shadow-xl space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto transition-colors">
              
              <div className="flex items-start justify-between gap-3 border-b border-[#E9E2D7] dark:border-zinc-800 pb-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EEF1EB] dark:bg-zinc-800 text-[#5A5A40] dark:text-amber-300 text-[11px] font-bold mb-1">
                    <CalendarCheck className="w-3.5 h-3.5" />
                    Reagendar Atendimento
                  </div>
                  <h3 className="serif text-xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                    Escolha uma Nova Data e Horário
                  </h3>
                  <p className="text-xs text-[#706B5F] dark:text-zinc-400 mt-0.5">
                    Reserva #{booking.code} com {booking.professionalName}
                  </p>
                </div>

                <button
                  onClick={() => setIsRescheduleOpen(false)}
                  className="p-1.5 text-[#706B5F] dark:text-zinc-400 hover:text-[#2D2D2A] dark:hover:text-zinc-100 dark:text-zinc-100 dark:hover:text-zinc-100 dark:text-zinc-100 dark:hover:text-zinc-100 hover:bg-[#FAF8F5] dark:hover:bg-zinc-800 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Seleção da Data */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#5A5A40] dark:text-amber-300 uppercase tracking-wider">
                  1. Selecione a Nova Data (Dias Liberados pela Profissional)
                </label>
                
                {allowedDatesList.length === 0 ? (
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-200">
                    A profissional não possui datas disponíveis no momento. Entre em contato diretamente pelo WhatsApp.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1 bg-[#FAF8F5] dark:bg-zinc-800/50 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700">
                    {allowedDatesList.map((dateStr) => {
                      const isSelected = rescheduleDate === dateStr;
                      return (
                        <button
                          key={dateStr}
                          type="button"
                          onClick={() => {
                            setRescheduleDate(dateStr);
                            setRescheduleTime('');
                          }}
                          className={`p-2.5 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#5A5A40] dark:bg-amber-600 text-white shadow-xs'
                              : 'bg-white dark:bg-zinc-800 text-[#2D2D2A] dark:text-zinc-200 border border-[#E9E2D7] dark:border-zinc-700 hover:border-[#5A5A40] dark:border-zinc-600'
                          }`}
                        >
                          {formatDatePtBr(dateStr)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Seleção do Horário */}
              {rescheduleDate && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#5A5A40] dark:text-amber-300 uppercase tracking-wider">
                    2. Selecione o Novo Horário ({formatDatePtBr(rescheduleDate)})
                  </label>

                  {availableRescheduleSlots.length === 0 ? (
                    <div className="p-4 rounded-xl bg-stone-50 dark:bg-zinc-800/50 border border-[#E9E2D7] dark:border-zinc-700 text-xs text-stone-600 dark:text-zinc-400 text-center">
                      Não há horários disponíveis para esta data. Por favor, selecione outro dia.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1 bg-[#FAF8F5] dark:bg-zinc-800/50 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700">
                      {availableRescheduleSlots.map((timeStr) => {
                        const isSelected = rescheduleTime === timeStr;
                        return (
                          <button
                            key={timeStr}
                            type="button"
                            onClick={() => setRescheduleTime(timeStr)}
                            className={`py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#5A5A40] dark:bg-amber-600 text-white shadow-xs'
                                : 'bg-white dark:bg-zinc-800 text-[#2D2D2A] dark:text-zinc-200 border border-[#E9E2D7] dark:border-zinc-700 hover:border-[#5A5A40] dark:border-zinc-600'
                            }`}
                          >
                            {timeStr}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Resumo da Mudança */}
              {rescheduleDate && rescheduleTime && (
                <div className="bg-[#EEF1EB] dark:bg-zinc-800 p-3.5 rounded-2xl border border-[#D5DDCF] dark:border-zinc-700 text-xs space-y-1">
                  <span className="text-[#5A5A40] dark:text-amber-300 font-bold block">Novo Horário Proposto:</span>
                  <div className="flex items-center gap-2 text-[#2D2D2A] dark:text-zinc-100 font-bold">
                    <Clock className="w-4 h-4 text-[#5A5A40] dark:text-amber-400" />
                    <span>{formatDatePtBr(rescheduleDate)} às {rescheduleTime}</span>
                  </div>
                  <span className="text-[11px] text-[#706B5F] dark:text-zinc-400 block">
                    Horário anterior: {formatDatePtBr(booking.date)} às {booking.time}
                  </span>
                </div>
              )}

              {/* Botões do Modal */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRescheduleOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-xs font-bold text-[#706B5F] dark:text-zinc-300 hover:bg-[#FAF8F5] dark:hover:bg-zinc-800 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!rescheduleDate || !rescheduleTime}
                  onClick={handleConfirmReschedule}
                  className="px-5 py-2.5 rounded-xl bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 dark:bg-amber-600 dark:hover:bg-amber-500 disabled:opacity-50 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Confirmar Reagendamento
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
