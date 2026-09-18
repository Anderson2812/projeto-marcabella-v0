'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import { 
  Professional, 
  ServiceItem, 
  Booking,
  PortfolioPhoto
} from '@/types';
import { useAppStore } from '@/lib/use-app-store';
import { useBodyScrollLock } from '@/lib/use-body-scroll-lock';
import { getTheme, getThemeStyles } from '@/lib/theme-utils';
import { 
  formatDatePtBr, 
  formatPhoneMask, 
  isValidWhatsApp,
  generateProfessionalNotificationWhatsAppUrl,
  cleanPhone
} from '@/lib/whatsapp-utils';
import { openWhatsAppSafely, buildWhatsAppUrl } from '@/lib/validation-utils';
import { generatePixCopiaECola } from '@/lib/pix-utils';
import { formatWorkingDaysSummary } from '@/lib/calendar-utils';
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
  Info,
  Search,
  Plus,
  Trash2,
  Sun,
  Sunset,
  Moon,
  AlertCircle,
  Calendar as CalendarIcon,
  ChevronRight,
  User,
  HeartHandshake,
  Star,
  X,
  RotateCcw,
  MessageCircle,
  MessageSquare,
  Layers,
  Scissors,
  Crown,
  AlertTriangle,
  Camera,
  Percent,
  ArrowUpRight,
  ArrowDown,
  Banknote,
  CreditCard,
  ExternalLink
} from 'lucide-react';

interface Props {
  professional: Professional;
  initialServiceId?: string;
  onBackToProfile?: () => void;
}

function formatMinutes(minutes: number): string {
  if (!minutes || minutes <= 0) return '0 min';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export default function ClientBookingFlow({ professional, initialServiceId, onBackToProfile }: Props) {
  const { 
    themeMode,
    getServicesForProf, 
    getAvailabilityForProf, 
    getReviewsForProf,
    addWaitlistEntry,
    bookings, 
    createBooking,
    confirmMessageReceived
  } = useAppStore();

  const isDark = themeMode === 'dark';
  const themeConfig = getTheme(professional.themeColor, isDark);
  const themeStyles = getThemeStyles(professional.themeColor, isDark);

  const services = getServicesForProf(professional.id);
  const availability = getAvailabilityForProf(professional.id);
  const reviews = getReviewsForProf(professional.id);

  const workingDaysSummary = useMemo(() => {
    return formatWorkingDaysSummary(availability);
  }, [availability]);

  const isMasculine = professional.genderPreference === 'masculine' || 
    professional.pageLayoutTemplate === 'barber_club' ||
    professional.category.toLowerCase().includes('barbearia') || 
    professional.category.toLowerCase().includes('barbeiro') || 
    professional.category.toLowerCase().includes('barba') || 
    professional.category.toLowerCase().includes('masculin');

  const activeLayout = professional.pageLayoutTemplate || (isMasculine ? 'barber_club' : 'classic_elegant');

  // Steps: 1: Serviços, 2: Dia e Horário, 3: Identificação & Confirmação Automática, 4: Sucesso
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Multi-service selection state
  const [selectedServices, setSelectedServices] = useState<ServiceItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Fotos Reais dos Serviços
  const [selectedPhotoForModal, setSelectedPhotoForModal] = useState<PortfolioPhoto | null>(null);

  // Sugestão Inteligente de Procedimento Complementar com Desconto
  const [activeSuggestion, setActiveSuggestion] = useState<{
    baseService: ServiceItem;
    suggestedService: ServiceItem;
    discountPercent: number;
    discountedPrice: number;
    savings: number;
  } | null>(null);
  const [suggestionAcceptedAlert, setSuggestionAcceptedAlert] = useState(false);

  // Lista de Fotos Reais da Profissional (ou extraídas dos serviços com fotos)
  const portfolioList: PortfolioPhoto[] = useMemo(() => {
    if (professional.portfolioPhotos && professional.portfolioPhotos.length > 0) {
      return professional.portfolioPhotos;
    }
    return services
      .filter(s => !!s.imageUrl)
      .map(s => ({
        id: `auto-${s.id}`,
        url: s.imageUrl!,
        title: s.name,
        serviceName: s.name,
        serviceId: s.id,
        description: s.description
      }));
  }, [professional.portfolioPhotos, services]);

  // Pre-seleção vinda de card externo (carrossel da página pública)
  useEffect(() => {
    if (!initialServiceId) return;
    const match = services?.find(s => s.id === initialServiceId);
    if (match) {
      setSelectedServices([match]);
      setStep(2);
    }
  }, [initialServiceId]);

  // Client identification state (with strict persistence guarantee)
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [clientNotes, setClientNotes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Reset entire flow
  const handleResetFlow = () => {
    setSelectedServices([]);
    setSelectedTime('');
    setSelectedEndTime('');
    setIsEncaixeMode(false);
    setEncaixeReason('');
    setIsSplitScheduleMode(false);
    setSplitParts([]);
    setSplitSelections({});
    setConflictModalSlot(null);
    setClientName('');
    setClientPhone('');
    setClientNotes('');
    setFormError(null);
    setPaymentIntention(null);
    setStep(1);
  };

  // Selected schedule
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedEndTime, setSelectedEndTime] = useState<string>('');
  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedPixFull, setCopiedPixFull] = useState(false);
  const [paymentIntention, setPaymentIntention] = useState<'deposit' | 'full' | 'in_person' | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [hasConfirmedReceivedMessage, setHasConfirmedReceivedMessage] = useState(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  // Estados de Encaixe Especial e Conflito de Horário
  const [isEncaixeMode, setIsEncaixeMode] = useState(false);
  const [encaixeReason, setEncaixeReason] = useState<string>('');
  const [conflictModalSlot, setConflictModalSlot] = useState<{
    time: string;
    endTime: string;
    conflictReason: string;
    conflictType?: 'booking_overlap' | 'exceeds_closing' | 'lunch' | 'lunch_overlap' | 'blocked' | 'locked';
  } | null>(null);

  // Estados de Divisão de Serviços em Horários Distintos (Split Schedule)
  const [isSplitScheduleMode, setIsSplitScheduleMode] = useState(false);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [splitParts, setSplitParts] = useState<{
    serviceId: string;
    serviceName: string;
    durationMinutes: number;
    price: number;
    date?: string;
    time: string;
    endTime: string;
  }[]>([]);
  const [splitSelections, setSplitSelections] = useState<{ [serviceId: string]: { date: string; time: string } }>({});
  const [splitErrorMessage, setSplitErrorMessage] = useState<string | null>(null);

  // Estado do Modal de Lista de Espera (Waitlist / Encaixe)
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);
  const [waitlistName, setWaitlistName] = useState('');
  const [waitlistPhone, setWaitlistPhone] = useState('');
  const [waitlistPeriodPref, setWaitlistPeriodPref] = useState<'morning' | 'afternoon' | 'evening' | 'any'>('any');
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);

  // Evita rolagem da página do fundo quando qualquer modal estiver aberto
  useBodyScrollLock(isWaitlistModalOpen || !!conflictModalSlot || isSplitModalOpen);

  // Validação de Concorrência: Bloqueio temporário de 5 minutos no servidor
  const [sessionId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('__bella_client_session__');
      if (stored) return stored;
      const gen = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('__bella_client_session__', gen);
      return gen;
    }
    return `sess_${Date.now()}`;
  });

  const [activeServerLock, setActiveServerLock] = useState<{
    lockId: string;
    date: string;
    time: string;
    expiresAt: string;
  } | null>(null);
  const [lockSecondsRemaining, setLockSecondsRemaining] = useState<number | null>(null);
  const [lockingSlotInProgress, setLockingSlotInProgress] = useState(false);
  const [lockConflictAlert, setLockConflictAlert] = useState<string | null>(null);
  const [serverLockedSlots, setServerLockedSlots] = useState<Array<{ date: string; time: string; expiresAt: string }>>([]);

  // Dynamic totals calculation
  const totalDurationMinutes = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);
  }, [selectedServices]);

  const totalPrice = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + s.price, 0);
  }, [selectedServices]);

  const hasDepositRequired = useMemo(() => {
    return selectedServices.some(s => s.requiresDeposit);
  }, [selectedServices]);

  const depositAmount = useMemo(() => {
    return selectedServices.reduce((sum, s) => {
      if (!s.requiresDeposit) return sum;
      if (s.depositType === 'percentage') {
        return sum + (s.price * s.depositValue) / 100;
      }
      return sum + s.depositValue;
    }, 0);
  }, [selectedServices]);

  // Filtered services in Step 1
  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return services;
    const q = searchQuery.toLowerCase().trim();
    return services.filter(s => 
      s.name.toLowerCase().includes(q) || 
      (s.description && s.description.toLowerCase().includes(q))
    );
  }, [services, searchQuery]);

  // Generate available days: Mostra APENAS os dias que a profissional deixou liberados e exclui férias
  const availableDays = useMemo(() => {
    const days: { dateStr: string; dayName: string; dayNumber: number; monthName: string; isAvailable: boolean }[] = [];
    const today = new Date();
    
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    // Analisa os próximos 45 dias para encontrar todos os dias liberados
    for (let i = 0; i < 45; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const dayOfWeek = d.getDay();
      
      // Checa se cai em período de férias da profissional
      const isVacation = (availability.vacationPeriods || []).some(v => dateStr >= v.startDate && dateStr <= v.endDate);
      const isBlocked = (availability.blockedDates || []).includes(dateStr) || isVacation;
      
      let isAvailable = false;
      if (availability.allowedDatesMode === 'specific_dates' && availability.allowedSpecificDates) {
        // Se a profissional determinou dias específicos do mês
        isAvailable = availability.allowedSpecificDates.includes(dateStr) && !isBlocked;
      } else {
        // Modo padrão por dias da semana
        const isActiveDay = (availability.activeDays || [1, 2, 3, 4, 5, 6]).includes(dayOfWeek);
        isAvailable = isActiveDay && !isBlocked;
      }

      // Regra de ouro: quando a cliente for escolher a data, deve aparecer apenas os dias liberados!
      if (isAvailable) {
        days.push({
          dateStr,
          dayName: i === 0 ? 'Hoje' : (i === 1 ? 'Amanhã' : weekDays[dayOfWeek]),
          dayNumber: d.getDate(),
          monthName: months[d.getMonth()],
          isAvailable: true
        });
      }
    }
    return days;
  }, [availability]);

  // Initial date derived safely dos dias liberados
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return availableDays[0]?.dateStr || '';
  });

  // Buscar bloqueios temporários ativos no servidor para a data escolhida
  const profId = professional.id;
  const fetchDateLocks = useCallback(async (date: string) => {
    if (!date || !profId) return;
    try {
      const res = await fetch(`/api/slots/lock?professionalId=${encodeURIComponent(profId)}&date=${encodeURIComponent(date)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.locks)) {
          const otherLocks = data.locks
            .filter((l: any) => l.sessionId !== sessionId)
            .map((l: any) => ({
              date: l.date,
              time: l.time,
              expiresAt: l.expiresAt
            }));
          setServerLockedSlots(otherLocks);
        }
      }
    } catch {
      // Ignora falha de rede silenciosamente
    }
  }, [profId, sessionId]);

  useEffect(() => {
    const d = selectedDate || availableDays[0]?.dateStr;
    if (!d) return;

    let isMounted = true;
    const initialTimer = setTimeout(() => {
      if (isMounted) {
        void fetchDateLocks(d);
      }
    }, 0);

    const poll = setInterval(() => {
      if (isMounted) {
        void fetchDateLocks(d);
      }
    }, 8000);

    return () => {
      isMounted = false;
      clearTimeout(initialTimer);
      clearInterval(poll);
    };
  }, [selectedDate, availableDays, fetchDateLocks]);

  // Contagem regressiva do bloqueio temporário de 5 minutos
  useEffect(() => {
    if (!activeServerLock) {
      return;
    }
    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((new Date(activeServerLock.expiresAt).getTime() - Date.now()) / 1000));
      setLockSecondsRemaining(remaining);
      if (remaining <= 0) {
        setActiveServerLock(null);
        setLockSecondsRemaining(null);
        setSelectedTime('');
        setSelectedEndTime('');
        setLockConflictAlert('O prazo de 5 minutos de reserva temporária expirou. Por favor, selecione o horário novamente.');
      }
    };
    const initialTimer = setTimeout(updateTimer, 0);
    const timer = setInterval(updateTimer, 1000);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(timer);
    };
  }, [activeServerLock]);

  // Ao clicar em um horário, faz a validação e bloqueio imediato no servidor (5 min)
  const handleSelectSlot = async (slotTime: string, slotEndTime: string) => {
    const activeDate = selectedDate || availableDays[0]?.dateStr;
    if (!activeDate) return;

    setLockConflictAlert(null);

    // Validação estrita de colisão de horário e duração exigida pelo procedimento
    const [selH, selM] = slotTime.split(':').map(Number);
    const candidateStartMin = (selH || 0) * 60 + (selM || 0);
    const candidateEndMin = candidateStartMin + totalDurationMinutes;
    const buffer = availability.bufferMinutes ?? 15;

    // 1. Checa colisão com agendamentos existentes (normais e split schedule)
    let collisionBookingName = '';
    let collisionBookingTime = '';
    let collisionBookingEndTime = '';
    const hasCollision = bookings.some(b => {
      if (b.status === 'cancelled') return false;
      const isSameProf = b.professionalId === professional.id || 
                         (b.professionalSlug && b.professionalSlug === professional.slug) ||
                         (b.professionalName && professional.name && b.professionalName.trim().toLowerCase() === professional.name.trim().toLowerCase());
      if (!isSameProf) return false;

      if (b.isSplitSchedule && b.splitParts && b.splitParts.length > 0) {
        return b.splitParts.some(part => {
          const partDate = part.date || b.date;
          if (partDate !== activeDate) return false;
          const [pH, pM] = (part.time || '08:00').split(':').map(Number);
          const pStart = (pH || 0) * 60 + (pM || 0);
          let pEnd = pStart + (part.durationMinutes || 60);
          if (part.endTime && part.endTime.includes(':')) {
            const [peH, peM] = part.endTime.split(':').map(Number);
            const parsed = (peH || 0) * 60 + (peM || 0);
            if (parsed > pStart) pEnd = Math.max(pEnd, parsed);
          }
          const overlaps = candidateStartMin < (pEnd + buffer) && (candidateEndMin + buffer) > pStart;
          if (overlaps) {
            collisionBookingName = part.serviceName || b.serviceName;
            collisionBookingTime = part.time;
            collisionBookingEndTime = part.endTime;
          }
          return overlaps;
        });
      }

      if (b.date !== activeDate) return false;
      const [bH, bM] = b.time.split(':').map(Number);
      const bStart = (bH || 0) * 60 + (bM || 0);
      let bEnd = bStart + (b.serviceDuration || 60);
      if (b.endTime && b.endTime.includes(':')) {
        const [eH, eM] = b.endTime.split(':').map(Number);
        const parsedEnd = (eH || 0) * 60 + (eM || 0);
        if (parsedEnd > bStart) bEnd = Math.max(bEnd, parsedEnd);
      }
      const overlaps = candidateStartMin < (bEnd + buffer) && (candidateEndMin + buffer) > bStart;
      if (overlaps) {
        collisionBookingName = b.serviceName;
        collisionBookingTime = b.time;
        collisionBookingEndTime = b.endTime || '';
      }
      return overlaps;
    });

    if (hasCollision) {
      handleSlotConflictClick({
        time: slotTime,
        endTime: slotEndTime,
        conflictType: 'booking_overlap',
        conflictReason: `Choque de horário: Procedimento dura ${formatMinutes(totalDurationMinutes)} e sobrepõe o agendamento (${collisionBookingName}) das ${collisionBookingTime} às ${collisionBookingEndTime || 'conclusão'}`
      });
      return;
    }

    // 2. Checa se o procedimento cabe antes do encerramento do expediente
    const [endH, endM] = availability.endTime.split(':').map(Number);
    const closingMin = (endH || 0) * 60 + (endM || 0);
    if (candidateEndMin > closingMin) {
      handleSlotConflictClick({
        time: slotTime,
        endTime: slotEndTime,
        conflictType: 'exceeds_closing',
        conflictReason: `Choque de horário: Procedimento dura ${formatMinutes(totalDurationMinutes)} e excede o término do expediente (${availability.endTime})`
      });
      return;
    }

    // 3. Checa colisão com horário de almoço
    if (availability.hasLunchBreak) {
      const [lStartH, lStartM] = (availability.lunchStart || '12:00').split(':').map(Number);
      const [lEndH, lEndM] = (availability.lunchEnd || '13:00').split(':').map(Number);
      const lunchStartMin = (lStartH || 0) * 60 + (lStartM || 0);
      const lunchEndMin = (lEndH || 0) * 60 + (lEndM || 0);

      // Cai dentro do intervalo de almoço
      if (candidateStartMin >= lunchStartMin && candidateStartMin < lunchEndMin) {
        handleSlotConflictClick({
          time: slotTime,
          endTime: slotEndTime,
          conflictType: 'lunch',
          conflictReason: `Horário no intervalo de almoço (${availability.lunchStart} às ${availability.lunchEnd})`
        });
        return;
      }

      // Começa antes mas invade o almoço (considerando o buffer de higienização)
      if (candidateStartMin < lunchStartMin && (candidateEndMin + buffer) > lunchStartMin) {
        handleSlotConflictClick({
          time: slotTime,
          endTime: slotEndTime,
          conflictType: 'lunch_overlap',
          conflictReason: `Choque de horário: Procedimento dura ${formatMinutes(totalDurationMinutes)} (com intervalo de higienização de ${buffer} min) e invade o almoço (${availability.lunchStart} às ${availability.lunchEnd})`
        });
        return;
      }

      if (candidateStartMin < lunchEndMin && candidateEndMin > lunchStartMin) {
        handleSlotConflictClick({
          time: slotTime,
          endTime: slotEndTime,
          conflictType: 'lunch_overlap',
          conflictReason: `Choque de horário: Procedimento dura ${formatMinutes(totalDurationMinutes)} e colide com o horário de almoço (${availability.lunchStart} às ${availability.lunchEnd})`
        });
        return;
      }
    }

    // 4. Checa colisão com bloqueios manuais da profissional
    const dayBlockedSlots = (availability.blockedTimeSlots || []).filter(bl => bl.date === activeDate);
    const conflictingBlock = dayBlockedSlots.find(bl => {
      const [blStartH, blStartM] = bl.startTime.split(':').map(Number);
      const [blEndH, blEndM] = bl.endTime.split(':').map(Number);
      const blStart = (blStartH || 0) * 60 + (blStartM || 0);
      const blEnd = (blEndH || 0) * 60 + (blEndM || 0);
      return candidateStartMin < blEnd && candidateEndMin > blStart;
    });
    if (conflictingBlock) {
      handleSlotConflictClick({
        time: slotTime,
        endTime: slotEndTime,
        conflictType: 'blocked',
        conflictReason: conflictingBlock.reason || 'Intervalo bloqueado pelo(a) profissional'
      });
      return;
    }

    // Seleção normal de horário 100% livre
    setIsEncaixeMode(false);
    setEncaixeReason('');
    setIsSplitScheduleMode(false);
    setSplitParts([]);

    setLockingSlotInProgress(true);

    try {
      const res = await fetch('/api/slots/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'lock',
          professionalId: professional.id,
          date: activeDate,
          time: slotTime,
          durationMinutes: totalDurationMinutes,
          sessionId,
          clientName: clientName || undefined
        })
      });

      const data = await res.json();
      if (res.status === 409 || !data.success) {
        setLockConflictAlert(
          data.error || '⚠️ Este horário acabou de ser selecionado por outro(a) cliente e tem prioridade temporária de 5 minutos. Por favor, escolha outro horário ou entre na fila de espera.'
        );
        fetchDateLocks(activeDate);
        return;
      }

      // Bloqueio garantido com sucesso no servidor!
      setSelectedTime(slotTime);
      setSelectedEndTime(slotEndTime);
      setActiveServerLock({
        lockId: data.lockId,
        date: activeDate,
        time: slotTime,
        expiresAt: data.expiresAt
      });
    } catch {
      // Fallback local se estiver offline
      setSelectedTime(slotTime);
      setSelectedEndTime(slotEndTime);
    } finally {
      setLockingSlotInProgress(false);
    }
  };

  // Acionado quando o cliente clica em um horário com conflito
  const handleSlotConflictClick = (slot: {
    time: string;
    endTime: string;
    conflictReason?: string;
    conflictType?: 'booking_overlap' | 'exceeds_closing' | 'lunch' | 'lunch_overlap' | 'blocked' | 'locked';
  }) => {
    setConflictModalSlot({
      time: slot.time,
      endTime: slot.endTime,
      conflictReason: slot.conflictReason || 'Horário com sobreposição ou indisponibilidade',
      conflictType: slot.conflictType
    });
  };

  // Abrir Modal de Divisão de Serviços em Horários Distintos
  const handleOpenSplitModal = () => {
    setSplitErrorMessage(null);
    setConflictModalSlot(null);
    setIsSplitModalOpen(true);
    
    const activeDate = selectedDate || (availableDays.find(d => d.isAvailable)?.dateStr) || '';
    const initial: { [serviceId: string]: { date: string; time: string } } = { ...splitSelections };

    // Para cada serviço selecionado, se ainda não tiver data, define como activeDate
    // e busca o primeiro horário disponível sem sobrepor os já atribuídos
    const occupiedOnDate: { [dateStr: string]: { startMin: number; endMin: number }[] } = {};

    selectedServices.forEach(s => {
      const existing = initial[s.id];
      const targetDate = existing?.date || activeDate;
      const currentExcluded = occupiedOnDate[targetDate] || [];

      if (!existing || !existing.time) {
        const avail = getAvailableSlotsForDurationAndDate(s.durationMinutes, targetDate, currentExcluded);
        const chosenTime = avail.length > 0 ? avail[0].time : '';
        initial[s.id] = { date: targetDate, time: chosenTime };
        
        if (chosenTime) {
          const [sH, sM] = chosenTime.split(':').map(Number);
          const startMin = (sH || 0) * 60 + (sM || 0);
          const endMin = startMin + s.durationMinutes;
          if (!occupiedOnDate[targetDate]) occupiedOnDate[targetDate] = [];
          occupiedOnDate[targetDate].push({ startMin, endMin });
        }
      } else {
        const [sH, sM] = existing.time.split(':').map(Number);
        const startMin = (sH || 0) * 60 + (sM || 0);
        const endMin = startMin + s.durationMinutes;
        if (!occupiedOnDate[targetDate]) occupiedOnDate[targetDate] = [];
        occupiedOnDate[targetDate].push({ startMin, endMin });
      }
    });

    setSplitSelections(initial);
  };

  // Confirmar Divisão de Serviços
  const handleConfirmSplitSchedule = () => {
    setSplitErrorMessage(null);
    for (const s of selectedServices) {
      const sel = splitSelections[s.id];
      if (!sel || !sel.time) {
        setSplitErrorMessage(`Por favor, selecione um horário disponível para o procedimento: "${s.name}".`);
        return;
      }
      if (!sel.date) {
        setSplitErrorMessage(`Por favor, selecione a data para o procedimento: "${s.name}".`);
        return;
      }
    }

    const calculatedParts = selectedServices.map(s => {
      const sel = splitSelections[s.id];
      const [sH, sM] = sel.time.split(':').map(Number);
      const startMin = (sH || 0) * 60 + (sM || 0);
      const endMin = startMin + s.durationMinutes;
      const eH = Math.floor(endMin / 60);
      const eM = endMin % 60;
      const endTime = `${String(eH).padStart(2, '0')}:${String(eM).padStart(2, '0')}`;
      return {
        serviceId: s.id,
        serviceName: s.name,
        durationMinutes: s.durationMinutes,
        price: s.price,
        date: sel.date,
        time: sel.time,
        endTime,
        startMin,
        endMin
      };
    });

    // Valida se na mesma data há sobreposição entre as partes
    for (let i = 0; i < calculatedParts.length; i++) {
      for (let j = i + 1; j < calculatedParts.length; j++) {
        const p1 = calculatedParts[i];
        const p2 = calculatedParts[j];
        if (p1.date === p2.date) {
          if (p1.startMin < p2.endMin && p1.endMin > p2.startMin) {
            setSplitErrorMessage(`Os horários de "${p1.serviceName}" (${p1.time}) e "${p2.serviceName}" (${p2.time}) no dia ${formatDatePtBr(p1.date)} se sobrepõem. Escolha horários livres distintos.`);
            return;
          }
        }
      }
    }

    // Ordena por data e depois por horário
    calculatedParts.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startMin - b.startMin;
    });

    setSplitParts(calculatedParts.map(p => ({
      serviceId: p.serviceId,
      serviceName: p.serviceName,
      durationMinutes: p.durationMinutes,
      price: p.price,
      date: p.date,
      time: p.time,
      endTime: p.endTime
    })));

    setIsSplitScheduleMode(true);
    setIsEncaixeMode(false);
    setSelectedTime(calculatedParts[0].time);
    setSelectedEndTime(calculatedParts[calculatedParts.length - 1].endTime);
    setSelectedDate(calculatedParts[0].date);
    setIsSplitModalOpen(false);
    setConflictModalSlot(null);
    setLockConflictAlert(null);
    setFormError(null);
    setStep(3);
  };

  // Helper para calcular horários 100% livres para uma duração específica em qualquer data alvo
  // Opcionalmente excluindo intervalos já reservados por outros procedimentos na mesma data
  const getAvailableSlotsForDurationAndDate = useCallback((
    durationMin: number, 
    targetDate: string, 
    excludeIntervals?: { startMin: number; endMin: number }[]
  ) => {
    if (!targetDate || durationMin <= 0) return [];

    // Suporte a horários personalizados para dias específicos da semana (ex: Sábado)
    const [tY, tM, tD] = targetDate.split('-').map(Number);
    const dateObj = new Date(tY, (tM || 1) - 1, tD || 1);
    const dayOfWeek = dateObj.getDay();
    const customHours = availability.dayCustomHours?.[dayOfWeek];

    const effectiveStartTime = (customHours?.enabled ? customHours.startTime : availability.startTime) || '08:00';
    const effectiveEndTime = (customHours?.enabled ? customHours.endTime : availability.endTime) || '19:00';
    const effectiveHasLunch = customHours?.enabled 
      ? (customHours.hasLunchBreak ?? availability.hasLunchBreak)
      : availability.hasLunchBreak;
    const effectiveLunchStart = (customHours?.enabled ? customHours.lunchStart : availability.lunchStart) || '12:00';
    const effectiveLunchEnd = (customHours?.enabled ? customHours.lunchEnd : availability.lunchEnd) || '13:00';

    const [startH, startM] = effectiveStartTime.split(':').map(Number);
    const [endH, endM] = effectiveEndTime.split(':').map(Number);
    const interval = availability.intervalMinutes || 30;
    const buffer = availability.bufferMinutes ?? 15;

    const startMinutes = (startH || 0) * 60 + (startM || 0);
    const endMinutes = (endH || 0) * 60 + (endM || 0);

    const [lunchStartH, lunchStartM] = effectiveLunchStart.split(':').map(Number);
    const [lunchEndH, lunchEndM] = effectiveLunchEnd.split(':').map(Number);
    const lunchStartMin = (lunchStartH || 0) * 60 + (lunchStartM || 0);
    const lunchEndMin = (lunchEndH || 0) * 60 + (lunchEndM || 0);

    const isMatchingProf = (b: Booking) => {
      if (b.professionalId === professional.id) return true;
      if (professional.slug && (b as any).professionalSlug === professional.slug) return true;
      if (b.professionalName && professional.name && b.professionalName.trim().toLowerCase() === professional.name.trim().toLowerCase()) return true;
      return false;
    };

    const dayBookings = bookings.filter(
      b => isMatchingProf(b) && b.date === targetDate && b.status !== 'cancelled'
    );

    const bookedIntervals: { start: number; end: number; endWithBuffer: number }[] = [];
    dayBookings.forEach(b => {
      if (b.isSplitSchedule && b.splitParts && b.splitParts.length > 0) {
        b.splitParts.forEach(part => {
          const partDate = part.date || b.date;
          if (partDate === targetDate) {
            const [pH, pM] = (part.time || '08:00').split(':').map(Number);
            const pStart = (pH || 0) * 60 + (pM || 0);
            let pEnd = pStart + (part.durationMinutes || 60);
            if (part.endTime && part.endTime.includes(':')) {
              const [peH, peM] = part.endTime.split(':').map(Number);
              const parsed = (peH || 0) * 60 + (peM || 0);
              if (parsed > pStart) pEnd = Math.max(pEnd, parsed);
            }
            bookedIntervals.push({ start: pStart, end: pEnd, endWithBuffer: pEnd + buffer });
          }
        });
      } else {
        const [bH, bM] = (b.time || '08:00').split(':').map(Number);
        const bStart = (bH || 0) * 60 + (bM || 0);
        let bEnd = bStart + (b.serviceDuration || 60);
        if (b.endTime && b.endTime.includes(':')) {
          const [eH, eM] = b.endTime.split(':').map(Number);
          const parsed = (eH || 0) * 60 + (eM || 0);
          if (parsed > bStart) bEnd = Math.max(bEnd, parsed);
        }
        bookedIntervals.push({ start: bStart, end: bEnd, endWithBuffer: bEnd + buffer });
      }
    });

    if (excludeIntervals && excludeIntervals.length > 0) {
      excludeIntervals.forEach(item => {
        bookedIntervals.push({
          start: item.startMin,
          end: item.endMin,
          endWithBuffer: item.endMin + buffer
        });
      });
    }

    const dayBlockedSlots = (availability.blockedTimeSlots || []).filter(bl => bl.date === targetDate);
    const validSlots: { time: string; endTime: string; startMin: number; endMin: number }[] = [];

    for (let cur = startMinutes; cur < endMinutes; cur += interval) {
      const candidateEnd = cur + durationMin;
      if (candidateEnd > endMinutes) continue;

      if (availability.hasLunchBreak) {
        // Horário dentro do almoço ou procedimento + buffer invade o almoço
        if (
          (cur >= lunchStartMin && cur < lunchEndMin) ||
          (cur < lunchStartMin && (candidateEnd + buffer) > lunchStartMin) ||
          (cur < lunchEndMin && candidateEnd > lunchStartMin)
        ) {
          continue;
        }
      }

      const hasBookingConflict = bookedIntervals.some(b => cur < b.endWithBuffer && (candidateEnd + buffer) > b.start);
      if (hasBookingConflict) continue;

      const hasBlockConflict = dayBlockedSlots.some(bl => {
        const [blStartH, blStartM] = bl.startTime.split(':').map(Number);
        const [blEndH, blEndM] = bl.endTime.split(':').map(Number);
        const blStart = (blStartH || 0) * 60 + (blStartM || 0);
        const blEnd = (blEndH || 0) * 60 + (blEndM || 0);
        return cur < blEnd && candidateEnd > blStart;
      });
      if (hasBlockConflict) continue;

      const sH = Math.floor(cur / 60);
      const sM = cur % 60;
      const timeStr = `${String(sH).padStart(2, '0')}:${String(sM).padStart(2, '0')}`;

      const eH = Math.floor(candidateEnd / 60);
      const eM = candidateEnd % 60;
      const endTimeStr = `${String(eH).padStart(2, '0')}:${String(eM).padStart(2, '0')}`;

      validSlots.push({ time: timeStr, endTime: endTimeStr, startMin: cur, endMin: candidateEnd });
    }

    return validSlots;
  }, [availability, bookings, professional.id, professional.name, professional.slug]);

  // Helper backward-compatible para calcular horários 100% livres para a data atual selecionada
  const getAvailableSlotsForDuration = useCallback((durationMin: number) => {
    const activeDate = selectedDate || (availableDays.find(d => d.isAvailable)?.dateStr) || '';
    return getAvailableSlotsForDurationAndDate(durationMin, activeDate);
  }, [selectedDate, availableDays, getAvailableSlotsForDurationAndDate]);

  // Calculate intelligent time slots accounting for total duration, buffer time, and server-locked slots
  const timeSlots = useMemo(() => {
    const dateToUse = selectedDate || (availableDays.find(d => d.isAvailable)?.dateStr);
    if (!dateToUse || totalDurationMinutes <= 0) return [];

    const slots: { 
      time: string; 
      endTime: string; 
      period: 'morning' | 'afternoon' | 'evening'; 
      isBooked: boolean;
      isServerLockedByOther?: boolean;
      conflictReason?: string;
      conflictType?: 'booking_overlap' | 'exceeds_closing' | 'lunch' | 'lunch_overlap' | 'blocked' | 'locked';
    }[] = [];

    // Suporte a horários diferenciados para dias específicos (ex: Sábado)
    const [tY, tM, tD] = dateToUse.split('-').map(Number);
    const dateObj = new Date(tY, (tM || 1) - 1, tD || 1);
    const dayOfWeek = dateObj.getDay();
    const customHours = availability.dayCustomHours?.[dayOfWeek];

    const effectiveStartTime = (customHours?.enabled ? customHours.startTime : availability.startTime) || '08:00';
    const effectiveEndTime = (customHours?.enabled ? customHours.endTime : availability.endTime) || '19:00';
    const effectiveHasLunch = customHours?.enabled 
      ? (customHours.hasLunchBreak ?? availability.hasLunchBreak)
      : availability.hasLunchBreak;
    const effectiveLunchStart = (customHours?.enabled ? customHours.lunchStart : availability.lunchStart) || '12:00';
    const effectiveLunchEnd = (customHours?.enabled ? customHours.lunchEnd : availability.lunchEnd) || '13:00';

    const [startH, startM] = effectiveStartTime.split(':').map(Number);
    const [endH, endM] = effectiveEndTime.split(':').map(Number);
    const interval = availability.intervalMinutes || 30;
    const buffer = availability.bufferMinutes ?? 15;

    const startMinutes = (startH || 0) * 60 + (startM || 0);
    const endMinutes = (endH || 0) * 60 + (endM || 0);

    // Horário de almoço
    const [lunchStartH, lunchStartM] = effectiveLunchStart.split(':').map(Number);
    const [lunchEndH, lunchEndM] = effectiveLunchEnd.split(':').map(Number);
    const lunchStartMin = (lunchStartH || 0) * 60 + (lunchStartM || 0);
    const lunchEndMin = (lunchEndH || 0) * 60 + (lunchEndM || 0);

    // Agendamentos ativos para este dia e profissional (busca ampla por id, slug ou nome)
    const isMatchingProf = (b: Booking) => {
      if (b.professionalId === professional.id) return true;
      if (professional.slug && (b as any).professionalSlug === professional.slug) return true;
      if (b.professionalName && professional.name && b.professionalName.trim().toLowerCase() === professional.name.trim().toLowerCase()) return true;
      return false;
    };

    const dayBookings = bookings.filter(
      b => isMatchingProf(b) && b.date === dateToUse && b.status !== 'cancelled'
    );

    // Booked intervals [start, end] in minutes (com buffer time entre atendimentos e suporte a split)
    const bookedIntervals: { start: number; end: number; endWithBuffer: number; booking: Booking }[] = [];
    dayBookings.forEach(b => {
      if (b.isSplitSchedule && b.splitParts && b.splitParts.length > 0) {
        b.splitParts.forEach(part => {
          const [pH, pM] = (part.time || '08:00').split(':').map(Number);
          const pStart = (pH || 0) * 60 + (pM || 0);
          let pEnd = pStart + (part.durationMinutes || 60);
          if (part.endTime && part.endTime.includes(':')) {
            const [peH, peM] = part.endTime.split(':').map(Number);
            const parsed = (peH || 0) * 60 + (peM || 0);
            if (parsed > pStart) pEnd = Math.max(pEnd, parsed);
          }
          bookedIntervals.push({ start: pStart, end: pEnd, endWithBuffer: pEnd + buffer, booking: b });
        });
      } else {
        const [bH, bM] = (b.time || '08:00').split(':').map(Number);
        const bStart = (bH || 0) * 60 + (bM || 0);
        let bEnd = bStart + (b.serviceDuration || 60);
        if (b.endTime && b.endTime.includes(':')) {
          const [eH, eM] = b.endTime.split(':').map(Number);
          const parsedEnd = (eH || 0) * 60 + (eM || 0);
          if (parsedEnd > bStart) {
            bEnd = Math.max(bEnd, parsedEnd);
          }
        }
        bookedIntervals.push({ 
          start: bStart, 
          end: bEnd, 
          endWithBuffer: bEnd + buffer,
          booking: b 
        });
      }
    });

    // Bloqueios rápidos do(a) profissional para a data
    const dayBlockedSlots = (availability.blockedTimeSlots || []).filter(bl => bl.date === dateToUse);

    for (let cur = startMinutes; cur < endMinutes; cur += interval) {
      const candidateEnd = cur + totalDurationMinutes;
      
      const sH = Math.floor(cur / 60);
      const sM = cur % 60;
      const timeStr = `${String(sH).padStart(2, '0')}:${String(sM).padStart(2, '0')}`;

      const eH = Math.floor(candidateEnd / 60);
      const eM = candidateEnd % 60;
      const endTimeStr = `${String(eH).padStart(2, '0')}:${String(eM).padStart(2, '0')}`;

      let isBooked = false;
      let isServerLockedByOther = false;
      let conflictReason: string | undefined = undefined;
      let conflictType: 'booking_overlap' | 'exceeds_closing' | 'lunch' | 'lunch_overlap' | 'blocked' | 'locked' | undefined = undefined;

      // 1. Ultrapassa encerramento do expediente
      if (candidateEnd > endMinutes) {
        isBooked = true;
        conflictType = 'exceeds_closing';
        conflictReason = `Procedimento dura ${formatMinutes(totalDurationMinutes)} e excede o expediente (${availability.endTime})`;
      }

      // 2. Colisão com almoço
      if (!isBooked && availability.hasLunchBreak) {
        if (cur >= lunchStartMin && cur < lunchEndMin) {
          isBooked = true;
          conflictType = 'lunch';
          conflictReason = `Intervalo de almoço (${availability.lunchStart} às ${availability.lunchEnd})`;
        } else if (cur < lunchStartMin && (candidateEnd + buffer) > lunchStartMin) {
          isBooked = true;
          conflictType = 'lunch_overlap';
          conflictReason = `Choque: Procedimento dura ${formatMinutes(totalDurationMinutes)} (+ ${buffer} min higienização) e invade o almoço (${availability.lunchStart} às ${availability.lunchEnd})`;
        } else if (cur < lunchEndMin && candidateEnd > lunchStartMin) {
          isBooked = true;
          conflictType = 'lunch_overlap';
          conflictReason = `Choque: Procedimento (${formatMinutes(totalDurationMinutes)}) colide com intervalo de almoço (${availability.lunchStart} às ${availability.lunchEnd})`;
        }
      }

      // 3. Colisão estrita com outros agendamentos já preenchidos (considerando tempo do procedimento e buffer)
      if (!isBooked) {
        const conflictingBooking = bookedIntervals.find(b => {
          return cur < b.endWithBuffer && (candidateEnd + buffer) > b.start;
        });

        if (conflictingBooking) {
          isBooked = true;
          conflictType = 'booking_overlap';
          const confEndH = Math.floor(conflictingBooking.end / 60);
          const confEndM = conflictingBooking.end % 60;
          const confEndTimeStr = `${String(confEndH).padStart(2, '0')}:${String(confEndM).padStart(2, '0')}`;

          if (cur < conflictingBooking.end && candidateEnd > conflictingBooking.start) {
            conflictReason = `Sobreposição: Procedimento dura ${formatMinutes(totalDurationMinutes)} e colide com agendamento das ${conflictingBooking.booking.time} às ${conflictingBooking.booking.endTime || confEndTimeStr}`;
          } else {
            conflictReason = `Intervalo de higienização (${buffer} min) após horário das ${conflictingBooking.booking.time} às ${conflictingBooking.booking.endTime || confEndTimeStr}`;
          }
        }
      }

      // 4. Bloqueios Rápidos do(a) profissional (compromissos, eventos, folgas parciais)
      if (!isBooked && dayBlockedSlots.length > 0) {
        const conflictingBlock = dayBlockedSlots.find(bl => {
          const [blStartH, blStartM] = bl.startTime.split(':').map(Number);
          const [blEndH, blEndM] = bl.endTime.split(':').map(Number);
          const blStart = (blStartH || 0) * 60 + (blStartM || 0);
          const blEnd = (blEndH || 0) * 60 + (blEndM || 0);
          return cur < blEnd && candidateEnd > blStart;
        });
        if (conflictingBlock) {
          isBooked = true;
          conflictType = 'blocked';
          conflictReason = conflictingBlock.reason || 'Intervalo bloqueado pelo(a) profissional';
        }
      }

      // 5. Bloqueio Temporário no Servidor (Concorrência de 5 minutos por outro cliente)
      if (!isBooked && serverLockedSlots.some(l => l.date === dateToUse && l.time === timeStr) && selectedTime !== timeStr) {
        isBooked = true;
        isServerLockedByOther = true;
        conflictType = 'locked';
        conflictReason = 'Em reserva temporária (5 minutos) por outro(a) cliente';
      }

      let period: 'morning' | 'afternoon' | 'evening' = 'morning';
      if (sH >= 18) {
        period = 'evening';
      } else if (sH >= 12) {
        period = 'afternoon';
      }

      slots.push({
        time: timeStr,
        endTime: endTimeStr,
        period,
        isBooked,
        isServerLockedByOther,
        conflictReason,
        conflictType
      });
    }

    return slots;
  }, [selectedDate, availableDays, availability, bookings, professional.id, professional.name, professional.slug, totalDurationMinutes, serverLockedSlots, selectedTime]);

  const morningSlots = useMemo(() => timeSlots.filter(s => s.period === 'morning'), [timeSlots]);
  const afternoonSlots = useMemo(() => timeSlots.filter(s => s.period === 'afternoon'), [timeSlots]);
  const eveningSlots = useMemo(() => timeSlots.filter(s => s.period === 'evening'), [timeSlots]);
  const freeSlotsCount = useMemo(() => timeSlots.filter(s => !s.isBooked).length, [timeSlots]);

  // Pix Copia e Cola code
  const pixCode = useMemo(() => {
    if (!depositAmount || !professional.pixKey) return '';
    const refCode = `AGEND${selectedServices.map(s => s.id.replace(/\D/g, '')).join('') || '101'}`.slice(0, 20);
    return generatePixCopiaECola(
      professional.pixKey,
      professional.name,
      'São Paulo',
      depositAmount,
      refCode
    );
  }, [depositAmount, professional, selectedServices]);

  // Toggle single service in multi-select com Sugestão Inteligente de Combo com Desconto
  const toggleService = (service: ServiceItem) => {
    setSelectedServices(prev => {
      const exists = prev.some(s => s.id === service.id);
      if (exists) {
        if (activeSuggestion?.baseService.id === service.id) {
          setActiveSuggestion(null);
        }
        return prev.filter(s => s.id !== service.id);
      } else {
        // Encontrar outro procedimento ativo da profissional que ainda não está selecionado
        const remainingServices = services.filter(
          s => s.id !== service.id && !prev.some(p => p.id === s.id) && s.active !== false
        );
        if (remainingServices.length > 0) {
          // Seleciona uma sugestão complementar inteligente
          const suggested = remainingServices[0];
          const discountPercent = 15;
          const discountedPrice = Math.round(suggested.price * (1 - discountPercent / 100));
          const savings = suggested.price - discountedPrice;
          setActiveSuggestion({
            baseService: service,
            suggestedService: suggested,
            discountPercent,
            discountedPrice,
            savings
          });
        }
        return [...prev, service];
      }
    });
    // Reset slot selection when duration changes
    setSelectedTime('');
    setSelectedEndTime('');
  };

  // Aceitar sugestão de combo com desconto
  const handleAcceptSuggestion = () => {
    if (!activeSuggestion) return;
    const discountedItem: ServiceItem = {
      ...activeSuggestion.suggestedService,
      name: `${activeSuggestion.suggestedService.name} (Combo 15% OFF)`,
      price: activeSuggestion.discountedPrice
    };
    setSelectedServices(prev => {
      if (prev.some(s => s.id === discountedItem.id)) return prev;
      return [...prev, discountedItem];
    });
    setActiveSuggestion(null);
    setSuggestionAcceptedAlert(true);
    setTimeout(() => setSuggestionAcceptedAlert(false), 4500);
    // Reset slot selection
    setSelectedTime('');
    setSelectedEndTime('');
  };

  // Fechar banner de sugestão
  const handleDismissSuggestion = () => {
    setActiveSuggestion(null);
  };

  // Selecionar serviço a partir da foto real
  const handleSelectServiceFromPhoto = (photo: PortfolioPhoto) => {
    let target = services.find(s => s.id === photo.serviceId || s.name.toLowerCase() === (photo.serviceName || '').toLowerCase());
    if (!target && services.length > 0) {
      target = services[0];
    }
    if (target) {
      if (!selectedServices.some(s => s.id === target!.id)) {
        toggleService(target);
      }
      setSelectedPhotoForModal(null);
    }
  };

  // Ação de Confirmação Direta e Automática (Elimina botões redundantes e passos extras)
  const handleConfirmBooking = async () => {
    if (isSubmittingBooking) return;
    setFormError(null);
    if (!clientName.trim() || clientName.trim().length < 3) {
      setFormError('Por favor, informe seu nome completo (mínimo 3 letras).');
      return;
    }
    if (!isValidWhatsApp(clientPhone)) {
      setFormError('Por favor, informe um WhatsApp válido com DDD (exemplo: (11) 98765-4321).');
      return;
    }

    const activeDate = selectedDate || (availableDays.find(d => d.isAvailable)?.dateStr);
    if (selectedServices.length === 0 || !activeDate || !selectedTime) {
      setFormError('Por favor, confira os dados da reserva antes de confirmar.');
      return;
    }

    setIsSubmittingBooking(true);

    try {
      // Validação rigorosa de choque de horário (se não for modo Encaixe ou Split aprovável)
      if (!isEncaixeMode && !isSplitScheduleMode) {
        const [selH, selM] = selectedTime.split(':').map(Number);
        const candidateStartMin = (selH || 0) * 60 + (selM || 0);
        const candidateEndMin = candidateStartMin + totalDurationMinutes;
        const buffer = availability.bufferMinutes ?? 15;

        // 1. Checa agendamentos existentes (normais e split schedule)
        let collisionName = '';
        let collisionTime = '';
        let collisionEndTime = '';
        const hasCollision = bookings.some(b => {
          if (b.status === 'cancelled') return false;
          const isSameProf = b.professionalId === professional.id || 
                             (b.professionalSlug && b.professionalSlug === professional.slug) ||
                             (b.professionalName && professional.name && b.professionalName.trim().toLowerCase() === professional.name.trim().toLowerCase());
          if (!isSameProf) return false;

          if (b.isSplitSchedule && b.splitParts && b.splitParts.length > 0) {
            return b.splitParts.some(part => {
              const partDate = part.date || b.date;
              if (partDate !== activeDate) return false;
              const [pH, pM] = (part.time || '08:00').split(':').map(Number);
              const pStart = (pH || 0) * 60 + (pM || 0);
              let pEnd = pStart + (part.durationMinutes || 60);
              if (part.endTime && part.endTime.includes(':')) {
                const [peH, peM] = part.endTime.split(':').map(Number);
                const parsed = (peH || 0) * 60 + (peM || 0);
                if (parsed > pStart) pEnd = Math.max(pEnd, parsed);
              }
              const overlaps = candidateStartMin < (pEnd + buffer) && (candidateEndMin + buffer) > pStart;
              if (overlaps) {
                collisionName = part.serviceName || b.serviceName;
                collisionTime = part.time;
                collisionEndTime = part.endTime;
              }
              return overlaps;
            });
          }

          if (b.date !== activeDate) return false;
          const [bH, bM] = b.time.split(':').map(Number);
          const bStart = (bH || 0) * 60 + (bM || 0);
          let bEnd = bStart + (b.serviceDuration || 60);
          if (b.endTime && b.endTime.includes(':')) {
            const [eH, eM] = b.endTime.split(':').map(Number);
            const parsedEnd = (eH || 0) * 60 + (eM || 0);
            if (parsedEnd > bStart) bEnd = Math.max(bEnd, parsedEnd);
          }

          const overlaps = candidateStartMin < (bEnd + buffer) && (candidateEndMin + buffer) > bStart;
          if (overlaps) {
            collisionName = b.serviceName;
            collisionTime = b.time;
            collisionEndTime = b.endTime || '';
          }
          return overlaps;
        });

        if (hasCollision) {
          setFormError(
            `Choque de horário detectado: O horário selecionado (${selectedTime} às ${selectedEndTime}) sobrepõe outro atendimento (${collisionName}) das ${collisionTime} às ${collisionEndTime || 'conclusão'}. Por favor, selecione outro horário ou solicite um encaixe manual.`
          );
          setIsSubmittingBooking(false);
          return;
        }

        // 2. Checa colisão com intervalo de almoço
        if (availability.hasLunchBreak) {
          const [lStartH, lStartM] = (availability.lunchStart || '12:00').split(':').map(Number);
          const [lEndH, lEndM] = (availability.lunchEnd || '13:00').split(':').map(Number);
          const lunchStartMin = (lStartH || 0) * 60 + (lStartM || 0);
          const lunchEndMin = (lEndH || 0) * 60 + (lEndM || 0);
          if (
            (candidateStartMin >= lunchStartMin && candidateStartMin < lunchEndMin) ||
            (candidateStartMin < lunchStartMin && (candidateEndMin + buffer) > lunchStartMin) ||
            (candidateStartMin < lunchEndMin && candidateEndMin > lunchStartMin)
          ) {
            setFormError(
              `Choque de horário: O atendimento (${selectedTime} às ${selectedEndTime}) conflita com o horário de almoço da profissional (${availability.lunchStart} às ${availability.lunchEnd}). Por favor, escolha outro horário.`
            );
            setIsSubmittingBooking(false);
            return;
          }
        }

        // 3. Checa limite do expediente
        const [endH, endM] = availability.endTime.split(':').map(Number);
        const closingMin = (endH || 0) * 60 + (endM || 0);
        if (candidateEndMin > closingMin) {
          setFormError(
            `Choque de horário: O atendimento (${selectedTime} às ${selectedEndTime}) ultrapassa o horário de encerramento (${availability.endTime}).`
          );
          setIsSubmittingBooking(false);
          return;
        }

        // 4. Checa bloqueios manuais
        const dayBlockedSlots = (availability.blockedTimeSlots || []).filter(bl => bl.date === activeDate);
        const blBlock = dayBlockedSlots.find(bl => {
          const [blStartH, blStartM] = bl.startTime.split(':').map(Number);
          const [blEndH, blEndM] = bl.endTime.split(':').map(Number);
          const blStart = (blStartH || 0) * 60 + (blStartM || 0);
          const blEnd = (blEndH || 0) * 60 + (blEndM || 0);
          return candidateStartMin < blEnd && candidateEndMin > blStart;
        });
        if (blBlock) {
          setFormError(
            `Choque de horário: O horário selecionado está bloqueado na agenda (${blBlock.reason || 'indisponível'}).`
          );
          setIsSubmittingBooking(false);
          return;
        }
      }

      const primaryService = selectedServices[0];
      const combinedServiceName = selectedServices.map(s => s.name).join(' + ');

      // Libera / confirma o bloqueio temporário do servidor
      if (activeServerLock) {
        try {
          await fetch('/api/slots/lock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'commit',
              lockId: activeServerLock.lockId,
              sessionId
            })
          });
        } catch {
          // Prossegue normalmente
        }
        setActiveServerLock(null);
        setLockSecondsRemaining(null);
      }

      const newBooking = createBooking({
        professionalId: professional.id,
        professionalSlug: professional.slug,
        professionalName: professional.name,
        professionalPhone: professional.phone,
        professionalAddress: professional.address,
        serviceId: primaryService.id,
        serviceName: combinedServiceName,
        serviceDuration: totalDurationMinutes,
        serviceIds: selectedServices.map(s => s.id),
        servicesList: selectedServices.map(s => ({
          id: s.id,
          name: s.name,
          price: s.price,
          durationMinutes: s.durationMinutes
        })),
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        date: isSplitScheduleMode && splitParts.length > 0 && splitParts[0].date ? splitParts[0].date : activeDate,
        time: isSplitScheduleMode && splitParts.length > 0 ? splitParts[0].time : selectedTime,
        endTime: isSplitScheduleMode && splitParts.length > 0 ? splitParts[splitParts.length - 1].endTime : selectedEndTime,
        status: 'pending',
        totalPrice: totalPrice,
        depositRequired: hasDepositRequired,
        depositAmount: depositAmount,
        depositPaid: false,
        depositStatus: hasDepositRequired ? 'pending' : undefined,
        depositDeadlineHours: professional.depositDeadlineHours || 2,
        pixCode: pixCode || undefined,
        notes: clientNotes.trim() || undefined,
        isEncaixe: isEncaixeMode,
        encaixeReason: isEncaixeMode ? (encaixeReason || 'Solicitação de Encaixe com sobreposição de horário') : undefined,
        requiresSpecialApproval: isEncaixeMode || isSplitScheduleMode,
        isSplitSchedule: isSplitScheduleMode,
        splitParts: isSplitScheduleMode ? splitParts : undefined
      });

      setConfirmedBooking(newBooking);
      setStep(4);

      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Confetti fallback
      }
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-28">
      
      {/* ========================================================================= */}
      {/* BARRA SUPERIOR DE NAVEGAÇÃO & AÇÕES (VOLTAR, LIMPAR, ACOMPANHAR RESERVAS) */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 dark:text-zinc-300 hover:text-black dark:hover:text-white bg-white dark:bg-zinc-900 px-3.5 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 shadow-2xs hover:bg-stone-50 dark:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar ao Início
          </Link>

          {(step > 1 || selectedServices.length > 0) && (
            <button
              onClick={handleResetFlow}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-3.5 py-2 rounded-xl border border-rose-200 shadow-2xs transition-colors cursor-pointer"
              title="Limpar seleções e reiniciar agendamento do zero"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reiniciar Agendamento
            </button>
          )}
        </div>

        <Link
          href="/agendamento"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5A5A40] dark:text-zinc-300 hover:text-[#2D2D2A] dark:hover:text-zinc-100 dark:text-zinc-100 dark:hover:text-zinc-100 dark:text-zinc-100 bg-white dark:bg-zinc-900 px-3.5 py-2 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 shadow-2xs hover:bg-[#FAF8F5] dark:hover:bg-zinc-800 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-[#5A5A40] dark:text-zinc-300" />
          Acompanhar Minhas Reservas (#BE-...)
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* CABEÇALHO ELEGANTE DA PROFISSIONAL - ADAPTADO AO LAYOUT & GÊNERO */}
      {/* ========================================================================= */}
      <div className={`rounded-3xl p-6 sm:p-8 shadow-xs border mb-8 relative overflow-hidden transition-all ${
        activeLayout === 'barber_club'
          ? 'bg-[#0F172A] text-slate-100 border-slate-800'
          : activeLayout === 'boutique_glamour'
            ? 'bg-gradient-to-br from-white to-[#FDF9F3] text-stone-900 dark:text-zinc-100 border-[#E9E2D7] dark:border-zinc-700'
            : activeLayout === 'dark_minimal'
              ? 'bg-[#18181B] text-zinc-100 border-zinc-800'
              : 'bg-white dark:bg-zinc-900 text-[#2D2D2A] dark:text-zinc-100 border-[#E9E2D7] dark:border-zinc-700'
      }`}>
        {/* Glow sutil de fundo */}
        <div className={`absolute top-0 right-0 w-80 h-80 pointer-events-none rounded-full blur-2xl ${
          activeLayout === 'barber_club'
            ? 'bg-gradient-to-bl from-amber-600/15 to-transparent'
            : activeLayout === 'dark_minimal'
              ? 'bg-gradient-to-bl from-blue-500/10 to-transparent'
              : 'bg-gradient-to-bl from-[#D4A373]/10 to-transparent'
        }`} />
        
        <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
          {/* Avatar com moldura elegante */}
          <div className="relative shrink-0">
            <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full ring-4 shadow-md overflow-hidden relative mx-auto ${
              activeLayout === 'barber_club'
                ? 'ring-amber-500/30'
                : activeLayout === 'dark_minimal'
                  ? 'ring-zinc-700'
                  : 'ring-[#EEF1EB]'
            }`}>
              <Image 
                src={professional.avatarUrl} 
                alt={professional.name}
                fill
                sizes="112px"
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className={`absolute bottom-1 right-1 p-1.5 rounded-full ring-2 shadow-xs ${
              activeLayout === 'barber_club'
                ? 'bg-amber-600 text-white ring-slate-900'
                : 'bg-[#5A5A40] dark:bg-zinc-700 text-white ring-white'
            }`} title={isMasculine ? 'Agenda Aberta do Barbeiro' : 'Agenda Aberta'}>
              {activeLayout === 'barber_club' ? (
                <Scissors className="w-3.5 h-3.5" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
            </span>
          </div>

          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              {activeLayout === 'barber_club' ? (
                <span className="text-[11px] uppercase tracking-wider font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Scissors className="w-3 h-3" />
                  Barber Club & Barbearia
                </span>
              ) : activeLayout === 'boutique_glamour' ? (
                <span className="text-[11px] uppercase tracking-wider font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Crown className="w-3 h-3 text-amber-600" />
                  Haute Beauté & Glamour
                </span>
              ) : activeLayout === 'dark_minimal' ? (
                <span className="text-[11px] uppercase tracking-wider font-bold text-blue-300 bg-blue-950/60 border border-blue-800/60 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Layers className="w-3 h-3" />
                  Obsidian Studio Pro
                </span>
              ) : (
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#5A5A40] dark:text-zinc-300 bg-[#EEF1EB] px-3 py-1 rounded-full">
                  {professional.category}
                </span>
              )}

              <span className="text-[11px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Agenda Aberta
              </span>
            </div>

            <h1 className={`serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight ${
              activeLayout === 'barber_club' || activeLayout === 'dark_minimal' ? 'text-white' : 'text-[#2D2D2A] dark:text-zinc-100'
            }`}>
              {professional.name}
            </h1>

            {professional.bio && (
              <p className={`text-sm sm:text-base max-w-2xl leading-relaxed ${
                activeLayout === 'barber_club' ? 'text-slate-300' : activeLayout === 'dark_minimal' ? 'text-zinc-400' : 'text-[#706B5F] dark:text-zinc-400'
              }`}>
                {professional.bio}
              </p>
            )}

            {/* Dias e Horários de Atendimento Salvos pela Profissional */}
            <div className={`inline-flex flex-wrap items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border ${
              activeLayout === 'barber_club'
                ? 'bg-amber-950/40 text-amber-300 border-amber-800/50'
                : activeLayout === 'dark_minimal'
                  ? 'bg-zinc-800/80 text-zinc-300 border-zinc-700'
                  : 'bg-[#EEF1EB]/90 dark:bg-zinc-800 text-[#5A5A40] dark:text-zinc-300 border-[#E9E2D7] dark:border-zinc-700'
            }`}>
              <div className="flex items-center gap-1.5 font-bold">
                <CalendarIcon className="w-3.5 h-3.5 text-[#D4A373] shrink-0" />
                <span>Atendimento: {workingDaysSummary.daysText}</span>
              </div>
              <span className="opacity-40">•</span>
              <div className="flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 opacity-70 shrink-0" />
                <span>{workingDaysSummary.hoursText}</span>
              </div>
              {workingDaysSummary.lunchBreakText && (
                <>
                  <span className="opacity-40">•</span>
                  <span className="text-[11px] opacity-85">{workingDaysSummary.lunchBreakText}</span>
                </>
              )}
            </div>

            <div className={`flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs sm:text-sm pt-1 ${
              activeLayout === 'barber_club' ? 'text-slate-300' : activeLayout === 'dark_minimal' ? 'text-zinc-400' : 'text-[#706B5F] dark:text-zinc-400'
            }`}>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#D4A373] shrink-0" />
                {professional.address}
              </span>
              <span className={`flex items-center gap-1.5 font-medium ${
                activeLayout === 'barber_club' || activeLayout === 'dark_minimal' ? 'text-white' : 'text-[#2D2D2A] dark:text-zinc-100'
              }`}>
                <Phone className="w-4 h-4 text-[#5A5A40] dark:text-zinc-300 shrink-0" />
                {professional.phone}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* INDICADOR DE PASSOS MINIMALISTA & MODERNO */}
      {/* ========================================================================= */}
      {step < 4 && (
        <div className="mb-8 bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 shadow-xs">
          <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-[#A09A8E] dark:text-zinc-500 mb-2 px-1">
            <span className="flex items-center gap-1.5 text-[#5A5A40] dark:text-zinc-300">
              <span className="w-5 h-5 rounded-full bg-[#5A5A40] dark:bg-zinc-700 text-white flex items-center justify-center text-xs">
                {step}
              </span>
              Passo {step} de 3
            </span>
            <span className="text-[#2D2D2A] dark:text-zinc-100">
              {step === 1 && '1. Procedimentos'}
              {step === 2 && '2. Dia & Horário'}
              {step === 3 && '3. Seus Dados & Confirmação Automática'}
            </span>
          </div>

          <div className="w-full bg-[#E9E2D7] dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-[#5A5A40] dark:bg-zinc-700 h-full rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ESTRUTURA PRINCIPAL: COLUNA DE CONTEÚDO + SIDEBAR DE RESUMO DINÂMICO */}
      {/* ========================================================================= */}
      {step < 4 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ===================================================================== */}
          {/* COLUNA ESQUERDA (CONTEÚDO DO PASSO ATIVO) */}
          {/* ===================================================================== */}
          <div className="lg:col-span-8 space-y-6">

            {/* PASSO 1: ESCOLHER UM OU MAIS SERVIÇOS */}
            {step === 1 && (
              <div className="space-y-5">
                {/* SEÇÃO DE FOTOS REAIS DOS SERVIÇOS DA PROFISSIONAL */}
                {portfolioList.length > 0 && (
                  <div className="bg-[#FAF8F5] dark:bg-zinc-900 border border-[#E9E2D7] dark:border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs" style={{ backgroundColor: themeConfig.primary }}>
                          <Camera className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="serif text-base sm:text-lg font-bold text-[#2D2D2A] dark:text-zinc-100">
                              Vitrine de Trabalhos de {professional.name.split(' ')[0]}
                            </h3>
                            <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              Fotos Reais
                            </span>
                          </div>
                          <p className="text-xs text-[#706B5F] dark:text-zinc-400">
                            Veja os resultados e acabamentos reais. Toque em qualquer foto para ver a descrição detalhada.
                          </p>
                        </div>
                      </div>

                      <a
                        href="#catalogo-servicos"
                        className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-transform active:scale-95 flex items-center gap-1.5 shrink-0"
                        style={{ backgroundColor: themeConfig.primary }}
                      >
                        <span>Ir para Agendamento</span>
                        <ArrowDown className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    {/* Grid de Fotos Reais Exclusivo para Vitrine e Descrições */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      {portfolioList.slice(0, 4).map((photo) => (
                        <div
                          key={photo.id}
                          onClick={() => setSelectedPhotoForModal(photo)}
                          className="group relative rounded-2xl overflow-hidden border border-[#E9E2D7] dark:border-zinc-800 bg-white dark:bg-zinc-950 cursor-pointer aspect-square shadow-xs transition-all hover:-translate-y-1 hover:shadow-md"
                        >
                          <Image
                            src={photo.url}
                            alt={photo.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 640px) 50vw, 25vw"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-end p-2.5 transition-opacity">
                            <span className="text-xs font-bold text-white line-clamp-1 group-hover:text-amber-200 transition-colors">
                              {photo.title}
                            </span>
                            {photo.description ? (
                              <p className="text-[10px] text-zinc-300 line-clamp-2 mt-0.5 leading-snug">
                                {photo.description}
                              </p>
                            ) : photo.serviceName ? (
                              <span className="text-[10px] text-zinc-300 line-clamp-1 mt-0.5">
                                {photo.serviceName}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Banner de Feedback quando Combo com Desconto for Adicionado */}
                {suggestionAcceptedAlert && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 p-4 rounded-2xl flex items-center justify-between gap-3 text-sm animate-fade-in shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>
                        <strong>Combo Especial Adicionado!</strong> O procedimento complementar foi inserido na sua reserva com 15% de desconto promocional.
                      </span>
                    </div>
                    <button 
                      onClick={() => setSuggestionAcceptedAlert(false)}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 underline"
                    >
                      Fechar
                    </button>
                  </div>
                )}

                {/* SUGESTÃO INTELIGENTE DE PROCEDIMENTO COMPLEMENTAR COM DESCONTO (UPSELL) */}
                {activeSuggestion && !selectedServices.some(s => s.id === activeSuggestion.suggestedService.id) && (
                  <div className="bg-gradient-to-r from-amber-50 via-orange-50/50 to-amber-50 dark:from-amber-950/40 dark:via-zinc-900 dark:to-amber-950/30 border-2 border-amber-300 dark:border-amber-600/60 rounded-3xl p-5 sm:p-6 shadow-md relative overflow-hidden transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-amber-400 dark:bg-amber-500 text-stone-950 flex items-center justify-center text-sm font-black shadow-xs">
                          %
                        </span>
                        <div>
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300 bg-amber-200/70 dark:bg-amber-900/60 px-2.5 py-0.5 rounded-full">
                            Oportunidade Especial • 15% de Desconto
                          </span>
                          <h3 className="serif text-lg sm:text-xl font-bold text-stone-900 dark:text-zinc-100 mt-1">
                            Que tal adicionar {activeSuggestion.suggestedService.name}?
                          </h3>
                        </div>
                      </div>
                      <button
                        onClick={handleDismissSuggestion}
                        className="text-stone-400 hover:text-stone-700 dark:text-zinc-500 dark:hover:text-zinc-200 p-1 rounded-lg transition-colors cursor-pointer"
                        title="Dispensar sugestão"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs sm:text-sm text-stone-700 dark:text-zinc-300 mt-2.5 leading-relaxed">
                      Você já selecionou <strong>{activeSuggestion.baseService.name}</strong>. Aproveite para realizar também <strong>{activeSuggestion.suggestedService.name}</strong> na mesma visita e ganhe 15% de desconto automático neste segundo serviço!
                    </p>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 mt-4 pt-3.5 border-t border-amber-200 dark:border-amber-800/60">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs text-stone-500 dark:text-zinc-400 line-through">
                          De R$ {activeSuggestion.suggestedService.price.toFixed(2)}
                        </span>
                        <span className="text-base sm:text-lg font-black text-amber-900 dark:text-amber-300">
                          Por R$ {activeSuggestion.discountedPrice.toFixed(2)}
                        </span>
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                          Economia de R$ {activeSuggestion.savings.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleDismissSuggestion}
                          className="px-3 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-zinc-400 hover:bg-amber-100/50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                          Continuar sem desconto
                        </button>
                        <button
                          type="button"
                          onClick={handleAcceptSuggestion}
                          className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-600 text-stone-950 shadow-sm transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                          Adicionar com 15% OFF
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* INTRODUÇÃO E SELEÇÃO DE PROCEDIMENTOS */}
                <div className="bg-[#FDFBF7] dark:bg-zinc-900 border border-[#E9E2D7] dark:border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h2 className="serif text-xl sm:text-2xl font-bold text-[#2D2D2A] dark:text-zinc-100 flex items-center gap-2">
                      <Sparkles className="w-5 h-5" style={{ color: themeConfig.primary }} />
                      Todos os Procedimentos Disponíveis
                    </h2>
                    {selectedServices.length > 0 && (
                      <button
                        onClick={() => setSelectedServices([])}
                        className="text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 w-fit cursor-pointer transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Limpar Seleção ({selectedServices.length})
                      </button>
                    )}
                  </div>
                  <p className="text-[#706B5F] dark:text-zinc-400 text-sm sm:text-base">
                    Selecione abaixo os procedimentos desejados. Você pode escolher mais de um e o sistema calcula a duração exata para o seu atendimento!
                  </p>
                </div>

                {/* Busca Rápida */}
                {services.length > 3 && (
                  <div className="relative">
                    <Search className="w-4 h-4 text-[#A09A8E] dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar procedimento (ex.: Alongamento, Manutenção, Limpeza...)"
                      className="w-full pl-10 pr-10 py-3 text-sm rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[#2D2D2A] dark:text-zinc-100 focus:ring-2 outline-none transition-all"
                      style={{ borderColor: searchQuery ? themeConfig.primary : undefined }}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#A09A8E] dark:text-zinc-500 hover:text-[#2D2D2A] dark:hover:text-zinc-100"
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                )}

                {/* Grade de Cartões de Serviços Elegantes com Tema Dinâmico */}
                <div className="space-y-3.5">
                  {filteredServices.map((service) => {
                    const isSelected = selectedServices.some(s => s.id === service.id);
                    const depositText = service.requiresDeposit
                      ? service.depositType === 'percentage'
                        ? `Sinal Pix: ${service.depositValue}% (R$ ${((service.price * service.depositValue) / 100).toFixed(2)})`
                        : `Sinal Pix: R$ ${service.depositValue.toFixed(2)}`
                      : 'Sem sinal prévio (pague no local)';

                    return (
                      <div
                        key={service.id}
                        onClick={() => toggleService(service)}
                        className="w-full text-left p-5 sm:p-6 rounded-3xl border-2 transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none"
                        style={{
                          borderColor: isSelected ? themeConfig.primary : (isDark ? '#27272a' : '#E9E2D7'),
                          backgroundColor: isSelected 
                            ? (isDark ? 'rgba(255, 255, 255, 0.08)' : `${themeConfig.badgeBg}90`) 
                            : (isDark ? '#18181b' : '#FFFFFF')
                        }}
                      >
                        <div className="flex items-start gap-4">
                          {/* Checkbox Visual Elegante com Tema */}
                          <div 
                            className="w-7 h-7 rounded-xl border-2 mt-0.5 flex items-center justify-center shrink-0 transition-colors"
                            style={{
                              backgroundColor: isSelected ? themeConfig.primary : (isDark ? '#27272a' : '#FFFFFF'),
                              borderColor: isSelected ? themeConfig.primary : (isDark ? '#52525b' : '#A09A8E'),
                              color: '#FFFFFF'
                            }}
                          >
                            {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : <Plus className="w-4 h-4 text-stone-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100" />}
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="serif text-lg sm:text-xl font-bold text-[#2D2D2A] dark:text-zinc-100 transition-colors">
                                {service.name}
                              </h3>
                              {isSelected && (
                                <span 
                                  className="text-[10px] font-bold px-2.5 py-0.5 rounded-full text-white uppercase tracking-wider"
                                  style={{ backgroundColor: themeConfig.primary }}
                                >
                                  Selecionado
                                </span>
                              )}
                            </div>

                            {service.description && (
                              <p className="text-[#706B5F] dark:text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-xl">
                                {service.description}
                              </p>
                            )}

                            {/* Badges de Duração Média e Sinal */}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <span 
                                className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-xl border"
                                style={{ backgroundColor: themeConfig.badgeBg, color: themeConfig.badgeText, borderColor: `${themeConfig.primary}30` }}
                              >
                                <Clock className="w-3.5 h-3.5" />
                                Duração: <strong>{formatMinutes(service.durationMinutes)}</strong>
                              </span>
                              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-xl ${
                                service.requiresDeposit 
                                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60' 
                                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                              }`}>
                                {depositText}
                              </span>
                              <span className="inline-flex items-center gap-1 text-2xs font-bold px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                                ⚡ 5% OFF no Pix
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Preço e Ação */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-[#E9E2D7] dark:border-zinc-700 shrink-0 pl-11 sm:pl-0">
                          <div className="text-left sm:text-right">
                            <span className="text-[10px] text-[#A09A8E] dark:text-zinc-400 block font-bold">
                              R$ {service.price.toFixed(2)} no Cartão
                            </span>
                            <div className="flex items-baseline gap-1 sm:justify-end">
                              <span className="serif text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                                R$ {(service.price * 0.95).toFixed(2)}
                              </span>
                              <span className="text-2xs font-bold text-emerald-600 dark:text-emerald-400">no Pix</span>
                            </div>
                          </div>
                          <span 
                            className="text-xs font-semibold mt-1 px-3 py-1 rounded-lg transition-colors"
                            style={{
                              backgroundColor: isSelected ? themeConfig.primary : themeConfig.badgeBg,
                              color: isSelected ? '#FFFFFF' : themeConfig.badgeText
                            }}
                          >
                            {isSelected ? '✓ Adicionado' : '+ Adicionar'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredServices.length === 0 && (
                  <div className="p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-[#E9E2D7] dark:border-zinc-700 text-center space-y-2">
                    <p className="text-[#706B5F] dark:text-zinc-400 text-sm">Nenhum procedimento encontrado com o termo &quot;{searchQuery}&quot;.</p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-xs font-bold underline cursor-pointer"
                      style={{ color: themeConfig.primary }}
                    >
                      Limpar filtro de busca
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* PASSO 2: ESCOLHER DIA E HORÁRIO (BASEADO NO TEMPO COMBINADO) */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-1.5 text-stone-700 dark:text-zinc-300 hover:text-black dark:hover:text-white text-xs sm:text-sm font-semibold py-2 px-3.5 rounded-xl hover:bg-stone-100 dark:bg-zinc-800/80 border border-stone-200 dark:border-zinc-700 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para Procedimentos
                  </button>

                  <div className="flex items-center gap-2">
                    {selectedTime && (
                      <button
                        onClick={() => {
                          setSelectedTime('');
                          setSelectedEndTime('');
                        }}
                        className="text-xs font-bold text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:text-zinc-100 flex items-center gap-1 cursor-pointer bg-stone-100 dark:bg-zinc-800/80 hover:bg-stone-200 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-zinc-700 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Limpar Horário
                      </button>
                    )}
                    <span 
                      className="text-xs font-bold px-3 py-1 rounded-full"
                      style={{ backgroundColor: themeConfig.badgeBg, color: themeConfig.badgeText }}
                    >
                      Tempo somado: {formatMinutes(totalDurationMinutes)}
                    </span>
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-7 border border-[#E9E2D7] dark:border-zinc-700 shadow-xs space-y-6">
                  <div>
                    <h2 className="serif text-xl sm:text-2xl font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">
                      1. Escolha a data do atendimento:
                    </h2>
                    <p className="text-[#706B5F] dark:text-zinc-400 text-sm">
                      Selecione um dos dias liberados abaixo para ver a grade de horários disponíveis.
                    </p>

                    {/* Barra Horizontal de Dias Liberados */}
                    {availableDays.length === 0 ? (
                      <div className="p-6 bg-stone-50 dark:bg-zinc-800 rounded-2xl border border-dashed border-[#E9E2D7] dark:border-zinc-700 text-center space-y-3 mt-3">
                        <CalendarIcon className="w-8 h-8 text-[#A09A8E] dark:text-zinc-500 mx-auto" />
                        <p className="text-sm font-semibold text-[#2D2D2A] dark:text-zinc-100">
                          Nenhuma data liberada para agendamento online neste período.
                        </p>
                        <p className="text-xs text-[#706B5F] dark:text-zinc-400">
                          Entre em contato direto pelo WhatsApp com o(a) profissional para consultar datas extras ou encaixes.
                        </p>
                        <a
                          href={`https://wa.me/55${professional.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                            `Olá, ${professional.name}! Gostaria de agendar ${selectedServices.map(s => s.name).join(' + ')}, mas vi que não há datas liberadas online. Você tem alguma disponibilidade de encaixe?`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Falar no WhatsApp ({professional.phone})
                        </a>
                      </div>
                    ) : (
                      <div className="flex gap-2.5 overflow-x-auto pb-2 pt-3 scrollbar-thin">
                        {availableDays.map((day) => {
                          const isSelected = (selectedDate || availableDays[0]?.dateStr) === day.dateStr;
                          return (
                            <button
                              key={day.dateStr}
                              onClick={() => {
                                setSelectedDate(day.dateStr);
                                setSelectedTime('');
                                setSelectedEndTime('');
                              }}
                              className="flex-shrink-0 w-20 py-3.5 px-2 rounded-2xl border-2 text-center transition-all cursor-pointer"
                              style={{
                                borderColor: isSelected ? themeConfig.primary : (isDark ? '#27272a' : '#E9E2D7'),
                                backgroundColor: isSelected ? themeConfig.primary : (isDark ? '#18181b' : '#FFFFFF'),
                                color: isSelected ? '#FFFFFF' : (isDark ? '#f4f4f5' : '#3D3D3D')
                              }}
                            >
                              <span className={`block text-xs font-semibold uppercase ${isSelected ? 'text-white/80' : 'text-[#A09A8E] dark:text-zinc-500'}`}>
                                {day.dayName}
                              </span>
                              <span className="serif block text-2xl font-bold my-0.5">
                                {day.dayNumber}
                              </span>
                              <span className={`block text-xs font-medium ${isSelected ? 'text-white/80' : 'text-[#706B5F] dark:text-zinc-400'}`}>
                                {day.monthName}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Horários Calculados com Duração Combinada */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3 pt-2 border-t border-[#E9E2D7] dark:border-zinc-700">
                      <h3 className="serif text-lg sm:text-xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                        2. Horários disponíveis para {formatMinutes(totalDurationMinutes)} de sessão:
                      </h3>
                      {selectedDate && (
                        <span 
                          className="text-xs font-semibold px-3 py-1 rounded-md w-fit"
                          style={{ backgroundColor: themeConfig.badgeBg, color: themeConfig.badgeText }}
                        >
                          {formatDatePtBr(selectedDate)}
                        </span>
                      )}
                    </div>

                    {/* Alerta de Conflito de Concorrência */}
                    {lockConflictAlert && (
                      <div className="mb-4 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2.5 animate-in fade-in">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div className="flex-1 font-medium leading-relaxed">{lockConflictAlert}</div>
                        <button 
                          onClick={() => setLockConflictAlert(null)} 
                          className="text-rose-500 hover:text-rose-800 dark:hover:text-rose-200 text-xs font-bold px-1"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {/* Banner de Modo Encaixe Ativo */}
                    {isEncaixeMode && selectedTime && (
                      <div className="mb-4 p-3.5 bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 rounded-2xl text-xs text-amber-950 dark:text-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="block text-sm text-amber-900 dark:text-amber-200">
                              Modo Encaixe Especial Ativo: {selectedTime} às {selectedEndTime}
                            </strong>
                            <p className="text-amber-800 dark:text-amber-300 text-xs mt-0.5 leading-relaxed">
                              {encaixeReason || 'Horário com sobreposição selecionado para aprovação prévia da profissional.'}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEncaixeMode(false);
                            setEncaixeReason('');
                            setSelectedTime('');
                            setSelectedEndTime('');
                          }}
                          className="self-start sm:self-auto px-3 py-1.5 bg-amber-200 hover:bg-amber-300 dark:bg-amber-800 dark:hover:bg-amber-700 text-amber-950 dark:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          Desfazer Encaixe
                        </button>
                      </div>
                    )}

                    {/* Banner de Modo Divisão de Serviços em Horários Distintos Ativo */}
                    {isSplitScheduleMode && splitParts.length > 0 && (
                      <div className="mb-4 p-3.5 bg-purple-50 dark:bg-purple-950/40 border-2 border-purple-300 dark:border-purple-700 rounded-2xl text-xs text-purple-950 dark:text-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <Scissors className="w-4 h-4 text-purple-600 dark:text-purple-300 shrink-0" />
                            <strong className="text-sm text-purple-900 dark:text-purple-200">
                              Serviços Divididos em Horários Distintos Ativo
                            </strong>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {splitParts.map((p, idx) => (
                              <span key={idx} className="bg-purple-100 dark:bg-purple-900/60 px-2.5 py-1 rounded-lg border border-purple-200 dark:border-purple-800 font-medium text-purple-900 dark:text-purple-200">
                                {p.serviceName}: <strong>{p.time} às {p.endTime}</strong> ({formatMinutes(p.durationMinutes)})
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <button
                            type="button"
                            onClick={handleOpenSplitModal}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          >
                            Editar Horários
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsSplitScheduleMode(false);
                              setSplitParts([]);
                              setSelectedTime('');
                              setSelectedEndTime('');
                            }}
                            className="px-2.5 py-1.5 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Sugestão de divisão de horários quando há múltiplos procedimentos selecionados */}
                    {selectedServices.length > 1 && !isSplitScheduleMode && (
                      <div className="mb-4 p-3 bg-stone-50 dark:bg-zinc-800/80 border border-[#E9E2D7] dark:border-zinc-700 rounded-2xl text-xs text-[#5A5A40] dark:text-zinc-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                          <Scissors className="w-4 h-4 text-[#5A5A40] dark:text-zinc-300 shrink-0" />
                          <span>
                            Selecionou {selectedServices.length} procedimentos ({formatMinutes(totalDurationMinutes)}). Se preferir, pode dividi-los em horários livres separados no mesmo dia:
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleOpenSplitModal}
                          className="self-start sm:self-auto px-3.5 py-1.5 bg-white dark:bg-zinc-700 hover:bg-stone-100 dark:bg-zinc-800/80 dark:hover:bg-zinc-600 text-[#2D2D2A] dark:text-zinc-100 border border-[#D0C8B8] dark:border-zinc-600 rounded-xl text-xs font-bold transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
                        >
                          ✂️ Dividir em Horários Distintos
                        </button>
                      </div>
                    )}

                    {/* Banner de Reserva Temporária Ativa (5 minutos) */}
                    {activeServerLock && selectedTime && lockSecondsRemaining !== null && (
                      <div className="mb-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-xs text-emerald-900 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs animate-in fade-in">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-3 w-3 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
                          </span>
                          <span className="font-medium">
                            Horário das <strong>{selectedTime}</strong> bloqueado com exclusividade para você no servidor!
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 self-start sm:self-auto font-mono font-bold bg-emerald-200/80 dark:bg-emerald-900/70 px-2.5 py-1 rounded-lg text-emerald-950 dark:text-emerald-100 text-xs whitespace-nowrap">
                          <Clock className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
                          <span>Garantido por: {Math.floor(lockSecondsRemaining / 60)}:{String(lockSecondsRemaining % 60).padStart(2, '0')}</span>
                        </div>
                      </div>
                    )}

                    {freeSlotsCount === 0 ? (
                      /* Fallback inteligente quando não há horário: contato WhatsApp + Waitlist */
                      <div className="p-6 text-center text-[#706B5F] dark:text-zinc-400 bg-[#F8F6F2] dark:bg-zinc-850 rounded-3xl border border-[#E9E2D7] dark:border-zinc-800 space-y-4">
                        <AlertCircle className="w-9 h-9 text-[#D4A373] mx-auto" />
                        <div className="space-y-1">
                          <p className="font-bold text-[#2D2D2A] dark:text-zinc-100 text-base">
                            Sem intervalo contínuo de {formatMinutes(totalDurationMinutes)} livre nesta data
                          </p>
                          <p className="text-xs text-[#706B5F] dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                            Como seus procedimentos somam {formatMinutes(totalDurationMinutes)}, precisamos de um horário ininterrupto.
                            Se você precisa de atendimento neste dia, fale diretamente com <strong>{professional.name}</strong> para solicitar um encaixe ou entre na nossa Fila de Espera!
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              const msg = `Olá, ${professional.name}! Tentei agendar para o dia ${formatDatePtBr(selectedDate)} (${selectedServices.map(s => s.name).join(' + ')} - duração: ${formatMinutes(totalDurationMinutes)}), mas não encontrei horário disponível na sua agenda online. Você teria como verificar uma previsão de encaixe ou remanejamento para mim?`;
                              openWhatsAppSafely(professional.phone, msg);
                            }}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                          >
                            <MessageCircle className="w-4 h-4" />
                            Pedir Previsão de Encaixe no WhatsApp
                          </button>

                          <button
                            onClick={() => {
                              setWaitlistName(clientName);
                              setWaitlistPhone(clientPhone);
                              setIsWaitlistModalOpen(true);
                            }}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                          >
                            <Clock className="w-4 h-4 text-amber-400" />
                            Entrar na Fila de Espera
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 pt-1">
                        
                        {/* Manhã */}
                        {morningSlots.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-xs uppercase font-bold text-[#706B5F] dark:text-zinc-400 flex items-center gap-1.5">
                              <Sun className="w-3.5 h-3.5 text-[#D4A373]" />
                              Manhã
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                              {morningSlots.map((slot) => {
                                const isSelected = selectedTime === slot.time;
                                if (slot.isServerLockedByOther) {
                                  return (
                                    <div
                                      key={slot.time}
                                      className="py-3 px-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-center text-xs font-medium cursor-not-allowed border border-amber-200 dark:border-amber-800/60"
                                      title={slot.conflictReason || 'Em reserva temporária por outro cliente'}
                                    >
                                      <span className="font-mono block font-bold text-amber-900 dark:text-amber-300">{slot.time}</span>
                                      <span className="text-[10px] text-amber-700 dark:text-amber-400">🔒 Em reserva (5 min)</span>
                                    </div>
                                  );
                                }
                                if (slot.isBooked) {
                                  const isConflict = slot.conflictType === 'booking_overlap' || 
                                                     slot.conflictType === 'lunch_overlap' || 
                                                     slot.conflictType === 'exceeds_closing' || 
                                                     slot.conflictReason?.includes('dura') || 
                                                     slot.conflictReason?.includes('sobrepõe') || 
                                                     slot.conflictReason?.includes('insuficiente') || 
                                                     slot.conflictReason?.includes('invade') || 
                                                     slot.conflictReason?.includes('Choque');
                                  const isEncaixeSelected = isSelected && isEncaixeMode;
                                  return (
                                    <button
                                      key={slot.time}
                                      type="button"
                                      onClick={() => handleSlotConflictClick(slot)}
                                      className={`py-2.5 px-2 rounded-2xl text-center text-xs font-medium border transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                                        isEncaixeSelected
                                          ? 'border-amber-500 bg-amber-500 text-white shadow-md scale-105 ring-2 ring-amber-300'
                                          : isConflict
                                          ? 'bg-rose-50/90 hover:bg-rose-100 dark:bg-rose-950/40 border-rose-300 hover:border-rose-400 text-rose-900 dark:text-rose-200 shadow-2xs'
                                          : slot.conflictType === 'lunch'
                                          ? 'bg-stone-100/90 hover:bg-stone-200/70 dark:bg-zinc-800 border-stone-300 dark:border-zinc-700 text-stone-700 dark:text-zinc-300 shadow-2xs'
                                          : 'bg-[#F8F6F2] hover:bg-stone-100 dark:bg-zinc-800/80 text-[#706B5F] dark:text-zinc-400 border-stone-200 dark:border-zinc-700/60'
                                      }`}
                                      title="Clique para analisar conflito, pedir encaixe ou dividir serviços"
                                    >
                                      <span className="font-mono block font-bold text-xs">{slot.time}</span>
                                      <span className={`text-[10px] block truncate font-bold mt-0.5 ${isConflict ? 'text-rose-600 dark:text-rose-400' : 'text-stone-500 dark:text-zinc-500'}`}>
                                        {isConflict
                                          ? '⚠️ Choque'
                                          : slot.conflictType === 'lunch'
                                          ? '🍽️ Almoço'
                                          : '🔒 Ocupado'}
                                      </span>
                                      <span className="text-[9px] block text-stone-400 dark:text-stone-500 font-medium">
                                        {isConflict ? 'Opções →' : 'Fechado'}
                                      </span>
                                    </button>
                                  );
                                }

                                return (
                                  <button
                                    key={slot.time}
                                    onClick={() => handleSelectSlot(slot.time, slot.endTime)}
                                    disabled={lockingSlotInProgress}
                                    className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                                      isSelected && !isEncaixeMode
                                        ? 'border-[#5A5A40] dark:border-amber-400 bg-[#5A5A40] dark:bg-zinc-800 text-white shadow-md scale-102 ring-2 ring-[#5A5A40]/30'
                                        : 'border-[#E9E2D7] dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-[#FDFBF7] dark:hover:bg-zinc-700 hover:border-[#5A5A40] dark:hover:border-zinc-500 text-[#2D2D2A] dark:text-zinc-100 shadow-2xs'
                                    }`}
                                  >
                                    <div className="flex items-center justify-center gap-1">
                                      <span className="block font-bold text-base">{slot.time}</span>
                                      {isSelected && !isEncaixeMode && (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline shrink-0" />
                                      )}
                                    </div>
                                    <span className={`block text-[11px] font-medium ${isSelected && !isEncaixeMode ? 'text-white/85' : 'text-[#706B5F] dark:text-zinc-400'}`}>
                                      até {slot.endTime}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Tarde */}
                        {afternoonSlots.length > 0 && (
                          <div className="space-y-2 pt-2">
                            <span className="text-xs uppercase font-bold text-[#706B5F] dark:text-zinc-400 flex items-center gap-1.5">
                              <Sunset className="w-3.5 h-3.5 text-[#D4A373]" />
                              Tarde
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                              {afternoonSlots.map((slot) => {
                                const isSelected = selectedTime === slot.time;
                                if (slot.isServerLockedByOther) {
                                  return (
                                    <div
                                      key={slot.time}
                                      className="py-3 px-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-center text-xs font-medium cursor-not-allowed border border-amber-200 dark:border-amber-800/60"
                                      title={slot.conflictReason || 'Em reserva temporária por outro cliente'}
                                    >
                                      <span className="font-mono block font-bold text-amber-900 dark:text-amber-300">{slot.time}</span>
                                      <span className="text-[10px] text-amber-700 dark:text-amber-400">🔒 Em reserva (5 min)</span>
                                    </div>
                                  );
                                }
                                if (slot.isBooked) {
                                  const isConflict = slot.conflictType === 'booking_overlap' || 
                                                     slot.conflictType === 'lunch_overlap' || 
                                                     slot.conflictType === 'exceeds_closing' || 
                                                     slot.conflictReason?.includes('dura') || 
                                                     slot.conflictReason?.includes('sobrepõe') || 
                                                     slot.conflictReason?.includes('insuficiente') || 
                                                     slot.conflictReason?.includes('invade') || 
                                                     slot.conflictReason?.includes('Choque');
                                  const isEncaixeSelected = isSelected && isEncaixeMode;
                                  return (
                                    <button
                                      key={slot.time}
                                      type="button"
                                      onClick={() => handleSlotConflictClick(slot)}
                                      className={`py-2.5 px-2 rounded-2xl text-center text-xs font-medium border transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                                        isEncaixeSelected
                                          ? 'border-amber-500 bg-amber-500 text-white shadow-md scale-105 ring-2 ring-amber-300'
                                          : isConflict
                                          ? 'bg-rose-50/90 hover:bg-rose-100 dark:bg-rose-950/40 border-rose-300 hover:border-rose-400 text-rose-900 dark:text-rose-200 shadow-2xs'
                                          : slot.conflictType === 'lunch'
                                          ? 'bg-stone-100/90 hover:bg-stone-200/70 dark:bg-zinc-800 border-stone-300 dark:border-zinc-700 text-stone-700 dark:text-zinc-300 shadow-2xs'
                                          : 'bg-[#F8F6F2] hover:bg-stone-100 dark:bg-zinc-800/80 text-[#706B5F] dark:text-zinc-400 border-stone-200 dark:border-zinc-700/60'
                                      }`}
                                      title="Clique para analisar conflito, pedir encaixe ou dividir serviços"
                                    >
                                      <span className="font-mono block font-bold text-xs">{slot.time}</span>
                                      <span className={`text-[10px] block truncate font-bold mt-0.5 ${isConflict ? 'text-rose-600 dark:text-rose-400' : 'text-stone-500 dark:text-zinc-500'}`}>
                                        {isConflict
                                          ? '⚠️ Choque'
                                          : slot.conflictType === 'lunch'
                                          ? '🍽️ Almoço'
                                          : '🔒 Ocupado'}
                                      </span>
                                      <span className="text-[9px] block text-stone-400 dark:text-stone-500 font-medium">
                                        {isConflict ? 'Opções →' : 'Fechado'}
                                      </span>
                                    </button>
                                  );
                                }

                                return (
                                  <button
                                    key={slot.time}
                                    onClick={() => handleSelectSlot(slot.time, slot.endTime)}
                                    disabled={lockingSlotInProgress}
                                    className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                                      isSelected && !isEncaixeMode
                                        ? 'border-[#5A5A40] dark:border-amber-400 bg-[#5A5A40] dark:bg-zinc-800 text-white shadow-md scale-102 ring-2 ring-[#5A5A40]/30'
                                        : 'border-[#E9E2D7] dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-[#FDFBF7] dark:hover:bg-zinc-700 hover:border-[#5A5A40] dark:hover:border-zinc-500 text-[#2D2D2A] dark:text-zinc-100 shadow-2xs'
                                    }`}
                                  >
                                    <div className="flex items-center justify-center gap-1">
                                      <span className="block font-bold text-base">{slot.time}</span>
                                      {isSelected && !isEncaixeMode && (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline shrink-0" />
                                      )}
                                    </div>
                                    <span className={`block text-[11px] font-medium ${isSelected && !isEncaixeMode ? 'text-white/85' : 'text-[#706B5F] dark:text-zinc-400'}`}>
                                      até {slot.endTime}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Noite */}
                        {eveningSlots.length > 0 && (
                          <div className="space-y-2 pt-2">
                            <span className="text-xs uppercase font-bold text-[#706B5F] dark:text-zinc-400 flex items-center gap-1.5">
                              <Moon className="w-3.5 h-3.5 text-[#5A5A40] dark:text-zinc-300" />
                              Noite
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                              {eveningSlots.map((slot) => {
                                const isSelected = selectedTime === slot.time;
                                if (slot.isServerLockedByOther) {
                                  return (
                                    <div
                                      key={slot.time}
                                      className="py-3 px-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-center text-xs font-medium cursor-not-allowed border border-amber-200 dark:border-amber-800/60"
                                      title={slot.conflictReason || 'Em reserva temporária por outro cliente'}
                                    >
                                      <span className="font-mono block font-bold text-amber-900 dark:text-amber-300">{slot.time}</span>
                                      <span className="text-[10px] text-amber-700 dark:text-amber-400">🔒 Em reserva (5 min)</span>
                                    </div>
                                  );
                                }
                                if (slot.isBooked) {
                                  const isConflict = slot.conflictType === 'booking_overlap' || 
                                                     slot.conflictType === 'lunch_overlap' || 
                                                     slot.conflictType === 'exceeds_closing' || 
                                                     slot.conflictReason?.includes('dura') || 
                                                     slot.conflictReason?.includes('sobrepõe') || 
                                                     slot.conflictReason?.includes('insuficiente') || 
                                                     slot.conflictReason?.includes('invade') || 
                                                     slot.conflictReason?.includes('Choque');
                                  const isEncaixeSelected = isSelected && isEncaixeMode;
                                  return (
                                    <button
                                      key={slot.time}
                                      type="button"
                                      onClick={() => handleSlotConflictClick(slot)}
                                      className={`py-2.5 px-2 rounded-2xl text-center text-xs font-medium border transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                                        isEncaixeSelected
                                          ? 'border-amber-500 bg-amber-500 text-white shadow-md scale-105 ring-2 ring-amber-300'
                                          : isConflict
                                          ? 'bg-rose-50/90 hover:bg-rose-100 dark:bg-rose-950/40 border-rose-300 hover:border-rose-400 text-rose-900 dark:text-rose-200 shadow-2xs'
                                          : slot.conflictType === 'lunch'
                                          ? 'bg-stone-100/90 hover:bg-stone-200/70 dark:bg-zinc-800 border-stone-300 dark:border-zinc-700 text-stone-700 dark:text-zinc-300 shadow-2xs'
                                          : 'bg-[#F8F6F2] hover:bg-stone-100 dark:bg-zinc-800/80 text-[#706B5F] dark:text-zinc-400 border-stone-200 dark:border-zinc-700/60'
                                      }`}
                                      title="Clique para analisar conflito, pedir encaixe ou dividir serviços"
                                    >
                                      <span className="font-mono block font-bold text-xs">{slot.time}</span>
                                      <span className={`text-[10px] block truncate font-bold mt-0.5 ${isConflict ? 'text-rose-600 dark:text-rose-400' : 'text-stone-500 dark:text-zinc-500'}`}>
                                        {isConflict
                                          ? '⚠️ Choque'
                                          : slot.conflictType === 'lunch'
                                          ? '🍽️ Almoço'
                                          : '🔒 Ocupado'}
                                      </span>
                                      <span className="text-[9px] block text-stone-400 dark:text-stone-500 font-medium">
                                        {isConflict ? 'Opções →' : 'Fechado'}
                                      </span>
                                    </button>
                                  );
                                }

                                return (
                                  <button
                                    key={slot.time}
                                    onClick={() => handleSelectSlot(slot.time, slot.endTime)}
                                    disabled={lockingSlotInProgress}
                                    className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                                      isSelected && !isEncaixeMode
                                        ? 'border-[#5A5A40] dark:border-amber-400 bg-[#5A5A40] dark:bg-zinc-800 text-white shadow-md scale-102 ring-2 ring-[#5A5A40]/30'
                                        : 'border-[#E9E2D7] dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-[#FDFBF7] dark:hover:bg-zinc-700 hover:border-[#5A5A40] dark:hover:border-zinc-500 text-[#2D2D2A] dark:text-zinc-100 shadow-2xs'
                                    }`}
                                  >
                                    <div className="flex items-center justify-center gap-1">
                                      <span className="block font-bold text-base">{slot.time}</span>
                                      {isSelected && !isEncaixeMode && (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline shrink-0" />
                                      )}
                                    </div>
                                    <span className={`block text-[11px] font-medium ${isSelected && !isEncaixeMode ? 'text-white/85' : 'text-[#706B5F] dark:text-zinc-400'}`}>
                                      até {slot.endTime}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PASSO 3: SEUS DADOS (VALIDAÇÃO ESTRITA DE WHATSAPP + PERSISTÊNCIA TOTAL) */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-1.5 text-stone-700 dark:text-zinc-300 hover:text-black dark:hover:text-white text-xs sm:text-sm font-semibold py-2 px-3.5 rounded-xl hover:bg-stone-100 dark:bg-zinc-800/80 border border-stone-200 dark:border-zinc-700 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar e alterar horário
                  </button>

                  {(clientName || clientPhone || clientNotes) && (
                    <button
                      onClick={() => {
                        setClientName('');
                        setClientPhone('');
                        setClientNotes('');
                        setFormError(null);
                      }}
                      className="text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Limpar Campos
                    </button>
                  )}
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-[#E9E2D7] dark:border-zinc-700 shadow-xs space-y-6">
                  <div className="space-y-1">
                    <span 
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-1"
                      style={{ backgroundColor: themeConfig.badgeBg, color: themeConfig.badgeText }}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Passo Final: Identificação
                    </span>
                    <h2 className="serif text-2xl sm:text-3xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                      Para quem é este agendamento?
                    </h2>
                    <p className="text-[#706B5F] dark:text-zinc-400 text-sm sm:text-base">
                      Preencha seu nome e WhatsApp. <span className="font-semibold" style={{ color: themeConfig.primary }}>Não exigimos cadastro com senha</span> nem burocracia! Ao confirmar, seu horário já será agendado automaticamente.
                    </p>
                  </div>

                  {formError && (
                    <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs sm:text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1.5">
                        Seu Nome Completo:
                      </label>
                      <input
                        type="text"
                        value={clientName}
                        onChange={(e) => {
                          setClientName(e.target.value);
                          if (formError) setFormError(null);
                        }}
                        placeholder="Ex.: Maria Aparecida da Silva"
                        className="w-full px-4 py-3.5 text-base rounded-2xl border-2 border-[#E9E2D7] dark:border-zinc-700 focus:ring-2 outline-none text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 transition-colors"
                        style={{ borderColor: clientName ? themeConfig.primary : undefined }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1.5 flex items-center justify-between">
                        <span>Seu WhatsApp com DDD:</span>
                        {isValidWhatsApp(clientPhone) && (
                          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> WhatsApp válido
                          </span>
                        )}
                      </label>
                      <input
                        type="tel"
                        value={clientPhone}
                        onChange={(e) => {
                          setClientPhone(formatPhoneMask(e.target.value));
                          if (formError) setFormError(null);
                        }}
                        placeholder="Ex.: (11) 98765-4321"
                        className="w-full px-4 py-3.5 text-base rounded-2xl border-2 border-[#E9E2D7] dark:border-zinc-700 focus:ring-2 outline-none text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 font-medium transition-colors"
                        style={{ borderColor: isValidWhatsApp(clientPhone) ? '#10B981' : (clientPhone ? themeConfig.primary : undefined) }}
                      />
                      <p className="text-xs text-[#706B5F] dark:text-zinc-400 mt-1.5 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-[#A09A8E] dark:text-zinc-500 shrink-0" />
                        A confirmação e as notificações de aprovação chegarão diretamente neste WhatsApp.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1.5">
                        Observações ou preferências (opcional):
                      </label>
                      <textarea
                        rows={2}
                        value={clientNotes}
                        onChange={(e) => setClientNotes(e.target.value)}
                        placeholder={isMasculine ? "Ex.: Prefiro corte na tesoura, degradê navalhado..." : "Ex.: Tenho unhas sensíveis, prefiro esmalte hipoalergênico..."}
                        className="w-full px-4 py-3 text-sm rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 focus:ring-1 outline-none text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 resize-none"
                      />
                    </div>

                    {/* Resumo Integrado da Escolha */}
                    <div className="p-4 sm:p-5 bg-[#FDFBF7] border border-[#E9E2D7] dark:border-zinc-700 rounded-2xl space-y-3 text-xs sm:text-sm mt-4">
                      {isEncaixeMode && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-amber-950 dark:text-amber-100 flex items-start gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div className="leading-relaxed">
                            <strong className="block text-amber-900 dark:text-amber-200">
                              🚨 Solicitação de Encaixe com Sobreposição
                            </strong>
                            <span>
                              Este horário possui sobreposição com a agenda padrão. Ao confirmar, seu pedido será enviado com destaque de <strong>Encaixe Especial</strong> e dependerá da aprovação de <strong>{professional.name}</strong>.
                            </span>
                          </div>
                        </div>
                      )}

                      {isSplitScheduleMode && splitParts.length > 0 && (
                        <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800 rounded-xl text-xs text-purple-950 dark:text-purple-100 space-y-2">
                          <div className="flex items-center gap-2 font-bold text-purple-900 dark:text-purple-200">
                            <Scissors className="w-4 h-4 text-purple-600 shrink-0" />
                            <span>✂️ Atendimento com Serviços Divididos em Horários / Dias</span>
                          </div>
                          <div className="space-y-1.5">
                            {splitParts.map((p, idx) => (
                              <div key={idx} className="bg-white dark:bg-zinc-800 p-2.5 rounded-lg border border-purple-200 dark:border-purple-700 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                                <div>
                                  <span className="font-semibold text-purple-950 dark:text-purple-100">{p.serviceName} ({formatMinutes(p.durationMinutes)})</span>
                                  {p.date && (
                                    <span className="block text-2xs text-purple-700 dark:text-purple-300 font-medium">
                                      📅 {formatDatePtBr(p.date)}
                                    </span>
                                  )}
                                </div>
                                <strong className="text-purple-900 dark:text-purple-300 font-mono">{p.time} às {p.endTime}</strong>
                              </div>
                            ))}
                          </div>
                          <p className="text-[11px] text-purple-800 dark:text-purple-300">
                            * A divisão dos procedimentos em horários ou dias distintos será analisada e aprovada pela profissional.
                          </p>
                        </div>
                      )}

                      <div className="flex justify-between items-center pb-2 border-b border-[#E9E2D7] dark:border-zinc-700">
                        <span className="text-[#706B5F] dark:text-zinc-400">{isMasculine ? 'Barbeiro:' : 'Profissional:'}</span>
                        <strong className="text-[#2D2D2A] dark:text-zinc-100">{professional.name}</strong>
                      </div>
                      <div className="flex justify-between items-start pb-2 border-b border-[#E9E2D7] dark:border-zinc-700 gap-2">
                        <span className="text-[#706B5F] dark:text-zinc-400 shrink-0">Data & Horário:</span>
                        <strong className="text-[#2D2D2A] dark:text-zinc-100 text-right">
                          {isSplitScheduleMode && splitParts.length > 0
                            ? splitParts.map(p => `${p.date ? formatDatePtBr(p.date) : formatDatePtBr(selectedDate)} (${p.time}-${p.endTime})`).join(' • ')
                            : `${formatDatePtBr(selectedDate)} das ${selectedTime} às ${selectedEndTime}`
                          }
                        </strong>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-[#E9E2D7] dark:border-zinc-700">
                        <span className="text-[#706B5F] dark:text-zinc-400">Procedimento(s):</span>
                        <span className="font-semibold text-right max-w-[220px] truncate text-[#2D2D2A] dark:text-zinc-100">
                          {selectedServices.map(s => s.name).join(', ')} ({formatMinutes(totalDurationMinutes)})
                        </span>
                      </div>
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[#706B5F] dark:text-zinc-400">💳 No Cartão (em até 3x):</span>
                          <span className="font-bold text-[#2D2D2A] dark:text-zinc-200">
                            R$ {totalPrice.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            ⚡ Com Desconto no Pix (5% OFF):
                          </span>
                          <span className="serif text-base font-bold text-emerald-700 dark:text-emerald-400">
                            R$ {(totalPrice * 0.95).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      {hasDepositRequired ? (
                        <div className="text-[11px] text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800/60 space-y-1">
                          <p className="font-bold">
                            💰 Sinal de Reserva: R$ {depositAmount.toFixed(2)} via Pix
                          </p>
                          <p className="text-[10px] text-amber-800 dark:text-amber-300">
                            O saldo restante de R$ {((totalPrice * 0.95) - depositAmount).toFixed(2)} no Pix (ou R$ {(totalPrice - depositAmount).toFixed(2)} no Cartão) será pago no momento do seu atendimento.
                          </p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                          ✓ Sem cobrança de sinal prévio. Pagamento no local no momento do atendimento.
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleConfirmBooking}
                      disabled={isSubmittingBooking}
                      className="w-full py-4 px-6 rounded-2xl font-bold text-base text-white shadow-md flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                      style={{ backgroundColor: themeConfig.primary }}
                    >
                      {isSubmittingBooking ? (
                        <>
                          <Clock className="w-5 h-5 animate-spin" />
                          Processando Agendamento...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                          {isMasculine ? 'Confirmar Agendamento com o Barbeiro' : 'Confirmar Agendamento'}
                        </>
                      )}
                    </button>

                    <div className="pt-2 text-center">
                      <Link
                        href="/agendamento"
                        className="inline-flex items-center gap-1.5 text-xs text-[#706B5F] dark:text-zinc-400 hover:text-[#8C4E46] dark:hover:text-rose-300 font-medium transition-colors"
                      >
                        <Clock className="w-3.5 h-3.5 text-[#8C4E46] dark:text-rose-400" />
                        <span>Ver agendas já realizadas</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* ===================================================================== */}
          {/* COLUNA DIREITA: SIDEBAR DE RESUMO DINÂMICO FIXA (DESKTOP) */}
          {/* ===================================================================== */}
          <div className="hidden lg:block lg:col-span-4 sticky top-24 space-y-4">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-[#E9E2D7] dark:border-zinc-700 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-[#E9E2D7] dark:border-zinc-700 pb-3">
                <h3 className="serif font-bold text-lg text-[#2D2D2A] dark:text-zinc-100">
                  Resumo da Reserva
                </h3>
                <span 
                  className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: themeConfig.badgeBg, color: themeConfig.badgeText }}
                >
                  {selectedServices.length} {selectedServices.length === 1 ? 'item' : 'itens'}
                </span>
              </div>

              {selectedServices.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#A09A8E] dark:text-zinc-500 space-y-2">
                  <Clock className="w-8 h-8 mx-auto text-stone-300" />
                  <p>Selecione um ou mais procedimentos ao lado para ver os totais de tempo e valor.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Lista de Serviços Selecionados */}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedServices.map(s => (
                      <div key={s.id} className="flex justify-between items-start text-xs border-b border-stone-100 pb-2">
                        <div className="space-y-0.5 max-w-[180px]">
                          <span className="font-semibold text-[#2D2D2A] dark:text-zinc-100 block truncate">{s.name}</span>
                          <span className="text-[#A09A8E] dark:text-zinc-500 flex items-center gap-1 text-[11px]">
                            <Clock className="w-3 h-3" style={{ color: themeConfig.primary }} /> {formatMinutes(s.durationMinutes)}
                          </span>
                        </div>
                        <span className="font-bold" style={{ color: themeConfig.primary }}>R$ {s.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Somatório Dinâmico de Duração e Valor */}
                  <div className="bg-[#F8F6F2] p-4 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#706B5F] dark:text-zinc-400 font-medium flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" style={{ color: themeConfig.primary }} />
                        Tempo total estimado:
                      </span>
                      <span className="font-bold text-sm" style={{ color: themeConfig.primary }}>
                        {formatMinutes(totalDurationMinutes)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-[#E9E2D7] dark:border-zinc-700">
                      <span className="text-sm font-bold text-[#2D2D2A] dark:text-zinc-100">Valor Total:</span>
                      <span className="serif text-xl font-bold" style={{ color: themeConfig.primary }}>
                        R$ {totalPrice.toFixed(2)}
                      </span>
                    </div>

                    {hasDepositRequired && (
                      <div className="text-[11px] text-[#D4A373] pt-1">
                        * Exige sinal de R$ {depositAmount.toFixed(2)} (via Pix após confirmação).
                      </div>
                    )}
                  </div>

                  {/* Data & Horário Selecionado se houver */}
                  {selectedTime && (
                    <div 
                      className="p-3 rounded-xl text-xs space-y-0.5 border"
                      style={{ backgroundColor: `${themeConfig.badgeBg}80`, borderColor: `${themeConfig.primary}30` }}
                    >
                      <span className="font-bold block" style={{ color: themeConfig.primary }}>Horário Reservado:</span>
                      <span className="text-[#2D2D2A] dark:text-zinc-100">
                        {formatDatePtBr(selectedDate)} das <strong>{selectedTime} às {selectedEndTime}</strong>
                      </span>
                    </div>
                  )}

                  {/* Botão de Ação Dinâmico no Sidebar */}
                  {step === 1 && (
                    <button
                      onClick={() => setStep(2)}
                      className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.02]"
                      style={{ backgroundColor: themeConfig.primary }}
                    >
                      Escolher Horário &rarr;
                    </button>
                  )}

                  {step === 2 && (
                    <button
                      disabled={!selectedTime}
                      onClick={() => setStep(3)}
                      className="w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                      style={{
                        backgroundColor: selectedTime ? themeConfig.primary : '#E9E2D7',
                        color: selectedTime ? '#FFFFFF' : '#A09A8E',
                        cursor: selectedTime ? 'pointer' : 'not-allowed'
                      }}
                    >
                      Preencher Meus Dados &rarr;
                    </button>
                  )}

                  {step === 3 && (
                    <button
                      onClick={handleConfirmBooking}
                      className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.02]"
                      style={{ backgroundColor: themeConfig.primary }}
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      {isMasculine ? 'Confirmar Agendamento' : 'Confirmar Agendamento'}
                    </button>
                  )}

                  <div className="pt-2 text-center">
                    <Link
                      href="/agendamento"
                      className="inline-flex items-center gap-1.5 text-xs text-[#706B5F] dark:text-zinc-400 hover:text-[#8C4E46] dark:hover:text-rose-300 font-medium transition-colors"
                    >
                      <Clock className="w-3.5 h-3.5 text-[#8C4E46] dark:text-rose-400" />
                      <span>Ver agendas já realizadas</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (
        /* ========================================================================= */
        /* PASSO 4: TELA DE SUCESSO / SOLICITAÇÃO ENVIADA */
        /* ========================================================================= */
        confirmedBooking && (
          <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-10 border border-[#E9E2D7] dark:border-zinc-700 shadow-lg space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
            
            <div className="w-20 h-20 bg-emerald-50 text-emerald-700 border-2 border-emerald-200 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#5A5A40] dark:text-zinc-300 bg-[#EEF1EB] border border-[#5A5A40] dark:border-zinc-600/30 px-3 py-1 rounded-full">
                  Código: {confirmedBooking.code}
                </span>
                {confirmedBooking.isEncaixe ? (
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-200 border border-amber-300 px-3 py-1 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                    Encaixe Especial (Aguardando Aprovação)
                  </span>
                ) : confirmedBooking.isSplitSchedule ? (
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-900 bg-purple-200 border border-purple-300 px-3 py-1 rounded-full flex items-center gap-1">
                    <Scissors className="w-3.5 h-3.5 text-purple-700" />
                    Serviços Divididos (Aguardando Aprovação)
                  </span>
                ) : (
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-3 py-1 rounded-full">
                    ⏳ Aguardando Aprovação
                  </span>
                )}
              </div>
              <h2 className="serif text-2xl sm:text-3xl font-bold text-[#2D2D2A] dark:text-zinc-100 pt-2">
                {confirmedBooking.isEncaixe
                  ? 'Solicitação de Encaixe Enviada com Sucesso!'
                  : confirmedBooking.isSplitSchedule
                  ? 'Agendamento Dividido Registrado com Sucesso!'
                  : 'Solicitação Realizada com Sucesso!'}
              </h2>
              <p className="text-[#706B5F] dark:text-zinc-400 text-base max-w-md mx-auto">
                Olá, <strong>{confirmedBooking.clientName}</strong>! Seu pedido de agendamento foi registrado e enviado para <strong>{confirmedBooking.professionalName}</strong>.
              </p>
            </div>

            {/* Opções de Pagamento Antecipado via Pix ou Cartão */}
            {(() => {
              const activeServiceWithCard = services.find(s => s.id === confirmedBooking.serviceId && s.cardPaymentLink);
              const cardLink = activeServiceWithCard?.cardPaymentLink || professional.cardPaymentLink || '';

              return (
                <div className="bg-[#FDFBF7] dark:bg-zinc-800/80 border border-[#E9E2D7] dark:border-zinc-700 rounded-3xl p-5 sm:p-6 text-left space-y-4">
                  <h3 className="serif font-bold text-base text-[#2D2D2A] dark:text-zinc-100 flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-[#D4A373]" />
                    Como você prefere pagar?
                  </h3>
                  
                  {!paymentIntention ? (
                    <div className="space-y-3">
                      {confirmedBooking.depositRequired && confirmedBooking.depositAmount > 0 && (
                        <button
                          onClick={() => setPaymentIntention('deposit')}
                          className="w-full text-left p-4 rounded-2xl border-2 border-[#E9E2D7] dark:border-zinc-700 hover:border-amber-400 dark:hover:border-amber-500 bg-white dark:bg-zinc-900 transition-colors"
                        >
                          <div className="font-bold text-[#2D2D2A] dark:text-zinc-100 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <span>Pagar apenas o Sinal (Pix)</span>
                            </span>
                            <span className="text-amber-600 dark:text-amber-500">R$ {confirmedBooking.depositAmount.toFixed(2)}</span>
                          </div>
                          <p className="text-xs text-[#706B5F] dark:text-zinc-400 mt-1">Garante o seu horário na agenda de forma rápida.</p>
                        </button>
                      )}

                      <button
                        onClick={() => setPaymentIntention('full')}
                        className="w-full text-left p-4 rounded-2xl border-2 border-[#E9E2D7] dark:border-zinc-700 hover:border-emerald-400 dark:hover:border-emerald-500 bg-white dark:bg-zinc-900 transition-colors"
                      >
                        <div className="font-bold text-[#2D2D2A] dark:text-zinc-100 flex items-center justify-between">
                          <span>Pagar Valor Integral (Pix)</span>
                          <span className="text-emerald-600 dark:text-emerald-500">R$ {confirmedBooking.totalPrice.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-[#706B5F] dark:text-zinc-400 mt-1">Pague tudo agora via Pix e não se preocupe no dia.</p>
                      </button>

                      {/* Opção de Pagamento com Cartão de Crédito (se cadastrado link pela profissional) */}
                      {cardLink && (
                        <a
                          href={cardLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full text-left p-4 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800/60 hover:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 transition-colors cursor-pointer group"
                        >
                          <div className="font-bold text-[#2D2D2A] dark:text-zinc-100 flex items-center justify-between">
                            <span className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300">
                              <CreditCard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                              <span>Pagar no Cartão de Crédito</span>
                            </span>
                            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                              Abrir Link <ExternalLink className="w-3.5 h-3.5" />
                            </span>
                          </div>
                          <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80 mt-1">
                            Link seguro de pagamento configurado pela profissional (Mercado Pago, InfinitePay, etc.).
                          </p>
                        </a>
                      )}
                      
                      {!confirmedBooking.depositRequired && (
                        <button
                          onClick={() => setPaymentIntention('in_person')}
                          className="w-full text-left p-4 rounded-2xl border-2 border-[#E9E2D7] dark:border-zinc-700 hover:border-stone-400 bg-white dark:bg-zinc-900 transition-colors"
                        >
                          <div className="font-bold text-[#2D2D2A] dark:text-zinc-100 flex items-center justify-between">
                            <span>Pagar no Local</span>
                            <span className="text-stone-500 dark:text-zinc-400">R$ {confirmedBooking.totalPrice.toFixed(2)}</span>
                          </div>
                          <p className="text-xs text-[#706B5F] dark:text-zinc-400 mt-1">Realize o pagamento no dia do atendimento.</p>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      {paymentIntention === 'in_person' ? (
                         <div className="p-4 bg-stone-50 dark:bg-zinc-900/50 rounded-2xl border border-stone-200 dark:border-zinc-700 text-center space-y-2">
                           <CheckCircle2 className="w-8 h-8 text-stone-400 mx-auto" />
                           <strong className="block text-stone-800 dark:text-zinc-200">Perfeito! Pagamento no local.</strong>
                           <p className="text-xs text-stone-600 dark:text-zinc-400">Seu agendamento foi registrado e aguarda confirmação.</p>
                         </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-900 text-center space-y-2">
                            <strong className="block text-emerald-800 dark:text-emerald-400">
                              {paymentIntention === 'deposit' ? `Sinal de R$ ${confirmedBooking.depositAmount.toFixed(2)}` : `Valor Integral de R$ ${confirmedBooking.totalPrice.toFixed(2)}`}
                            </strong>
                            <p className="text-xs text-emerald-700 dark:text-emerald-500">
                              Copie o código abaixo e pague no app do seu banco. A profissional será avisada!
                            </p>
                          </div>

                          {(() => {
                            const amountToPay = paymentIntention === 'deposit' ? confirmedBooking.depositAmount : confirmedBooking.totalPrice;
                            const pixCodeToPay = generatePixCopiaECola(
                              professional.pixKey || '',
                              professional.name || 'Profissional',
                              professional.address?.split('-')[0] || 'Cidade',
                              amountToPay,
                              confirmedBooking.code.replace('#', '')
                            );
                            return (
                              <div className="flex items-center gap-2">
                                <input 
                                  readOnly 
                                  value={pixCodeToPay} 
                                  className="w-full text-xs p-3 bg-white dark:bg-zinc-950 border border-stone-200 dark:border-zinc-700 rounded-xl font-mono text-stone-600 dark:text-zinc-400 truncate"
                                />
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(pixCodeToPay);
                                    setCopiedPixFull(true);
                                    setTimeout(() => setCopiedPixFull(false), 2000);
                                  }}
                                  className="shrink-0 p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-colors cursor-pointer"
                                >
                                  {copiedPixFull ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                </button>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                      
                      <button onClick={() => setPaymentIntention(null)} className="text-xs text-[#706B5F] dark:text-zinc-400 hover:text-black dark:hover:text-white underline w-full text-center mt-2 cursor-pointer transition-colors">
                        Voltar e escolher outra opção
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="space-y-3 pt-2">
              {/* Botão Chamativo de Envio Direto ao WhatsApp */}
              <a
                href={generateProfessionalNotificationWhatsAppUrl(confirmedBooking, professional)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-6 rounded-2xl font-bold text-base bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-lg flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01]"
              >
                <MessageSquare className="w-5 h-5 fill-current" />
                <span>Enviar Notificação no WhatsApp de {confirmedBooking.professionalName}</span>
              </a>
              <p className="text-xs text-[#706B5F] dark:text-zinc-400 text-center">
                Clique no botão acima para abrir a conversa já preenchida no WhatsApp. <strong>100% gratuito, sem custo algum!</strong>
              </p>

              <Link
                href={`/agendamento/${confirmedBooking.code.replace('#', '')}`}
                className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white shadow-md flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.01]"
              >
                <Clock className="w-4 h-4 text-emerald-300" />
                Acompanhar Status da Reserva em Tempo Real &rarr;
              </Link>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      const url = `${window.location.origin}/agendamento/${confirmedBooking.code.replace('#', '')}`;
                      navigator.clipboard.writeText(url);
                      setCopiedPix(true);
                      setTimeout(() => setCopiedPix(false), 2000);
                    }
                  }}
                  className="py-3 px-4 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 hover:border-[#5A5A40] dark:border-zinc-600 bg-[#FAF8F5] dark:bg-zinc-800/50 font-semibold text-[#5A5A40] dark:text-zinc-300 text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  {copiedPix ? 'Link da Reserva Copiado!' : 'Copiar Link da Reserva'}
                </button>

                <button
                  onClick={() => {
                    setConfirmedBooking(null);
                    setPaymentIntention(null);
                    setSelectedServices([]);
                    setSelectedTime('');
                    setSelectedEndTime('');
                    setStep(1);
                  }}
                  className="py-3 px-4 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 hover:border-[#5A5A40] dark:border-zinc-600 bg-white dark:bg-zinc-900 font-semibold text-[#2D2D2A] dark:text-zinc-100 text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  Novo agendamento
                </button>
              </div>
            </div>

          </div>
        )
      )}

      {/* ========================================================================= */}
      {/* BARRA INFERIOR FLUTUANTE (MOBILE) - RESUMO DINÂMICO SEMPRE VISÍVEL */}
      {/* ========================================================================= */}
      {step < 4 && selectedServices.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-zinc-900/95 backdrop-blur-md border-t border-[#E9E2D7] dark:border-zinc-700 shadow-xl z-40">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-[#5A5A40] dark:text-zinc-300 bg-[#EEF1EB] px-2 py-0.5 rounded-md">
                  {selectedServices.length} {selectedServices.length === 1 ? 'item' : 'itens'}
                </span>
                <span className="font-semibold text-[#706B5F] dark:text-zinc-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#5A5A40] dark:text-zinc-300" />
                  {formatMinutes(totalDurationMinutes)}
                </span>
              </div>
              <div className="serif text-lg font-bold text-[#2D2D2A] dark:text-zinc-100 mt-0.5">
                R$ {totalPrice.toFixed(2)}
                {hasDepositRequired && (
                  <span className="text-[10px] font-normal text-[#D4A373] ml-1">
                    (Sinal R$ {depositAmount.toFixed(2)})
                  </span>
                )}
              </div>
            </div>

            {step === 1 && (
              <button
                onClick={() => setStep(2)}
                className="px-5 py-3 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md flex items-center gap-1 cursor-pointer"
                style={{ backgroundColor: themeConfig.primary }}
              >
                Horários &rarr;
              </button>
            )}

            {step === 2 && (
              <button
                disabled={!selectedTime}
                onClick={() => setStep(3)}
                className={`px-5 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1 ${
                  selectedTime 
                    ? 'text-white shadow-md cursor-pointer' 
                    : 'bg-[#E9E2D7] dark:bg-zinc-700 text-[#A09A8E] dark:text-zinc-500 cursor-not-allowed'
                }`}
                style={{ backgroundColor: selectedTime ? themeConfig.primary : undefined }}
              >
                Seus Dados &rarr;
              </button>
            )}

            {step === 3 && (
              <button
                onClick={handleConfirmBooking}
                className="px-5 py-3 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md flex items-center gap-1.5 cursor-pointer"
                style={{ backgroundColor: themeConfig.primary }}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                Confirmar
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEÇÃO DE AVALIAÇÕES E PROVA SOCIAL DAS CLIENTES */}
      {/* ========================================================================= */}
      {step < 4 && reviews.length > 0 && (
        <div className="max-w-4xl mx-auto pt-10 border-t border-[#E9E2D7] dark:border-zinc-700 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex items-center text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="font-bold text-lg text-[#2D2D2A] dark:text-zinc-100">
                  {(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)}
                </span>
                <span className="text-xs text-[#706B5F] dark:text-zinc-400">
                  ({reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'} de clientes verificadas)
                </span>
              </div>
              <h3 className="serif text-xl sm:text-2xl font-bold text-[#2D2D2A] dark:text-zinc-100 mt-1">
                {isMasculine ? `O que os clientes dizem sobre ${professional.name}` : `O que as clientes dizem sobre ${professional.name}`}
              </h3>
            </div>
            
            <span 
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold"
              style={{ backgroundColor: themeConfig.badgeBg, color: themeConfig.badgeText }}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              100% Avaliações Reais
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => (
              <div 
                key={rev.id} 
                className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <strong className="text-sm text-[#2D2D2A] dark:text-zinc-100 block">{rev.clientName}</strong>
                    {rev.serviceName && (
                      <span className="text-[11px] text-[#A09A8E] dark:text-zinc-500">{rev.serviceName}</span>
                    )}
                  </div>
                  <div className="flex items-center text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-[#555] leading-relaxed italic">
                  &ldquo;{rev.comment}&rdquo;
                </p>
                <div className="text-[10px] text-stone-400 text-right">
                  {formatDatePtBr(rev.createdAt.split('T')[0])}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE FILA DE ESPERA / PEDIDO DE ENCAIXE INTELIGENTE */}
      {/* ========================================================================= */}
      {isWaitlistModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 text-[#2D2D2A] dark:text-zinc-100 rounded-3xl max-w-md w-full p-6 sm:p-8 border border-[#E9E2D7] dark:border-zinc-800 shadow-2xl relative space-y-5 my-auto max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setIsWaitlistModalOpen(false);
                setWaitlistSuccess(false);
              }}
              className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 dark:text-zinc-300 dark:hover:text-stone-200 hover:bg-stone-100 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {waitlistSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="serif text-xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                    Você está na Fila de Espera!
                  </h3>
                  <p className="text-xs sm:text-sm text-[#706B5F] dark:text-zinc-400 leading-relaxed">
                    Assim que surgir um cancelamento ou horário disponível para <strong>{formatDatePtBr(selectedDate)}</strong>, {professional.name} entrará em contato com você pelo WhatsApp no número <strong>{waitlistPhone}</strong>.
                  </p>
                </div>
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const msg = `Olá, ${professional.name}! Acabei de me cadastrar na fila de espera para o dia ${formatDatePtBr(selectedDate)} (${selectedServices.map(s => s.name).join(' + ')}). Meu nome é ${waitlistName}. Gostaria de saber se você teria alguma previsão de encaixe para mim.`;
                      openWhatsAppSafely(professional.phone, msg);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Solicitar Previsão de Encaixe no WhatsApp
                  </button>

                  <button
                    onClick={() => {
                      setIsWaitlistModalOpen(false);
                      setWaitlistSuccess(false);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-stone-700 dark:text-zinc-300 hover:text-stone-900 dark:text-zinc-100 bg-stone-100 dark:bg-zinc-800/80 hover:bg-stone-200 transition-colors cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full inline-block">
                    ⏳ Fila de Espera & Encaixe
                  </span>
                  <h3 className="serif text-xl font-bold text-[#2D2D2A] dark:text-zinc-100 pt-1">
                    Entrar na lista de {formatDatePtBr(selectedDate)}
                  </h3>
                  <p className="text-xs text-[#706B5F] dark:text-zinc-400">
                    Se houver desistência ou remanejamento de horários para {selectedServices.map(s => s.name).join(', ')}, você terá prioridade!
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Seu Nome:</label>
                    <input
                      type="text"
                      value={waitlistName}
                      onChange={(e) => setWaitlistName(e.target.value)}
                      placeholder="Ex: Beatriz Lima"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-zinc-600 text-sm focus:ring-1 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Seu WhatsApp:</label>
                    <input
                      type="tel"
                      value={waitlistPhone}
                      onChange={(e) => setWaitlistPhone(formatPhoneMask(e.target.value))}
                      placeholder="(11) 98765-4321"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-zinc-600 text-sm focus:ring-1 outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Turno de preferência:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'any', label: 'Qualquer Turno' },
                        { id: 'morning', label: 'Manhã' },
                        { id: 'afternoon', label: 'Tarde' },
                        { id: 'evening', label: 'Noite' }
                      ].map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setWaitlistPeriodPref(p.id as any)}
                          className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-colors ${
                            waitlistPeriodPref === p.id 
                              ? 'border-black bg-stone-900 text-white' 
                              : 'border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:bg-zinc-800/80'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    disabled={!waitlistName.trim() || !isValidWhatsApp(waitlistPhone)}
                    onClick={() => {
                      addWaitlistEntry({
                        professionalId: professional.id,
                        clientName: waitlistName,
                        clientPhone: waitlistPhone,
                        desiredDate: selectedDate,
                        preferredPeriod: waitlistPeriodPref,
                        serviceIds: selectedServices.map(s => s.id),
                        serviceNames: selectedServices.map(s => s.name).join(' + ')
                      });
                      setWaitlistSuccess(true);
                    }}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white transition-all ${
                      waitlistName.trim() && isValidWhatsApp(waitlistPhone)
                        ? 'shadow-md cursor-pointer'
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                    style={{ backgroundColor: themeConfig.primary }}
                  >
                    Confirmar e Entrar na Fila
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const msg = `Olá, ${professional.name}! Gostaria de saber se você tem previsão de encaixe para o dia ${formatDatePtBr(selectedDate)} (${selectedServices.map(s => s.name).join(' + ')}).`;
                      openWhatsAppSafely(professional.phone, msg);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    Solicitar Previsão de Encaixe no WhatsApp
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: RESOLUÇÃO DE CONFLITO DE HORÁRIO (ENCAIXE / DIVISÃO) */}
      {/* ========================================================================= */}
      {conflictModalSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 text-[#2D2D2A] dark:text-zinc-100 rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-[#E9E2D7] dark:border-zinc-800 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setConflictModalSlot(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 dark:text-zinc-300 dark:hover:text-stone-200 hover:bg-stone-100 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cabeçalho do Conflito */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                  <AlertTriangle className="w-5 h-5" />
                </span>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                    Conflito de Horário Detectado
                  </span>
                  <h3 className="serif text-xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                    Horário com Sobreposição
                  </h3>
                </div>
              </div>

              <div className="p-3.5 bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-xs space-y-1.5">
                <div className="flex justify-between font-medium text-rose-900 dark:text-rose-200">
                  <span>Horário pretendido:</span>
                  <strong className="font-mono">{conflictModalSlot.time} às {conflictModalSlot.endTime}</strong>
                </div>
                <div className="flex justify-between font-medium text-rose-900 dark:text-rose-200">
                  <span>Procedimento(s):</span>
                  <strong className="max-w-[220px] truncate text-right">{selectedServices.map(s => s.name).join(' + ')} ({formatMinutes(totalDurationMinutes)})</strong>
                </div>
                <div className="pt-1 text-rose-800 dark:text-rose-300 text-[11px] leading-relaxed border-t border-rose-200/60 dark:border-rose-900/40">
                  ⚠️ <strong>Motivo:</strong> {conflictModalSlot.conflictReason}
                </div>
              </div>
            </div>

            {/* Alternativas Disponíveis */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[#706B5F] dark:text-zinc-400">
                Como proceder para este agendamento:
              </p>

              {/* Opção 1: Verificar diretamente com a profissional no WhatsApp se dá para encaixar */}
              <div className="p-4 rounded-2xl border-2 border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30 space-y-2.5 shadow-2xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide bg-emerald-200/80 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
                      <MessageCircle className="w-3 h-3" /> Opção 1: Verificar Encaixe Manual
                    </span>
                    <h4 className="font-bold text-sm text-emerald-950 dark:text-emerald-100">
                      Verificar com {professional.name} no WhatsApp
                    </h4>
                  </div>
                </div>
                <p className="text-xs text-emerald-900/80 dark:text-emerald-200/90 leading-relaxed">
                  Como há um compromisso ou horário fechado na grade às 15h ou durante o intervalo, a marcação contínua de {formatMinutes(totalDurationMinutes)} não pode ser feita diretamente pelo site. Fale com a profissional para verificar se ela consegue flexibilizar a agenda e te encaixar.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const msg = `Olá, ${professional.name}! Gostaria de agendar ${selectedServices.map(s => s.name).join(' + ')} no dia ${formatDatePtBr(selectedDate)}. Como a duração total é de ${formatMinutes(totalDurationMinutes)} (das ${conflictModalSlot.time} às ${conflictModalSlot.endTime}), notei que há um choque de horário na agenda. Seria possível você verificar se tem previsão de encaixe ou consegue ajustar um horário para me atender?`;
                    openWhatsAppSafely(professional.phone, msg);
                  }}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  Solicitar Previsão de Encaixe no WhatsApp
                </button>
              </div>

              {/* Opção 2: Marcar em horários separados não seguidos */}
              <div className="p-4 rounded-2xl border-2 border-purple-200 dark:border-purple-800/80 bg-purple-50/60 dark:bg-purple-950/20 hover:border-purple-400 transition-all space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wide bg-purple-200/70 dark:bg-purple-900/60 px-2 py-0.5 rounded-md">
                      <Scissors className="w-3 h-3" /> Opção 2: Horários Separados
                    </span>
                    <h4 className="font-bold text-sm text-purple-950 dark:text-purple-100">
                      Marcar em Horários Separados (Não Seguidos)
                    </h4>
                  </div>
                </div>

                {selectedServices.length > 1 ? (
                  <>
                    <p className="text-xs text-purple-900/80 dark:text-purple-300/80 leading-relaxed">
                      Você selecionou {selectedServices.length} procedimentos. Em vez de 4h seguidas, você pode dividi-los em horários livres e separados no mesmo dia (ex: um de manhã e outro à tarde), garantindo sua vaga sem conflito na agenda.
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenSplitModal}
                      className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Scissors className="w-4 h-4" />
                      Distribuir Serviços em Horários Separados
                    </button>
                  </>
                ) : (
                  <p className="text-xs text-purple-900/80 dark:text-purple-300/80 leading-relaxed">
                    Este é um procedimento único de longa duração ({formatMinutes(totalDurationMinutes)}) e requer um bloco contínuo de atendimento. Por favor, verifique com a profissional no WhatsApp acima ou escolha outro horário/dia em que a agenda esteja 100% livre.
                  </p>
                )}
              </div>

              {/* Opção 3: Fila de Espera */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setConflictModalSlot(null);
                    setIsWaitlistModalOpen(true);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl border border-stone-300 dark:border-zinc-700 hover:bg-stone-50 dark:bg-zinc-800 dark:hover:bg-zinc-800 text-xs font-semibold text-[#5A5A40] dark:text-zinc-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Entrar na Fila de Espera (Avisar se surgir desistência)
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setConflictModalSlot(null)}
                className="w-full py-2 text-center text-xs font-medium text-[#706B5F] dark:text-zinc-400 hover:text-[#2D2D2A] dark:hover:text-zinc-100 dark:text-zinc-100 dark:hover:text-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 cursor-pointer"
              >
                Voltar e escolher outro horário livre
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DIVIDIR SERVIÇOS EM HORÁRIOS DISTINTOS */}
      {/* ========================================================================= */}
      {isSplitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 text-[#2D2D2A] dark:text-zinc-100 rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-[#E9E2D7] dark:border-zinc-800 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsSplitModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 dark:text-zinc-300 dark:hover:text-stone-200 hover:bg-stone-100 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cabeçalho */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                  <Scissors className="w-5 h-5" />
                </span>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                    Divisão de Procedimentos
                  </span>
                  <h3 className="serif text-xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                    Agendar em Dias ou Horários Distintos
                  </h3>
                </div>
              </div>
              <p className="text-xs text-[#706B5F] dark:text-zinc-400 leading-relaxed">
                Você pode agendar cada procedimento em <strong>horários diferentes no mesmo dia</strong> ou até em <strong>dias distintos</strong> conforme a disponibilidade da agenda.
              </p>
            </div>

            {/* Alerta de erro da validação de divisão */}
            {splitErrorMessage && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{splitErrorMessage}</span>
              </div>
            )}

            {/* Lista dos Procedimentos e Seletor de Dia e Horários */}
            <div className="space-y-3.5">
              {selectedServices.map((service, index) => {
                const sel = splitSelections[service.id] || { 
                  date: selectedDate || (availableDays.find(d => d.isAvailable)?.dateStr) || '', 
                  time: '' 
                };
                const currentDate = sel.date || selectedDate || (availableDays.find(d => d.isAvailable)?.dateStr) || '';
                const currentTime = sel.time || '';

                // Calcula intervalos de outros procedimentos atribuídos para a MESMA data
                const otherIntervalsOnSameDate: { startMin: number; endMin: number }[] = [];
                selectedServices.forEach(other => {
                  if (other.id !== service.id) {
                    const otherSel = splitSelections[other.id];
                    if (otherSel && (otherSel.date || selectedDate) === currentDate && otherSel.time) {
                      const [oH, oM] = otherSel.time.split(':').map(Number);
                      const oStart = (oH || 0) * 60 + (oM || 0);
                      const oEnd = oStart + other.durationMinutes;
                      otherIntervalsOnSameDate.push({ startMin: oStart, endMin: oEnd });
                    }
                  }
                });

                const availableForThis = getAvailableSlotsForDurationAndDate(
                  service.durationMinutes, 
                  currentDate, 
                  otherIntervalsOnSameDate
                );

                return (
                  <div
                    key={service.id}
                    className="p-4 rounded-2xl border border-stone-200 dark:border-zinc-800 bg-[#FDFBF7] dark:bg-zinc-850 space-y-3 shadow-2xs"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                          Procedimento {index + 1} de {selectedServices.length}
                        </span>
                        <h4 className="font-bold text-sm text-[#2D2D2A] dark:text-zinc-100">
                          {service.name}
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-stone-700 dark:text-zinc-300 block">
                          {formatMinutes(service.durationMinutes)}
                        </span>
                        <span className="text-xs font-semibold text-stone-500 dark:text-zinc-500">
                          R$ {service.price.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* 1. SELEÇÃO DO DIA */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-[#706B5F] dark:text-zinc-400">
                          📅 Escolher dia:
                        </label>
                        <select
                          value={currentDate}
                          onChange={(e) => {
                            const newDate = e.target.value;
                            setSplitSelections(prev => ({
                              ...prev,
                              [service.id]: { date: newDate, time: '' }
                            }));
                            setSplitErrorMessage(null);
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium text-[#2D2D2A] dark:text-zinc-100 outline-none focus:ring-2 focus:ring-[#5A5A40] dark:ring-zinc-600"
                        >
                          {availableDays.filter(d => d.isAvailable).map(day => (
                            <option key={day.dateStr} value={day.dateStr}>
                              {formatDatePtBr(day.dateStr)} ({day.dayName})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 2. SELEÇÃO DO HORÁRIO */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-[#706B5F] dark:text-zinc-400">
                          ⏰ Horário livre disponível:
                        </label>
                        {availableForThis.length === 0 ? (
                          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-2xs text-amber-900 dark:text-amber-200">
                            Sem horário livre neste dia.
                          </div>
                        ) : (
                          <select
                            value={currentTime}
                            onChange={(e) => {
                              const newTime = e.target.value;
                              setSplitSelections(prev => ({
                                ...prev,
                                [service.id]: { date: currentDate, time: newTime }
                              }));
                              setSplitErrorMessage(null);
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-[#2D2D2A] dark:text-zinc-100 outline-none focus:ring-2 focus:ring-[#5A5A40] dark:ring-zinc-600"
                          >
                            <option value="">Selecione o horário...</option>
                            {availableForThis.map(slot => (
                              <option key={slot.time} value={slot.time}>
                                {slot.time} às {slot.endTime} (Vago)
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>

                    {/* Previsão de encaixe se o dia não tiver horário */}
                    {availableForThis.length === 0 && (
                      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
                        <p className="text-[11px]">
                          ⚠️ Nenhum horário contínuo de {formatMinutes(service.durationMinutes)} disponível em <strong>{formatDatePtBr(currentDate)}</strong>.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            const msg = `Olá, ${professional.name}! Gostaria de agendar o procedimento ${service.name} (${formatMinutes(service.durationMinutes)}) para o dia ${formatDatePtBr(currentDate)}, mas não encontrei horário vago na grade online. Você teria alguma previsão de encaixe para mim neste dia?`;
                            openWhatsAppSafely(professional.phone, msg);
                          }}
                          className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Pedir Previsão de Encaixe no WhatsApp
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Botão de Confirmação da Divisão */}
            <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={handleConfirmSplitSchedule}
                className="w-full py-3.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Confirmar Divisão e Avançar para Confirmação
              </button>
              <button
                type="button"
                onClick={() => setIsSplitModalOpen(false)}
                className="w-full py-2 text-center text-xs font-medium text-[#706B5F] dark:text-zinc-400 hover:text-[#2D2D2A] dark:hover:text-zinc-100 dark:text-zinc-100 dark:hover:text-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 cursor-pointer"
              >
                Cancelar divisão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL LIGHTBOX: FOTO REAL DO PROCEDIMENTO COM AÇÃO DIRETA DE AGENDAR */}
      {/* ========================================================================= */}
      {selectedPhotoForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-white dark:bg-zinc-900 border border-[#E9E2D7] dark:border-zinc-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl space-y-0">
            {/* Imagem Grande */}
            <div className="relative w-full aspect-4/3 bg-black">
              <Image
                src={selectedPhotoForModal.url}
                alt={selectedPhotoForModal.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 512px"
                priority
                referrerPolicy="no-referrer"
              />
              <button
                type="button"
                onClick={() => setSelectedPhotoForModal(null)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 text-white hover:bg-black flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer z-10"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo & Ação */}
            <div className="p-5 sm:p-6 space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Trabalho Real Realizado
                  </span>
                  {selectedPhotoForModal.serviceName && (
                    <span className="text-xs font-semibold text-[#706B5F] dark:text-zinc-400">
                      • {selectedPhotoForModal.serviceName}
                    </span>
                  )}
                </div>
                <h3 className="serif text-xl font-bold text-[#2D2D2A] dark:text-zinc-100 mt-1.5">
                  {selectedPhotoForModal.title}
                </h3>
                {selectedPhotoForModal.description && (
                  <p className="text-sm text-[#706B5F] dark:text-zinc-400 mt-1.5 leading-relaxed">
                    {selectedPhotoForModal.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPhotoForModal(null)}
                  className="flex-1 py-3 px-4 rounded-xl border border-stone-200 dark:border-zinc-700 text-xs sm:text-sm font-semibold text-stone-700 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectServiceFromPhoto(selectedPhotoForModal)}
                  className="flex-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  style={{ backgroundColor: themeConfig.primary }}
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  Agendar este Procedimento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
