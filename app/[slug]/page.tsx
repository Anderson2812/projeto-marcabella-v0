'use client';

import React, { use, useState, useRef, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/use-app-store';
import { findBestImageForService } from '@/lib/service-images';
import { useLockBodyScroll } from '@/lib/use-lock-body-scroll';
import { ServiceItem, Booking } from '@/types';
import { 
  AlertTriangle, 
  ArrowLeft, 
  ArrowRight, 
  Calendar, 
  Clock, 
  MapPin, 
  MessageCircle, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Check, 
  CheckCircle2, 
  Copy, 
  Images, 
  X, 
  Search, 
  User, 
  Phone, 
  CreditCard, 
  QrCode, 
  CalendarCheck, 
  HelpCircle, 
  Scissors, 
  Split, 
  Info, 
  Sun, 
  Sunset, 
  Moon,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Zap,
  RotateCcw,
  LayoutGrid,
  Instagram,
  ShieldCheck,
  Palmtree,
  Users
} from 'lucide-react';
import { openWhatsAppSafely } from '@/lib/validation-utils';
import { formatWorkingDaysSummary } from '@/lib/calendar-utils';
import { formatDatePtBr, formatPhoneMask, isValidWhatsApp } from '@/lib/whatsapp-utils';
import { getCleanCardPrice, INITIAL_PROFESSIONALS } from '@/lib/data-store';

const ClientBookingLookupModal = dynamic(() => import('@/components/ClientBookingLookupModal'), {
  ssr: false
});

interface PageProps {
  params: Promise<{ slug: string }>;
}

function getInstagramHref(_instagram?: string): string {
  return 'https://www.instagram.com';
}

function getInstagramLabel(_instagram?: string): string {
  return 'Instagram';
}

export default function PublicSchedulePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const router = useRouter();
  const { 
    getProfessionalBySlug, 
    professionals, 
    getServicesForProf, 
    getAvailabilityForProf,
    bookings,
    createBooking,
    holdSlot,
    releaseSlotHold,
    isSlotHeldByOther,
    getHeldSlotsForDay
  } = useAppStore();

  // Se o usuário acessar a URL antiga, atualiza suavemente para o novo link oficial
  useEffect(() => {
    if (!slug) return;
    const clean = slug.toLowerCase().trim();
    if (clean === 'camilasilva-marcabella' || clean === 'camilasilva' || clean === 'marcabella') {
      router.replace('/bella-beauty');
    }
  }, [slug, router]);

  const professional = getProfessionalBySlug(slug);

  // Estados do fluxo de agendamento em card simples
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('any');
  const [selectedServices, setSelectedServices] = useState<ServiceItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedEndTime, setSelectedEndTime] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [paymentChoice, setPaymentChoice] = useState<'deposit_pix' | 'full_pix' | 'pay_on_arrival'>('pay_on_arrival');
  const [formError, setFormError] = useState<string | null>(null);

  // Reseta o carrinho de serviços quando a cliente troca de URL (profissional diferente)
  useEffect(() => {
    setStep(1);
    setSelectedStaffId('any');
    setSelectedServices([]);
    setSelectedDate('');
    setSelectedTime('');
    setPaymentChoice('pay_on_arrival');
    setFormError(null);
  }, [slug]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [isPixCopied, setIsPixCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Controle de Fila e Reserva de Horário Temporária (Lock de Concorrência)
  const [holdExpiresAt, setHoldExpiresAt] = useState<number | null>(null);
  const [holdRemainingSeconds, setHoldRemainingSeconds] = useState<number | null>(null);
  const [holdConflictError, setHoldConflictError] = useState<string | null>(null);

  // Funcionalidade de Dividir Horário (quando mais de 1 procedimento for selecionado)
  const [isSplitSchedule, setIsSplitSchedule] = useState(false);
  const [splitNotes, setSplitNotes] = useState('');
  const [splitActiveIndex, setSplitActiveIndex] = useState<number>(0);
  const [splitSelections, setSplitSelections] = useState<{
    serviceId: string;
    serviceName: string;
    durationMinutes: number;
    date: string;
    time: string;
    endTime: string;
  }[]>([]);

  // Funcionalidade de Pedir Encaixe
  const [isEncaixeModalOpen, setIsEncaixeModalOpen] = useState(false);
  const [encaixePeriod, setEncaixePeriod] = useState<'manha' | 'tarde' | 'noite' | 'qualquer'>('qualquer');
  const [encaixeDate, setEncaixeDate] = useState('');
  const [encaixeObservation, setEncaixeObservation] = useState('');
  const [encaixeName, setEncaixeName] = useState('');
  const [encaixePhone, setEncaixePhone] = useState('');
  const [encaixeSelectedServiceIds, setEncaixeSelectedServiceIds] = useState<string[]>([]);
  const [isSplitEncaixe, setIsSplitEncaixe] = useState(false);
  const [splitEncaixePrefs, setSplitEncaixePrefs] = useState<Record<string, { date: string; period: 'manha' | 'tarde' | 'noite' | 'qualquer' }>>({});
  const [encaixeError, setEncaixeError] = useState<string | null>(null);
  const [encaixeSuccess, setEncaixeSuccess] = useState(false);

  const getProcedureEncaixePref = (serviceId: string) => {
    return splitEncaixePrefs[serviceId] || {
      date: encaixeDate || activeDate || new Date().toISOString().split('T')[0],
      period: encaixePeriod
    };
  };

  const updateProcedureEncaixePref = (serviceId: string, field: 'date' | 'period', value: string) => {
    setSplitEncaixePrefs(prev => ({
      ...prev,
      [serviceId]: {
        ...(prev[serviceId] || {
          date: encaixeDate || activeDate || new Date().toISOString().split('T')[0],
          period: encaixePeriod
        }),
        [field]: value
      }
    }));
  };

  // Galeria e Carrossel de fotos (responsivo: lateral no desktop / carrossel no topo no mobile)
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Lightbox para fotos dos procedimentos com zoom interativo
  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean;
    photos: { url: string; name?: string; title?: string; subtitle?: string; price?: number }[];
    serviceName: string;
    currentIndex: number;
    zoom: number;
  }>({
    isOpen: false,
    photos: [],
    serviceName: '',
    currentIndex: 0,
    zoom: 1,
  });

  // Trava o scroll do body APENAS quando modais com backdrop fixo estiverem abertos
  const isAnyModalOpen = isSearchModalOpen || isEncaixeModalOpen || lightboxState.isOpen;
  useLockBodyScroll(isAnyModalOpen);

  const datesScrollRef = useRef<HTMLDivElement>(null);
  const bookingCardRef = useRef<HTMLDivElement>(null);

  // Rolagem suave para o topo do card de agendamento sempre que o passo mudar
  useEffect(() => {
    if (bookingCardRef.current && step > 1) {
      bookingCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [step]);

  const services = professional ? getServicesForProf(professional.id) : [];
  const availability = professional ? getAvailabilityForProf(professional.id) : undefined;
  const primaryAvatar = professional?.avatarUrl || professional?.photoUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80';
  const workingSummary = formatWorkingDaysSummary(availability);

  // Valores somados
  const totalPricePix = useMemo(() => {
    return selectedServices.reduce((acc, s) => acc + s.price, 0);
  }, [selectedServices]);

  // Cartão com valores cheios e arredondados (ex: 55, 75, 80, 120, 170, 200, etc.)
  const totalPriceCard = useMemo(() => {
    return selectedServices.reduce((acc, s) => {
      const cardVal = getCleanCardPrice(s.price);
      return acc + cardVal;
    }, 0);
  }, [selectedServices]);

  const totalDurationMinutes = useMemo(() => {
    return selectedServices.reduce((acc, s) => acc + s.durationMinutes, 0);
  }, [selectedServices]);

  const formattedTotalDuration = useMemo(() => {
    if (totalDurationMinutes <= 0) return '0 min';
    const h = Math.floor(totalDurationMinutes / 60);
    const m = totalDurationMinutes % 60;
    if (h > 0 && m > 0) return `${h}h ${m}min (${totalDurationMinutes} min)`;
    if (h > 0) return `${h}h (${totalDurationMinutes} min)`;
    return `${m} min`;
  }, [totalDurationMinutes]);

  const acceptsCreditCard = useMemo(() => {
    return (professional?.acceptedPaymentMethods || ['pix', 'credit_card', 'cash']).includes('credit_card');
  }, [professional?.acceptedPaymentMethods]);

  const acceptsCreditInstallments = useMemo(() => {
    return (professional?.acceptedPaymentMethods || []).includes('credit_installments');
  }, [professional?.acceptedPaymentMethods]);

  const acceptsAnyCard = acceptsCreditCard || acceptsCreditInstallments;

  const acceptsPixOrCash = useMemo(() => {
    return (professional?.acceptedPaymentMethods || ['pix', 'credit_card', 'cash']).some(m => m === 'pix' || m === 'cash');
  }, [professional?.acceptedPaymentMethods]);

  const hasDepositRequired = useMemo(() => {
    return selectedServices.some(s => s.requiresDeposit);
  }, [selectedServices]);

  // O sinal obrigatório é estritamente via Pix
  const depositAmountPix = useMemo(() => {
    if (!hasDepositRequired) return 0;
    return selectedServices.reduce((acc, s) => {
      if (!s.requiresDeposit) return acc;
      if (s.depositType === 'percentage') {
        return acc + Math.round((s.price * (s.depositValue || 30)) / 100);
      }
      return acc + (s.depositValue || 30);
    }, 0);
  }, [selectedServices, hasDepositRequired]);

  // Escolha efetiva de pagamento (se há sinal obrigatório, a opção é pagar sinal via Pix ou pagar o valor total)
  const effectivePaymentChoice: 'deposit_pix' | 'full_pix' | 'pay_on_arrival' = useMemo(() => {
    if (hasDepositRequired) {
      return paymentChoice === 'full_pix' ? 'full_pix' : 'deposit_pix';
    }
    return paymentChoice === 'full_pix' ? 'full_pix' : 'pay_on_arrival';
  }, [hasDepositRequired, paymentChoice]);

  // Equipe de Colaboradoras Ativas do Salão/Espaço
  const activeStaffList = useMemo(() => {
    if (!professional) return [];
    const rawList = (professional.staffMembers && professional.staffMembers.length > 0)
      ? professional.staffMembers
      : (INITIAL_PROFESSIONALS.find(p => p.id === professional.id)?.staffMembers || INITIAL_PROFESSIONALS[0]?.staffMembers || []);
    return rawList.filter(s => s.active !== false);
  }, [professional?.staffMembers, professional?.id]);

  const hasMultipleStaff = activeStaffList.length > 0;
  const selectedStaffMember = useMemo(() => {
    return activeStaffList.find(s => s.id === selectedStaffId);
  }, [activeStaffList, selectedStaffId]);

  const effectiveAvailability = useMemo(() => {
    if (selectedStaffMember && selectedStaffMember.useCustomSchedule && selectedStaffMember.customSchedule) {
      return {
        ...availability,
        ...selectedStaffMember.customSchedule,
        blockedDates: availability?.blockedDates || [],
        bufferMinutes: availability?.bufferMinutes || 15
      };
    }
    return availability;
  }, [availability, selectedStaffMember]);

  // Informações e Período de Férias/Recesso da Profissional
  const vacation = professional?.vacation;
  const isVacationActive = Boolean(
    vacation && vacation.isActive && vacation.startDate && vacation.endDate
  );

  // Filtro de serviços por busca e por profissional selecionada (se houver restrição)
  const filteredServices = useMemo(() => {
    let list = services;
    if (selectedStaffId !== 'any' && selectedStaffMember?.assignedServiceIds && selectedStaffMember.assignedServiceIds.length > 0) {
      const assignedIds = selectedStaffMember.assignedServiceIds;
      list = list.filter(s => assignedIds.includes(s.id));
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(s => s.name.toLowerCase().includes(q) || (s.description && s.description.toLowerCase().includes(q)));
  }, [services, searchQuery, selectedStaffId, selectedStaffMember]);

  // Separação em colunas: Procedimentos Individuais vs. Combos & Pacotes
  const individualServices = useMemo(() => {
    return filteredServices.filter(s => !s.isCombo && !(s.comboServiceNames && s.comboServiceNames.length > 1) && !s.name.toLowerCase().includes('combo') && !s.name.includes(' + '));
  }, [filteredServices]);

  const comboServices = useMemo(() => {
    return filteredServices.filter(s => s.isCombo || (s.comboServiceNames && s.comboServiceNames.length > 1) || s.name.toLowerCase().includes('combo') || s.name.includes(' + '));
  }, [filteredServices]);

  // Verifica se é elegível para divisão de horários (múltiplos procedimentos OU um combo com etapas)
  const canSplitSchedule = useMemo(() => {
    if (selectedServices.length > 1) return true;
    if (selectedServices.length === 1) {
      const s = selectedServices[0];
      return Boolean(s.isCombo || (s.comboServiceNames && s.comboServiceNames.length > 1) || s.name.toLowerCase().includes('combo') || s.name.includes(' + '));
    }
    return false;
  }, [selectedServices]);

  // Desmembra os procedimentos selecionados em unidades agendáveis individuais
  const schedulableUnits = useMemo(() => {
    const units: {
      id: string;
      serviceId: string;
      serviceName: string;
      durationMinutes: number;
      parentServiceName?: string;
      isComboPart?: boolean;
    }[] = [];

    selectedServices.forEach(s => {
      const isCombo = s.isCombo || (s.comboServiceNames && s.comboServiceNames.length > 1) || s.name.toLowerCase().includes('combo') || s.name.includes(' + ');
      
      let subNames: string[] | null = null;
      if (s.comboServiceNames && s.comboServiceNames.length > 1) {
        subNames = s.comboServiceNames;
      } else if (s.name.includes(' + ')) {
        subNames = s.name.split(' + ').map(x => x.trim()).filter(Boolean);
      } else if (isCombo && s.description && s.description.includes('+')) {
        subNames = s.description.split('+').map(x => x.trim()).filter(Boolean);
      }

      if (isCombo && subNames && subNames.length > 1) {
        const avgDuration = Math.max(30, Math.round((s.durationMinutes / subNames.length) / 15) * 15);
        subNames.forEach((subName, subIdx) => {
          const isLast = subIdx === subNames.length - 1;
          const dur = isLast ? (s.durationMinutes - avgDuration * (subNames.length - 1) || avgDuration) : avgDuration;
          units.push({
            id: `${s.id}-sub-${subIdx}`,
            serviceId: s.id,
            serviceName: subName.toLowerCase().includes(s.name.toLowerCase()) ? subName : `${subName} (Combo ${s.name})`,
            durationMinutes: Math.max(15, dur),
            parentServiceName: s.name,
            isComboPart: true
          });
        });
      } else {
        units.push({
          id: s.id,
          serviceId: s.id,
          serviceName: s.name,
          durationMinutes: s.durationMinutes,
          parentServiceName: s.name,
          isComboPart: false
        });
      }
    });

    return units;
  }, [selectedServices]);

  // Mídia ativa estruturada para a vitrine/carrossel (com nomes reais e colagens de combos)
  const activeShowcaseItems = useMemo(() => {
    const list: {
      id: string;
      url: string;
      name: string;
      title: string;
      badge?: string;
      subtitle?: string;
      category?: string;
      price?: number;
      durationMinutes?: number;
      isCombo?: boolean;
      comboImages?: string[];
      comboNames?: string[];
    }[] = [];

    const profCategory = professional?.category || 'beleza';
    const profName = professional?.name || 'Espaço de Beleza';

    // Prioriza fotos dos serviços selecionados
    if (selectedServices.length > 0) {
      // Se selecionou múltiplos procedimentos, cria no topo uma colagem de combo exclusiva
      if (selectedServices.length > 1) {
        const comboImgs: string[] = [];
        selectedServices.forEach(s => {
          const img = s.imageUrl || (s.images && s.images[0]) || findBestImageForService(s.name, profCategory);
          if (img && !comboImgs.includes(img)) comboImgs.push(img);
        });

        list.push({
          id: 'selected-combo-collage',
          url: comboImgs[0] || findBestImageForService(profCategory, profCategory),
          name: selectedServices.map(s => s.name).join(' + '),
          title: selectedServices.map(s => s.name).join(' + '),
          badge: 'Combo Selecionado',
          subtitle: `${selectedServices.length} procedimentos inclusos no combo`,
          durationMinutes: totalDurationMinutes,
          isCombo: true,
          comboImages: comboImgs,
          comboNames: selectedServices.map(s => s.name)
        });
      }

      // Adiciona cada serviço selecionado individualmente com seu nome real
      selectedServices.forEach(s => {
        const img = s.imageUrl || (s.images && s.images[0]) || findBestImageForService(s.name, profCategory);
        list.push({
          id: `sel-${s.id}`,
          url: img,
          name: s.name,
          title: s.name,
          badge: 'Procedimento Selecionado',
          subtitle: s.description || `${s.durationMinutes} min de atendimento`,
          category: profCategory,
          durationMinutes: s.durationMinutes,
          isCombo: s.isCombo || s.name.toLowerCase().includes('combo')
        });
      });
    }

    // Adiciona todos os serviços cadastrados da profissional com seus nomes reais e colagens
    services.forEach(s => {
      const alreadyInList = list.some(item => item.id === `sel-${s.id}` || item.name === s.name);
      if (!alreadyInList) {
        const img = s.imageUrl || (s.images && s.images[0]) || findBestImageForService(s.name, profCategory);
        const isCombo = s.isCombo || s.name.toLowerCase().includes('combo') || (s.comboServiceNames && s.comboServiceNames.length > 1);
        
        let comboImgs: string[] | undefined;
        let comboNames: string[] | undefined;
        if (isCombo) {
          if (s.images && s.images.length > 1) {
            comboImgs = s.images;
          } else if (s.comboServiceNames && s.comboServiceNames.length > 0) {
            comboImgs = s.comboServiceNames.map(subName => findBestImageForService(subName, profCategory));
            comboNames = s.comboServiceNames;
          }
        }

        list.push({
          id: `service-${s.id}`,
          url: img,
          name: s.name,
          title: s.name,
          badge: isCombo ? 'Combo Especial' : 'Procedimento',
          subtitle: s.description || `${s.durationMinutes} min de atendimento`,
          category: profCategory,
          durationMinutes: s.durationMinutes,
          isCombo: !!isCombo,
          comboImages: comboImgs && comboImgs.length > 1 ? comboImgs : undefined,
          comboNames: comboNames
        });
      }
    });

    // Adiciona fotos do portfólio da profissional
    if (professional?.portfolioPhotos && professional.portfolioPhotos.length > 0) {
      professional.portfolioPhotos.forEach((p, idx) => {
        if (p.url && !list.some(item => item.url === p.url)) {
          list.push({
            id: `portfolio-${idx}`,
            url: p.url,
            name: p.title || `Resultado • ${profName}`,
            title: p.title || `Resultado • ${profName}`,
            badge: 'Portfólio / Resultado',
            subtitle: p.description || profName,
            category: profCategory
          });
        }
      });
    }

    if (list.length === 0) {
      list.push({
        id: 'default-showcase',
        url: findBestImageForService(profCategory, profCategory),
        name: profName,
        title: profName,
        badge: 'Espaço & Atendimento',
        category: profCategory
      });
    }

    return list;
  }, [selectedServices, professional, services, totalPricePix, totalDurationMinutes]);

  // Lista simples de URLs para compatibilidade
  const activeShowcasePhotos = useMemo(() => {
    return activeShowcaseItems.map(item => item.url);
  }, [activeShowcaseItems]);

  // Geração dos próximos dias úteis de atendimento (25 dias)
  const availableDays = useMemo(() => {
    const activeDays = effectiveAvailability?.activeDays || [1, 2, 3, 4, 5, 6];
    const blockedDates = effectiveAvailability?.blockedDates || [];
    const list: { dateStr: string; dayName: string; dayNumber: string; monthName: string; isToday: boolean }[] = [];

    const now = new Date();
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    for (let i = 0; i < 25; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const dayOfWeek = d.getDay();
      if (!activeDays.includes(dayOfWeek)) continue;
      if (blockedDates.includes(dateStr)) continue;

      // Se a profissional está em período de férias, bloqueia as datas das férias
      if (isVacationActive && vacation?.startDate && vacation?.endDate) {
        if (dateStr >= vacation.startDate && dateStr <= vacation.endDate) {
          continue;
        }
      }

      list.push({
        dateStr,
        dayName: i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : dayNames[dayOfWeek],
        dayNumber: dd,
        monthName: monthNames[d.getMonth()],
        isToday: i === 0
      });
    }

    return list;
  }, [effectiveAvailability, isVacationActive, vacation]);

  // Data ativa para agendamento
  const activeDate = selectedDate || (availableDays[0]?.dateStr || '');

  // Helper para cálculo dinâmico de horários livres por duração
  const calculateFreeSlotsForDuration = (dateStr: string, durationMin: number) => {
    if (!dateStr || durationMin <= 0) return [];

    const [startH, startM] = (effectiveAvailability?.startTime || '08:00').split(':').map(Number);
    const [endH, endM] = (effectiveAvailability?.endTime || '19:00').split(':').map(Number);
    const interval = effectiveAvailability?.intervalMinutes || 30;
    const buffer = effectiveAvailability?.bufferMinutes ?? 15;

    const startMin = (startH || 8) * 60 + (startM || 0);
    const closingMin = (endH || 19) * 60 + (endM || 0);

    let lunchStartMin = -1;
    let lunchEndMin = -1;
    if (effectiveAvailability?.hasLunchBreak && effectiveAvailability?.lunchStart && effectiveAvailability?.lunchEnd) {
      const [lsH, lsM] = effectiveAvailability?.lunchStart.split(':').map(Number);
      const [leH, leM] = effectiveAvailability?.lunchEnd.split(':').map(Number);
      lunchStartMin = (lsH || 12) * 60 + (lsM || 0);
      lunchEndMin = (leH || 13) * 60 + (leM || 0);
    }

    const dayBookings = bookings.filter(b => {
      if (b.status === 'cancelled') return false;
      const isProf = professional && (b.professionalId === professional.id || (b.professionalSlug && b.professionalSlug === professional.slug));
      if (!isProf || b.date !== dateStr) return false;

      // Se foi selecionada uma profissional específica da equipe, valida concorrência apenas com a agenda dela
      if (selectedStaffId && selectedStaffId !== 'any') {
        const bStaffId = b.staffMemberId || b.staffId;
        // Se o agendamento pertence a outra profissional da equipe, não conflita!
        if (bStaffId && bStaffId !== selectedStaffId) {
          return false;
        }
      }

      return true;
    });

    const blockedSlots = (effectiveAvailability?.blockedTimeSlots || []).filter(bl => bl.date === dateStr);

    const now = new Date();
    const isToday = dateStr === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const nowMin = isToday ? now.getHours() * 60 + now.getMinutes() : -1;

    const available: { time: string; endTime: string }[] = [];

    for (let cur = startMin; cur + durationMin <= closingMin; cur += interval) {
      const curH = Math.floor(cur / 60);
      const curM = cur % 60;
      const timeStr = `${String(curH).padStart(2, '0')}:${String(curM).padStart(2, '0')}`;

      const finishMin = cur + durationMin;
      const finishH = Math.floor(finishMin / 60);
      const finishM = finishMin % 60;
      const endTimeStr = `${String(finishH).padStart(2, '0')}:${String(finishM).padStart(2, '0')}`;

      let isBooked = false;

      // Se for hoje e já tiver passado ou estiver muito próximo
      if (isToday && cur <= nowMin + 20) {
        isBooked = true;
      }

      // Intervalo de almoço
      if (!isBooked && lunchStartMin >= 0 && lunchEndMin >= 0) {
        if (cur < lunchEndMin && finishMin > lunchStartMin) {
          isBooked = true;
        }
      }

      // Conflito com agendamentos existentes
      if (!isBooked && dayBookings.length > 0) {
        const hasConflict = dayBookings.some(b => {
          if (!b.time) return false;
          const [bStartH, bStartM] = b.time.split(':').map(Number);
          const bStart = (bStartH || 0) * 60 + (bStartM || 0);
          let bEnd = bStart + (b.serviceDuration || 60);
          if (b.endTime && b.endTime.includes(':')) {
            const [bEndH, bEndM] = b.endTime.split(':').map(Number);
            bEnd = Math.max(bEnd, (bEndH || 0) * 60 + (bEndM || 0));
          }
          return cur < (bEnd + buffer) && (finishMin + buffer) > bStart;
        });
        if (hasConflict) isBooked = true;
      }

      // Conflito com bloqueios pontuais
      if (!isBooked && blockedSlots.length > 0) {
        const hasBlock = blockedSlots.some(bl => {
          const [blStartH, blStartM] = bl.startTime.split(':').map(Number);
          const [blEndH, blEndM] = bl.endTime.split(':').map(Number);
          const blStart = (blStartH || 0) * 60 + (blStartM || 0);
          const blEnd = (blEndH || 0) * 60 + (blEndM || 0);
          return cur < blEnd && finishMin > blStart;
        });
        if (hasBlock) isBooked = true;
      }

      // Fila / Reserva temporária de outro cliente (hold ativo)
      if (!isBooked && professional && isSlotHeldByOther(professional.id, dateStr, timeStr)) {
        isBooked = true;
      }

      // Inclui APENAS se estiver LIVRE!
      if (!isBooked) {
        available.push({
          time: timeStr,
          endTime: endTimeStr
        });
      }
    }

    return available;
  };

  // Horários disponíveis para a data selecionada (quando agendamento em bloco)
  const freeTimeSlots = useMemo(() => {
    return calculateFreeSlotsForDuration(activeDate, totalDurationMinutes);
  }, [activeDate, totalDurationMinutes, effectiveAvailability, bookings, professional, isSlotHeldByOther]);

  // Timer de retenção temporária do horário na fila durante a etapa de confirmação dos dados
  useEffect(() => {
    if (step !== 3 || !holdExpiresAt) {
      setHoldRemainingSeconds(null);
      return;
    }

    const updateRemaining = () => {
      const remaining = Math.max(0, Math.floor((holdExpiresAt - Date.now()) / 1000));
      setHoldRemainingSeconds(remaining);
      if (remaining <= 0) {
        setHoldConflictError('Seu tempo de reserva temporária de 5 minutos expirou e o horário foi liberado para a fila. Por favor, selecione novamente.');
        setStep(2);
        setHoldExpiresAt(null);
      }
    };

    updateRemaining();
    const timer = setInterval(updateRemaining, 1000);
    return () => clearInterval(timer);
  }, [step, holdExpiresAt]);

  const toggleService = (service: ServiceItem) => {
    setSelectedServices(prev => {
      const exists = prev.some(s => s.id === service.id);
      let updated: ServiceItem[];
      if (exists) {
        updated = prev.filter(s => s.id !== service.id);
      } else {
        updated = [...prev, service];
      }
      return updated;
    });
    setSelectedTime('');
    setSelectedEndTime('');
    setSplitSelections([]);
    setSplitActiveIndex(0);
  };

  // Efeito para sincronizar as seleções divididas quando a divisão de horários é ativada (para múltiplos procedimentos ou combos)
  useEffect(() => {
    if (isSplitSchedule && canSplitSchedule && schedulableUnits.length > 0) {
      setSplitSelections(schedulableUnits.map(unit => ({
        serviceId: unit.id,
        serviceName: unit.serviceName,
        durationMinutes: unit.durationMinutes,
        date: activeDate,
        time: '',
        endTime: ''
      })));
      setSplitActiveIndex(0);
    } else if (!canSplitSchedule) {
      setIsSplitSchedule(false);
    }
  }, [isSplitSchedule, canSplitSchedule, schedulableUnits, activeDate]);

  const handleOpenLightbox = (
    items: { url: string; name?: string; title?: string; subtitle?: string; price?: number }[],
    serviceName: string,
    initialIndex: number
  ) => {
    setLightboxState({
      isOpen: true,
      photos: items,
      serviceName,
      currentIndex: initialIndex,
      zoom: 1,
    });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClientPhone(formatPhoneMask(e.target.value));
  };

  const handleEncaixePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEncaixePhone(formatPhoneMask(e.target.value));
  };

  const handleConfirmBooking = async () => {
    if (isSubmitting || !professional) return;
    setFormError(null);

    if (!clientName.trim() || clientName.trim().length < 3) {
      setFormError('Por favor, digite seu nome completo (mínimo 3 letras).');
      return;
    }
    if (!isValidWhatsApp(clientPhone)) {
      setFormError('Por favor, informe um WhatsApp válido com DDD (exemplo: (11) 98765-4321).');
      return;
    }

    if (selectedServices.length === 0) {
      setFormError('Selecione pelo menos um procedimento antes de confirmar.');
      return;
    }

    if (isSplitSchedule && canSplitSchedule) {
      const missingSlot = splitSelections.some(s => !s.date || !s.time);
      if (missingSlot) {
        setFormError('Por favor, defina a data e horário para cada um dos procedimentos divididos ou desmarque a opção de dividir.');
        return;
      }
    } else {
      if (!activeDate || !selectedTime) {
        setFormError('Selecione o procedimento, data e horário antes de confirmar.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const primaryService = selectedServices[0];
      const combinedServiceName = selectedServices.map(s => s.name).join(' + ');

      // Monta as observações agregando a divisão de horários caso ativada
      let finalNotes = clientNotes.trim();
      let bookingDate = activeDate;
      let bookingTime = selectedTime;
      let bookingEndTime = selectedEndTime;

      if (isSplitSchedule && splitSelections.length > 0) {
        const splitText = splitSelections.map((s, idx) => `${idx + 1}º ${s.serviceName} (${s.durationMinutes}min): ${formatDatePtBr(s.date)} às ${s.time}`).join(' | ');
        finalNotes = `[DIVISÃO DE HORÁRIOS]: ${splitText}${splitNotes.trim() ? ` (Obs: ${splitNotes.trim()})` : ''}${finalNotes ? ` | Obs Cliente: ${finalNotes}` : ''}`;
        bookingDate = splitSelections[0].date;
        bookingTime = splitSelections[0].time;
        bookingEndTime = splitSelections[0].endTime;
      }

      const isDepositPix = hasDepositRequired && effectivePaymentChoice === 'deposit_pix';
      const isFullPix = effectivePaymentChoice === 'full_pix';
      const isPayOnArrival = !hasDepositRequired && effectivePaymentChoice === 'pay_on_arrival';

      const remainingAfterDeposit = Math.max(0, totalPricePix - depositAmountPix);

      let paymentOptionStr: 'pay_on_arrival' | 'pay_pix_now' | 'pay_deposit_pix' | 'pay_full_pix' = 'pay_on_arrival';
      let depositReq = false;
      let depositAmt = 0;
      let paymentNotesPrefix = '';

      if (isPayOnArrival) {
        paymentOptionStr = 'pay_on_arrival';
        depositReq = false;
        depositAmt = 0;
        paymentNotesPrefix = '[PAGAMENTO: Pagar no dia do atendimento (Pix, Cartão ou Dinheiro)] ';
      } else if (isDepositPix) {
        paymentOptionStr = 'pay_deposit_pix';
        depositReq = true;
        depositAmt = depositAmountPix;
        paymentNotesPrefix = `[PAGAMENTO: Sinal Pix de R$ ${depositAmountPix.toFixed(2).replace('.', ',')} + Saldo de R$ ${remainingAfterDeposit.toFixed(2).replace('.', ',')} no atendimento] `;
      } else if (isFullPix) {
        paymentOptionStr = hasDepositRequired ? 'pay_full_pix' : 'pay_pix_now';
        depositReq = true;
        depositAmt = totalPricePix;
        paymentNotesPrefix = `[PAGAMENTO: Pagamento 100% Total Antecipado via Pix (R$ ${totalPricePix.toFixed(2).replace('.', ',')})] `;
      }

      const newBooking = createBooking({
        professionalId: professional.id,
        professionalSlug: professional.slug,
        professionalName: professional.name,
        professionalPhone: professional.phone,
        professionalAddress: professional.address,
        staffMemberId: selectedStaffId !== 'any' ? selectedStaffId : undefined,
        staffId: selectedStaffId !== 'any' ? selectedStaffId : undefined,
        staffMemberName: selectedStaffMember?.name,
        staffName: selectedStaffMember?.name,
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
        date: bookingDate,
        time: bookingTime,
        endTime: bookingEndTime,
        status: isPayOnArrival ? 'pending' : 'pending',
        totalPrice: totalPricePix,
        depositRequired: depositReq,
        depositAmount: depositAmt,
        depositPaid: false,
        depositStatus: depositReq ? 'pending' : undefined,
        notes: `${paymentNotesPrefix}${finalNotes}`.trim() || undefined,
        isSplitSchedule: isSplitSchedule,
        requiresSpecialApproval: isPayOnArrival || isSplitSchedule || hasDepositRequired,
        payOnArrival: isPayOnArrival,
        payFullInAdvance: isFullPix,
        paymentOption: paymentOptionStr
      });

      setConfirmedBooking(newBooking);
      setStep(4);
    } catch (err) {
      console.error(err);
      setFormError('Ocorreu um erro ao registrar sua reserva. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enviar Pedido de Encaixe para a Profissional
  const handleSendEncaixeRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!professional) return;
    setEncaixeError(null);

    if (!encaixeName.trim() || encaixeName.trim().length < 3) {
      setEncaixeError('Por favor, informe seu nome completo.');
      return;
    }
    if (!isValidWhatsApp(encaixePhone)) {
      setEncaixeError('Por favor, informe um WhatsApp válido com DDD.');
      return;
    }

    const periodLabels: Record<string, string> = {
      manha: 'Manhã (08:00 às 12:00)',
      tarde: 'Tarde (12:00 às 18:00)',
      noite: 'Noite (Após 18:00)',
      qualquer: 'Qualquer horário disponível'
    };

    let targetServicesToBook = selectedServices;
    if (targetServicesToBook.length === 0 && encaixeSelectedServiceIds.length > 0) {
      targetServicesToBook = services.filter(s => encaixeSelectedServiceIds.includes(s.id));
    }

    const targetService = targetServicesToBook.length > 0 
      ? targetServicesToBook.map(s => s.name).join(' + ')
      : 'Atendimento Geral';

    const preferredDateText = encaixeDate ? formatDatePtBr(encaixeDate) : (activeDate ? formatDatePtBr(activeDate) : 'O mais breve possível');

    let bookingNotes = `Período: ${periodLabels[encaixePeriod]} | Obs: ${encaixeObservation.trim() || 'Nenhuma'}`;
    let splitEncaixeSummary = '';

    if (isSplitEncaixe && targetServicesToBook.length > 1) {
      const splitLines = targetServicesToBook.map((s, idx) => {
        const pref = getProcedureEncaixePref(s.id);
        const dateFormatted = formatDatePtBr(pref.date);
        const periodName = periodLabels[pref.period] || pref.period;
        return `${idx + 1}. ${s.name} (${s.durationMinutes}min) ➔ ${dateFormatted} (${periodName.split(' ')[0]})`;
      });
      splitEncaixeSummary = splitLines.join(' | ');
      bookingNotes = `[ENCAIXE SEPARADO]: ${splitEncaixeSummary} | Obs: ${encaixeObservation.trim() || 'Nenhuma'}`;
    }

    // Cria agendamento pendente no sistema marcado como encaixe para análise da profissional
    try {
      createBooking({
        professionalId: professional.id,
        professionalSlug: professional.slug,
        professionalName: professional.name,
        professionalPhone: professional.phone,
        professionalAddress: professional.address,
        serviceId: targetServicesToBook[0]?.id || 'encaixe',
        serviceName: `[ENCAIXE SOLICITADO] ${targetService}`,
        serviceDuration: targetServicesToBook.reduce((acc, s) => acc + s.durationMinutes, 0) || 60,
        clientName: encaixeName.trim(),
        clientPhone: encaixePhone.trim(),
        date: encaixeDate || activeDate || new Date().toISOString().split('T')[0],
        time: 'Encaixe',
        status: 'pending',
        totalPrice: targetServicesToBook.reduce((acc, s) => acc + s.price, 0) || totalPricePix,
        depositRequired: hasDepositRequired,
        depositAmount: depositAmountPix,
        depositPaid: false,
        isEncaixe: true,
        requiresSpecialApproval: true,
        notes: bookingNotes
      });
    } catch (e) {
      console.error(e);
    }

    // Mensagem amigável e direta para o WhatsApp da profissional
    let msg = `Olá ${professional.name}! Gostaria de solicitar um *ENCAIXE DE HORÁRIO* na sua agenda:\n\n`;
    
    if (isSplitEncaixe && targetServicesToBook.length > 1) {
      msg += `✨ *Procedimento(s) com Preferência de Datas/Turnos:* \n`;
      targetServicesToBook.forEach((s) => {
        const pref = getProcedureEncaixePref(s.id);
        const dateFormatted = formatDatePtBr(pref.date);
        const periodName = periodLabels[pref.period] || pref.period;
        msg += `• *${s.name}* (${s.durationMinutes} min): 📅 ${dateFormatted} no turno da *${periodName.split(' ')[0]}*\n`;
      });
      msg += `\n`;
    } else {
      msg += `✨ *Procedimento:* ${targetService}\n`;
      msg += `📅 *Data Preferencial:* ${preferredDateText}\n`;
      msg += `🕒 *Período Desejado:* ${periodLabels[encaixePeriod]}\n\n`;
    }

    msg += `👤 *Cliente:* ${encaixeName.trim()}\n`;
    msg += `📱 *WhatsApp:* ${encaixePhone.trim()}\n`;
    if (encaixeObservation.trim()) {
      msg += `📝 *Observação:* ${encaixeObservation.trim()}\n`;
    }
    msg += `\nFico no aguardo da sua confirmação para verificar se consegue me atender! ✨`;

    const cleanPhone = (professional?.phone || '').replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const whatsappUrl = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(msg)}`;

    setEncaixeSuccess(true);
    setTimeout(() => {
      window.open(whatsappUrl, '_blank');
    }, 500);
  };

  const handleCopyPix = () => {
    if (!professional?.pixKey) return;
    navigator.clipboard.writeText(professional.pixKey);
    setIsPixCopied(true);
    setTimeout(() => setIsPixCopied(false), 3000);
  };

  const handleReset = () => {
    setSelectedServices([]);
    setSelectedTime('');
    setSelectedEndTime('');
    setClientName('');
    setClientPhone('');
    setClientNotes('');
    setIsSplitSchedule(false);
    setSplitNotes('');
    setConfirmedBooking(null);
    setFormError(null);
    setStep(1);
  };

  // Formata mensagem para WhatsApp de confirmação
  const getWhatsAppConfirmationUrl = () => {
    if (!confirmedBooking || !professional) return '';
    const dateFormatted = formatDatePtBr(confirmedBooking.date);
    let msg = `Olá ${professional.name}! Acabei de agendar pelo seu link Marcabella:\n\n`;
    if (confirmedBooking.staffMemberName || confirmedBooking.staffName) {
      msg += `👩‍💼 *Profissional / Atendente:* ${confirmedBooking.staffMemberName || confirmedBooking.staffName}\n`;
    }
    msg += `✨ *Procedimento:* ${confirmedBooking.serviceName}\n`;
    msg += `📅 *Data:* ${dateFormatted}\n`;
    msg += `⏰ *Horário:* ${confirmedBooking.time}\n`;
    msg += `👤 *Cliente:* ${confirmedBooking.clientName}\n`;
    msg += `📱 *WhatsApp:* ${confirmedBooking.clientPhone}\n`;
    msg += `💰 *Valor:* R$ ${confirmedBooking.totalPrice.toFixed(2).replace('.', ',')} (Pix) ou valor tabelado (Cartão)\n`;

    if (confirmedBooking.isSplitSchedule) {
      msg += `✂️ *Nota:* Solicitei divisão de horários para os procedimentos. Aguardo sua validação!\n`;
    }

    if (!professional) return '';

    if (confirmedBooking.payOnArrival) {
      msg += `💵 *Forma de Pagamento:* Pagar no dia do atendimento (no espaço)\n`;
      msg += `\nSolicitei o agendamento e aguardo sua confirmação do horário! ✨`;
    } else if (confirmedBooking.payFullInAdvance || confirmedBooking.paymentOption === 'pay_full_pix' || (confirmedBooking.depositAmount && confirmedBooking.depositAmount === confirmedBooking.totalPrice)) {
      msg += `💳 *Forma de Pagamento:* Pagamento Total Antecipado (Pix ou Cartão)\n`;
      if (professional.pixKey) {
        msg += `🔑 *Chave Pix:* ${professional.pixKey}\n`;
      }
      msg += `\nSeguirei com o envio do comprovante para confirmação e quitação da minha vaga! ✨`;
    } else if (confirmedBooking.depositRequired && confirmedBooking.depositAmount) {
      const remaining = Math.max(0, confirmedBooking.totalPrice - confirmedBooking.depositAmount);
      msg += `⚡ *Sinal Pix Obrigatório:* R$ ${confirmedBooking.depositAmount.toFixed(2).replace('.', ',')}${professional.pixKey ? ` (Chave: ${professional.pixKey})` : ''}\n`;
      msg += `💵 *Saldo no Atendimento:* R$ ${remaining.toFixed(2).replace('.', ',')}\n`;
      msg += `\nSeguirei com o envio do comprovante do sinal para validação e garantia da minha vaga! ✨`;
    } else {
      msg += `\nFavor confirmar se o horário está registrado certinho!`;
    }

    const cleanPhone = (professional.phone || '').replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(msg)}`;
  };

  // Se profissional não for encontrado
  if (!professional) {
    return (
      <div className="min-h-[80vh] bg-[#FAF8F5] dark:bg-zinc-950 flex items-center justify-center px-4 py-12 text-[#2D2D2A] dark:text-zinc-100 transition-colors">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-7 max-w-sm w-full text-center border border-[#E8DCCD] dark:border-zinc-800 shadow-xl space-y-4">
          <div className="w-13 h-13 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-900/50">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h1 className="serif text-xl font-bold text-[#2B2320] dark:text-zinc-100">Espaço não encontrado</h1>
          <p className="text-xs text-[#7A6D65] dark:text-zinc-400">
            Não localizamos nenhum estabelecimento cadastrado no link <code className="bg-[#FAF5EF] dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[#8C4E46] dark:text-rose-300 font-mono text-xs">/{slug}</code>.
          </p>
          <div className="pt-2">
            <span className="text-[11px] text-stone-500 dark:text-zinc-400 block mb-2 font-medium">Outras agendas disponíveis:</span>
            <div className="flex flex-col gap-1.5">
              {professionals.slice(0, 3).map(p => (
                <Link
                  key={p.id}
                  href={`/${p.slug}`}
                  className="py-2 px-3 bg-[#FAF5EF] dark:bg-zinc-800 hover:bg-[#F2E5D8] dark:hover:bg-zinc-700 text-[#8C4E46] dark:text-rose-300 rounded-xl text-xs font-bold transition-colors"
                >
                  {p.name} • {p.category}
                </Link>
              ))}
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-stone-600 dark:text-zinc-400 hover:text-stone-950 dark:hover:text-white font-semibold pt-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    );
  }

  // Se a conta estiver inativa
  const isAccountInactive = professional.status === 'inactive' || (professional.status === 'delinquent' && (professional.daysOverdue || 0) > 5);

  if (isAccountInactive) {
    return (
      <div className="min-h-[80vh] bg-[#FAF8F5] dark:bg-zinc-950 flex items-center justify-center px-4 py-12 text-[#2D2D2A] dark:text-zinc-100 transition-colors">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-7 max-w-sm w-full text-center border border-[#E8DCCD] dark:border-zinc-800 shadow-xl space-y-4">
          <div className="w-13 h-13 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-900/50">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h1 className="serif text-xl font-bold text-[#2B2320] dark:text-zinc-100">Agenda Indisponível</h1>
          <p className="text-xs text-[#7A6D65] dark:text-zinc-400 leading-relaxed">
            Os agendamentos online para o espaço <strong>{professional.name}</strong> estão temporariamente pausados.
          </p>
          <button
            type="button"
            onClick={() => openWhatsAppSafely(professional.phone, `Olá ${professional.name}! Vim pelo link da sua agenda e gostaria de consultar a disponibilidade de horários.`)}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-xl font-bold text-xs shadow-md cursor-pointer transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Falar no WhatsApp ({professional.phone})</span>
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-stone-500 dark:text-zinc-400 hover:text-stone-950 dark:hover:text-white font-medium pt-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-zinc-950 text-[#2B2320] dark:text-zinc-100 transition-colors py-6 sm:py-10 px-4 flex flex-col items-center justify-start">

      {/* BARRA SUPERIOR DISCRETA */}
      <div className="w-full max-w-md lg:max-w-4xl xl:max-w-5xl flex items-center justify-between pb-3 px-1">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7A6D65] dark:text-zinc-400 hover:text-[#2B2320] dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Início</span>
        </Link>

        <button
          type="button"
          onClick={() => setIsSearchModalOpen(true)}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#8C4E46] dark:text-rose-300 hover:underline cursor-pointer"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Minhas Reservas</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* CONTAINER RESPONSIVO (LADO A LADO EM TELAS GRANDES / CARROSSEL NO MOBILE) */}
      {/* ========================================================================= */}
      <div className="w-full max-w-md lg:max-w-4xl xl:max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* ========================================================================= */}
        {/* COLUNA 1 (DESKTOP) / CARROSSEL TOPO (MOBILE): FOTOS DOS PROCEDIMENTOS */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 w-full space-y-4">
          
          {/* Card Vitrine de Fotos com Procedimentos Cadastrados, Colagem de Combos e Zoom */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 sm:p-5 border border-[#E8DCCD] dark:border-zinc-800 shadow-lg shadow-stone-200/40 dark:shadow-black/30 overflow-hidden relative">
            
            {/* Imagem em Destaque / Colagem de Combo / Carrossel */}
            {(() => {
              const currentItem = activeShowcaseItems[activePhotoIndex] || activeShowcaseItems[0];
              const isComboCollage = currentItem?.isCombo && currentItem.comboImages && currentItem.comboImages.length > 1;

              return (
                <>
                  <div className="relative aspect-4/3 sm:aspect-16/10 w-full rounded-2xl overflow-hidden bg-stone-100 dark:bg-zinc-800 group border border-[#EAE0D5] dark:border-zinc-700/60 shadow-inner">
                  {isComboCollage ? (
                    // Colagem para Combos de Procedimentos Selecionados
                    <div className="w-full h-full grid grid-cols-2 gap-1 p-1 bg-stone-900/10">
                      {currentItem.comboImages!.slice(0, 4).map((imgUrl, cIdx) => (
                        <div key={cIdx} className="relative w-full h-full rounded-xl overflow-hidden">
                          <Image
                            src={imgUrl}
                            alt={`${currentItem.title} ${cIdx + 1}`}
                            fill
                            sizes="(max-width: 1024px) 50vw, 220px"
                            className="object-cover transition-transform duration-500 hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1.5 text-[9px] text-white font-semibold truncate">
                            {selectedServices[cIdx]?.name || `Parte ${cIdx + 1}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Imagem Individual com Efeito Suave
                    <Image
                      src={currentItem?.url || primaryAvatar}
                      alt={currentItem?.title || professional.name}
                      fill
                      sizes="(max-width: 1024px) 100vw, 450px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      priority
                      referrerPolicy="no-referrer"
                    />
                  )}

                  {/* Tag Superior de Resultados & Procedimentos */}
                  <div className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                    <Images className="w-3 h-3 text-rose-300" />
                    <span>{currentItem?.badge || 'Resultados & Procedimentos'}</span>
                  </div>

                  {/* Botão de Zoom na Foto */}
                  <button
                    type="button"
                    onClick={() => handleOpenLightbox(activeShowcaseItems, currentItem?.title || professional.name, activePhotoIndex)}
                    className="absolute top-2.5 right-2.5 bg-black/70 hover:bg-black/90 backdrop-blur-xs text-white p-2 rounded-full text-xs transition-all shadow-md hover:scale-110 cursor-pointer flex items-center gap-1"
                    title="Dar zoom na foto"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold pr-0.5">Zoom</span>
                  </button>

                  {/* Nome do Procedimento e Descrição na Foto (Sem valores sobre a foto) */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pt-6 flex items-end justify-between gap-2 text-white">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold text-rose-300 uppercase tracking-wider">
                        {currentItem?.badge || (currentItem?.isCombo ? '✨ Combo Especial' : 'Procedimento')}
                      </p>
                      <h3 className="font-bold text-xs sm:text-sm text-white truncate drop-shadow-xs">
                        {currentItem?.title || professional.name}
                      </h3>
                      {currentItem?.subtitle && (
                        <p className="text-[11px] text-stone-200 line-clamp-2 mt-0.5 font-normal leading-tight">
                          {currentItem.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Setas de navegação do carrossel */}
                  {activeShowcaseItems.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setActivePhotoIndex(prev => (prev - 1 + activeShowcaseItems.length) % activeShowcaseItems.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 dark:bg-zinc-900/80 hover:bg-white text-stone-800 dark:text-zinc-100 flex items-center justify-center shadow-md cursor-pointer transition-all hover:scale-105"
                        aria-label="Foto anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivePhotoIndex(prev => (prev + 1) % activeShowcaseItems.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 dark:bg-zinc-900/80 hover:bg-white text-stone-800 dark:text-zinc-100 flex items-center justify-center shadow-md cursor-pointer transition-all hover:scale-105"
                        aria-label="Próxima foto"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

                {/* Indicador de Bolinhas (Abaixo da foto, em espaço dedicado sem sobrepor texto) */}
                {activeShowcaseItems.length > 1 && (
                  <div className="flex justify-center items-center gap-1.5 pt-1.5 pb-0.5">
                    {activeShowcaseItems.slice(0, 8).map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActivePhotoIndex(idx)}
                        className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                          idx === activePhotoIndex 
                            ? 'w-5 bg-[#8C4E46] dark:bg-rose-400 shadow-xs' 
                            : 'w-1.5 bg-stone-300 dark:bg-zinc-700 hover:bg-[#8C4E46]/50'
                        }`}
                        aria-label={`Ir para foto ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}
              </>
            );
          })()}

            {/* Miniaturas navegáveis com nomes dos procedimentos */}
            {activeShowcaseItems.length > 1 && (
              <div className="flex items-center gap-2 mt-2.5 overflow-x-auto pb-1 [scrollbar-width:thin]">
                {activeShowcaseItems.slice(0, 6).map((item, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setActivePhotoIndex(index)}
                    className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      activePhotoIndex === index 
                        ? 'border-[#8C4E46] scale-105 shadow-xs ring-1 ring-[#8C4E46]' 
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                    title={item.title}
                  >
                    <Image
                      src={item.url}
                      alt={item.title}
                      fill
                      sizes="56px"
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-black/75 text-[8px] text-white truncate px-1 py-0.5 font-bold">
                      {item.title.split(' ')[0]}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Mini Perfil do Estabelecimento (Integrado na lateral no desktop) */}
            <div className="pt-3.5 mt-3.5 border-t border-[#F2E8DF] dark:border-zinc-800 space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-2xl overflow-hidden border-2 border-[#8C4E46]/20 dark:border-rose-400/30 shadow-xs shrink-0">
                  <Image
                    src={primaryAvatar}
                    alt={professional.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                    priority
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h2 className="serif text-sm font-bold text-[#2B2320] dark:text-zinc-100 truncate">
                      {professional.name}
                    </h2>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  </div>
                  <p className="text-[11px] font-semibold text-[#8C4E46] dark:text-rose-400 truncate">
                    {professional.category}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-[#7A6D65] dark:text-zinc-400">
                    <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                    <span className="truncate">{professional.address.split(',')[0]}</span>
                  </div>
                </div>
              </div>

              {/* Indicador de Profissional Atendente na Equipe */}
              {selectedStaffMember ? (
                <div className="p-2.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 flex items-center gap-2.5">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-amber-400/60 shadow-xs">
                    <Image
                      src={selectedStaffMember.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80'}
                      alt={selectedStaffMember.name}
                      fill
                      sizes="32px"
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block leading-tight">
                      Atendimento com:
                    </span>
                    <p className="text-xs font-bold text-[#2B2320] dark:text-zinc-100 truncate">
                      {selectedStaffMember.name}
                    </p>
                    <p className="text-[10px] text-stone-500 dark:text-zinc-400 truncate">
                      {selectedStaffMember.roleOrSpecialty || 'Especialista'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="px-2.5 py-1.5 rounded-xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-200/60 dark:border-zinc-700/60 flex items-center justify-between text-[10px] text-stone-600 dark:text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#8C4E46]" />
                    <span>Equipe: Camila Silva e especialistas</span>
                  </span>
                  <span className="font-semibold text-stone-700 dark:text-zinc-300">{activeStaffList.length} profissionais</span>
                </div>
              )}

              {/* Informações sobre Formas de Pagamento Evidentes & Reforço de Desconto no Pix */}
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                {(professional.acceptedPaymentMethods || ['pix', 'credit_card', 'cash']).some(m => m === 'pix' || m === 'cash') && (
                  <div className="p-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold block text-[10px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                        <span>Pix/Dinheiro</span>
                        <span className="text-[8px] bg-emerald-600 text-white font-extrabold px-1 rounded">-5%</span>
                      </span>
                      <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-medium">Economia garantida</span>
                    </div>
                  </div>
                )}

                {(professional.acceptedPaymentMethods || ['pix', 'credit_card', 'cash']).includes('credit_card') && (
                  <div className="p-2 rounded-xl bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-stone-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                    <div>
                      <span className="font-bold block text-[10px]">Cartão no Local</span>
                      <span className="text-[9px] opacity-85">Débito ou Crédito</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Botões de Ação do Estabelecimento: Instagram e WhatsApp */}
              <div className="flex flex-col gap-1.5 pt-0.5">
                <a
                  href={getInstagramHref(professional.instagram)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-amber-500/10 dark:from-purple-900/30 dark:to-pink-900/30 hover:bg-pink-100/60 dark:hover:bg-pink-950/50 text-pink-700 dark:text-pink-300 border border-pink-200/80 dark:border-pink-900/50 text-xs font-bold transition-all cursor-pointer group"
                >
                  <Instagram className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform" />
                  <span>{getInstagramLabel(professional.instagram)}</span>
                </a>

                <button
                  type="button"
                  onClick={() => openWhatsAppSafely(professional.phone, `Olá! Gostaria de tirar uma dúvida sobre os procedimentos do espaço ${professional.name} antes de agendar.`)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                  <span>Tirar Dúvidas no WhatsApp</span>
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* ========================================================================= */}
        {/* COLUNA 2 (DESKTOP) / CORPO PRINCIPAL: CARD DE AGENDAMENTO SIMPLES */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 w-full">
          <div 
            ref={bookingCardRef}
            id="booking-card"
            className="bg-white dark:bg-zinc-900 rounded-3xl p-4 sm:p-6 border border-[#E8DCCD] dark:border-zinc-800 shadow-xl shadow-stone-200/50 dark:shadow-black/40 relative transition-all text-left"
          >
            
            {/* Glow decorativo sutil encapsulado em container com overflow-hidden para não travar o scroll da página */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
              <div className="absolute -top-16 -right-16 w-36 h-36 bg-gradient-to-bl from-rose-200/40 via-amber-100/20 to-transparent dark:from-rose-900/20 dark:via-transparent rounded-full blur-2xl" />
            </div>

            {/* Cabeçalho do Card */}
            <div className="relative pb-3 mb-4 border-b border-[#F2E8DF] dark:border-zinc-800 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                  Agenda Oficial Aberta
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Link Direto para o Instagram no Card Principal */}
                <a
                  href={getInstagramHref(professional.instagram)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Acessar Instagram"
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-pink-700 dark:text-pink-300 hover:bg-pink-100/70 dark:hover:bg-pink-950/60 bg-pink-50 dark:bg-pink-950/40 px-2.5 py-1 rounded-full border border-pink-200/80 dark:border-pink-900/60 transition-all cursor-pointer shadow-2xs group"
                >
                  <Instagram className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline">{getInstagramLabel(professional.instagram)}</span>
                  <span className="sm:hidden">Instagram</span>
                </a>

                {/* Botão de Encaixe EXCLUSIVO na tela de Data & Horário (Passo 2) */}
                {step === 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      setEncaixeDate(activeDate);
                      setIsEncaixeModalOpen(true);
                      setEncaixeSuccess(false);
                    }}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#8C4E46] dark:text-rose-300 hover:bg-[#8C4E46]/10 bg-[#FAF5EF] dark:bg-zinc-800 px-3 py-1 rounded-full border border-[#8C4E46]/20 transition-all cursor-pointer shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Pedir Encaixe</span>
                  </button>
                )}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* AVISO DE FÉRIAS / RECESSO COM OPÇÕES INTELIGENTES PARA AS CLIENTES */}
            {/* ========================================================================= */}
            {isVacationActive && (
              <div className="mb-4 p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-700/60 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Palmtree className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                        Comunicado de Férias & Recesso
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                        Atendimento em Pausa
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 mt-0.5 leading-relaxed">
                      Estamos em recesso de <strong>{formatDatePtBr(vacation?.startDate || '')}</strong> até <strong>{formatDatePtBr(vacation?.endDate || '')}</strong>.
                      {vacation?.returnDate && (
                        <span> Retorno oficial das atividades em <strong>{formatDatePtBr(vacation.returnDate)}</strong>.</span>
                      )}
                    </p>
                    {vacation?.notes && (
                      <p className="text-[11px] italic text-amber-700 dark:text-amber-400 mt-1 bg-white/60 dark:bg-black/20 p-2 rounded-lg border border-amber-200 dark:border-amber-800">
                        &ldquo;{vacation.notes}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200 dark:border-amber-800/60">
                  {vacation?.returnDate && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDate(vacation.returnDate!);
                        setStep(2);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <CalendarCheck className="w-3.5 h-3.5" />
                      Agendar para a Volta ({formatDatePtBr(vacation.returnDate)})
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setEncaixeDate(vacation?.returnDate || '');
                      setIsEncaixeModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-zinc-700 border border-amber-300 dark:border-amber-700 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Solicitar Horário Manual / Fila
                  </button>

                  <button
                    type="button"
                    onClick={() => openWhatsAppSafely(professional.phone, `Olá ${professional.name}! Vi seu aviso de férias e gostaria de saber sobre disponibilidade para quando você retornar!`)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Chamar no WhatsApp
                  </button>
                </div>
              </div>
            )}

            {/* Barra de Passos */}
            {step < 4 && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
                  <span className={step === 1 ? 'text-[#8C4E46] dark:text-rose-400' : 'text-stone-400'}>
                    1. Procedimento
                  </span>
                  <span className={step === 2 ? 'text-[#8C4E46] dark:text-rose-400' : 'text-stone-400'}>
                    2. Data & Horário
                  </span>
                  <span className={step === 3 ? 'text-[#8C4E46] dark:text-rose-400' : 'text-stone-400'}>
                    3. Seus Dados
                  </span>
                </div>
                <div className="w-full bg-stone-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#8C4E46] dark:bg-rose-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${(step / 3) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* ===================================================================== */}
            {/* PASSO 1: ESCOLHA DO PROCEDIMENTO (SEPARADO POR COLUNAS E CARDS MENORES) */}
            {/* ===================================================================== */}
            {step === 1 && (
              <div className="space-y-3">
                
                {/* SELETOR DE COLABORADORA / PROFISSIONAL (QUANDO HOUVER MAIS DE 1) */}
                {hasMultipleStaff && (
                  <div className="p-3.5 rounded-2xl bg-[#F8F6F2] dark:bg-zinc-800/80 border border-[#E9E2D7] dark:border-zinc-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wide text-[#8C4E46] dark:text-rose-400 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        <span>Com quem você deseja ser atendida?</span>
                      </span>
                      {selectedStaffId !== 'any' && (
                        <button
                          type="button"
                          onClick={() => { if (selectedStaffId !== 'any') { setSelectedStaffId('any'); setSelectedServices([]); } }}
                          className="text-[10px] text-stone-500 hover:text-stone-800 dark:hover:text-zinc-200 underline cursor-pointer"
                        >
                          Ver todas
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                      {/* Opção Qualquer Profissional */}
                      <button
                        type="button"
                        onClick={() => { if (selectedStaffId !== 'any') { setSelectedStaffId('any'); setSelectedServices([]); } }}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                          selectedStaffId === 'any'
                            ? 'bg-[#8C4E46] text-white border-[#8C4E46] shadow-xs'
                            : 'bg-white dark:bg-zinc-900 border-[#E8DCCD] dark:border-zinc-700 text-[#4A3D36] dark:text-zinc-200 hover:border-[#8C4E46]/50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          selectedStaffId === 'any' ? 'bg-white/20 text-white' : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                        }`}>
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold leading-tight truncate">
                            Qualquer profissional
                          </p>
                          <p className={`text-[10px] truncate ${selectedStaffId === 'any' ? 'text-white/80' : 'text-stone-500 dark:text-zinc-400'}`}>
                            Mais horários livres
                          </p>
                        </div>
                      </button>

                      {/* Cada colaboradora */}
                      {activeStaffList.map((staff) => {
                        const isSelected = selectedStaffId === staff.id;
                        return (
                          <button
                            key={staff.id}
                            type="button"
                            onClick={() => { if (selectedStaffId !== staff.id) { setSelectedStaffId(staff.id); setSelectedServices([]); } }}
                            className={`p-2 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#8C4E46] text-white border-[#8C4E46] shadow-xs'
                                : 'bg-white dark:bg-zinc-900 border-[#E8DCCD] dark:border-zinc-700 text-[#4A3D36] dark:text-zinc-200 hover:border-[#8C4E46]/50'
                            }`}
                          >
                            <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-black/10">
                              <Image
                                src={staff.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80'}
                                alt={staff.name}
                                fill
                                sizes="32px"
                                className="object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold leading-tight truncate">
                                {staff.name}
                              </p>
                              <p className={`text-[10px] truncate ${isSelected ? 'text-white/80' : 'text-stone-500 dark:text-zinc-400'}`}>
                                {staff.roleOrSpecialty || 'Especialista'}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-[#8C4E46] dark:text-rose-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Catálogo de Procedimentos & Combos</span>
                  </span>
                  {selectedServices.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedServices([])}
                      className="text-[10px] text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer"
                    >
                      Limpar ({selectedServices.length})
                    </button>
                  )}
                </div>

                {/* Busca rápida */}
                {services.length > 3 && (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar por nome ou procedimento..."
                      className="w-full pl-8.5 pr-6 py-1.5 text-xs rounded-xl border border-[#EAE0D5] dark:border-zinc-800 bg-[#FAF5EF]/50 dark:bg-zinc-800/60 text-[#2B2320] dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#8C4E46]"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )}

                {/* Grade Separada por Coluna: Procedimentos Individuais e Combos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-0.5 [scrollbar-width:thin]">
                  
                  {/* COLUNA 1: PROCEDIMENTOS INDIVIDUAIS */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-stone-200 dark:border-zinc-800">
                      <span className="text-[11px] font-bold text-[#4A3D36] dark:text-zinc-300 flex items-center gap-1">
                        <Scissors className="w-3 h-3 text-[#8C4E46]" />
                        <span>Procedimentos</span>
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 rounded-md">
                        {individualServices.length}
                      </span>
                    </div>

                    {individualServices.length === 0 ? (
                      <p className="text-[11px] text-stone-400 py-3 text-center italic">
                        Nenhum procedimento individual encontrado.
                      </p>
                    ) : (
                      individualServices.map((service) => {
                        const isSelected = selectedServices.some(s => s.id === service.id);
                        const cardPrice = getCleanCardPrice(service.price);
                        const serviceImg = service.imageUrl || (service.images && service.images[0]) || findBestImageForService(service.name, professional.category);

                        return (
                          <div
                            key={service.id}
                            onClick={() => toggleService(service)}
                            className={`group p-2.5 rounded-xl border text-xs transition-all cursor-pointer relative ${
                              isSelected
                                ? 'bg-[#FAF5EF] dark:bg-rose-950/30 border-[#8C4E46] dark:border-rose-500/70 shadow-xs'
                                : 'bg-white dark:bg-zinc-900 border-[#EAE0D5] dark:border-zinc-800 hover:border-[#8C4E46]/40 dark:hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {/* Mini Thumbnail com Zoom */}
                              <div 
                                className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-stone-200 dark:border-zinc-700 group/thumb"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenLightbox(
                                    [{ url: serviceImg, name: service.name, subtitle: service.description || `${service.durationMinutes} min de atendimento` }],
                                    service.name,
                                    0
                                  );
                                }}
                                title="Clique para ampliar a foto"
                              >
                                <Image
                                  src={serviceImg}
                                  alt={service.name}
                                  fill
                                  sizes="40px"
                                  className="object-cover group-hover/thumb:scale-110 transition-transform"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                                  <ZoomIn className="w-3.5 h-3.5 text-white" />
                                </div>
                              </div>

                              {/* Informações Compactas */}
                              <div className="min-w-0 flex-1">
                                <h4 className={`font-bold text-[11px] leading-snug truncate ${isSelected ? 'text-[#8C4E46] dark:text-rose-300' : 'text-[#2B2320] dark:text-zinc-100'}`}>
                                  {service.name}
                                </h4>

                                <div className="flex items-center gap-1.5 text-[9px] text-[#7A6D65] dark:text-zinc-400 mt-1 flex-wrap">
                                  <span className="flex items-center gap-0.5 font-medium bg-stone-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                    <Clock className="w-2.5 h-2.5 text-stone-400" />
                                    {service.durationMinutes}m
                                  </span>
                                  {service.requiresDeposit && (
                                    <span className="text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/60 px-1 py-0.5 rounded">
                                      Sinal R$ {service.depositValue.toFixed(0)}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-stone-100 dark:border-zinc-800">
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">Pix</span>
                                    <span className="font-extrabold text-[#2B2320] dark:text-zinc-100 text-[11px]">
                                      R$ {service.price.toFixed(2).replace('.', ',')}
                                    </span>
                                    <span className="text-[8px] text-stone-400 hidden sm:inline font-medium">
                                      {acceptsAnyCard ? `(Cartão: R$ ${cardPrice.toFixed(0)},00)` : ''}
                                    </span>
                                  </div>

                                  <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                                    isSelected 
                                      ? 'bg-[#8C4E46] text-white' 
                                      : 'border border-stone-300 dark:border-zinc-700 group-hover:border-[#8C4E46]'
                                  }`}>
                                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* COLUNA 2: COMBOS & PACOTES ESPECIAIS */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-rose-200 dark:border-rose-900/50">
                      <span className="text-[11px] font-bold text-[#8C4E46] dark:text-rose-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>Combos & Pacotes</span>
                      </span>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-rose-100 dark:bg-rose-950/80 text-[#8C4E46] dark:text-rose-300 rounded-md">
                        {comboServices.length} {comboServices.length === 1 ? 'combo' : 'combos'}
                      </span>
                    </div>

                    {comboServices.length === 0 ? (
                      <p className="text-[11px] text-stone-400 py-3 text-center italic">
                        Nenhum combo cadastrado no momento.
                      </p>
                    ) : (
                      comboServices.map((service) => {
                        const isSelected = selectedServices.some(s => s.id === service.id);
                        const cardPrice = getCleanCardPrice(service.price);
                        const comboDepositVal = service.requiresDeposit && service.depositValue > 0 
                          ? service.depositValue 
                          : Math.round(service.price * 0.25 / 5) * 5 || 30;
                        const comboImgs = service.images && service.images.length > 1 
                          ? service.images 
                          : service.comboServiceNames && service.comboServiceNames.length > 0
                            ? service.comboServiceNames.map(sub => findBestImageForService(sub, professional.category))
                            : [service.imageUrl || findBestImageForService(service.name, professional.category)];

                        return (
                          <div
                            key={service.id}
                            onClick={() => toggleService(service)}
                            className={`group p-2.5 rounded-xl border text-xs transition-all cursor-pointer relative ${
                              isSelected
                                ? 'bg-amber-50/60 dark:bg-amber-950/30 border-[#8C4E46] dark:border-rose-500/70 shadow-xs'
                                : 'bg-white dark:bg-zinc-900 border-[#EAE0D5] dark:border-zinc-800 hover:border-[#8C4E46]/40 dark:hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {/* Mini Colagem de Fotos com Zoom */}
                              <div 
                                className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-amber-300/80 dark:border-amber-900/60 group/thumb"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenLightbox(
                                    comboImgs.map(img => ({ url: img, name: service.name, subtitle: service.description || `Combo Especial • ${service.durationMinutes} min de procedimento` })),
                                    service.name,
                                    0
                                  );
                                }}
                                title="Clique para ampliar fotos do Combo"
                              >
                                {comboImgs.length > 1 ? (
                                  <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-0.5">
                                    {comboImgs.slice(0, 4).map((imgUrl, i) => (
                                      <div key={i} className="relative w-full h-full">
                                        <Image
                                          src={imgUrl}
                                          alt={`Combo ${i}`}
                                          fill
                                          sizes="22px"
                                          className="object-cover"
                                          referrerPolicy="no-referrer"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <Image
                                    src={comboImgs[0]}
                                    alt={service.name}
                                    fill
                                    sizes="44px"
                                    className="object-cover group-hover/thumb:scale-110 transition-transform"
                                    referrerPolicy="no-referrer"
                                  />
                                )}
                                <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                                  <ZoomIn className="w-3.5 h-3.5 text-white" />
                                </div>
                              </div>

                              {/* Informações do Combo */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1">
                                  <span className="text-[8px] font-extrabold uppercase px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300">
                                    Combo
                                  </span>
                                  <h4 className={`font-bold text-[11px] leading-snug truncate ${isSelected ? 'text-[#8C4E46] dark:text-rose-300' : 'text-[#2B2320] dark:text-zinc-100'}`}>
                                    {service.name}
                                  </h4>
                                </div>

                                <div className="flex items-center gap-1.5 text-[9px] text-[#7A6D65] dark:text-zinc-400 mt-1 flex-wrap">
                                  <span className="flex items-center gap-0.5 font-medium bg-stone-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                    <Clock className="w-2.5 h-2.5 text-stone-400" />
                                    {service.durationMinutes}m
                                  </span>
                                  <span className="text-amber-800 dark:text-amber-300 font-bold bg-amber-100/80 dark:bg-amber-950/80 border border-amber-300/60 dark:border-amber-800/60 px-1.5 py-0.5 rounded">
                                    Sinal R$ {comboDepositVal.toFixed(0)}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-stone-100 dark:border-zinc-800">
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">Pix</span>
                                    <span className="font-extrabold text-[#8C4E46] dark:text-rose-400 text-[11px]">
                                      R$ {service.price.toFixed(2).replace('.', ',')}
                                    </span>
                                    <span className="text-[8px] text-stone-400 hidden sm:inline font-medium">
                                      {acceptsAnyCard ? `(Cartão: R$ ${cardPrice.toFixed(0)},00)` : ''}
                                    </span>
                                  </div>

                                  <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                                    isSelected 
                                      ? 'bg-[#8C4E46] text-white' 
                                      : 'border border-stone-300 dark:border-zinc-700 group-hover:border-[#8C4E46]'
                                  }`}>
                                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                </div>

                {/* Rodapé do Passo 1 com Duração Total & Valores Totais Evidentes */}
                <div className="pt-2 border-t border-[#F2E8DF] dark:border-zinc-800 space-y-2.5">
                  {selectedServices.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-[#FAF5EF] dark:bg-zinc-800/70 border border-[#EAE0D5] dark:border-zinc-700/60 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-[#7A6D65] dark:text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#8C4E46]" />
                          <span>Duração total estimada:</span>
                        </span>
                        <strong className="text-[#2B2320] dark:text-zinc-100">{formattedTotalDuration}</strong>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-[#EAE0D5] dark:border-zinc-700">
                        <span className="font-bold text-[#4A3D36] dark:text-zinc-300">Valor Total:</span>
                        <div className="text-right">
                          <span className="font-extrabold text-sm text-[#8C4E46] dark:text-rose-400 block">
                            R$ {totalPricePix.toFixed(2).replace('.', ',')} no Pix
                          </span>
                          <span className="text-[10px] text-[#7A6D65] dark:text-zinc-400 block">
                            {acceptsAnyCard ? `ou R$ ${totalPriceCard.toFixed(2).replace('.', ',')} no Cartão` : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={selectedServices.length === 0}
                    onClick={() => setStep(2)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#8C4E46] hover:bg-[#783F38] disabled:opacity-45 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-sm hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  >
                    <span>Escolher Data & Horário</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* ===================================================================== */}
            {/* PASSO 2: ESCOLHA DE DATA, HORÁRIO, DIVISÃO DE COMBO/SERVIÇOS & ENCAIXE */}
            {/* ===================================================================== */}
            {step === 2 && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-[#8C4E46] dark:text-rose-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{isSplitSchedule ? 'Horários Individuais dos Serviços/Combo' : 'Escolha o Dia e Horário'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-[11px] text-stone-500 hover:text-stone-900 dark:hover:text-zinc-200 font-semibold cursor-pointer"
                  >
                    ← Trocar serviço
                  </button>
                </div>

                {/* Resumo com Duração Total e Valores com Destaque Pix */}
                <div className="p-2.5 rounded-xl bg-[#FAF5EF] dark:bg-zinc-800/80 border border-[#EAE0D5] dark:border-zinc-700/60 text-xs flex items-center justify-between">
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="font-semibold text-[#2B2320] dark:text-zinc-100 truncate block">
                      {selectedServices.map(s => s.name).join(' + ')}
                    </span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                      ✨ Desconto aplicado no Pix
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-[#7A6D65] dark:text-zinc-400 block">
                      ⏱️ {formattedTotalDuration}
                    </span>
                    <span className="text-xs font-bold text-[#8C4E46] dark:text-rose-400">
                      R$ {totalPricePix.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                {/* OPÇÃO DE DIVIDIR O HORÁRIO (QUANDO HÁ MÚLTIPLOS SERVIÇOS OU UM COMBO SELECIONADO) */}
                {canSplitSchedule && (
                  <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2 text-xs">
                    <label className="flex items-start gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isSplitSchedule}
                        onChange={(e) => setIsSplitSchedule(e.target.checked)}
                        className="mt-0.5 rounded border-amber-300 text-[#8C4E46] focus:ring-[#8C4E46]"
                      />
                      <div>
                        <span className="font-bold text-amber-950 dark:text-amber-200 block">
                          Deseja dividir estes procedimentos em horários ou dias separados?
                        </span>
                        <span className="text-[11px] text-amber-800 dark:text-amber-300 block mt-0.5">
                          Você escolhe o melhor dia e horário para o 1º procedimento/etapa, depois o 2º, e assim por diante.
                        </span>
                      </div>
                    </label>
                  </div>
                )}

                {/* FLUXO SEQUENCIAL CASO O USUÁRIO OPTE POR DIVIDIR */}
                {isSplitSchedule && canSplitSchedule ? (
                  <div className="space-y-3 pt-1">
                    {/* Barra de Etapas Sequenciais dos Procedimentos */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-[#4A3D36] dark:text-zinc-300">
                        Etapas dos Procedimentos (Selecione um por vez):
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {splitSelections.map((item, idx) => {
                          const isActive = splitActiveIndex === idx;
                          const hasSlot = Boolean(item.date && item.time);

                          return (
                            <button
                              key={item.serviceId}
                              type="button"
                              onClick={() => setSplitActiveIndex(idx)}
                              className={`p-2 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                isActive
                                  ? 'bg-[#8C4E46] text-white border-[#8C4E46] shadow-sm'
                                  : hasSlot
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-900 dark:text-emerald-300'
                                    : 'bg-white dark:bg-zinc-800 border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-zinc-300'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <span className="font-bold block truncate text-[11px]">
                                  {idx + 1}º {item.serviceName}
                                </span>
                                <span className={`text-[10px] block ${isActive ? 'text-white/80' : 'text-stone-500 dark:text-zinc-400'}`}>
                                  {item.durationMinutes} min
                                </span>
                              </div>

                              <div className="text-right shrink-0">
                                {hasSlot ? (
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                    isActive ? 'bg-white/20 text-white' : 'bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200'
                                  }`}>
                                    {formatDatePtBr(item.date).split(' - ')[0]} às {item.time}
                                  </span>
                                ) : (
                                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                                    isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                                  }`}>
                                    Escolher
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Procedimento Ativo em Configuração */}
                    {(() => {
                      const currentSplit = splitSelections[splitActiveIndex] || splitSelections[0];
                      if (!currentSplit) return null;

                      const currentSplitSlots = calculateFreeSlotsForDuration(currentSplit.date || activeDate, currentSplit.durationMinutes);

                      return (
                        <div className="p-3 rounded-2xl bg-stone-50 dark:bg-zinc-850 border border-stone-200 dark:border-zinc-700 space-y-3">
                          <div className="flex items-center justify-between border-b border-stone-200 dark:border-zinc-700 pb-2">
                            <span className="font-bold text-xs text-[#8C4E46] dark:text-rose-400">
                              Agendando {splitActiveIndex + 1}º serviço: {currentSplit.serviceName} ({currentSplit.durationMinutes} min)
                            </span>
                            {currentSplit.time && (
                              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                <span>{currentSplit.time} selecionado</span>
                              </span>
                            )}
                          </div>

                          {/* Seletor de Dias para este procedimento */}
                          <div>
                            <label className="block text-[11px] font-bold text-[#4A3D36] dark:text-zinc-300 mb-1.5">
                              1. Selecione a data para este serviço:
                            </label>
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
                              {availableDays.map((d) => {
                                const isDaySelected = (currentSplit.date || activeDate) === d.dateStr;
                                return (
                                  <button
                                    key={d.dateStr}
                                    type="button"
                                    onClick={() => {
                                      setSplitSelections(prev => {
                                        const next = [...prev];
                                        if (next[splitActiveIndex]) {
                                          next[splitActiveIndex] = {
                                            ...next[splitActiveIndex],
                                            date: d.dateStr,
                                            time: '',
                                            endTime: ''
                                          };
                                        }
                                        return next;
                                      });
                                    }}
                                    className={`shrink-0 flex flex-col items-center justify-center w-14 py-2 rounded-xl text-xs transition-all cursor-pointer border ${
                                      isDaySelected
                                        ? 'bg-[#8C4E46] text-white border-[#8C4E46] shadow-xs scale-102'
                                        : 'bg-white dark:bg-zinc-800 border-[#EAE0D5] dark:border-zinc-700 text-[#4A3D36] dark:text-zinc-300 hover:border-[#8C4E46]/40'
                                    }`}
                                  >
                                    <span className="text-[10px] font-semibold">{d.dayName}</span>
                                    <span className="text-sm font-extrabold">{d.dayNumber}</span>
                                    <span className="text-[9px] opacity-80">{d.monthName}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Grade de Horários Livres para este procedimento específico */}
                          <div>
                            <label className="block text-[11px] font-bold text-[#4A3D36] dark:text-zinc-300 mb-1.5">
                              2. Selecione o horário livre ({currentSplitSlots.length} disponíveis):
                            </label>

                            {currentSplitSlots.length === 0 ? (
                              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-center space-y-1.5">
                                <p className="text-[11px] text-amber-900 dark:text-amber-200">
                                  Sem horários livres nesta data para {currentSplit.serviceName}.
                                </p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-4 gap-1.5 max-h-[160px] overflow-y-auto pr-0.5 [scrollbar-width:thin]">
                                {currentSplitSlots.map((slot) => {
                                  const isPicked = currentSplit.time === slot.time;
                                  return (
                                    <button
                                      key={slot.time}
                                      type="button"
                                      onClick={() => {
                                        setSplitSelections(prev => {
                                          const next = [...prev];
                                          if (next[splitActiveIndex]) {
                                            next[splitActiveIndex] = {
                                              ...next[splitActiveIndex],
                                              time: slot.time,
                                              endTime: slot.endTime
                                            };
                                          }
                                          return next;
                                        });

                                        // Auto-avançar para o próximo serviço pendente se houver
                                        if (splitActiveIndex < splitSelections.length - 1) {
                                          setTimeout(() => {
                                            setSplitActiveIndex(splitActiveIndex + 1);
                                          }, 250);
                                        }
                                      }}
                                      className={`py-2 text-center rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                        isPicked
                                          ? 'bg-[#8C4E46] text-white border-[#8C4E46] shadow-xs'
                                          : 'bg-white dark:bg-zinc-800 border-[#EAE0D5] dark:border-zinc-700 text-[#2B2320] dark:text-zinc-100 hover:border-[#8C4E46]/60'
                                      }`}
                                    >
                                      {slot.time}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  /* FLUXO PADRÃO (HORÁRIO ÚNICO / SEQUENCIAL NORMAL) */
                  <>
                    {/* Seletor Horizontal de Dias */}
                    <div>
                      <label className="block text-[11px] font-bold text-[#4A3D36] dark:text-zinc-300 mb-1.5">
                        Selecione o Dia:
                      </label>
                      <div 
                        ref={datesScrollRef}
                        className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]"
                      >
                        {availableDays.map((d) => {
                          const isDaySelected = activeDate === d.dateStr;
                          return (
                            <button
                              key={d.dateStr}
                              type="button"
                              onClick={() => {
                                setSelectedDate(d.dateStr);
                                setSelectedTime('');
                                setSelectedEndTime('');
                              }}
                              className={`shrink-0 flex flex-col items-center justify-center w-14 py-2 rounded-xl text-xs transition-all cursor-pointer border ${
                                isDaySelected
                                  ? 'bg-[#8C4E46] text-white border-[#8C4E46] shadow-sm scale-102'
                                  : 'bg-white dark:bg-zinc-800 border-[#EAE0D5] dark:border-zinc-700 text-[#4A3D36] dark:text-zinc-300 hover:border-[#8C4E46]/40'
                              }`}
                            >
                              <span className="text-[10px] font-semibold">{d.dayName}</span>
                              <span className="text-sm font-extrabold">{d.dayNumber}</span>
                              <span className="text-[9px] opacity-80">{d.monthName}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Grade de Horários Livres (MOSTRAR APENAS HORÁRIOS LIVRES) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-bold text-[#4A3D36] dark:text-zinc-300 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-400" />
                          <span>Horários Livres Disponíveis:</span>
                        </label>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                          {freeTimeSlots.length} {freeTimeSlots.length === 1 ? 'vaga livre' : 'vagas livres'}
                        </span>
                      </div>

                      {freeTimeSlots.length === 0 ? (
                        <div className="p-4 rounded-2xl bg-[#FAF5EF] dark:bg-zinc-800/80 border border-[#EAE0D5] dark:border-zinc-700 text-center space-y-2">
                          <p className="text-xs text-[#7A6D65] dark:text-zinc-400">
                            Todos os horários deste dia já foram preenchidos.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setEncaixeDate(activeDate);
                              setIsEncaixeModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#8C4E46] text-white text-xs font-bold shadow-xs hover:bg-[#783F38] cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Solicitar Encaixe neste dia</span>
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-1.5 max-h-[190px] overflow-y-auto pr-0.5 [scrollbar-width:thin]">
                          {freeTimeSlots.map((slot) => {
                            const isPicked = selectedTime === slot.time;
                            return (
                              <button
                                key={slot.time}
                                type="button"
                                onClick={() => {
                                  setSelectedTime(slot.time);
                                  setSelectedEndTime(slot.endTime);
                                }}
                                className={`py-2 text-center rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                  isPicked
                                    ? 'bg-[#8C4E46] text-white border-[#8C4E46] shadow-xs scale-[1.02]'
                                    : 'bg-white dark:bg-zinc-800 border-[#EAE0D5] dark:border-zinc-700 text-[#2B2320] dark:text-zinc-100 hover:border-[#8C4E46]/60'
                                }`}
                              >
                                {slot.time}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* OPÇÃO DE CONVERSAR COM A PROFISSIONAL CASO OS HORÁRIOS NÃO SEJAM LEGAIS */}
                <div className="p-3 rounded-2xl bg-stone-50 dark:bg-zinc-850 border border-[#EAE0D5] dark:border-zinc-700 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-[#2B2320] dark:text-zinc-100">
                        Os horários disponíveis não ficaram ideais para você?
                      </p>
                      <p className="text-[10px] text-[#7A6D65] dark:text-zinc-400">
                        Fale diretamente com nossa equipe no WhatsApp para verificarmos encaixes e ajustes de horário.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!professional) return;
                      const serviceSummary = selectedServices.map(s => s.name).join(' + ');
                      openWhatsAppSafely(
                        professional.phone, 
                        `Olá! Gostaria de agendar ${serviceSummary} no espaço ${professional.name}, mas não encontrei um horário ideal. Pode me ajudar a ajustar manualmente?`
                      );
                    }}
                    className="w-full py-1.5 px-3 rounded-xl bg-white dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Falar no WhatsApp para Ajuste Manual</span>
                  </button>
                </div>

                {/* Rodapé do Passo 2 */}
                {holdConflictError && (
                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 flex items-start gap-2.5 text-amber-900 dark:text-amber-200 text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Horário Indisponível no Momento</p>
                      <p className="text-[11px] leading-relaxed">{holdConflictError}</p>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-[#F2E8DF] dark:border-zinc-800 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 py-2.5 px-3 rounded-xl border border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    disabled={
                      isSplitSchedule 
                        ? splitSelections.some(s => !s.date || !s.time)
                        : !selectedTime
                    }
                    onClick={() => {
                      if (!professional) return;
                      setHoldConflictError(null);
                      setFormError(null);

                      if (isSplitSchedule && canSplitSchedule) {
                        const missingSlot = splitSelections.some(s => !s.date || !s.time);
                        if (missingSlot) {
                          setHoldConflictError('Por favor, defina a data e horário para todos os procedimentos divididos.');
                          return;
                        }
                        for (const splitSel of splitSelections) {
                          const holdRes = holdSlot(professional.id, splitSel.date, splitSel.time, splitSel.endTime);
                          if (!holdRes.success) {
                            setHoldConflictError(holdRes.message || `O horário ${splitSel.time} de ${splitSel.serviceName} acabou de ser reservado por outra cliente.`);
                            return;
                          }
                        }
                        setHoldExpiresAt(Date.now() + 5 * 60 * 1000);
                        setStep(3);
                      } else {
                        if (!activeDate || !selectedTime) {
                          setHoldConflictError('Selecione um horário disponível antes de avançar.');
                          return;
                        }
                        const holdRes = holdSlot(professional.id, activeDate, selectedTime, selectedEndTime);
                        if (!holdRes.success) {
                          setHoldConflictError(holdRes.message || 'Este horário está sendo preenchido por outra cliente no momento. Por favor, escolha outro horário.');
                          return;
                        }
                        setHoldExpiresAt(holdRes.expiresAt);
                        setStep(3);
                      }
                    }}
                    className="w-2/3 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#8C4E46] hover:bg-[#783F38] disabled:opacity-45 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    <span>Avançar para Seus Dados</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* ===================================================================== */}
            {/* PASSO 3: SEUS DADOS & CONFIRMAÇÃO COM VALORES E SINAL PIX */}
            {/* ===================================================================== */}
            {step === 3 && (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleConfirmBooking();
                }} 
                className="flex flex-col"
              >
                {/* Cabeçalho fixo do Passo 3 */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100 dark:border-zinc-800 shrink-0">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-[#8C4E46] dark:text-rose-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>Identificação & Pagamento</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (professional && selectedTime && activeDate) {
                        releaseSlotHold(professional.id, activeDate, selectedTime);
                      }
                      if (professional && isSplitSchedule && splitSelections.length > 0) {
                        splitSelections.forEach(s => {
                          if (s.date && s.time) {
                            releaseSlotHold(professional.id, s.date, s.time);
                          }
                        });
                      }
                      setHoldExpiresAt(null);
                      setHoldRemainingSeconds(null);
                      setStep(2);
                    }}
                    className="text-[11px] text-stone-500 hover:text-stone-900 dark:hover:text-zinc-200 font-semibold cursor-pointer"
                  >
                    ← Trocar horário
                  </button>
                </div>

                {/* Área rolável do formulário e opções de pagamento */}
                <div className="space-y-3.5 max-h-[62vh] sm:max-h-[68vh] overflow-y-auto pr-1 sm:pr-1.5 custom-scrollbar [scrollbar-width:thin] focus:outline-none py-0.5">

                {/* Banner de Reserva de Horário Exclusiva com Timer de Fila */}
                {holdRemainingSeconds !== null && holdRemainingSeconds > 0 && (
                  <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs shadow-2xs transition-colors ${
                    holdRemainingSeconds <= 60 
                      ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200 animate-pulse'
                      : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300/80 dark:border-amber-800/60 text-amber-950 dark:text-amber-200'
                  }`}>
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <Clock className={`w-4 h-4 shrink-0 ${holdRemainingSeconds <= 60 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400 animate-pulse'}`} />
                      <div className="text-[11px] leading-tight">
                        <span className="font-bold block">
                          {holdRemainingSeconds <= 60 ? '⚡ Quase expirando! Horário reservado:' : 'Horário reservado para você:'}
                        </span>
                        <span className={holdRemainingSeconds <= 60 ? 'text-rose-800 dark:text-rose-300 font-semibold' : 'text-amber-800 dark:text-amber-300'}>
                          {isSplitSchedule ? 'Procedimentos divididos' : `${selectedTime} (${formatDatePtBr(activeDate)})`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`text-[10px] font-medium ${holdRemainingSeconds <= 60 ? 'text-rose-800 dark:text-rose-300' : 'text-amber-800 dark:text-amber-400'}`}>
                        expira em
                      </span>
                      <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded-lg border ${
                        holdRemainingSeconds <= 60
                          ? 'bg-rose-200 dark:bg-rose-900 text-rose-950 dark:text-rose-100 border-rose-300 dark:border-rose-700'
                          : 'bg-amber-200/80 dark:bg-amber-900 text-amber-950 dark:text-amber-100 border-amber-300 dark:border-amber-700'
                      }`}>
                        {Math.floor(holdRemainingSeconds / 60)}:{String(holdRemainingSeconds % 60).padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                )}

                {formError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
                    {formError}
                  </div>
                )}

                {/* Inputs de dados */}
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#4A3D36] dark:text-zinc-300 mb-1">
                      Seu Nome Completo *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Como prefere ser chamada?"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-[#E0D4C8] dark:border-zinc-700 text-xs text-[#2B2320] dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8C4E46]/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#4A3D36] dark:text-zinc-300 mb-1">
                      WhatsApp com DDD *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="tel"
                        required
                        value={clientPhone}
                        onChange={handlePhoneChange}
                        placeholder="(11) 99999-9999"
                        maxLength={15}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-[#E0D4C8] dark:border-zinc-700 text-xs text-[#2B2320] dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8C4E46]/30"
                      />
                    </div>
                    <span className="text-[10px] text-stone-500 dark:text-zinc-400 mt-0.5 block">
                      Para envio da confirmação e lembrete do horário.
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#4A3D36] dark:text-zinc-300 mb-1">
                      Observações (opcional)
                    </label>
                    <input
                      type="text"
                      value={clientNotes}
                      onChange={(e) => setClientNotes(e.target.value)}
                      placeholder="Ex: Primeira vez no espaço, unhas sensíveis..."
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-[#E0D4C8] dark:border-zinc-700 text-xs text-[#2B2320] dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8C4E46]/30"
                    />
                  </div>

                  {/* Seleção de Forma / Momento de Pagamento: Cards Invertidos (Pix à esquerda, Pagar no dia ou Total à direita) */}
                  <div className="space-y-1.5 pt-1">
                    <label className="block text-xs font-bold text-[#4A3D36] dark:text-zinc-300">
                      Como deseja pagar?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {hasDepositRequired ? (
                        /* CASO 1: PROCEDIMENTO COM SINAL OBRIGATÓRIO */
                        <>
                          {/* Card 1 (Esquerda): Pagar Sinal Pix */}
                          <button
                            type="button"
                            onClick={() => setPaymentChoice('deposit_pix')}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              effectivePaymentChoice === 'deposit_pix'
                                ? 'bg-[#FAF5EF] dark:bg-zinc-800 border-[#8C4E46] dark:border-rose-400 ring-2 ring-[#8C4E46]/20 shadow-xs'
                                : 'bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-700 hover:border-stone-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1.5 w-full">
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                  effectivePaymentChoice === 'deposit_pix' ? 'border-[#8C4E46] bg-[#8C4E46]' : 'border-stone-300 dark:border-zinc-600'
                                }`}>
                                  {effectivePaymentChoice === 'deposit_pix' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                                <span className="font-bold text-xs text-[#2B2320] dark:text-zinc-100">
                                  ⚡ Pagar Sinal Pix
                                </span>
                              </div>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 shrink-0">
                                Sinal: R$ {depositAmountPix.toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#7A6D65] dark:text-zinc-400 mt-1.5 leading-snug">
                              Sinal obrigatório para reservar. O restante de <strong>R$ {Math.max(0, totalPricePix - depositAmountPix).toFixed(2).replace('.', ',')}</strong> (se pagar no Pix ou Dinheiro) {acceptsAnyCard && <span>ou <strong>R$ {Math.max(0, totalPriceCard - depositAmountPix).toFixed(2).replace('.', ',')}</strong> (se pagar no Cartão) </span>}você quita no atendimento.
                            </p>
                          </button>

                          {/* Card 2 (Direita): Pagar Valor Total */}
                          <button
                            type="button"
                            onClick={() => setPaymentChoice('full_pix')}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              effectivePaymentChoice === 'full_pix'
                                ? 'bg-[#FAF5EF] dark:bg-zinc-800 border-[#8C4E46] dark:border-rose-400 ring-2 ring-[#8C4E46]/20 shadow-xs'
                                : 'bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-700 hover:border-stone-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1.5 w-full">
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                  effectivePaymentChoice === 'full_pix' ? 'border-[#8C4E46] bg-[#8C4E46]' : 'border-stone-300 dark:border-zinc-600'
                                }`}>
                                  {effectivePaymentChoice === 'full_pix' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                                <span className="font-bold text-xs text-[#2B2320] dark:text-zinc-100">
                                  💳 Pagar Valor Total
                                </span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 block">
                                  Pix: R$ {totalPricePix.toFixed(2).replace('.', ',')}
                                </span>
                                {acceptsAnyCard && (
                                  <span className="text-[9px] text-stone-500 dark:text-zinc-400 font-semibold block mt-0.5">
                                    Cartão: R$ {totalPriceCard.toFixed(2).replace('.', ',')}
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-[11px] text-[#7A6D65] dark:text-zinc-400 mt-1.5 leading-snug">
                              Prefere quitar tudo sem depender de sinal? Pague o valor total via <strong>Pix</strong> (R$ {totalPricePix.toFixed(2).replace('.', ',')}) {acceptsAnyCard && <span>ou <strong>Cartão</strong> (R$ {totalPriceCard.toFixed(2).replace('.', ',')})</span>}.
                            </p>
                          </button>
                        </>
                      ) : (
                        /* CASO 2: PROCEDIMENTO SEM SINAL EXIGIDO */
                        <>
                          {/* Card 1 (Esquerda): Pagar Valor Total */}
                          <button
                            type="button"
                            onClick={() => setPaymentChoice('full_pix')}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              effectivePaymentChoice === 'full_pix'
                                ? 'bg-[#FAF5EF] dark:bg-zinc-800 border-[#8C4E46] dark:border-rose-400 ring-2 ring-[#8C4E46]/20 shadow-xs'
                                : 'bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-700 hover:border-stone-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1.5 w-full">
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                  effectivePaymentChoice === 'full_pix' ? 'border-[#8C4E46] bg-[#8C4E46]' : 'border-stone-300 dark:border-zinc-600'
                                }`}>
                                  {effectivePaymentChoice === 'full_pix' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                                <span className="font-bold text-xs text-[#2B2320] dark:text-zinc-100">
                                  💳 Pagar Valor Total
                                </span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 block">
                                  Pix: R$ {totalPricePix.toFixed(2).replace('.', ',')}
                                </span>
                                {acceptsAnyCard && (
                                  <span className="text-[9px] text-stone-500 dark:text-zinc-400 font-semibold block mt-0.5">
                                    Cartão: R$ {totalPriceCard.toFixed(2).replace('.', ',')}
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-[11px] text-[#7A6D65] dark:text-zinc-400 mt-1.5 leading-snug">
                              Prefere adiantar seu pagamento? Pague o valor total via <strong>Pix</strong> (R$ {totalPricePix.toFixed(2).replace('.', ',')}) {acceptsAnyCard && <span>ou <strong>Cartão</strong> (R$ {totalPriceCard.toFixed(2).replace('.', ',')})</span>}.
                            </p>
                          </button>

                          {/* Card 2 (Direita): Pagar no Dia do Atendimento */}
                          <button
                            type="button"
                            onClick={() => setPaymentChoice('pay_on_arrival')}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              effectivePaymentChoice === 'pay_on_arrival'
                                ? 'bg-[#FAF5EF] dark:bg-zinc-800 border-[#8C4E46] dark:border-rose-400 ring-2 ring-[#8C4E46]/20 shadow-xs'
                                : 'bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-700 hover:border-stone-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1.5 w-full">
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                  effectivePaymentChoice === 'pay_on_arrival' ? 'border-[#8C4E46] bg-[#8C4E46]' : 'border-stone-300 dark:border-zinc-600'
                                }`}>
                                  {effectivePaymentChoice === 'pay_on_arrival' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                                <span className="font-bold text-xs text-[#2B2320] dark:text-zinc-100">
                                  💵 Pagar no Dia do Atendimento
                                </span>
                              </div>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 shrink-0">
                                No Atendimento
                              </span>
                            </div>
                            <p className="text-[11px] text-[#7A6D65] dark:text-zinc-400 mt-1.5 leading-snug">
                              Pague presencialmente no dia do atendimento: <strong>R$ {totalPricePix.toFixed(2).replace('.', ',')}</strong> (se for no Pix ou Dinheiro) {acceptsAnyCard && <span>ou <strong>R$ {totalPriceCard.toFixed(2).replace('.', ',')}</strong> (se for no Cartão)</span>}.
                            </p>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cartão de Resumo */}
                <div className="p-3.5 rounded-2xl bg-[#FAF5EF] dark:bg-zinc-800/80 border border-[#EAE0D5] dark:border-zinc-700/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#7A6D65] dark:text-zinc-400">Atendimento:</span>
                    <span className="font-bold text-[#2B2320] dark:text-zinc-100 truncate max-w-[200px]">
                      {selectedServices.map(s => s.name).join(' + ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#7A6D65] dark:text-zinc-400">Duração estimada:</span>
                    <span className="font-semibold text-[#2B2320] dark:text-zinc-100">
                      {formattedTotalDuration}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#7A6D65] dark:text-zinc-400">Dia e Hora:</span>
                    <span className="font-bold text-[#2B2320] dark:text-zinc-100">
                      {formatDatePtBr(activeDate)} às {selectedTime}
                    </span>
                  </div>

                  {isSplitSchedule && (
                    <div className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold p-1.5 rounded-lg bg-amber-100/50">
                      ✂️ Solicitação de divisão de horários incluída (sujeita a aprovação).
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1.5 border-t border-[#E8DCCD] dark:border-zinc-700">
                    <div>
                      <span className="font-bold text-[#4A3D36] dark:text-zinc-300 block">Total no Pix / Dinheiro:</span>
                      {acceptsAnyCard && <span className="text-[10px] text-[#7A6D65] dark:text-zinc-400">ou no Cartão:</span>}
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-sm text-[#8C4E46] dark:text-rose-400 block">
                        R$ {totalPricePix.toFixed(2).replace('.', ',')}
                      </span>
                      {acceptsAnyCard && (
                        <span className="text-[10px] text-stone-600 dark:text-zinc-400 font-bold block">
                          R$ {totalPriceCard.toFixed(2).replace('.', ',')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Informação sobre Forma de Pagamento */}
                  {effectivePaymentChoice === 'pay_on_arrival' ? (
                    <div className="pt-2 text-[11px] text-emerald-900 dark:text-emerald-300 font-medium flex items-start gap-1.5 border-t border-emerald-200/60 dark:border-emerald-900/40">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">💵</span>
                      <span>
                        <strong>Opção escolhida: Pagar no dia do atendimento.</strong> Você pagará <strong>R$ {totalPricePix.toFixed(2).replace('.', ',')}</strong> (no Pix ou Dinheiro) {acceptsAnyCard && <span>ou <strong>R$ {totalPriceCard.toFixed(2).replace('.', ',')}</strong> (no Cartão) </span>}diretamente no espaço.
                      </span>
                    </div>
                  ) : effectivePaymentChoice === 'deposit_pix' ? (
                    <div className="pt-2 text-[11px] text-amber-900 dark:text-amber-200 font-medium flex items-start gap-1.5 border-t border-amber-200/60 dark:border-amber-900/40">
                      <span className="text-amber-600 dark:text-amber-400 font-bold shrink-0">⚡</span>
                      <span>
                        Este procedimento exige sinal antecipado de <strong>R$ {depositAmountPix.toFixed(2).replace('.', ',')} via Pix</strong> para garantir o horário. O saldo restante de <strong>R$ {Math.max(0, totalPricePix - depositAmountPix).toFixed(2).replace('.', ',')}</strong> (Pix/Dinheiro) {acceptsAnyCard && <span>ou <strong>R$ {Math.max(0, totalPriceCard - depositAmountPix).toFixed(2).replace('.', ',')}</strong> (Cartão) </span>}será pago no dia do atendimento.
                      </span>
                    </div>
                  ) : (
                    <div className="pt-2 text-[11px] text-emerald-900 dark:text-emerald-300 font-medium flex items-start gap-1.5 border-t border-emerald-200/60 dark:border-emerald-900/40">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">💳</span>
                      <span>
                        <strong>Pagamento Total Antecipado:</strong> Você optou por pagar o valor integral agora (Pix ou Cartão). As instruções estarão no WhatsApp.
                      </span>
                    </div>
                  )}

                  {/* Política de Pontualidade e Cancelamento */}
                  <div className="pt-2.5 border-t border-stone-200 dark:border-zinc-800 flex items-start gap-2 text-[10px] text-stone-500 dark:text-zinc-400 leading-tight bg-stone-50/70 dark:bg-zinc-800/40 p-2.5 rounded-xl">
                    <ShieldCheck className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-[#4A3D36] dark:text-zinc-300">Compromisso & Pontualidade:</span> Tolerância máxima de 10 minutos de atraso para manter a excelência do seu atendimento. Reagendamentos ou cancelamentos com até 2h de antecedência.
                    </div>
                  </div>
                </div>
                </div>

                {/* Botões de Ação fixos na base do card para garantir acesso imediato */}
                <div className="pt-3 mt-2 border-t border-[#F2E8DF] dark:border-zinc-800 flex items-center gap-2 shrink-0 bg-white dark:bg-zinc-900 sticky bottom-0 z-10">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-1/3 py-2.5 px-3 rounded-xl border border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-2/3 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#8C4E46] hover:bg-[#783F38] disabled:opacity-60 text-white text-xs font-bold shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>Salvando reserva...</span>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>
                          {effectivePaymentChoice === 'pay_on_arrival'
                            ? 'Solicitar Horário (Pagar no Atendimento)'
                            : effectivePaymentChoice === 'deposit_pix'
                            ? `Confirmar e Pagar Sinal (R$ ${depositAmountPix.toFixed(2).replace('.', ',')})`
                            : `Confirmar e Pagar Total (R$ ${totalPricePix.toFixed(2).replace('.', ',')})`}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ===================================================================== */}
            {/* PASSO 4: SUCESSO & COMPROVANTE */}
            {/* ===================================================================== */}
            {step === 4 && confirmedBooking && (
              <div className="py-2 text-center space-y-4 animate-in fade-in duration-300">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h3 className="serif text-lg font-bold text-[#2B2320] dark:text-zinc-100">
                    {confirmedBooking.payOnArrival ? 'Agendamento Solicitado!' : 'Agendamento Registrado!'}
                  </h3>
                  <p className="text-xs text-[#7A6D65] dark:text-zinc-400 max-w-xs mx-auto">
                    Obrigado, <strong>{confirmedBooking.clientName}</strong>. {confirmedBooking.payOnArrival ? 'Seu horário foi enviado para confirmação da profissional.' : 'Seu horário foi registrado com sucesso.'}
                  </p>
                </div>

                {/* Cartão do comprovante */}
                <div className="p-3.5 rounded-2xl bg-[#FAF5EF] dark:bg-zinc-800/80 border border-[#EAE0D5] dark:border-zinc-700/60 text-left text-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-[#EAE0D5] dark:border-zinc-700 pb-2">
                    <span className="text-[#7A6D65] dark:text-zinc-400 text-[11px]">Código da Reserva:</span>
                    <span className="font-mono font-bold text-[#8C4E46] dark:text-rose-400 text-[11px]">
                      #{confirmedBooking.id.slice(-6).toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-stone-500 dark:text-zinc-400 uppercase tracking-wider font-bold">Procedimento:</span>
                    <p className="font-bold text-[#2B2320] dark:text-zinc-100">{confirmedBooking.serviceName}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-stone-500 dark:text-zinc-400 uppercase tracking-wider font-bold">Data & Hora:</span>
                      <p className="font-semibold text-[#2B2320] dark:text-zinc-100">
                        {formatDatePtBr(confirmedBooking.date)} às {confirmedBooking.time}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-stone-500 dark:text-zinc-400 uppercase tracking-wider font-bold">Valor Total:</span>
                      <p className="font-extrabold text-[#8C4E46] dark:text-rose-400">
                        R$ {confirmedBooking.totalPrice.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>

                  <div className="pt-1 border-t border-[#EAE0D5] dark:border-zinc-700 text-[11px] text-[#7A6D65] dark:text-zinc-400 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                    <span className="truncate">{professional.address}</span>
                  </div>
                </div>

                {/* Bloco Explicativo: Pagar no Dia do Atendimento */}
                {confirmedBooking.payOnArrival && (
                  <div className="p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-left space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                        <span>Pagar no Dia do Atendimento</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 dark:bg-amber-900 dark:text-amber-200">
                        Aguardando Confirmação
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-900 dark:text-amber-300 leading-relaxed">
                      Você escolheu <strong>Pagar no Dia do Atendimento</strong>. Seu pedido foi enviado para <strong>{professional.name}</strong>, que irá conferir e confirmar o horário na agenda. O pagamento de <strong>R$ {confirmedBooking.totalPrice.toFixed(2).replace('.', ',')}</strong> será feito diretamente no local (em {(professional.acceptedPaymentMethods || ['pix', 'credit_card', 'cash']).map(m => m === 'credit_card' ? 'Cartão' : m === 'pix' ? 'Pix' : 'Dinheiro').join(', ')}).
                    </p>
                  </div>
                )}

                {/* Bloco: PAGAMENTO TOTAL ANTECIPADO VIA PIX */}
                {!confirmedBooking.payOnArrival && (confirmedBooking.payFullInAdvance || confirmedBooking.paymentOption === 'pay_full_pix' || (confirmedBooking.depositAmount && confirmedBooking.depositAmount === confirmedBooking.totalPrice)) && professional.pixKey && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-left space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                        <span>Pagamento Total: R$ {confirmedBooking.totalPrice.toFixed(2).replace('.', ',')}</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-950 dark:bg-emerald-900 dark:text-emerald-200">
                        100% via Pix
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                      Copie a chave Pix abaixo e envie o comprovante no WhatsApp de <strong>{professional.name}</strong> para quitação da sua vaga:
                    </p>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        readOnly
                        value={professional.pixKey}
                        className="flex-1 py-1.5 px-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-emerald-300 dark:border-emerald-800 font-mono text-[11px] text-stone-800 dark:text-zinc-200"
                      />
                      <button
                        type="button"
                        onClick={handleCopyPix}
                        className="inline-flex items-center gap-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer transition-colors"
                      >
                        {isPixCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* SINAL OBRIGATÓRIO VIA PIX (COM RESTANTE NO ATENDIMENTO) */}
                {!confirmedBooking.payOnArrival && !confirmedBooking.payFullInAdvance && confirmedBooking.paymentOption !== 'pay_full_pix' && confirmedBooking.depositRequired && confirmedBooking.depositAmount && confirmedBooking.depositAmount < confirmedBooking.totalPrice && professional.pixKey && (
                  <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-left space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                        Sinal de Reserva: R$ {confirmedBooking.depositAmount.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                        Sinal Obrigatório
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300">
                      Copie a chave Pix abaixo e envie o comprovante no WhatsApp da profissional para confirmar o seu horário. O saldo de <strong>R$ {Math.max(0, confirmedBooking.totalPrice - confirmedBooking.depositAmount).toFixed(2).replace('.', ',')}</strong> será pago no dia do atendimento:
                    </p>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        readOnly
                        value={professional.pixKey}
                        className="flex-1 py-1.5 px-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-amber-300 dark:border-amber-800 font-mono text-[11px] text-stone-800 dark:text-zinc-200"
                      />
                      <button
                        type="button"
                        onClick={handleCopyPix}
                        className="inline-flex items-center gap-1 py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer transition-colors"
                      >
                        {isPixCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Botão de Enviar no WhatsApp (Ocultado completamente se o sistema tiver gateway ativo ou pagamento já identificado) */}
                <div className="space-y-2 pt-1">
                  {!professional.hasPaymentGateway && !professional.pixGatewayActive && !confirmedBooking.depositPaid && (
                    <a
                      href={getWhatsAppConfirmationUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold shadow-md transition-transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 fill-white" />
                      <span>Enviar Comprovante no WhatsApp</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full py-2.5 px-4 rounded-xl bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Fazer Outro Agendamento
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL DE PEDIDO DE ENCAIXE COM PERÍODO, PROCEDIMENTOS E APROVAÇÃO */}
      {/* ========================================================================= */}
      {isEncaixeModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsEncaixeModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-5 sm:p-6 border border-[#E8DCCD] dark:border-zinc-800 shadow-2xl space-y-3.5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#F2E8DF] dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#8C4E46]/10 text-[#8C4E46] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <h3 className="serif text-sm sm:text-base font-bold text-[#2B2320] dark:text-zinc-100">
                    Solicitar Encaixe
                  </h3>
                  <p className="text-[11px] text-[#7A6D65] dark:text-zinc-400">
                    Com {professional.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEncaixeModalOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {encaixeSuccess ? (
              <div className="py-4 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-[#2B2320] dark:text-zinc-100">
                  Pedido de Encaixe Enviado!
                </h4>
                <p className="text-xs text-[#7A6D65] dark:text-zinc-400 leading-relaxed">
                  A conversa foi aberta no WhatsApp da profissional com todos os detalhes. Aguarde a confirmação de aprovação do seu horário!
                </p>
                <button
                  type="button"
                  onClick={() => setIsEncaixeModalOpen(false)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#8C4E46] text-white font-bold text-xs cursor-pointer"
                >
                  Concluir
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendEncaixeRequest} className="space-y-3 text-xs">
                {encaixeError && (
                  <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                    {encaixeError}
                  </div>
                )}

                {/* Resumo Dinâmico Moldado pelos Procedimentos */}
                <div className="p-2.5 rounded-2xl bg-[#FAF5EF] dark:bg-zinc-800/80 border border-[#EAE0D5] dark:border-zinc-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#4A3D36] dark:text-zinc-300 text-[11px] uppercase tracking-wider">
                      Procedimento(s) para o Encaixe:
                    </span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                      {selectedServices.length > 0 ? `${selectedServices.length} selecionado(s)` : 'Nenhum'}
                    </span>
                  </div>

                  {selectedServices.length > 0 ? (
                    <div className="space-y-1">
                      {selectedServices.map(s => (
                        <div key={s.id} className="flex items-center justify-between text-[11px]">
                          <span className="text-[#2B2320] dark:text-zinc-100 font-semibold truncate pr-2">
                            • {s.name} ({s.durationMinutes} min)
                          </span>
                          <span className="font-bold text-[#8C4E46] dark:text-rose-400 shrink-0">
                            R$ {s.price.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      ))}
                      <div className="pt-1.5 mt-1 border-t border-[#EAE0D5] dark:border-zinc-700 flex items-center justify-between text-[11px] font-bold">
                        <span className="text-stone-600 dark:text-zinc-300">Total estimado: {formattedTotalDuration}</span>
                        <span className="text-[#8C4E46] dark:text-rose-400">R$ {totalPricePix.toFixed(2).replace('.', ',')}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                      <p className="text-[11px] text-stone-500">Selecione pelo menos um procedimento:</p>
                      {services.map(s => {
                        const isChecked = selectedServices.some(sel => sel.id === s.id);
                        return (
                          <label key={s.id} className="flex items-center justify-between p-1.5 rounded-lg border border-stone-200 dark:border-zinc-700 cursor-pointer">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleService(s)}
                                className="rounded text-[#8C4E46]"
                              />
                              <span className="text-[11px] font-medium">{s.name}</span>
                            </div>
                            <span className="text-[10px] font-bold text-[#8C4E46]">R$ {s.price.toFixed(2).replace('.', ',')}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Alerta de Aprovação Obrigatória da Profissional */}
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Atenção:</strong> O pedido de encaixe depende de desistências ou aberturas extras e <strong>sempre requer a confirmação direta da profissional</strong>.
                  </span>
                </div>

                {/* Seletor Lúdico Opcional: Separar Dias/Turnos por Procedimento */}
                {selectedServices.length > 1 && (
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-[#FAF5EF] via-[#FDFBF7] to-rose-50/40 dark:from-zinc-800 dark:to-zinc-800/80 border border-[#EAE0D5] dark:border-zinc-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-[#8C4E46]/10 text-[#8C4E46] flex items-center justify-center text-xs">
                          ✨
                        </div>
                        <div>
                          <span className="text-xs font-bold text-[#2B2320] dark:text-zinc-100 block">
                            Separar horários por procedimento?
                          </span>
                          <span className="text-[10px] text-[#7A6D65] dark:text-zinc-400 block">
                            Defina dias ou turnos diferentes para cada um
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsSplitEncaixe(!isSplitEncaixe)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isSplitEncaixe ? 'bg-[#8C4E46]' : 'bg-stone-300 dark:bg-zinc-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            isSplitEncaixe ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}

                {/* MODO 1: DETALHAMENTO LÚDICO POR PROCEDIMENTO */}
                {isSplitEncaixe && selectedServices.length > 1 ? (
                  <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                    <label className="block font-bold text-[#4A3D36] dark:text-zinc-300 text-xs">
                      Defina a preferência de cada procedimento:
                    </label>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {selectedServices.map((service, sIdx) => {
                        const pref = getProcedureEncaixePref(service.id);
                        return (
                          <div 
                            key={service.id} 
                            className="p-3 rounded-2xl bg-white dark:bg-zinc-800 border border-[#EAE0D5] dark:border-zinc-700 shadow-xs space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-[#FAF5EF] dark:bg-zinc-700 text-[#8C4E46] dark:text-rose-300 font-bold text-[10px] flex items-center justify-center border border-[#EAE0D5] dark:border-zinc-600">
                                  {sIdx + 1}
                                </span>
                                <span className="font-bold text-[#2B2320] dark:text-zinc-100 text-xs">
                                  {service.name}
                                </span>
                              </div>
                              <span className="text-[10px] font-semibold text-stone-500 dark:text-zinc-400 bg-stone-100 dark:bg-zinc-700 px-2 py-0.5 rounded-full">
                                {service.durationMinutes} min
                              </span>
                            </div>

                            {/* Mini chips de turnos */}
                            <div className="grid grid-cols-4 gap-1">
                              {[
                                { id: 'manha', label: 'Manhã', icon: Sun, color: 'text-amber-500' },
                                { id: 'tarde', label: 'Tarde', icon: Sunset, color: 'text-orange-500' },
                                { id: 'noite', label: 'Noite', icon: Moon, color: 'text-indigo-500' },
                                { id: 'qualquer', label: 'Livre', icon: Clock, color: 'text-emerald-500' },
                              ].map((item) => {
                                const IconComp = item.icon;
                                const isSel = pref.period === item.id;
                                return (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => updateProcedureEncaixePref(service.id, 'period', item.id)}
                                    className={`py-1.5 px-1 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                                      isSel
                                        ? 'border-[#8C4E46] bg-[#FAF5EF] dark:bg-zinc-700 text-[#8C4E46] dark:text-rose-300 font-bold ring-1 ring-[#8C4E46]/30'
                                        : 'border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-400 hover:border-stone-300'
                                    }`}
                                  >
                                    <IconComp className={`w-3 h-3 ${item.color}`} />
                                    <span className="text-[10px] leading-tight">{item.label}</span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Data específica do procedimento */}
                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-100 dark:border-zinc-700">
                              <span className="text-[10px] text-[#7A6D65] dark:text-zinc-400 font-medium">Data sugerida:</span>
                              <input
                                type="date"
                                value={pref.date}
                                onChange={(e) => updateProcedureEncaixePref(service.id, 'date', e.target.value)}
                                className="px-2 py-1 rounded-lg border border-[#EAE0D5] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[11px] text-[#2B2320] dark:text-zinc-100"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* MODO 2: PADRÃO / RÁPIDO (ÚNICO PERÍODO E DATA PARA TODOS) */
                  <>
                    <div>
                      <label className="block font-bold text-[#4A3D36] dark:text-zinc-300 mb-1.5">
                        Escolha o Período Preferencial:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setEncaixePeriod('manha')}
                          className={`p-2 rounded-xl border flex items-center gap-1.5 transition-colors cursor-pointer text-left ${
                            encaixePeriod === 'manha'
                              ? 'border-[#8C4E46] bg-[#FAF5EF] dark:bg-zinc-800 text-[#8C4E46] font-bold'
                              : 'border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-zinc-300'
                          }`}
                        >
                          <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <div>
                            <span className="block text-xs font-semibold">Manhã</span>
                            <span className="text-[10px] text-stone-500">08h às 12h</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEncaixePeriod('tarde')}
                          className={`p-2 rounded-xl border flex items-center gap-1.5 transition-colors cursor-pointer text-left ${
                            encaixePeriod === 'tarde'
                              ? 'border-[#8C4E46] bg-[#FAF5EF] dark:bg-zinc-800 text-[#8C4E46] font-bold'
                              : 'border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-zinc-300'
                          }`}
                        >
                          <Sunset className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                          <div>
                            <span className="block text-xs font-semibold">Tarde</span>
                            <span className="text-[10px] text-stone-500">12h às 18h</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEncaixePeriod('noite')}
                          className={`p-2 rounded-xl border flex items-center gap-1.5 transition-colors cursor-pointer text-left ${
                            encaixePeriod === 'noite'
                              ? 'border-[#8C4E46] bg-[#FAF5EF] dark:bg-zinc-800 text-[#8C4E46] font-bold'
                              : 'border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-zinc-300'
                          }`}
                        >
                          <Moon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <div>
                            <span className="block text-xs font-semibold">Noite</span>
                            <span className="text-[10px] text-stone-500">Após 18h</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEncaixePeriod('qualquer')}
                          className={`p-2 rounded-xl border flex items-center gap-1.5 transition-colors cursor-pointer text-left ${
                            encaixePeriod === 'qualquer'
                              ? 'border-[#8C4E46] bg-[#FAF5EF] dark:bg-zinc-800 text-[#8C4E46] font-bold'
                              : 'border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-zinc-300'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <div>
                            <span className="block text-xs font-semibold">Qualquer</span>
                            <span className="text-[10px] text-stone-500">O que liberar</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Data Geral */}
                    <div>
                      <label className="block text-[11px] font-bold text-[#4A3D36] dark:text-zinc-300 mb-1">
                        Data Desejada:
                      </label>
                      <input
                        type="date"
                        value={encaixeDate || activeDate}
                        onChange={(e) => setEncaixeDate(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-[#EAE0D5] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-[#2B2320] dark:text-zinc-100"
                      />
                    </div>
                  </>
                )}

                {/* Observação Geral */}
                <div>
                  <label className="block text-[11px] font-bold text-[#4A3D36] dark:text-zinc-300 mb-1">
                    Observação ou preferência para a profissional:
                  </label>
                  <textarea
                    rows={2}
                    value={encaixeObservation}
                    onChange={(e) => setEncaixeObservation(e.target.value)}
                    placeholder="Ex: Só posso após 17:30, ou se alguém desmarcar me chame..."
                    className="w-full px-3 py-1.5 rounded-xl border border-[#EAE0D5] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-[#2B2320] dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none"
                  />
                </div>

                {/* Dados da Cliente */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-100 dark:border-zinc-800">
                  <div>
                    <label className="block text-[11px] font-bold text-[#4A3D36] dark:text-zinc-300 mb-1">
                      Seu Nome:
                    </label>
                    <input
                      type="text"
                      required
                      value={encaixeName}
                      onChange={(e) => setEncaixeName(e.target.value)}
                      placeholder="Nome completo"
                      className="w-full px-3 py-1.5 rounded-xl border border-[#EAE0D5] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-[#2B2320] dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#4A3D36] dark:text-zinc-300 mb-1">
                      WhatsApp:
                    </label>
                    <input
                      type="tel"
                      required
                      value={encaixePhone}
                      onChange={handleEncaixePhoneChange}
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                      className="w-full px-3 py-1.5 rounded-xl border border-[#EAE0D5] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-[#2B2320] dark:text-zinc-100"
                    />
                  </div>
                </div>

                {/* Botões de Ação com Proporção Equilibrada */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEncaixeModalOpen(false)}
                    className="w-1/3 py-2 px-3 rounded-xl border border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={selectedServices.length === 0}
                    className="w-2/3 py-2 px-4 rounded-xl bg-[#8C4E46] hover:bg-[#783F38] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-transform active:scale-[0.99]"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Solicitar no WhatsApp</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LIGHTBOX / GALERIA DE FOTOS DO PROCEDIMENTO COM ZOOM */}
      {/* ========================================================================= */}
      {lightboxState.isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          onClick={() => setLightboxState(prev => ({ ...prev, isOpen: false, zoom: 1 }))}
        >
          <div 
            className="relative w-full max-w-md bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Barra Superior com Título e Ações */}
            <div className="p-3 bg-zinc-950/80 border-b border-zinc-800 text-white flex items-center justify-between text-xs">
              <div className="min-w-0 flex-1 pr-2">
                <span className="font-bold truncate block text-xs">{lightboxState.serviceName}</span>
                {lightboxState.photos.length > 1 && (
                  <span className="text-zinc-400 text-[10px]">
                    Foto {lightboxState.currentIndex + 1} de {lightboxState.photos.length}
                  </span>
                )}
              </div>

              {/* Controles de Zoom */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  title="Diminuir Zoom"
                  onClick={() => setLightboxState(prev => ({ ...prev, zoom: Math.max(1, (prev.zoom || 1) - 0.5) }))}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Aumentar Zoom"
                  onClick={() => setLightboxState(prev => ({ ...prev, zoom: Math.min(3, (prev.zoom || 1) + 0.5) }))}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                {(lightboxState.zoom || 1) > 1 && (
                  <button
                    type="button"
                    title="Restaurar Tamanho"
                    onClick={() => setLightboxState(prev => ({ ...prev, zoom: 1 }))}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setLightboxState(prev => ({ ...prev, isOpen: false, zoom: 1 }))}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Imagem com visualização e zoom */}
            <div className="relative aspect-4/3 w-full bg-black overflow-hidden flex items-center justify-center">
              <div 
                className="relative w-full h-full transition-transform duration-200 ease-out"
                style={{ transform: `scale(${lightboxState.zoom || 1})` }}
              >
                <Image
                  src={lightboxState.photos[lightboxState.currentIndex]?.url || lightboxState.photos[0]?.url}
                  alt={lightboxState.serviceName}
                  fill
                  sizes="450px"
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {lightboxState.photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setLightboxState(prev => ({
                      ...prev,
                      currentIndex: (prev.currentIndex - 1 + prev.photos.length) % prev.photos.length,
                      zoom: 1
                    }))}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center cursor-pointer transition-transform active:scale-95 z-10"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setLightboxState(prev => ({
                      ...prev,
                      currentIndex: (prev.currentIndex + 1) % prev.photos.length,
                      zoom: 1
                    }))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center cursor-pointer transition-transform active:scale-95 z-10"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Detalhes do Procedimento no Rodapé da Lightbox (Apenas descrição, sem valores sobre ou junto à foto) */}
            {lightboxState.photos[lightboxState.currentIndex]?.subtitle && (
              <div className="p-3 bg-zinc-950 text-white flex items-center justify-between text-xs border-t border-zinc-800">
                <span className="text-zinc-300 text-[11px] leading-relaxed">
                  {lightboxState.photos[lightboxState.currentIndex]?.subtitle}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE CONSULTA DE AGENDAMENTOS (MINHAS RESERVAS) */}
      <ClientBookingLookupModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        professional={professional}
        onBookNew={() => {
          setIsSearchModalOpen(false);
          setStep(1);
        }}
      />

    </div>
  );
}
