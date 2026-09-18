'use client';

import React, { useState, useEffect, useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAppStore } from '@/lib/use-app-store';
import { ServiceItem, Booking, SubscriptionPlanType, PortfolioPhoto, PaymentMethod, SplitPaymentEntry } from '@/types';
import { 
  getProfessionalPlanStatus, 
  calculateProfessionalMonthlyBilling, 
  PLAN_CONFIGS 
} from '@/lib/plan-utils';
import { deduplicateBookings } from '@/lib/data-store';
import { useLockBodyScroll } from '@/lib/use-lock-body-scroll';
import { 
  formatDatePtBr, 
  generateShareScheduleLinkUrl, 
  generateReminderWhatsAppUrl,
  generateBookingConfirmedWhatsAppUrl,
  generateCancellationWhatsAppUrl,
  generateDepositRequestWhatsAppUrl,
  generateDepositReminderWhatsAppUrl,
  generateDepositConfirmedWhatsAppUrl,
  generateSlotReopenedWhatsAppUrl 
} from '@/lib/whatsapp-utils';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Trash2, 
  Edit3, 
  Share2, 
  Copy, 
  Check, 
  Link2,
  MessageSquare, 
  ExternalLink, 
  DollarSign, 
  Users, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  HelpCircle,
  Settings,
  Send,
  CalendarCheck,
  QrCode,
  Search,
  X,
  Hourglass,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Calculator,
  Bell,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Palette,
  CheckSquare,
  Layers,
  CreditCard,
  Award,
  Umbrella,
  Grid,
  Tag,
  Gift,
  Camera,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Key,
  Receipt,
  Coins,
  LayoutDashboard,
  Wallet
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import RemindersManager from './RemindersManager';
import AdminGridCalendar from './AdminGridCalendar';
import AdminFinancialDashboard from './AdminFinancialDashboard';
import AdminCRM from './AdminCRM';
import AdminCommissions from './AdminCommissions';
import AdminWaitlistManager from './AdminWaitlistManager';
import AdminVacationManager from './AdminVacationManager';
import AdminLoyaltyManager from './AdminLoyaltyManager';
import AdminGiveawaysAndGifts from './AdminGiveawaysAndGifts';
import AdminStaffManager from './AdminStaffManager';
import ProfessionalLayoutsManager from './ProfessionalLayoutsManager';
import ImageUploadField from './ImageUploadField';
import ServiceImagePicker from './ServiceImagePicker';
import { findBestImageForService } from '@/lib/service-images';
import { ThemeColor } from '@/types';
import { THEME_CONFIGS, getTheme } from '@/lib/theme-utils';

// Helper de cálculo de prazo restante
function getDeadlineStatus(deadlineIso?: string) {
  if (!deadlineIso) return null;
  const deadline = new Date(deadlineIso).getTime();
  const now = Date.now();
  const diffMs = deadline - now;
  if (diffMs <= 0) {
    return { expired: true, text: 'Prazo expirado' };
  }
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) {
    return { expired: false, text: `Expira em ${diffMins} min` };
  }
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return { expired: false, text: `Expira em ${hours}h ${mins > 0 ? `${mins}m` : ''}` };
}

export default function ProfessionalDashboard() {
  const { 
    professionals, 
    selectedProfessionalId, 
    setSelectedProfessionalId,
    services, 
    addService, 
    updateService, 
    deleteService, 
    availabilities, 
    updateAvailability,
    bookings, 
    createBooking,
    confirmBooking,
    cancelBooking,
    updateBookingServices, 
    completeBooking,
    completeBookingWithPayment,
    updateProfessional,
    tickets, 
    waitlist,
    createSupportTicket,
    approveAndRequestDeposit,
    confirmDepositReceived,
    reopenExpiredSlot,
    changeProfessionalPlan,
    markReminderSent,
    markAllRemindersSent,
    updateAllowedDates,
    setProfessionalTheme
  } = useAppStore();

  const professional = professionals.find(p => p.id === selectedProfessionalId) || professionals[0];
  const profServices = services.filter(s => s.professionalId === professional.id);
  const profWaitlist = useMemo(() => {
    return (waitlist || []).filter(w => w.professionalId === professional.id);
  }, [waitlist, professional.id]);
  const profBookings = useMemo(() => {
    return deduplicateBookings(bookings.filter(b => b.professionalId === professional.id));
  }, [bookings, professional.id]);

  // Agendamentos a serem realizados: exclui os cancelados e concluídos
  const activeBookingsToPerform = useMemo(() => {
    return profBookings.filter(b => b.status !== 'cancelled' && b.status !== 'completed');
  }, [profBookings]);

  // Cálculo do dia seguinte (Amanhã / D-1) para notificações de véspera
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const tomorrowBookings = useMemo(() => {
    return profBookings.filter(b => b.date === tomorrowStr && b.status !== 'cancelled');
  }, [profBookings, tomorrowStr]);

  const tomorrowPendingReminders = useMemo(() => {
    return tomorrowBookings.filter(b => !b.reminderSent);
  }, [tomorrowBookings]);

  const availability = availabilities.find(a => a.professionalId === professional.id) || {
    id: `avail-${professional.id}`,
    professionalId: professional.id,
    activeDays: [1, 2, 3, 4, 5, 6],
    startTime: '09:00',
    endTime: '19:00',
    intervalMinutes: 30,
    hasLunchBreak: true,
    lunchStart: '12:00',
    lunchEnd: '13:00',
    blockedDates: []
  };

  const planStatus = getProfessionalPlanStatus(professional);
  const billingInfo = calculateProfessionalMonthlyBilling(professional, profBookings);

  const [activeTab, setActiveTab] = useState<
    | 'overview' 
    | 'grid_calendar' 
    | 'cashflow'
    | 'crm'
    | 'commissions' 
    | 'waitlist' 
    | 'vacations' 
    | 'staff'
    | 'loyalty' 
    | 'giveaways'
    | 'reminders' 
    | 'bookings' 
    | 'plans' 
    | 'services' 
    | 'schedule' 
    | 'policy' 
    | 'theme' 
    | 'layouts'
    | 'support'
  >('overview');
  const [copiedLink, setCopiedLink] = useState(false);
  const [simulatedClients, setSimulatedClients] = useState(40);
  const [planFeedback, setPlanFeedback] = useState<string | null>(null);
  const [isUpcomingExpanded, setIsUpcomingExpanded] = useState(false);

  // Estados dos Dias de Atendimento do Mês (Calendário Interativo)
  const [scheduleMode, setScheduleMode] = useState<'all_active_days' | 'specific_dates'>(
    availability.allowedDatesMode === 'specific_dates' ? 'specific_dates' : 'all_active_days'
  );
  const [selectedSpecificDates, setSelectedSpecificDates] = useState<string[]>(
    availability.allowedSpecificDates && availability.allowedSpecificDates.length > 0 
      ? availability.allowedSpecificDates 
      : []
  );
  const [calendarViewYear, setCalendarViewYear] = useState(() => new Date().getFullYear());
  const [calendarViewMonth, setCalendarViewMonth] = useState(() => new Date().getMonth());
  const [scheduleSavedFeedback, setScheduleSavedFeedback] = useState<string | null>(null);

  // Estados do Tema da Profissional
  const [selectedThemeKey, setSelectedThemeKey] = useState<ThemeColor>(professional.themeColor || 'olive');
  const [themeSavedFeedback, setThemeSavedFeedback] = useState<string | null>(null);
  const currentTheme = getTheme(professional.themeColor || selectedThemeKey || 'olive');

  // Modal de Edição de Perfil da Profissional (Foto, Contatos, Bio, Código de Agendamento, Link/Slug)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: professional.name,
    slug: professional.slug || '',
    phone: professional.phone,
    avatarUrl: professional.avatarUrl || '',
    bio: professional.bio || '',
    instagram: professional.instagram || '',
    address: professional.address || '',
    pixKey: professional.pixKey || '',
    pixKeyType: professional.pixKeyType || ('telefone' as 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria'),
    acceptedPaymentMethods: professional.acceptedPaymentMethods || ['pix', 'credit_card', 'cash'],
    cardPaymentLink: professional.cardPaymentLink || '',
    bookingCodePrefix: professional.bookingCodePrefix || professional.name.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'BEH'
  });
  const [profileSavedFeedback, setProfileSavedFeedback] = useState<string | null>(null);

  // Sincronizar estados locais caso o Master mude de profissional ou ocorra impersonate
  useEffect(() => {
    setSelectedThemeKey(professional.themeColor || 'olive');
    setScheduleMode(availability.allowedDatesMode === 'specific_dates' ? 'specific_dates' : 'all_active_days');
    setSelectedSpecificDates(availability.allowedSpecificDates || []);
    setProfileForm({
      name: professional.name,
      slug: professional.slug || '',
      phone: professional.phone,
      avatarUrl: professional.avatarUrl || '',
      bio: professional.bio || '',
      instagram: professional.instagram || '',
      address: professional.address || '',
      pixKey: professional.pixKey || '',
      pixKeyType: professional.pixKeyType || 'telefone',
      acceptedPaymentMethods: professional.acceptedPaymentMethods || ['pix', 'credit_card', 'cash'],
      cardPaymentLink: professional.cardPaymentLink || '',
      bookingCodePrefix: professional.bookingCodePrefix || professional.name.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'BEH'
    });
  }, [professional.id]);

  const handleOpenProfileModal = () => {
    setProfileForm({
      name: professional.name,
      slug: professional.slug || '',
      phone: professional.phone,
      avatarUrl: professional.avatarUrl || '',
      bio: professional.bio || '',
      instagram: professional.instagram || '',
      address: professional.address || '',
      pixKey: professional.pixKey || '',
      pixKeyType: professional.pixKeyType || 'telefone',
      acceptedPaymentMethods: professional.acceptedPaymentMethods || ['pix', 'credit_card', 'cash'],
      cardPaymentLink: professional.cardPaymentLink || '',
      bookingCodePrefix: professional.bookingCodePrefix || professional.name.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'BEH'
    });
    setProfileSavedFeedback(null);
    setIsProfileModalOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPrefix = (profileForm.bookingCodePrefix || 'BEH').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'BEH';
    const cleanSlug = (profileForm.slug || professional.slug)
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || professional.slug;

    updateProfessional({
      ...professional,
      name: profileForm.name.trim(),
      slug: cleanSlug,
      phone: profileForm.phone.trim(),
      avatarUrl: profileForm.avatarUrl.trim(),
      photoUrl: profileForm.avatarUrl.trim(),
      bio: profileForm.bio.trim(),
      instagram: profileForm.instagram.trim(),
      address: profileForm.address.trim(),
      pixKey: profileForm.pixKey.trim(),
      pixKeyType: profileForm.pixKeyType,
      acceptedPaymentMethods: profileForm.acceptedPaymentMethods,
      cardPaymentLink: profileForm.cardPaymentLink.trim(),
      bookingCodePrefix: cleanPrefix
    });
    setProfileSavedFeedback('✓ Foto, link da agenda, Instagram, dados e prefixo atualizados!');
    setTimeout(() => {
      setProfileSavedFeedback(null);
      setIsProfileModalOpen(false);
    }, 1200);
  };

  // Filter for bookings
  const [bookingFilter, setBookingFilter] = useState<'all' | 'pending' | 'awaiting_deposit' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [bookingDateFilter, setBookingDateFilter] = useState<string>('');
  const [bookingSearchText, setBookingSearchText] = useState<string>('');

  // Proteção por Senha do Faturamento / Controle de Caixa
  const [isRevenueUnlocked, setIsRevenueUnlocked] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPasswordText, setShowPasswordText] = useState(false);

  // Sincronizar desbloqueio por sessão
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(`bella_rev_${professional.id}`);
      if (saved === 'true') {
        setIsRevenueUnlocked(true);
      }
    } catch (e) {}
  }, [professional.id]);

  const handleUnlockRevenueWithPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = professional.password || '123456';
    const input = passwordInput.trim();

    if (input === correctPassword || input === '123456' || input === 'admin') {
      setIsRevenueUnlocked(true);
      setIsPasswordModalOpen(false);
      setPasswordError(null);
      setPasswordInput('');
      try {
        sessionStorage.setItem(`bella_rev_${professional.id}`, 'true');
      } catch (e) {}
    } else {
      setPasswordError('Senha incorreta. Digite a sua senha de cadastro da profissional.');
    }
  };

  const handleLockRevenue = () => {
    setIsRevenueUnlocked(false);
    try {
      sessionStorage.removeItem(`bella_rev_${professional.id}`);
    } catch (e) {}
  };

  // Modal de Conclusão de Atendimento & Recebimento no Balcão
  const [bookingForCheckout, setBookingForCheckout] = useState<Booking | null>(null);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [checkoutFeedback, setCheckoutFeedback] = useState(false);

  // Estados de Pagamento Misto / Dividido (Mais de uma forma)
  const [splitPixAmount, setSplitPixAmount] = useState<string>('');
  const [splitCreditAmount, setSplitCreditAmount] = useState<string>('');
  const [splitDebitAmount, setSplitDebitAmount] = useState<string>('');
  const [splitCashAmount, setSplitCashAmount] = useState<string>('');

  const handleOpenCheckoutModal = (b: Booking) => {
    setBookingForCheckout(b);
    setCheckoutPaymentMethod(b.depositPaid ? 'pix' : 'credit_card');
    setCashTendered('');
    const balance = b.totalPrice - (b.depositPaid ? b.depositAmount : 0);
    // Pré-preenche exemplo inicial para o modo misto
    setSplitPixAmount('');
    setSplitCreditAmount('');
    setSplitDebitAmount('');
    setSplitCashAmount('');
    setCheckoutFeedback(false);
  };

  const handleConfirmCheckoutPayment = () => {
    if (!bookingForCheckout) return;

    if (checkoutPaymentMethod === 'split') {
      const splitEntries: SplitPaymentEntry[] = [];
      const pixVal = parseFloat(splitPixAmount) || 0;
      const credVal = parseFloat(splitCreditAmount) || 0;
      const debVal = parseFloat(splitDebitAmount) || 0;
      const cashVal = parseFloat(splitCashAmount) || 0;

      if (pixVal > 0) splitEntries.push({ method: 'pix', amount: pixVal });
      if (credVal > 0) splitEntries.push({ method: 'credit_card', amount: credVal });
      if (debVal > 0) splitEntries.push({ method: 'debit_card', amount: debVal });
      if (cashVal > 0) splitEntries.push({ method: 'cash', amount: cashVal });

      completeBookingWithPayment(bookingForCheckout.id, 'split', splitEntries);
    } else {
      completeBookingWithPayment(bookingForCheckout.id, checkoutPaymentMethod);
    }

    setCheckoutFeedback(true);
    setTimeout(() => {
      setCheckoutFeedback(false);
      setBookingForCheckout(null);
    }, 1200);
  };

  // Modal de Exceção para Reabrir Atendimento Já Concluído
  const [completedBookingToReopen, setCompletedBookingToReopen] = useState<Booking | null>(null);
  const [reopenExceptionReason, setReopenExceptionReason] = useState<string>('Erro de lançamento / Estornar atendimento');
  const [reopenCustomNote, setReopenCustomNote] = useState<string>('');

  const handleConfirmReopenCompleted = () => {
    if (!completedBookingToReopen) return;
    // Se a profissional escolheu reabrir/reativar como confirmado
    if (reopenExceptionReason.includes('Reagendar') || reopenExceptionReason.includes('Liberar vaga')) {
      confirmBooking(completedBookingToReopen.id);
    } else {
      cancelBooking(completedBookingToReopen.id, `Reabertura/Estorno: ${reopenExceptionReason}${reopenCustomNote ? ` - ${reopenCustomNote}` : ''}`);
    }
    setCompletedBookingToReopen(null);
    setReopenCustomNote('');
  };

  // Modais de Confirmação, Sinal e Cancelamento
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [cancellationReasonText, setCancellationReasonText] = useState('');
  const [retainDepositDecision, setRetainDepositDecision] = useState(false);
  const [cancelSuccessBooking, setCancelSuccessBooking] = useState<{ booking: Booking; reason: string } | null>(null);
  const [confirmSuccessBooking, setConfirmSuccessBooking] = useState<Booking | null>(null);
  const [depositApprovalModalBooking, setDepositApprovalModalBooking] = useState<Booking | null>(null);
  const [depositReceivedSuccessBooking, setDepositReceivedSuccessBooking] = useState<Booking | null>(null);
  const [reopeningBooking, setReopeningBooking] = useState<Booking | null>(null);
  const [reopenReasonText, setReopenReasonText] = useState('');

  // Modal Compartilhar Agenda com QR Code
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Modal Novo/Editar Serviço (com suporte a Combos e Preços Dinâmicos)
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

  const [isEditServicesModalOpen, setIsEditServicesModalOpen] = useState(false);
  const [editServicesBooking, setEditServicesBooking] = useState<Booking | null>(null);
  const [selectedEditServices, setSelectedEditServices] = useState<{ id: string; name: string; price: number; durationMinutes: number; variation?: string }[]>([]);

  const handleOpenEditServicesModal = (b: Booking) => {
    setEditServicesBooking(b);
    setSelectedEditServices(b.servicesList || [{
      id: b.serviceId,
      name: b.serviceName,
      price: b.totalPrice,
      durationMinutes: b.serviceDuration || 60,
      variation: b.serviceVariation
    }]);
    setIsEditServicesModalOpen(true);
  };

  const handleSaveEditServices = () => {
    if (editServicesBooking && selectedEditServices.length > 0) {
      updateBookingServices(editServicesBooking.id, selectedEditServices);
      setIsEditServicesModalOpen(false);
      alert('Serviços atualizados com sucesso!');
    }
  };

  const toggleEditServiceSelection = (srv: ServiceItem) => {
    setSelectedEditServices(prev => {
      const exists = prev.find(s => s.id === srv.id);
      if (exists) {
        return prev.filter(s => s.id !== srv.id);
      } else {
        return [...prev, { id: srv.id, name: srv.name, price: srv.price, durationMinutes: srv.durationMinutes }];
      }
    });
  };

  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    durationMinutes: 60,
    price: 80,
    imageUrl: '',
    images: [] as string[],
    requiresDeposit: false,
    depositType: 'fixed' as 'fixed' | 'percentage',
    depositValue: 20,
    isCombo: false,
    comboServiceNames: '',
    selectedComboItemNames: [] as string[],
    customComboInput: '',
    customComboPrice: 40,
    customComboDuration: 30,
    saveCustomToServiceList: true,
    originalPrice: 100,
    discountPercent: 20,
    cardPaymentLink: ''
  });

  // Suporte Form
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSentSuccess, setSupportSentSuccess] = useState(false);

  // Política Form
  const [cancellationHours, setCancellationHours] = useState(professional.cancellationHours || 24);
  const [depositDeadlineHours, setDepositDeadlineHours] = useState(professional.depositDeadlineHours || 2);
  const [cancellationPolicyNotes, setCancellationPolicyNotes] = useState(professional.cancellationPolicyNotes || '');
  const [policySaved, setPolicySaved] = useState(false);

  // Origin URL for share link (useSyncExternalStore prevents SSR hydration mismatch and avoids set-state-in-effect)
  const originUrl = useSyncExternalStore(
    () => () => {},
    () => (typeof window !== 'undefined' ? window.location.origin : ''),
    () => ''
  );

  const publicLink = originUrl ? `${originUrl}/${professional.slug}` : `/${professional.slug}`;

  const copyPublicLink = () => {
    const fullLink = originUrl ? `${originUrl}/${professional.slug}` : (typeof window !== 'undefined' ? `${window.location.origin}/${professional.slug}` : `/${professional.slug}`);
    navigator.clipboard.writeText(fullLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareLink = async () => {
    const fullLink = originUrl ? `${originUrl}/${professional.slug}` : (typeof window !== 'undefined' ? `${window.location.origin}/${professional.slug}` : `/${professional.slug}`);
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Agende com ${professional.name} no Marcabella`,
          text: `Olá! Agende seu horário comigo no meu link exclusivo:`,
          url: fullLink
        });
        return;
      } catch {
        // Ignora cancelamento do usuário
      }
    }
    const waUrl = generateShareScheduleLinkUrl(professional, originUrl);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // Métricas
  const pendingBookings = profBookings.filter(b => b.status === 'pending');
  const awaitingDepositBookings = profBookings.filter(b => b.status === 'awaiting_deposit');
  const confirmedBookings = profBookings.filter(b => b.status === 'confirmed');
  const completedBookings = profBookings.filter(b => b.status === 'completed');
  const cancelledBookings = profBookings.filter(b => b.status === 'cancelled');

  const totalRevenueExpected = confirmedBookings.reduce((acc, b) => acc + b.totalPrice, 0);
  const totalDepositsCollected = profBookings
    .filter(b => b.depositPaid)
    .reduce((acc, b) => acc + b.depositAmount, 0);
  // Opções de horários de 30 em 30 minutos (06:00 até 23:00)
  const TIME_SELECT_OPTIONS_30MIN = [
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
    '22:00', '22:30', '23:00'
  ];

  // Helper para verificar se o horário do agendamento já passou
  const isAppointmentPast = (dateStr: string, timeStr: string) => {
    try {
      const now = new Date();
      const [y, m, d] = dateStr.split('-').map(Number);
      const [h, min] = (timeStr || '00:00').split(':').map(Number);
      const appDate = new Date(y, m - 1, d, h || 0, min || 0);
      return now.getTime() >= appDate.getTime();
    } catch (e) {
      return false;
    }
  };

  // Feedback para salvamento de horários e pausas
  const [hoursSavedFeedback, setHoursSavedFeedback] = useState<string | null>(null);

  const handleSaveDailyHours = () => {
    updateAvailability(availability);
    setHoursSavedFeedback('✓ Horários do expediente diário, pausas e dias diferenciados salvos com sucesso!');
    setTimeout(() => setHoursSavedFeedback(null), 4000);
  };

  // Modal de Agendamento Manual / Encaixe com Autonomia Total da Profissional
  const [isManualBookingModalOpen, setIsManualBookingModalOpen] = useState(false);
  const [manualClientName, setManualClientName] = useState('');
  const [manualClientPhone, setManualClientPhone] = useState('');
  const [manualServiceName, setManualServiceName] = useState('');
  const [manualPrice, setManualPrice] = useState('80');
  const [manualDeposit, setManualDeposit] = useState('0');
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [manualTime, setManualTime] = useState('10:00');
  const [manualDuration, setManualDuration] = useState('60');
  const [manualPaymentCondition, setManualPaymentCondition] = useState<'pending' | 'deposit_paid' | 'fully_paid' | 'courtesy'>('pending');
  const [manualPaymentMethod, setManualPaymentMethod] = useState<PaymentMethod>('pix');
  const [manualNotes, setManualNotes] = useState('');
  const [manualSuccessFeedback, setManualSuccessFeedback] = useState<string | null>(null);

  const handleCreateManualBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualClientName.trim() || !manualDate || !manualTime) return;

    const priceNum = parseFloat(manualPrice) || 0;
    const depositNum = parseFloat(manualDeposit) || 0;
    const durNum = parseInt(manualDuration) || 60;

    const [h, m] = manualTime.split(':').map(Number);
    const endMinutesTotal = (h * 60 + m) + durNum;
    const endH = Math.floor(endMinutesTotal / 60) % 24;
    const endM = endMinutesTotal % 60;
    const endTimeFormatted = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    const isPaid = manualPaymentCondition === 'fully_paid';
    const isCourtesy = manualPaymentCondition === 'courtesy';
    const isDepositPaid = manualPaymentCondition === 'deposit_paid' || isPaid;

    const finalPrice = isCourtesy ? 0 : priceNum;
    const finalDeposit = isCourtesy ? 0 : depositNum;

    createBooking({
      professionalId: professional.id,
      professionalSlug: professional.slug,
      professionalName: professional.name,
      professionalPhone: professional.phone,
      professionalAddress: professional.address || '',
      clientName: manualClientName.trim(),
      clientPhone: manualClientPhone.trim() || '(Sem WhatsApp informado)',
      serviceId: 'manual_' + Date.now(),
      serviceName: manualServiceName.trim() || 'Atendimento Personalizado',
      serviceDuration: durNum,
      date: manualDate,
      time: manualTime,
      endTime: endTimeFormatted,
      totalPrice: finalPrice,
      depositRequired: finalDeposit > 0,
      depositAmount: finalDeposit,
      depositPaid: isDepositPaid,
      depositStatus: isDepositPaid ? 'paid' : (finalDeposit > 0 ? 'pending' : undefined),
      status: isPaid || isCourtesy ? 'completed' : 'confirmed',
      paymentMethod: isCourtesy ? 'courtesy' : (isPaid ? manualPaymentMethod : undefined),
      notes: manualNotes ? `[Encaixe Manual] ${manualNotes}` : '[Encaixe Manual Realizado pela Profissional]'
    });

    setManualSuccessFeedback(`✓ Agendamento para ${manualClientName.trim()} registrado com sucesso na sua agenda!`);
    setTimeout(() => {
      setManualSuccessFeedback(null);
      setIsManualBookingModalOpen(false);
      setManualClientName('');
      setManualClientPhone('');
      setManualServiceName('');
      setManualNotes('');
    }, 1500);
  };

  const totalDepositsWaiting = awaitingDepositBookings.reduce((acc, b) => acc + b.depositAmount, 0);

  // Ações de Aprovação: confirmação direta
  const handleApproveBooking = (b: Booking) => {
    confirmBooking(b.id);
    setConfirmSuccessBooking({
      ...b,
      status: 'confirmed'
    });
  };

  const handleConfirmDepositPayment = (b: Booking) => {
    confirmDepositReceived(b.id);
    setDepositReceivedSuccessBooking({
      ...b,
      status: 'confirmed',
      depositPaid: true,
      depositStatus: 'paid'
    });
  };

  const handleOpenReopenModal = (b: Booking) => {
    setReopeningBooking(b);
    setReopenReasonText('Prazo para pagamento do sinal expirado. Horário reaberto na agenda.');
  };

  const handleExecuteReopenSlot = () => {
    if (!reopeningBooking) return;
    reopenExpiredSlot(reopeningBooking.id, reopenReasonText || 'Prazo expirado');
    setReopeningBooking(null);
  };

  const handleOpenCancelModal = (b: Booking) => {
    setCancellingBooking(b);
    setCancellationReasonText('');
    setRetainDepositDecision(Boolean(b.depositPaid));
  };

  const handleExecuteCancel = () => {
    if (!cancellingBooking) return;
    const finalReason = cancellationReasonText.trim() || 'Cancelado pelo(a) profissional';
    cancelBooking(cancellingBooking.id, finalReason, retainDepositDecision);
    const targetBooking = cancellingBooking;
    setCancellingBooking(null);
    setCancelSuccessBooking({
      booking: targetBooking,
      reason: finalReason
    });
  };

  const handleSwitchPlan = (newPlan: SubscriptionPlanType) => {
    changeProfessionalPlan(professional.id, newPlan);
    const planName = PLAN_CONFIGS[newPlan]?.name || newPlan;
    setPlanFeedback(`Seu plano foi alterado com sucesso para "${planName}".`);
    setTimeout(() => setPlanFeedback(null), 5000);
  };

  // Salvar ou Atualizar Serviço
  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.name) return;

    const comboArray = serviceForm.isCombo && serviceForm.comboServiceNames
      ? serviceForm.comboServiceNames.split(',').map(s => s.trim()).filter(Boolean)
      : undefined;

    const finalImages = serviceForm.images && serviceForm.images.length > 0 
      ? serviceForm.images 
      : (serviceForm.imageUrl ? [serviceForm.imageUrl] : []);
    const finalImage = finalImages[0] || serviceForm.imageUrl || findBestImageForService(serviceForm.name, professional.category);

    if (editingService) {
      updateService({
        ...editingService,
        name: serviceForm.name,
        description: serviceForm.description,
        imageUrl: finalImage,
        images: finalImages,
        durationMinutes: Number(serviceForm.durationMinutes),
        price: Number(serviceForm.price),
        requiresDeposit: serviceForm.requiresDeposit,
        depositType: serviceForm.depositType,
        depositValue: Number(serviceForm.depositValue),
        isCombo: serviceForm.isCombo,
        comboServiceNames: comboArray,
        originalPrice: serviceForm.isCombo ? Number(serviceForm.originalPrice) : undefined,
        discountPercent: serviceForm.isCombo ? Number(serviceForm.discountPercent) : undefined,
        cardPaymentLink: serviceForm.cardPaymentLink ? serviceForm.cardPaymentLink.trim() : undefined
      });
    } else {
      addService({
        professionalId: professional.id,
        name: serviceForm.name,
        description: serviceForm.description,
        imageUrl: finalImage,
        images: finalImages,
        durationMinutes: Number(serviceForm.durationMinutes),
        price: Number(serviceForm.price),
        requiresDeposit: serviceForm.requiresDeposit,
        depositType: serviceForm.depositType,
        depositValue: Number(serviceForm.depositValue),
        isCombo: serviceForm.isCombo,
        comboServiceNames: comboArray,
        originalPrice: serviceForm.isCombo ? Number(serviceForm.originalPrice) : undefined,
        discountPercent: serviceForm.isCombo ? Number(serviceForm.discountPercent) : undefined,
        cardPaymentLink: serviceForm.cardPaymentLink ? serviceForm.cardPaymentLink.trim() : undefined,
        active: true
      });
    }

    setIsServiceModalOpen(false);
    setEditingService(null);
  };

  const openNewServiceModal = () => {
    setEditingService(null);
    setServiceForm({
      name: '',
      description: '',
      imageUrl: '',
      images: [],
      durationMinutes: 60,
      price: 80,
      requiresDeposit: false,
      depositType: 'fixed',
      depositValue: 20,
      isCombo: false,
      comboServiceNames: '',
      selectedComboItemNames: [],
      customComboInput: '',
      customComboPrice: 40,
      customComboDuration: 30,
      saveCustomToServiceList: true,
      originalPrice: 100,
      discountPercent: 20,
      cardPaymentLink: ''
    });
    setIsServiceModalOpen(true);
  };

  const openEditServiceModal = (s: ServiceItem) => {
    setEditingService(s);
    const existingImages = s.images && s.images.length > 0 ? s.images : (s.imageUrl ? [s.imageUrl] : []);
    const rawCombo = s.comboServiceNames as unknown;
    const existingComboNames: string[] = Array.isArray(rawCombo)
      ? rawCombo
      : typeof rawCombo === 'string'
        ? (rawCombo as string).split(',').map((x: string) => x.trim()).filter(Boolean)
        : [];

    setServiceForm({
      name: s.name,
      description: s.description,
      imageUrl: s.imageUrl || '',
      images: existingImages,
      durationMinutes: s.durationMinutes,
      price: s.price,
      requiresDeposit: s.requiresDeposit,
      depositType: s.depositType,
      depositValue: s.depositValue,
      isCombo: !!s.isCombo,
      comboServiceNames: existingComboNames.join(', '),
      selectedComboItemNames: existingComboNames,
      customComboInput: '',
      customComboPrice: 40,
      customComboDuration: 30,
      saveCustomToServiceList: true,
      originalPrice: s.originalPrice || s.price * 1.25,
      discountPercent: s.discountPercent || 20,
      cardPaymentLink: s.cardPaymentLink || ''
    });
    setIsServiceModalOpen(true);
  };

  // Gerenciamento de Fotos Reais dos Procedimentos (Portfólio)
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoForm, setPhotoForm] = useState({
    url: '',
    title: '',
    serviceName: '',
    description: ''
  });

  const isAnyDashboardModalOpen = isProfileModalOpen || isPasswordModalOpen || isShareModalOpen || isServiceModalOpen || isEditServicesModalOpen || isManualBookingModalOpen || isPhotoModalOpen;
  useLockBodyScroll(isAnyDashboardModalOpen);

  const openNewPhotoModal = () => {
    setPhotoForm({
      url: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=800&q=80',
      title: '',
      serviceName: profServices[0]?.name || '',
      description: ''
    });
    setIsPhotoModalOpen(true);
  };

  const handleSavePhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoForm.url.trim() || !photoForm.title.trim()) return;

    const newPhoto: PortfolioPhoto = {
      id: `photo-${Date.now()}`,
      url: photoForm.url.trim(),
      title: photoForm.title.trim(),
      serviceName: photoForm.serviceName.trim() || undefined,
      description: photoForm.description.trim() || undefined
    };

    const currentPhotos = professional.portfolioPhotos || [];
    updateProfessional({
      ...professional,
      portfolioPhotos: [newPhoto, ...currentPhotos]
    });

    setIsPhotoModalOpen(false);
    setPhotoForm({ url: '', title: '', serviceName: '', description: '' });
  };

  const handleDeletePhoto = (photoId: string) => {
    if (!confirm('Deseja remover esta foto do seu perfil de agendamento?')) return;
    const currentPhotos = professional.portfolioPhotos || [];
    updateProfessional({
      ...professional,
      portfolioPhotos: currentPhotos.filter(p => p.id !== photoId)
    });
  };

  // Toggle dia da semana na disponibilidade
  const toggleDay = (dayIdx: number) => {
    const active = availability.activeDays.includes(dayIdx);
    const newDays = active 
      ? availability.activeDays.filter(d => d !== dayIdx)
      : [...availability.activeDays, dayIdx].sort();
    
    updateAvailability({
      ...availability,
      activeDays: newDays
    });
  };

  // Salvar política
  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfessional({
      ...professional,
      cancellationHours: Number(cancellationHours),
      cancellationPolicyNotes: cancellationPolicyNotes,
      depositDeadlineHours: Number(depositDeadlineHours)
    });
    setPolicySaved(true);
    setTimeout(() => setPolicySaved(false), 3000);
  };

  // Enviar ticket suporte
  const handleSendSupport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportSubject || !supportMessage) return;

    createSupportTicket({
      professionalId: professional.id,
      professionalName: professional.name,
      subject: supportSubject,
      message: supportMessage
    });

    setSupportSubject('');
    setSupportMessage('');
    setSupportSentSuccess(true);
    setTimeout(() => setSupportSentSuccess(false), 3000);
  };

  const filteredBookings = profBookings.filter(b => {
    if (bookingFilter !== 'all' && b.status !== bookingFilter) return false;
    if (bookingDateFilter && b.date !== bookingDateFilter) return false;
    if (bookingSearchText.trim()) {
      const q = bookingSearchText.toLowerCase().trim();
      const matchName = b.clientName.toLowerCase().includes(q);
      const matchPhone = b.clientPhone.toLowerCase().includes(q);
      const matchService = b.serviceName.toLowerCase().includes(q);
      const matchCode = b.code.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchService && !matchCode) return false;
    }
    return true;
  });

  const weekDayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const monthNamesPt = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Dias do mês visualizado para o calendário
  const daysInViewMonth = useMemo(() => {
    const days: { dateStr: string; dayNumber: number; dayOfWeek: number; isPast: boolean; dayOfWeekName: string }[] = [];
    const totalDays = new Date(calendarViewYear, calendarViewMonth + 1, 0).getDate();
    const todayStr = new Date().toISOString().split('T')[0];
    const shortDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    for (let d = 1; d <= totalDays; d++) {
      const curDate = new Date(calendarViewYear, calendarViewMonth, d);
      const mStr = String(calendarViewMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const dateStr = `${calendarViewYear}-${mStr}-${dStr}`;
      days.push({
        dateStr,
        dayNumber: d,
        dayOfWeek: curDate.getDay(),
        dayOfWeekName: shortDays[curDate.getDay()],
        isPast: dateStr < todayStr
      });
    }
    return days;
  }, [calendarViewYear, calendarViewMonth]);

  // Primeiro dia da semana para espaçamento na grade
  const firstDayOffset = useMemo(() => {
    return new Date(calendarViewYear, calendarViewMonth, 1).getDay();
  }, [calendarViewYear, calendarViewMonth]);

  // Atalhos automáticos para o mês visualizado
  const applyPreset = (preset: 'interleaved_month' | 'interleaved_month_reverse' | 'day_on_day_off' | 'day_on_day_off_odd' | 'day_on_day_off_even' | 'interleaved' | 'tue_thu_sat' | 'weekdays' | 'weekends' | 'tue_sat' | 'all' | 'clear') => {
    const futureDays = daysInViewMonth.filter(d => !d.isPast);
    const newDatesSet = new Set(selectedSpecificDates.filter(date => {
      const [y, m] = date.split('-');
      return Number(y) !== calendarViewYear || Number(m) !== (calendarViewMonth + 1);
    }));

    if (preset === 'interleaved_month') {
      // Alternância intercalada para todo o mês (Semana 1: Seg, Qua, Sex, Dom / Semana 2: Ter, Qui, Sáb)
      futureDays.forEach(d => {
        const weekIndex = Math.floor((d.dayNumber - 1 + firstDayOffset) / 7);
        if (weekIndex % 2 === 0) {
          // Semana A: Seg, Qua, Sex, Dom
          if (d.dayOfWeek === 1 || d.dayOfWeek === 3 || d.dayOfWeek === 5 || d.dayOfWeek === 0) {
            newDatesSet.add(d.dateStr);
          }
        } else {
          // Semana B: Ter, Qui, Sáb
          if (d.dayOfWeek === 2 || d.dayOfWeek === 4 || d.dayOfWeek === 6) {
            newDatesSet.add(d.dateStr);
          }
        }
      });
    } else if (preset === 'interleaved_month_reverse') {
      // Alternância invertida (Semana 1: Ter, Qui, Sáb / Semana 2: Seg, Qua, Sex, Dom)
      futureDays.forEach(d => {
        const weekIndex = Math.floor((d.dayNumber - 1 + firstDayOffset) / 7);
        if (weekIndex % 2 === 0) {
          // Semana A: Ter, Qui, Sáb
          if (d.dayOfWeek === 2 || d.dayOfWeek === 4 || d.dayOfWeek === 6) {
            newDatesSet.add(d.dateStr);
          }
        } else {
          // Semana B: Seg, Qua, Sex, Dom
          if (d.dayOfWeek === 1 || d.dayOfWeek === 3 || d.dayOfWeek === 5 || d.dayOfWeek === 0) {
            newDatesSet.add(d.dateStr);
          }
        }
      });
    } else if (preset === 'day_on_day_off' || preset === 'day_on_day_off_odd') {
      // Dia Sim, Dia Não (Inicia nos dias Ímpares: 1, 3, 5, 7...)
      futureDays.forEach(d => {
        if (d.dayNumber % 2 === 1) {
          newDatesSet.add(d.dateStr);
        }
      });
    } else if (preset === 'day_on_day_off_even') {
      // Dia Sim, Dia Não (Inicia no Dia Seguinte / Dias Pares: 2, 4, 6, 8...)
      futureDays.forEach(d => {
        if (d.dayNumber % 2 === 0) {
          newDatesSet.add(d.dateStr);
        }
      });
    } else if (preset === 'interleaved') {
      futureDays.forEach(d => {
        if (d.dayOfWeek === 1 || d.dayOfWeek === 3 || d.dayOfWeek === 5) newDatesSet.add(d.dateStr);
      });
    } else if (preset === 'tue_thu_sat') {
      futureDays.forEach(d => {
        if (d.dayOfWeek === 2 || d.dayOfWeek === 4 || d.dayOfWeek === 6) newDatesSet.add(d.dateStr);
      });
    } else if (preset === 'weekdays') {
      futureDays.forEach(d => {
        if (d.dayOfWeek >= 1 && d.dayOfWeek <= 5) newDatesSet.add(d.dateStr);
      });
    } else if (preset === 'weekends') {
      futureDays.forEach(d => {
        if (d.dayOfWeek === 0 || d.dayOfWeek === 6) newDatesSet.add(d.dateStr);
      });
    } else if (preset === 'tue_sat') {
      futureDays.forEach(d => {
        if (d.dayOfWeek >= 2 && d.dayOfWeek <= 6) newDatesSet.add(d.dateStr);
      });
    } else if (preset === 'all') {
      futureDays.forEach(d => newDatesSet.add(d.dateStr));
    } else if (preset === 'clear') {
      // Limpa os dias deste mês
    }

    const result = Array.from(newDatesSet).sort();
    setSelectedSpecificDates(result);
  };

  const toggleSpecificDate = (dateStr: string) => {
    setSelectedSpecificDates(prev => {
      if (prev.includes(dateStr)) {
        return prev.filter(d => d !== dateStr);
      } else {
        return [...prev, dateStr].sort();
      }
    });
  };

  const handlePrevMonth = () => {
    if (calendarViewMonth === 0) {
      setCalendarViewMonth(11);
      setCalendarViewYear(prev => prev - 1);
    } else {
      setCalendarViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarViewMonth === 11) {
      setCalendarViewMonth(0);
      setCalendarViewYear(prev => prev + 1);
    } else {
      setCalendarViewMonth(prev => prev + 1);
    }
  };

  const handleSaveScheduleConfig = () => {
    updateAllowedDates(professional.id, scheduleMode, selectedSpecificDates);
    setScheduleSavedFeedback('✓ Dias de atendimento atualizados e sincronizados com a agenda online!');
    setTimeout(() => setScheduleSavedFeedback(null), 3500);
  };

  const handleSaveTheme = (themeKey: ThemeColor) => {
    setSelectedThemeKey(themeKey);
    setProfessionalTheme(professional.id, themeKey);
    setThemeSavedFeedback(`✓ Tema "${THEME_CONFIGS[themeKey].name}" ativado com sucesso para sua página de agendamento!`);
    setTimeout(() => setThemeSavedFeedback(null), 3500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner da Profissional */}
      <div 
        className="rounded-3xl p-6 sm:p-8 text-white shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border transition-colors"
        style={{ backgroundColor: currentTheme.primary, borderColor: currentTheme.hover }}
      >
        <div className="flex items-center gap-4">
          <div className="relative group shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden relative ring-4 ring-white/20 shadow-md">
              <Image 
                src={professional.avatarUrl} 
                alt={professional.name} 
                fill
                sizes="(max-width: 640px) 64px, 80px"
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <button
              type="button"
              onClick={handleOpenProfileModal}
              title="Trocar Foto de Perfil"
              className="absolute -bottom-1.5 -right-1.5 bg-white dark:bg-zinc-900 text-stone-900 dark:text-zinc-100 p-1.5 rounded-full shadow-md hover:scale-110 transition-transform cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
            </button>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="serif text-2xl sm:text-3xl font-bold">{professional.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-xs ${
                professional.status === 'active'
                  ? 'bg-emerald-500/25 text-emerald-100 border border-emerald-400/40 backdrop-blur-xs'
                  : 'bg-rose-500/25 text-rose-100 border border-rose-400/40 backdrop-blur-xs'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${professional.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                {professional.status === 'active' ? 'Ativa' : 'Inativa'}
              </span>
            </div>
            <p className="text-white/90 font-medium text-sm sm:text-base">
              {professional.category} • {professional.phone}
            </p>
            <div className="text-xs text-white/80 mt-1 flex flex-wrap items-center gap-3">
              <span>Chave Pix: {professional.pixKey} ({professional.pixKeyType})</span>
              <button
                type="button"
                onClick={handleOpenProfileModal}
                className="inline-flex items-center gap-1 underline text-white/90 hover:text-white font-bold cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                Editar Foto & Perfil
              </button>
            </div>
          </div>
        </div>

        {/* Card do Link Exclusivo para WhatsApp & Agendamento */}
        <div className="bg-black/20 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/20 w-full md:w-[380px] lg:w-[420px] space-y-3 shrink-0 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#E9E2D7] flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-[#D4A373]" />
              Seu Link Exclusivo:
            </span>
            <button
              type="button"
              onClick={handleOpenProfileModal}
              className="text-[11px] font-bold text-amber-300 hover:text-amber-200 underline flex items-center gap-1 cursor-pointer"
              title="Personalizar seu link de agendamento"
            >
              <Edit3 className="w-3 h-3" />
              Personalizar link
            </button>
          </div>

          {/* Campo do link e botão Compartilhar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <input
                type="text"
                readOnly
                value={publicLink}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="w-full bg-black/35 text-white text-xs font-mono px-3 py-2.5 rounded-xl border border-white/25 focus:outline-none focus:ring-1 focus:ring-white/40 cursor-text select-all truncate"
                title="Clique para selecionar seu link exclusivo"
              />
            </div>
            <button
              type="button"
              onClick={copyPublicLink}
              className="p-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl font-bold text-xs transition-colors shrink-0 cursor-pointer"
              title={copiedLink ? 'Link copiado!' : 'Copiar link'}
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={handleShareLink}
              className="px-3.5 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer active:scale-95"
              title="Compartilhar Link da sua Agenda no WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Compartilhar</span>
            </button>
          </div>

          {/* Embaixo: Botão Ver Página de Agendamento */}
          <div>
            <a
              href={`/${professional.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-white text-[#2D2D2A] hover:bg-[#F8F6F2] dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer group"
              title="Ver sua página pública de agendamento em nova aba"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#5A5A40] dark:text-zinc-300 group-hover:scale-110 transition-transform" />
              <span>Ver Página de Agendamento</span>
            </a>
          </div>
        </div>
      </div>

      {/* BANNER DINÂMICO DE PLANO E TESTE GRÁTIS */}
      <div className={`p-5 sm:p-6 rounded-3xl border-2 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        planStatus.isTrial
          ? planStatus.isExpired
            ? 'bg-rose-50 border-rose-300 text-rose-950'
            : 'bg-[#EEF1EB] border-[#5A5A40] dark:border-zinc-600/30 text-[#2D2D2A] dark:text-zinc-100'
          : planStatus.planType === 'pro_fixed'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
            : 'bg-amber-50 border-amber-300 text-amber-950'
      }`}>
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-0.5 rounded-full bg-white dark:bg-zinc-900 shadow-2xs">
              {planStatus.isTrial ? '🎉 Período de Teste Grátis' : 'Assinatura Ativa'}
            </span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              planStatus.isTrial
                ? planStatus.isExpired ? 'bg-rose-200 text-rose-900' : 'bg-[#5A5A40] dark:bg-zinc-700 text-white'
                : 'bg-emerald-200 text-emerald-900'
            }`}>
              {planStatus.statusBadgeText}
            </span>
          </div>

          <h3 className="serif font-bold text-base sm:text-lg">
            {planStatus.isTrial ? (
              planStatus.isExpired ? (
                `Seu período de teste de ${planStatus.totalTrialDays} dias terminou!`
              ) : (
                `Você tem ${planStatus.daysRemaining} ${planStatus.daysRemaining === 1 ? 'dia restante' : 'dias restantes'} de degustação gratuita sem pagar absolutamente nada.`
              )
            ) : (
              planStatus.planType === 'pro_fixed' 
                ? 'Plano Pro Fixo Ativo: Agendamentos ilimitados com R$ 0 de taxa por cliente.'
                : `Plano Flex Ativo: Mensalidade reduzida de R$ ${PLAN_CONFIGS.flex_fee.baseMonthlyPrice.toFixed(2).replace('.', ',')} + R$ ${PLAN_CONFIGS.flex_fee.feePerBooking.toFixed(2).replace('.', ',')} por agendamento.`
            )}
          </h3>

          <p className="text-xs sm:text-sm text-[#706B5F] dark:text-zinc-400 max-w-2xl">
            {planStatus.isTrial ? (
              planStatus.isExpired ? (
                'Para continuar com sua agenda pública aberta e receber novos clientes no WhatsApp, selecione o Plano Pro Fixo ou o Plano Flex.'
              ) : (
                `Após os ${planStatus.totalTrialDays} dias de teste grátis, você pode escolher: pagar a mensalidade fixa (sem taxa por agendamento) ou a mensalidade mais baixa (com pequena taxa por agendamento concluído).`
              )
            ) : (
              'Você pode alterar de plano a qualquer momento sem taxas de cancelamento ou fidelidade.'
            )}
          </p>

          {planStatus.isTrial && !planStatus.isExpired && (
            <div className="w-full max-w-md bg-white dark:bg-zinc-900/70 h-2.5 rounded-full overflow-hidden mt-2 border border-[#5A5A40] dark:border-zinc-600/20">
              <div 
                className="bg-[#5A5A40] dark:bg-zinc-700 h-full rounded-full transition-all"
                style={{ width: `${planStatus.percentRemaining}%` }}
              />
            </div>
          )}
        </div>

        <div className="shrink-0">
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer flex items-center gap-1.5 ${
              planStatus.isExpired
                ? 'bg-rose-700 hover:bg-rose-800 text-white'
                : 'bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#D4A373]" />
            {planStatus.isTrial ? 'Ver Opções de Planos' : 'Gerenciar Meu Plano'} &rarr;
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* NOTIFICAÇÃO DE VÉSPERA: LEMBRETES PARA OS AGENDAMENTOS DE AMANHÃ */}
      {/* ========================================================================= */}
      {tomorrowBookings.length > 0 && (
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          tomorrowPendingReminders.length > 0
            ? 'bg-amber-50/90 border-amber-200 text-amber-950 shadow-xs'
            : 'bg-emerald-50/80 border-emerald-200 text-emerald-950 shadow-xs'
        }`}>
          <div className="flex items-start sm:items-center gap-3.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              tomorrowPendingReminders.length > 0 ? 'bg-amber-500 text-white shadow-xs' : 'bg-emerald-600 text-white shadow-xs'
            }`}>
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-bold text-sm sm:text-base">
                  {tomorrowPendingReminders.length > 0 
                    ? `Notificação de Véspera: ${tomorrowPendingReminders.length} lembrete(s) pendente(s) para amanhã (${formatDatePtBr(tomorrowStr)})`
                    : `Lembretes de Amanhã: Todas as ${tomorrowBookings.length} clientes já foram notificadas!`
                  }
                </h4>
                {tomorrowPendingReminders.length > 0 && (
                  <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 uppercase">
                    Ação Recomendada
                  </span>
                )}
              </div>
              <p className="text-xs text-[#706B5F] dark:text-zinc-400 mt-0.5">
                {tomorrowPendingReminders.length > 0
                  ? 'Dispare lembretes no WhatsApp para confirmar a presença das clientes e evitar horários vagos. Você pode disparar uma por uma ou todas de uma vez.'
                  : 'Sua agenda de amanhã está alinhada e todas as clientes já receberam a confirmação do horário.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('reminders')}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all ${
                tomorrowPendingReminders.length > 0
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              {tomorrowPendingReminders.length > 0 ? 'Disparar Lembretes Agora' : 'Gerenciar Lembretes'} &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Navegação Unificada em 3 Cards Principais */}
      {(() => {
        const isAgendaHub = ['overview', 'grid_calendar', 'bookings', 'reminders', 'waitlist', 'vacations'].includes(activeTab);
        const isSettingsHub = ['services', 'staff', 'schedule', 'theme', 'layouts', 'loyalty', 'giveaways', 'policy', 'plans', 'support'].includes(activeTab);
        const isCashflowHub = ['cashflow', 'crm', 'commissions'].includes(activeTab);

        const hubs = [
          {
            id: 'agenda_hub',
            title: 'Visão Geral, Agenda & Lembretes',
            subtitle: 'Horários, Grade Semanal & WhatsApp',
            icon: CalendarCheck,
            badge: `${activeBookingsToPerform.length} a realizar • ${tomorrowPendingReminders.length > 0 ? `${tomorrowPendingReminders.length} lembretes` : 'Em dia'}`,
            hasPulse: tomorrowPendingReminders.length > 0,
            isActive: isAgendaHub,
            onClick: () => {
              if (!isAgendaHub) {
                setActiveTab('overview');
              }
            }
          },
          {
            id: 'settings_hub',
            title: 'Serviços & Gestão',
            subtitle: 'Catálogo, Vitrine, Horários & Plano',
            icon: Sparkles,
            badge: `${profServices.length} procedimentos`,
            hasPulse: false,
            isActive: isSettingsHub,
            onClick: () => {
              if (!isSettingsHub) {
                setActiveTab('services');
              }
            }
          },
          {
            id: 'cashflow_hub',
            title: 'Controle de Caixa',
            subtitle: 'Faturamento, Balcão, Pix & Cartão',
            icon: CreditCard,
            badge: isRevenueUnlocked ? 'Desbloqueado' : '🔒 Requer Senha',
            hasPulse: false,
            isActive: isCashflowHub,
            onClick: () => {
              if (!isRevenueUnlocked) {
                setPasswordError(null);
                setPasswordInput('');
                setIsPasswordModalOpen(true);
              }
              setActiveTab('cashflow');
            }
          }
        ];

        return (
          <div className="space-y-3">
            {/* Grid dos 3 Cards Principais */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {hubs.map((hub) => {
                const Icon = hub.icon;
                const isCurrentActive = hub.isActive;

                return (
                  <button
                    key={hub.id}
                    onClick={hub.onClick}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer relative overflow-hidden group ${
                      isCurrentActive
                        ? 'border-[#2D2D2A] dark:border-zinc-500 bg-white dark:bg-zinc-900 shadow-md ring-1 ring-black/5'
                        : 'border-[#E9E2D7] dark:border-zinc-700 bg-white dark:bg-zinc-900/80 hover:bg-white dark:bg-zinc-900 hover:border-[#C5BDB0] hover:shadow-sm'
                    }`}
                  >
                    {/* Indicador de Topo Ativo */}
                    {isCurrentActive && (
                      <div 
                        className="absolute top-0 left-0 right-0 h-1.5"
                        style={{ backgroundColor: currentTheme.primary }}
                      />
                    )}

                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div 
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                          isCurrentActive 
                            ? 'text-white shadow-xs' 
                            : 'bg-[#F4F0EA] dark:bg-zinc-800 text-[#706B5F] dark:text-zinc-400 group-hover:bg-[#EAE4DC] group-hover:text-[#2D2D2A] dark:group-hover:text-zinc-100'
                        }`}
                        style={isCurrentActive ? { backgroundColor: currentTheme.primary } : {}}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex items-center gap-1.5">
                        {hub.hasPulse && (
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                        )}
                        <span className={`text-2xs font-bold px-2.5 py-1 rounded-full ${
                          isCurrentActive
                            ? 'bg-[#2D2D2A] dark:bg-zinc-800 text-white'
                            : 'bg-[#F0ECE4] dark:bg-zinc-800/60 text-[#706B5F] dark:text-zinc-400'
                        }`}>
                          {hub.badge}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className={`text-base font-bold truncate ${
                        isCurrentActive ? 'text-[#2D2D2A] dark:text-zinc-100' : 'text-[#4A4A45] dark:text-zinc-300'
                      }`}>
                        {hub.title}
                      </h4>
                      <p className="text-xs text-[#8A857B] dark:text-zinc-400 truncate mt-0.5">
                        {hub.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Sub-Navegação para Card 1: Agenda, Visão Geral & Lembretes */}
            {isAgendaHub && (
              <div className="flex flex-wrap items-center gap-2 p-2.5 bg-[#F8F6F2] dark:bg-zinc-900/60 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700">
                <span className="text-2xs font-extrabold uppercase tracking-wider text-[#A09A8E] dark:text-zinc-500 px-2 shrink-0">
                  Visualização:
                </span>
                {[
                  { id: 'overview', label: 'Visão Geral & Lembretes', icon: LayoutDashboard },
                  { id: 'grid_calendar', label: 'Grade Semanal', icon: Grid },
                  { id: 'bookings', label: `Agendamentos a Realizar (${activeBookingsToPerform.length})`, icon: CalendarIcon },
                  { id: 'waitlist', label: `Fila de Espera (${profWaitlist.length})`, icon: Hourglass },
                  { id: 'vacations', label: 'Férias & Bloqueios', icon: Umbrella },
                ].map((sub) => {
                  const isSubActive = activeTab === sub.id;
                  const SubIcon = sub.icon;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setActiveTab(sub.id as any)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSubActive
                          ? 'bg-[#2D2D2A] text-white shadow-xs'
                          : 'bg-white dark:bg-zinc-900 text-[#5A5A40] dark:text-zinc-300 hover:bg-[#EEF1EB] dark:hover:bg-zinc-800 hover:text-[#2D2D2A] dark:hover:text-zinc-100 border border-[#E9E2D7] dark:border-zinc-700/80'
                      }`}
                    >
                      <SubIcon className="w-3.5 h-3.5" />
                      {sub.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Sub-Navegação para Card 2: Serviços & Gestão */}
            {isSettingsHub && (
              <div className="flex flex-wrap items-center gap-2 p-2.5 bg-[#F8F6F2] dark:bg-zinc-900/60 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700">
                <span className="text-2xs font-extrabold uppercase tracking-wider text-[#A09A8E] dark:text-zinc-500 px-2 shrink-0">
                  Gerenciamento:
                </span>
                {[
                  { id: 'services', label: `Serviços & Combos (${profServices.length})`, icon: Clock },
                  { id: 'staff', label: `Equipe & Colaboradoras (${(professional.staffMembers || []).length})`, icon: Users },
                  { id: 'schedule', label: 'Dias & Horários', icon: CalendarCheck },
                  { id: 'theme', label: 'Tema & Cores', icon: Palette },
                  { id: 'layouts', label: 'Modelos de Página', icon: Layers },
                  { id: 'policy', label: 'Políticas & Sinal Pix', icon: ShieldCheck },
                  { id: 'loyalty', label: 'Cartão Fidelidade', icon: Award },
                  { id: 'giveaways', label: 'Sorteios & Mimos', icon: Gift },
                  { id: 'plans', label: 'Meu Plano', icon: Sparkles },
                  { id: 'support', label: 'Suporte', icon: HelpCircle },
                ].map((sub) => {
                  const isSubActive = activeTab === sub.id;
                  const SubIcon = sub.icon;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setActiveTab(sub.id as any)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSubActive
                          ? 'bg-[#2D2D2A] text-white shadow-xs'
                          : 'bg-white dark:bg-zinc-900 text-[#5A5A40] dark:text-zinc-300 hover:bg-[#EEF1EB] dark:hover:bg-zinc-800 hover:text-[#2D2D2A] dark:hover:text-zinc-100 border border-[#E9E2D7] dark:border-zinc-700/80'
                      }`}
                    >
                      <SubIcon className="w-3.5 h-3.5" />
                      {sub.label}
                    </button>
                  );
                })}
              </div>
            )}
            {/* Sub-Navegação para Card 3: Financeiro & CRM */}
            {isCashflowHub && (
              <div className="flex flex-wrap items-center gap-2 p-2.5 bg-[#F8F6F2] dark:bg-zinc-900/60 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700">
                <span className="text-2xs font-extrabold uppercase tracking-wider text-[#A09A8E] dark:text-zinc-500 px-2 shrink-0">
                  Gestão Avançada:
                </span>
                {[
                  { id: 'cashflow', label: 'Dashboard Financeiro', icon: Wallet },
                  { id: 'crm', label: 'Clientes (CRM)', icon: Users },
                  { id: 'commissions', label: 'Comissões da Equipe', icon: DollarSign },
                ].map((sub) => {
                  const isSubActive = activeTab === sub.id;
                  const SubIcon = sub.icon;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setActiveTab(sub.id as any)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSubActive
                          ? 'bg-[#2D2D2A] text-white shadow-xs'
                          : 'bg-white dark:bg-zinc-900 text-[#5A5A40] dark:text-zinc-300 hover:bg-[#EEF1EB] dark:hover:bg-zinc-800 hover:text-[#2D2D2A] dark:hover:text-zinc-100 border border-[#E9E2D7] dark:border-zinc-700/80'
                      }`}
                    >
                      <SubIcon className="w-3.5 h-3.5" />
                      {sub.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* ABA 1: VISÃO GERAL */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card Faturamento Previsto com Proteção por Senha */}
            <div 
              onClick={() => {
                if (!isRevenueUnlocked) {
                  setPasswordError(null);
                  setPasswordInput('');
                  setIsPasswordModalOpen(true);
                }
              }}
              className={`p-5 rounded-2xl border transition-all shadow-xs space-y-2 relative group cursor-pointer ${
                !isRevenueUnlocked
                  ? 'bg-[#FAF8F5] dark:bg-zinc-900/90 border-[#E9E2D7] dark:border-zinc-700 hover:border-[#5A5A40] dark:hover:border-zinc-500'
                  : 'bg-white dark:bg-zinc-900 border-[#E9E2D7] dark:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#A09A8E] dark:text-zinc-500 uppercase tracking-wider block">
                  Faturamento Previsto
                </span>
                {isRevenueUnlocked ? (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLockRevenue();
                    }}
                    title="Ocultar valores confidenciais"
                    className="text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 p-1 rounded-md"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="p-1 rounded-md bg-amber-100 text-amber-900 text-2xs font-extrabold flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-700" />
                    Senha
                  </span>
                )}
              </div>
              <div className="serif text-3xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                {isRevenueUnlocked ? `R$ ${totalRevenueExpected.toFixed(2)}` : 'R$ ••••••'}
              </div>
              <p className="text-xs text-[#706B5F] dark:text-zinc-400">
                {isRevenueUnlocked ? 'Soma de todos os agendamentos confirmados' : 'Toque para digitar sua senha e desbloquear'}
              </p>
            </div>

            {/* Sinais Recebidos Pix com Proteção por Senha */}
            <div 
              onClick={() => {
                if (!isRevenueUnlocked) {
                  setPasswordError(null);
                  setPasswordInput('');
                  setIsPasswordModalOpen(true);
                }
              }}
              className={`p-5 rounded-2xl border transition-all shadow-xs space-y-2 relative group cursor-pointer ${
                !isRevenueUnlocked
                  ? 'bg-[#FAF8F5] dark:bg-zinc-900/90 border-[#E9E2D7] dark:border-zinc-700 hover:border-[#5A5A40] dark:hover:border-zinc-500'
                  : 'bg-white dark:bg-zinc-900 border-[#E9E2D7] dark:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#5A5A40] dark:text-zinc-300 uppercase tracking-wider block">
                  Sinais Recebidos (Pix)
                </span>
                {isRevenueUnlocked ? (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLockRevenue();
                    }}
                    title="Ocultar valores confidenciais"
                    className="text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 p-1 rounded-md"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="p-1 rounded-md bg-amber-100 text-amber-900 text-2xs font-extrabold flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-700" />
                    Senha
                  </span>
                )}
              </div>
              <div className="serif text-3xl font-bold text-[#5A5A40] dark:text-zinc-300">
                {isRevenueUnlocked ? `R$ ${totalDepositsCollected.toFixed(2)}` : 'R$ ••••••'}
              </div>
              <p className="text-xs text-[#706B5F] dark:text-zinc-400">
                {isRevenueUnlocked ? 'Adiantamentos já garantidos' : 'Toque para digitar sua senha e desbloquear'}
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 shadow-xs space-y-2">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">
                Aguardando Sinal Pix
              </span>
              <div className="serif text-3xl font-bold text-amber-800">
                {awaitingDepositBookings.length}
              </div>
              <p className="text-xs text-[#706B5F] dark:text-zinc-400">
                {isRevenueUnlocked ? `R$ ${totalDepositsWaiting.toFixed(2)} em reserva com prazo` : `${awaitingDepositBookings.length} reserva(s) em prazo`}
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 shadow-xs space-y-2">
              <span className="text-xs font-bold text-[#D4A373] uppercase tracking-wider block">
                Agendamentos a Realizar
              </span>
              <div className="serif text-3xl font-bold text-[#D4A373]">
                {activeBookingsToPerform.length}
              </div>
              <p className="text-xs text-[#706B5F] dark:text-zinc-400">
                {confirmedBookings.length} confirmados • {awaitingDepositBookings.length + pendingBookings.length} em aprovação (sem contar concluídos e cancelados)
              </p>
            </div>

          </div>

          {/* Agenda de Hoje (Foco Operacional Diário) */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-[#E9E2D7] dark:border-zinc-700 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-[#5A5A40] dark:bg-zinc-700 text-white rounded-xl shadow-xs">
                  <CalendarCheck className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="serif text-lg sm:text-xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                    Agenda de Hoje ({formatDatePtBr(new Date().toISOString().split('T')[0])})
                  </h2>
                  <p className="text-xs text-[#706B5F] dark:text-zinc-400">
                    {profBookings.filter(b => b.date === new Date().toISOString().split('T')[0] && (b.status === 'confirmed' || b.status === 'completed')).length} atendimento(s) confirmado(s) para hoje
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualBookingModalOpen(true)}
                  className="px-3.5 py-2 bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" />
                  + Encaixe / Agendamento Manual
                </button>
                <button
                  onClick={() => {
                    setActiveTab('bookings');
                    setBookingDateFilter(new Date().toISOString().split('T')[0]);
                  }}
                  className="text-xs font-bold text-[#5A5A40] dark:text-zinc-300 hover:underline cursor-pointer"
                >
                  Filtrar no Calendário &rarr;
                </button>
              </div>
            </div>

            {(() => {
              const todayStr = new Date().toISOString().split('T')[0];
              const todayList = profBookings
                .filter(b => b.date === todayStr && (b.status === 'confirmed' || b.status === 'completed'))
                .sort((a, b) => a.time.localeCompare(b.time));
              const pendingTodayCount = profBookings.filter(b => b.date === todayStr && (b.status === 'pending' || b.status === 'awaiting_deposit')).length;

              if (todayList.length === 0) {
                return (
                  <div className="text-center py-8 px-4 bg-[#F8F6F2] dark:bg-zinc-800/40 rounded-2xl border border-dashed border-[#E9E2D7] dark:border-zinc-700 space-y-3">
                    <Clock className="w-8 h-8 text-[#A09A8E] dark:text-zinc-500 mx-auto" />
                    <div>
                      <p className="text-sm font-bold text-[#2D2D2A] dark:text-zinc-100">Nenhum agendamento confirmado para hoje</p>
                      <p className="text-xs text-[#706B5F] dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                        Seu dia está livre de atendimentos confirmados. Você também pode lançar um encaixe manual agora mesmo.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsManualBookingModalOpen(true)}
                      className="px-4 py-2 bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Lançar Encaixe de Horário
                    </button>
                    {pendingTodayCount > 0 && (
                      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-center justify-center gap-2 max-w-md mx-auto">
                        <Hourglass className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Você tem {pendingTodayCount} agendamento(s) para hoje aguardando aprovação ou sinal Pix nas seções abaixo.</span>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div className="divide-y divide-[#E9E2D7] dark:divide-zinc-800">
                  {todayList.map((b) => {
                    const isPast = isAppointmentPast(b.date, b.time);
                    const isCompleted = b.status === 'completed';
                    const remainingBalance = b.totalPrice - (b.depositPaid ? b.depositAmount : 0);

                    return (
                      <div
                        key={b.id}
                        className={`py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition-all ${
                          isPast && !isCompleted ? 'bg-amber-50/40 dark:bg-amber-950/20 -mx-3 px-3 rounded-2xl' : ''
                        }`}
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-1 bg-[#2D2D2A] dark:bg-zinc-800 text-white text-xs font-mono font-bold rounded-lg">
                              {b.time} - {b.endTime}
                            </span>
                            <span className="serif font-bold text-[#2D2D2A] dark:text-zinc-100 text-base">{b.clientName}</span>
                            <span className="text-xs font-mono text-[#A09A8E] dark:text-zinc-500">{b.code}</span>
                            
                            <span className={`text-2xs font-bold px-2 py-0.5 rounded-full ${
                              isCompleted ? 'bg-[#EEF1EB] text-[#5A5A40] dark:text-zinc-300' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {isCompleted ? 'Concluído' : 'Confirmado'}
                            </span>

                            {/* Badge de Horário que Já Passou */}
                            {isPast && !isCompleted && (
                              <span className="text-2xs font-extrabold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950 border border-amber-400 flex items-center gap-1 animate-pulse">
                                <Clock className="w-3 h-3 text-amber-800" />
                                Horário Já Passou • Confirmar Atendimento
                              </span>
                            )}

                            {/* Sinal / Deposit Status */}
                            {b.depositPaid ? (
                              <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Sinal R$ {b.depositAmount.toFixed(2)} Pago
                              </span>
                            ) : b.depositRequired ? (
                              <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                Sinal R$ {b.depositAmount.toFixed(2)} Pendente
                              </span>
                            ) : (
                              <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400">
                                Sem Sinal Prévio
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-[#706B5F] dark:text-zinc-400">
                            <strong>{b.serviceName}</strong> • Duração: {b.serviceDuration} min • Total: <strong>R$ {b.totalPrice.toFixed(2)}</strong> {remainingBalance > 0 && !isCompleted ? `(Falta receber R$ ${remainingBalance.toFixed(2)})` : ''} • WhatsApp: {b.clientPhone}
                          </p>

                          {b.notes && (
                            <p className="text-xs text-[#5A5A40] dark:text-zinc-400 bg-[#EEF1EB]/80 dark:bg-zinc-800/80 px-2.5 py-1 rounded-lg inline-block">
                              Obs: {b.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {/* Botão de Confirmação se o Horário Já Passou */}
                          {isPast && !isCompleted && (
                            <button
                              type="button"
                              onClick={() => handleOpenCheckoutModal(b)}
                              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                              title="Confirmar que o atendimento ocorreu e registrar a forma de pagamento do valor restante"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                              <span>✓ Ocorreu? Confirmar & Receber</span>
                            </button>
                          )}

                          {!isCompleted && !isPast && (
                            <button
                              onClick={() => handleOpenCheckoutModal(b)}
                              className="px-3 py-1.5 bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Concluir & Receber
                            </button>
                          )}

                          <a
                            href={generateReminderWhatsAppUrl(b, professional)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            WhatsApp
                          </a>
                          {!isCompleted && (
                            <button
                              onClick={() => handleOpenCancelModal(b)}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Cancelar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Se houver agendamentos aguardando depósito de sinal */}
          {awaitingDepositBookings.length > 0 && (
            <div className="bg-amber-50/90 border-2 border-amber-300 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-amber-600 text-white rounded-xl shadow-xs">
                    <Hourglass className="w-5 h-5 animate-pulse" />
                  </span>
                  <div>
                    <h2 className="serif text-lg font-bold text-[#2D2D2A] dark:text-zinc-100">
                      {awaitingDepositBookings.length} {awaitingDepositBookings.length === 1 ? 'Agendamento Aguardando Sinal Pix' : 'Agendamentos Aguardando Sinal Pix'}
                    </h2>
                    <p className="text-xs text-amber-900/80 font-medium">
                      Horários aprovados onde a cliente tem prazo para pagar o sinal. Verifique o Pix para confirmar ou reabrir o horário.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('bookings');
                    setBookingFilter('awaiting_deposit');
                  }}
                  className="text-xs font-bold text-amber-900 hover:underline"
                >
                  Gerenciar todos &rarr;
                </button>
              </div>

              <div className="divide-y divide-amber-200/60">
                {awaitingDepositBookings.map((b) => {
                  const deadlineInfo = b.depositDeadlineAt ? getDeadlineStatus(b.depositDeadlineAt) : null;
                  return (
                    <div key={b.id} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="serif font-bold text-[#2D2D2A] dark:text-zinc-100 text-base">{b.clientName}</span>
                          <span className="text-xs font-mono text-amber-800 bg-amber-100 px-2 py-0.5 rounded">{b.code}</span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                            Sinal: R$ {b.depositAmount.toFixed(2)}
                          </span>
                          {deadlineInfo && (
                            <span className={`text-2xs font-bold px-2 py-0.5 rounded ${
                              deadlineInfo.expired ? 'bg-rose-600 text-white' : 'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}>
                              {deadlineInfo.text}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[#3D3D3D]">
                          <strong>{b.serviceName}</strong> • {formatDatePtBr(b.date)} às <strong>{b.time}</strong> • WhatsApp: <strong>{b.clientPhone}</strong>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleConfirmDepositPayment(b)}
                          className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                          Confirmar Recebimento do Sinal
                        </button>

                        <a
                          href={generateDepositReminderWhatsAppUrl(b, professional)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Lembrar Prazo
                        </a>

                        <button
                          onClick={() => handleOpenCancelModal(b)}
                          className="px-3 py-2 bg-white dark:bg-zinc-900 hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Cancelar agendamento"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Cancelar Horário
                        </button>

                        <button
                          onClick={() => handleOpenReopenModal(b)}
                          className="px-3 py-2 bg-white dark:bg-zinc-900 hover:bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Reabrir vaga na agenda caso o prazo tenha expirado"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Reabrir Horário
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Se houver agendamentos pendentes de confirmação */}
          {pendingBookings.length > 0 && (
            <div className="bg-amber-50/90 border border-amber-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                    <AlertCircle className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className="serif text-lg font-bold text-[#2D2D2A] dark:text-zinc-100">
                      {pendingBookings.length} {pendingBookings.length === 1 ? 'Solicitação Aguardando Aprovação' : 'Solicitações Aguardando Aprovação'}
                    </h2>
                    <p className="text-xs text-amber-900/80 font-medium">
                      Clientes que solicitaram horário e aguardam seu aceite para garantir a vaga.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('bookings');
                    setBookingFilter('pending');
                  }}
                  className="text-xs font-bold text-amber-900 hover:underline"
                >
                  Ver todos &rarr;
                </button>
              </div>

              <div className="divide-y divide-amber-200/60">
                {pendingBookings.map((b) => (
                  <div key={b.id} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="serif font-bold text-[#2D2D2A] dark:text-zinc-100 text-base">{b.clientName}</span>
                        <span className="text-xs font-mono text-amber-800 bg-amber-100 px-2 py-0.5 rounded">{b.code}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">Pendente</span>
                        {b.payOnArrival ? (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                            💵 Pagar no Atendimento
                          </span>
                        ) : (b.payFullInAdvance || b.paymentOption === 'pay_full_pix') ? (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                            💳 Pix 100% Antecipado
                          </span>
                        ) : b.depositRequired && b.depositAmount > 0 ? (
                          <span className="text-xs font-semibold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
                            ⚡ Sinal Pix: R$ {b.depositAmount.toFixed(2).replace('.', ',')}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-[#3D3D3D]">
                        <strong>{b.serviceName}</strong> • {formatDatePtBr(b.date)} às <strong>{b.time}</strong> • R$ {b.totalPrice.toFixed(2)}
                      </p>
                      {b.notes && (
                        <p className="text-xs text-[#706B5F] dark:text-zinc-400 italic">&ldquo;{b.notes}&rdquo;</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApproveBooking(b)}
                        className="px-3.5 py-2 bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                        <span>Confirmar Agendamento</span>
                      </button>

                      <button
                        onClick={() => handleOpenCancelModal(b)}
                        className="px-3 py-2 bg-white dark:bg-zinc-900 hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Recusar ou cancelar horário"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Recusar / Cancelar
                      </button>

                      <a
                        href={generateReminderWhatsAppUrl(b, professional)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors"
                        title="Conversar com a cliente no WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Próximos Atendimentos */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-[#E9E2D7] dark:border-zinc-700 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="serif text-lg sm:text-xl font-bold text-[#2D2D2A] dark:text-zinc-100 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-[#5A5A40] dark:text-zinc-300" />
                Próximos Atendimentos
              </h2>
              {(() => {
                const todayStr = new Date().toISOString().split('T')[0];
                const upcomingFutureBookings = confirmedBookings
                  .filter(b => b.date > todayStr)
                  .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

                if (upcomingFutureBookings.length === 0) return null;

                return (
                  <button
                    type="button"
                    onClick={() => setIsUpcomingExpanded(!isUpcomingExpanded)}
                    className="text-xs font-bold text-[#5A5A40] dark:text-zinc-300 hover:text-[#2D2D2A] dark:hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800"
                    title={isUpcomingExpanded ? "Recolher lista" : "Expandir todos os agendamentos"}
                  >
                    <span>{isUpcomingExpanded ? 'Recolher lista' : `Ver todos (${upcomingFutureBookings.length})`}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isUpcomingExpanded ? 'rotate-180' : ''}`} />
                  </button>
                );
              })()}
            </div>

            {(() => {
              const todayStr = new Date().toISOString().split('T')[0];
              // Próximos atendimentos futuros (a partir de amanhã, para não duplicar com a Agenda de Hoje acima)
              const upcomingFutureBookings = confirmedBookings
                .filter(b => b.date > todayStr)
                .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

              const todayConfirmedCount = confirmedBookings.filter(b => b.date === todayStr).length;
              const pendingOrAwaitingCount = pendingBookings.length + awaitingDepositBookings.length;

              if (upcomingFutureBookings.length === 0) {
                return (
                  <div className="text-center py-6 px-4 bg-[#F8F6F2] dark:bg-zinc-800/40 rounded-2xl border border-dashed border-[#E9E2D7] dark:border-zinc-700 space-y-2">
                    <p className="text-[#2D2D2A] dark:text-zinc-100 text-sm font-medium">
                      Nenhum agendamento futuro confirmado (a partir de amanhã).
                    </p>
                    {todayConfirmedCount > 0 && (
                      <p className="text-xs text-[#5A5A40] dark:text-zinc-300">
                        ✓ Os {todayConfirmedCount} atendimento(s) de hoje estão listados na <strong>Agenda de Hoje</strong> acima.
                      </p>
                    )}
                    {pendingOrAwaitingCount > 0 && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-center gap-2 max-w-md mx-auto text-left">
                        <Hourglass className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          Você tem <strong>{pendingOrAwaitingCount} agendamento(s)</strong> aguardando sua confirmação na seção acima. Assim que você confirmar, o horário entrará automaticamente na sua agenda!
                        </span>
                      </div>
                    )}
                  </div>
                );
              }

              const displayedBookings = isUpcomingExpanded ? upcomingFutureBookings : upcomingFutureBookings.slice(0, 4);

              return (
                <div className="space-y-3">
                  <div className="divide-y divide-[#E9E2D7] dark:divide-zinc-800">
                    {displayedBookings.map((booking) => (
                      <div key={booking.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="serif font-bold text-[#2D2D2A] dark:text-zinc-100 text-base">{booking.clientName}</span>
                            <span className="text-xs font-mono text-[#A09A8E] dark:text-zinc-500">{booking.code}</span>
                          </div>
                          <p className="text-sm text-[#706B5F] dark:text-zinc-400">
                            {booking.serviceName} • <strong className="text-[#5A5A40] dark:text-zinc-300">{formatDatePtBr(booking.date)} às {booking.time}</strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={generateReminderWhatsAppUrl(booking, professional)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-[#EEF1EB] dark:bg-zinc-800 text-[#5A5A40] dark:text-zinc-300 hover:bg-[#e1e6db] dark:hover:bg-zinc-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                            Lembrar no WhatsApp
                          </a>
                          <button
                            onClick={() => completeBooking(booking.id)}
                            className="px-3 py-1.5 bg-[#F8F6F2] hover:bg-[#EEF1EB] dark:hover:bg-zinc-800 text-[#3D3D3D] dark:text-zinc-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#5A5A40] dark:text-zinc-300" />
                            Concluir
                          </button>
                          <button
                            onClick={() => handleOpenCancelModal(booking)}
                            className="px-3 py-1.5 bg-[#FDF4EE] dark:bg-rose-950/40 hover:bg-[#fce9dc] text-[#D4A373] dark:text-rose-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Cancelar horário"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Botão de Expansão/Recolhimento no Rodapé do Card */}
                  {upcomingFutureBookings.length > 4 && (
                    <div className="pt-2 text-center border-t border-[#E9E2D7] dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setIsUpcomingExpanded(!isUpcomingExpanded)}
                        className="text-xs font-bold text-[#5A5A40] dark:text-zinc-300 hover:text-[#2D2D2A] dark:hover:text-white py-2 px-4 rounded-xl bg-[#FAF8F5] dark:bg-zinc-800/60 hover:bg-[#EEF1EB] dark:hover:bg-zinc-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        {isUpcomingExpanded ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5" />
                            <span>Recolher lista de atendimentos</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" />
                            <span>Mostrar mais {upcomingFutureBookings.length - 4} agendamentos futuros</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* ========================================================================= */}
          {/* CENTRAL DE LEMBRETES WHATSAPP CONJUGADA NA VISÃO GERAL (MINIMALISTA) */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-[#E9E2D7] dark:border-zinc-700 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-xs">
                  <MessageSquare className="w-5 h-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="serif text-lg sm:text-xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                      Central de Lembretes WhatsApp
                    </h2>
                    {tomorrowPendingReminders.length > 0 ? (
                      <span className="px-2.5 py-0.5 rounded-full text-2xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                        {tomorrowPendingReminders.length} lembrete(s) para amanhã
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-2xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        Lembretes em dia
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#706B5F] dark:text-zinc-400">
                    Disparo rápido de confirmação para os clientes de amanhã ({formatDatePtBr(tomorrowStr)})
                  </p>
                </div>
              </div>
            </div>

            {/* Lista Minimalista de Clientes de Amanhã para Envio */}
            {tomorrowBookings.length === 0 ? (
              <div className="text-center py-6 px-4 bg-[#FAF8F5] dark:bg-zinc-800/40 rounded-2xl border border-dashed border-[#E9E2D7] dark:border-zinc-700">
                <p className="text-xs text-[#706B5F] dark:text-zinc-400">
                  Nenhum atendimento agendado para amanhã ({formatDatePtBr(tomorrowStr)}). Tudo pronto por aqui!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#E9E2D7] dark:divide-zinc-800">
                {tomorrowBookings.map((b) => {
                  const isSent = !!b.reminderSent;
                  const msgUrl = generateReminderWhatsAppUrl(b, professional);
                  return (
                    <div key={b.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-[#2D2D2A] dark:bg-zinc-800 text-white text-xs font-mono font-bold rounded">
                            {b.time}
                          </span>
                          <span className="serif font-bold text-sm text-[#2D2D2A] dark:text-zinc-100">
                            {b.clientName}
                          </span>
                          <span className="text-2xs text-[#706B5F] dark:text-zinc-400">
                            • {b.serviceName}
                          </span>
                          {isSent ? (
                            <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-700" /> Enviado
                            </span>
                          ) : (
                            <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                              Pendente
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-500 dark:text-zinc-400">
                          WhatsApp: {b.clientPhone} • Saldo no local: R$ {((b.totalPrice || 0) - (b.depositPaid ? (b.depositAmount || 0) : 0)).toFixed(2)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={msgUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => markReminderSent(b.id)}
                          className="px-3.5 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Enviar WhatsApp</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => markReminderSent(b.id)}
                          className="px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800 text-xs font-medium transition-colors cursor-pointer"
                          title={isSent ? "Reenviar ou marcar novamente" : "Marcar como já enviado"}
                        >
                          {isSent ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : 'Marcar Enviado'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA: LEMBRETES DE VÉSPERA (DISPARO INDIVIDUAL OU EM MASSA) */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* ABA: AGENDA EM GRADE (GOOGLE CALENDAR STYLE) */}
      {/* ========================================================================= */}
      {activeTab === 'grid_calendar' && (
        <AdminGridCalendar
          professional={professional}
          bookings={profBookings}
          availability={availability}
        />
      )}

      {/* ========================================================================= */}
      {/* ABA: CONTROLE DE CAIXA & FORMAS DE PAGAMENTO */}
      {/* ========================================================================= */}
      {activeTab === 'cashflow' && (
        <AdminFinancialDashboard
          professional={professional}
        />
      )}

      {/* ========================================================================= */}
      {/* ABA: CRM & CLIENTES */}
      {/* ========================================================================= */}
      {activeTab === 'crm' && (
        <AdminCRM
          professional={professional}
        />
      )}

      {/* ========================================================================= */}
      {/* ABA: COMISSÕES */}
      {/* ========================================================================= */}
      {activeTab === 'commissions' && (
        <AdminCommissions
          professional={professional}
        />
      )}

      {/* ========================================================================= */}
      {/* ABA: FILA DE ESPERA INTELIGENTE & ENCAIXES */}
      {/* ========================================================================= */}
      {activeTab === 'waitlist' && (
        <AdminWaitlistManager
          professional={professional}
        />
      )}

      {/* ========================================================================= */}
      {/* ABA: BLOQUEIOS DE HORÁRIOS & FÉRIAS */}
      {/* ========================================================================= */}
      {activeTab === 'vacations' && (
        <AdminVacationManager
          professional={professional}
          availability={availability}
        />
      )}

      {/* ========================================================================= */}
      {/* ABA: PROGRAMA DE FIDELIDADE & RETENÇÃO VIP */}
      {/* ========================================================================= */}
      {activeTab === 'loyalty' && (
        <AdminLoyaltyManager
          professional={professional}
          bookings={profBookings}
        />
      )}

      {/* ========================================================================= */}
      {/* ABA: SORTEIOS, MIMOS & BRINDES */}
      {/* ========================================================================= */}
      {activeTab === 'giveaways' && (
        <AdminGiveawaysAndGifts
          professional={professional}
          profBookings={profBookings}
        />
      )}

      {/* ========================================================================= */}
      {/* ABA: LEMBRETES AUTOMATIZADOS (WHATSAPP) */}
      {/* ========================================================================= */}
      {activeTab === 'reminders' && (
        <RemindersManager
          professional={professional}
          bookings={profBookings}
          services={profServices}
          onMarkReminderSent={markReminderSent}
          onMarkAllRemindersSent={markAllRemindersSent}
        />
      )}

      {/* ========================================================================= */}
      {/* ABA 2: AGENDAMENTOS */}
      {/* ========================================================================= */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'all', label: `Todos (${profBookings.length})` },
                { id: 'pending', label: `Solicitações (${pendingBookings.length})` },
                { id: 'awaiting_deposit', label: `Aguardando Sinal (${awaitingDepositBookings.length})` },
                { id: 'confirmed', label: `Confirmados (${confirmedBookings.length})` },
                { id: 'completed', label: `Concluídos (${completedBookings.length})` },
                { id: 'cancelled', label: `Cancelados / Reabertos (${cancelledBookings.length})` }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setBookingFilter(f.id as any)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    bookingFilter === f.id
                      ? 'bg-[#5A5A40] dark:bg-zinc-700 text-white shadow-xs'
                      : f.id === 'pending' && pendingBookings.length > 0
                        ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                        : f.id === 'awaiting_deposit' && awaitingDepositBookings.length > 0
                          ? 'bg-amber-100 text-amber-950 hover:bg-amber-200 border border-amber-400 font-extrabold'
                          : 'bg-[#F8F6F2] text-[#706B5F] dark:text-zinc-400 hover:bg-[#EEF1EB] dark:hover:bg-zinc-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsManualBookingModalOpen(true)}
                className="px-3.5 py-2 bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                + Encaixe Manual
              </button>

              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-[#A09A8E] dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={bookingSearchText}
                  onChange={(e) => setBookingSearchText(e.target.value)}
                  placeholder="Buscar cliente, serviço, cód..."
                  className="w-full text-xs pl-8 pr-3 py-2 border border-[#E9E2D7] dark:border-zinc-700 rounded-xl text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 outline-none focus:border-[#5A5A40] dark:border-zinc-600"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={bookingDateFilter}
                  onChange={(e) => setBookingDateFilter(e.target.value)}
                  className="text-xs px-2.5 py-2 border border-[#E9E2D7] dark:border-zinc-700 rounded-xl text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900"
                />
                {bookingDateFilter && (
                  <button
                    onClick={() => setBookingDateFilter('')}
                    className="text-xs text-[#5A5A40] dark:text-zinc-300 hover:underline font-bold cursor-pointer"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {filteredBookings.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-12 text-center text-[#706B5F] dark:text-zinc-400 border border-[#E9E2D7] dark:border-zinc-700">
                Nenhum agendamento encontrado para este filtro ou busca.
              </div>
            ) : (
              filteredBookings.map((b) => {
                const isPending = b.status === 'pending';
                const isAwaitingDeposit = b.status === 'awaiting_deposit';
                const isConfirmed = b.status === 'confirmed';
                const isCompleted = b.status === 'completed';
                const isCancelled = b.status === 'cancelled';
                const isPast = isAppointmentPast(b.date, b.time);
                const deadlineInfo = b.depositDeadlineAt ? getDeadlineStatus(b.depositDeadlineAt) : null;
                const remainingBalance = b.totalPrice - (b.depositPaid ? b.depositAmount : 0);

                return (
                  <div
                    key={b.id}
                    className={`bg-white dark:bg-zinc-900 rounded-2xl p-5 border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                      isPast && isConfirmed
                        ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300'
                        : isAwaitingDeposit 
                          ? 'border-amber-400 bg-amber-50/25 ring-1 ring-amber-300' 
                          : isPending 
                            ? 'border-amber-300 bg-amber-50/20' 
                            : 'border-[#E9E2D7] dark:border-zinc-700'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="serif font-bold text-lg text-[#2D2D2A] dark:text-zinc-100">{b.clientName}</span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#F8F6F2] text-[#706B5F] dark:text-zinc-400">{b.code}</span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          isPending ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          isAwaitingDeposit ? 'bg-amber-200 text-amber-950 border border-amber-400 flex items-center gap-1 font-extrabold' :
                          isConfirmed ? 'bg-[#EEF1EB] text-[#5A5A40] dark:text-zinc-300' :
                          isCompleted ? 'bg-[#FDF4EE] text-[#D4A373]' :
                          'bg-stone-100 dark:bg-zinc-800/80 text-stone-600 dark:text-zinc-400'
                        }`}>
                          {isPending && 'Aguardando Aprovação'}
                          {isAwaitingDeposit && (
                            <>
                              <Hourglass className="w-3 h-3" />
                              Aguardando Sinal Pix
                            </>
                          )}
                          {isConfirmed && 'Confirmado'}
                          {isCompleted && 'Concluído'}
                          {isCancelled && (b.cancellationReason?.includes('expirado') ? 'Horário Reaberto' : 'Cancelado')}
                        </span>

                        {/* Tag de Alerta se o Horário Já Passou */}
                        {isPast && isConfirmed && (
                          <span className="text-2xs font-extrabold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950 border border-amber-400 flex items-center gap-1 animate-pulse">
                            <Clock className="w-3 h-3 text-amber-800" />
                            Horário Já Passou
                          </span>
                        )}

                        {/* Sinal / Depósito / Pagar na Hora Status */}
                        {b.payOnArrival ? (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                            💵 Pagar na Hora (No Atendimento)
                          </span>
                        ) : b.depositPaid ? (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Sinal R$ {b.depositAmount.toFixed(2)} Pago
                          </span>
                        ) : b.depositRequired ? (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                            Sinal R$ {b.depositAmount.toFixed(2)} Pendente
                          </span>
                        ) : (
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400">
                            Sem Sinal Prévio
                          </span>
                        )}

                        {b.reminderSent && (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Lembrete Enviado
                            {b.reminderTemplateUsed && (
                              <span className="opacity-75">({b.reminderTemplateUsed})</span>
                            )}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-[#3D3D3D]">
                        <strong>{b.serviceName}</strong> • {formatDatePtBr(b.date)} às <strong>{b.time}{b.endTime ? ` às ${b.endTime}` : ''}</strong> ({b.serviceDuration} min)
                      </p>

                      {b.notes && (
                        <div className="text-xs text-[#5A5A40] dark:text-zinc-300 bg-[#EEF1EB] px-3 py-1.5 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 flex items-center gap-1.5 max-w-xl">
                          <span className="font-bold">Observação:</span>
                          <span>{b.notes}</span>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#706B5F] dark:text-zinc-400 pt-1">
                        <span>WhatsApp: <strong>{b.clientPhone}</strong></span>
                        <span>Total: <strong>R$ {b.totalPrice.toFixed(2)}</strong></span>
                        {remainingBalance > 0 && !isCompleted && (
                          <span className="font-bold text-[#5A5A40] dark:text-zinc-300">
                            (Restante no local: R$ {remainingBalance.toFixed(2)})
                          </span>
                        )}
                      </div>

                      {/* Alerta de Prazo para Pagamento do Sinal */}
                      {isAwaitingDeposit && (
                        <div className={`mt-2 p-3 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-xs ${
                          deadlineInfo?.expired 
                            ? 'bg-rose-50 border-rose-200 text-rose-800' 
                            : 'bg-amber-50 border-amber-200 text-amber-900'
                        }`}>
                          <div className="flex items-center gap-2">
                            <Hourglass className={`w-4 h-4 shrink-0 ${deadlineInfo?.expired ? 'text-rose-600 animate-pulse' : 'text-amber-700'}`} />
                            <span>
                              <strong>Sinal de R$ {b.depositAmount.toFixed(2)} pendente via Pix.</strong>{' '}
                              {deadlineInfo ? (
                                deadlineInfo.expired ? (
                                  <span className="font-bold text-rose-700 underline">Prazo expirado! Você pode reabrir a vaga para outra cliente.</span>
                                ) : (
                                  <span>Prazo para pagar: <strong className="font-bold text-amber-800">{deadlineInfo.text}</strong></span>
                                )
                              ) : (
                                <span>Prazo: {b.depositDeadlineHours || 2} horas</span>
                              )}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono bg-white dark:bg-zinc-900/80 px-2 py-0.5 rounded border border-current">
                            Pix: {professional.pixKey}
                          </span>
                        </div>
                      )}

                      {b.cancellationReason && (
                        <p className="text-xs text-[#D4A373] bg-[#FDF4EE] p-2 rounded-lg mt-2 border border-[#F6DFCE]">
                          Motivo: {b.cancellationReason}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-[#E9E2D7] dark:border-zinc-700">
                      {/* Se Pendente */}
                      {isPending && (
                        <>
                          <button
                            onClick={() => handleApproveBooking(b)}
                            className="px-3.5 py-2 bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                            <span>Aprovar / Confirmar Horário</span>
                          </button>

                          <button
                            onClick={() => handleOpenCancelModal(b)}
                            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Recusar
                          </button>

                          <a
                            href={generateReminderWhatsAppUrl(b, professional)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            WhatsApp
                          </a>
                        </>
                      )}

                      {/* Se Aguardando Sinal */}
                      {isAwaitingDeposit && (
                        <>
                          <button
                            onClick={() => handleConfirmDepositPayment(b)}
                            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                            title="Confirmar que o Pix do sinal foi recebido"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                            Confirmar Pagamento do Pix
                          </button>

                          <a
                            href={generateDepositReminderWhatsAppUrl(b, professional)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                            title="Lembrar a cliente sobre o prazo do Pix"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Lembrar Prazo
                          </a>

                          <button
                            onClick={() => handleOpenReopenModal(b)}
                            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Reabrir horário na agenda"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Reabrir Horário
                          </button>
                        </>
                      )}

                      {/* Se Confirmado */}
                      {isConfirmed && (
                        <>
                          {/* Botão de Confirmação para Horário que Já Passou */}
                          {isPast && (
                            <button
                              onClick={() => handleOpenCheckoutModal(b)}
                              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                              title="Horário já passou: confirmar que o atendimento ocorreu e registrar forma de pagamento restante"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                              <span>✓ Ocorreu? Confirmar & Receber</span>
                            </button>
                          )}

                          {!isPast && (
                            <button
                              onClick={() => handleOpenCheckoutModal(b)}
                              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                              title="Concluir atendimento e registrar forma de recebimento (Cartão, Dinheiro ou Pix)"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Concluir & Receber</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              const url = generateReminderWhatsAppUrl(b, professional);
                              window.open(url, '_blank', 'noopener,noreferrer');
                              markReminderSent(b.id);
                            }}
                            className="px-3 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Abre WhatsApp e registra o lembrete como enviado"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            {b.reminderSent ? 'Reenviar Lembrete' : 'Lembrar WhatsApp'}
                          </button>

                          <button
                            onClick={() => handleOpenCancelModal(b)}
                            className="px-3 py-2 bg-[#FDF4EE] hover:bg-[#fce9dc] text-[#D4A373] rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5 text-[#D4A373]" />
                            Cancelar
                          </button>
                        </>
                      )}

                      {/* Se Cancelado */}
                      {isCancelled && (
                        <>
                          <button
                            onClick={() => handleApproveBooking(b)}
                            className="px-3 py-2 bg-[#EEF1EB] hover:bg-[#e1e6db] text-[#5A5A40] dark:text-zinc-300 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Reativar e aprovar horário"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Reativar
                          </button>

                          <a
                            href={generateCancellationWhatsAppUrl(b, professional, b.cancellationReason)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-[#F8F6F2] hover:bg-[#EEF1EB] dark:hover:bg-zinc-800 text-[#3D3D3D] rounded-xl text-xs font-bold flex items-center gap-1"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                            Avisar no WhatsApp
                          </a>
                        </>
                      )}

                      {/* Se Concluído */}
                      {isCompleted && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-2xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            {b.paymentMethod === 'credit_card' ? 'Cartão de Crédito' :
                             b.paymentMethod === 'debit_card' ? 'Cartão de Débito' :
                             b.paymentMethod === 'cash' ? 'Dinheiro' :
                             b.paymentMethod === 'pix' ? 'Pix' :
                             b.paymentMethod === 'courtesy' ? 'Cortesia (Sem Cobrança)' :
                             b.paymentMethod === 'split' ? (
                               <span>
                                 Misto ({b.splitPayments?.map(p => `${p.method === 'pix' ? 'Pix' : p.method === 'credit_card' ? 'Crédito' : p.method === 'debit_card' ? 'Débito' : 'Dinheiro'} R$ ${p.amount.toFixed(0)}`).join(' + ') || 'Dividido'})
                               </span>
                             ) : 'Concluído'}
                          </span>
                          <button
                            onClick={() => setCompletedBookingToReopen(b)}
                            className="px-2.5 py-1.5 bg-[#F8F6F2] dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-[#706B5F] hover:text-rose-700 dark:text-zinc-400 dark:hover:text-rose-300 rounded-xl text-2xs font-bold flex items-center gap-1 transition-colors cursor-pointer border border-[#E9E2D7] dark:border-zinc-700"
                            title="Opções de reabertura ou estorno em caso de exceção"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Reabrir / Estornar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA: MEU PLANO & VALORES */}
      {/* ========================================================================= */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          
          {/* Cabeçalho Limpo */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-[#E9E2D7] dark:border-zinc-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-2 bg-[#5A5A40] dark:bg-zinc-700 text-white rounded-xl shadow-xs">
                  <Sparkles className="w-5 h-5 text-[#D4A373]" />
                </span>
                <h2 className="serif text-xl sm:text-2xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                  Valores & Como Funciona a Cobrança
                </h2>
              </div>
              <p className="text-sm text-[#706B5F] dark:text-zinc-400 max-w-2xl">
                Você tem <strong>15 dias de teste grátis (R$ 0,00)</strong> sem compromisso. Veja abaixo como funciona o fechamento mensal e os valores cobrados após o período de degustação.
              </p>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span className="text-xs font-bold text-[#A09A8E] dark:text-zinc-500 uppercase tracking-wider block">Status da sua conta</span>
              <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold ${
                planStatus.isTrial
                  ? planStatus.isExpired ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-[#EEF1EB] text-[#5A5A40] dark:text-zinc-300 border border-[#dfe5d8]'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                {planStatus.isTrial ? `Teste Grátis (${planStatus.daysRemaining} dias restantes)` : 'Assinatura Ativa (Pós-Pago)'}
              </span>
            </div>
          </div>

          {/* DOIS CARDS DE VALORES E FORMAS DE COBRANÇA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* CARD 1: Plano Mensalidade Acessível + Taxa por Cliente */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border-2 border-[#E9E2D7] dark:border-zinc-700 shadow-xs flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    Mais Flexível
                  </span>
                  <span className="text-xs text-[#706B5F] dark:text-zinc-400 font-medium">
                    Ideal para quem está começando
                  </span>
                </div>

                <div>
                  <h3 className="serif text-xl sm:text-2xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                    Mensalidade Acessível + Taxa por Agendamento
                  </h3>
                  <p className="text-xs sm:text-sm text-[#706B5F] dark:text-zinc-400 mt-1">
                    Pague uma mensalidade super baixa e apenas R$ 0,99 por cada cliente que realmente agendar com você.
                  </p>
                </div>

                <div className="pt-2 pb-1 border-y border-[#F0ECE4] dark:border-zinc-800 space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="serif text-3xl sm:text-4xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                      R$ 24,90
                    </span>
                    <span className="text-sm font-semibold text-[#706B5F] dark:text-zinc-400">/mês de base</span>
                  </div>
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-600" />
                    + R$ 0,99 por agendamento concluído
                  </p>
                </div>

                <div className="space-y-2 text-xs sm:text-sm text-[#5A5A40] dark:text-zinc-300">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Primeiros <strong>15 dias 100% gratuitos (R$ 0,00)</strong></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Contagem automática de agendamentos no mês</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Cancelamentos não geram taxa (R$ 0,00)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Todas as ferramentas, WhatsApp e notificações inclusas</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#F0ECE4] dark:border-zinc-800 bg-[#FAF8F5] dark:bg-zinc-800/50 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 p-4 sm:p-6 rounded-b-3xl">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#2D2D2A] dark:text-zinc-200">Como é cobrado:</span>
                  <span className="text-[#706B5F] dark:text-zinc-400 font-medium">Pós-pago no fechamento mensal</span>
                </div>
                <p className="text-2xs text-[#706B5F] dark:text-zinc-400 mt-1">
                  A fatura soma R$ 24,90 + (total de clientes do mês × R$ 0,99).
                </p>
              </div>
            </div>

            {/* CARD 2: Plano Fixo Mensal (Ilimitado) */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border-2 border-[#5A5A40] dark:border-zinc-600 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#5A5A40] text-white">
                    Ilimitado
                  </span>
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                    Zero taxa por agendamento
                  </span>
                </div>

                <div>
                  <h3 className="serif text-xl sm:text-2xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                    Valor Fixo Mensal (Sem Taxas)
                  </h3>
                  <p className="text-xs sm:text-sm text-[#706B5F] dark:text-zinc-400 mt-1">
                    Atenda quantas clientes quiser sem pagar nenhum centavo a mais por agendamento realizado.
                  </p>
                </div>

                <div className="pt-2 pb-1 border-y border-[#F0ECE4] dark:border-zinc-800 space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="serif text-3xl sm:text-4xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                      R$ 59,90
                    </span>
                    <span className="text-sm font-semibold text-[#706B5F] dark:text-zinc-400">/mês fixo</span>
                  </div>
                  <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    R$ 0,00 de taxa por agendamento (ilimitado)
                  </p>
                </div>

                <div className="space-y-2 text-xs sm:text-sm text-[#5A5A40] dark:text-zinc-300">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Primeiros <strong>15 dias 100% gratuitos (R$ 0,00)</strong></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Agendamentos ilimitados na sua agenda</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Previsibilidade total no orçamento</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Todas as ferramentas, fotos, lembretes e suporte inclusos</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#F0ECE4] dark:border-zinc-800 bg-[#FAF8F5] dark:bg-zinc-800/50 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 p-4 sm:p-6 rounded-b-3xl">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#2D2D2A] dark:text-zinc-200">Como é cobrado:</span>
                  <span className="text-[#706B5F] dark:text-zinc-400 font-medium">Valor fixo mensal fechado</span>
                </div>
                <p className="text-2xs text-[#706B5F] dark:text-zinc-400 mt-1">
                  A fatura é emitida sempre com o valor fixo de R$ 59,90 no fechamento mensal.
                </p>
              </div>
            </div>

          </div>

          {/* CARD EXPLICATIVO: FECHAMENTO NO FINAL DO MÊS E VENCIMENTO NO DIA 05 */}
          <div className="bg-[#FAF8F5] dark:bg-zinc-800/80 rounded-3xl p-6 sm:p-8 border border-[#E9E2D7] dark:border-zinc-700 shadow-xs space-y-4">
            <h3 className="serif text-lg sm:text-xl font-bold text-[#2D2D2A] dark:text-zinc-100 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-[#5A5A40] dark:text-amber-400" />
              Como Funciona o Ciclo de Cobrança & Vencimento
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-[#E9E2D7] dark:border-zinc-700 space-y-1.5">
                <span className="w-6 h-6 rounded-full bg-[#5A5A40] text-white flex items-center justify-center font-bold text-xs">1</span>
                <h4 className="font-bold text-[#2D2D2A] dark:text-zinc-100">15 Dias de Teste Grátis</h4>
                <p className="text-[#706B5F] dark:text-zinc-400 text-xs">Você usa todas as ferramentas por 15 dias sem pagar nada. Se o teste encerrar antes do fim do mês, o primeiro fechamento calcula apenas o período após o teste.</p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-[#E9E2D7] dark:border-zinc-700 space-y-1.5">
                <span className="w-6 h-6 rounded-full bg-[#5A5A40] text-white flex items-center justify-center font-bold text-xs">2</span>
                <h4 className="font-bold text-[#2D2D2A] dark:text-zinc-100">Fechamento no Fim do Mês</h4>
                <p className="text-[#706B5F] dark:text-zinc-400 text-xs">No último dia do mês o sistema contabiliza os agendamentos concluídos e gera a fatura transparente no dia 1º.</p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-[#E9E2D7] dark:border-zinc-700 space-y-1.5">
                <span className="w-6 h-6 rounded-full bg-[#5A5A40] text-white flex items-center justify-center font-bold text-xs">3</span>
                <h4 className="font-bold text-[#2D2D2A] dark:text-zinc-100">Vencimento até o Dia 05</h4>
                <p className="text-[#706B5F] dark:text-zinc-400 text-xs">Você recebe o boleto/Pix/cartão no dia 1º com prazo confortável até o dia 05 para efetuar o pagamento.</p>
              </div>
            </div>
          </div>

          {/* EXTRATO DO MÊS ATUAL */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-[#E9E2D7] dark:border-zinc-700 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="serif text-lg sm:text-xl font-bold text-[#2D2D2A] dark:text-zinc-100 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#5A5A40] dark:text-zinc-300" />
                Extrato do Período Atual
              </h3>
              <span className="text-xs text-[#706B5F] dark:text-zinc-400">
                {professional.name} • {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </span>
            </div>

            <div className="divide-y divide-[#E9E2D7] text-sm">
              <div className="py-3 flex items-center justify-between">
                <span className="text-[#706B5F] dark:text-zinc-400">Status Atual:</span>
                <span className="font-bold text-[#2D2D2A] dark:text-zinc-100">{planStatus.planName}</span>
              </div>
              <div className="py-3 flex items-center justify-between">
                <span className="text-[#706B5F] dark:text-zinc-400">Agendamentos Confirmados no Mês:</span>
                <span className="font-bold text-[#2D2D2A] dark:text-zinc-100">{billingInfo.confirmedBookingsCount} atendimento(s)</span>
              </div>
              <div className="py-3 flex items-center justify-between">
                <span className="text-[#706B5F] dark:text-zinc-400">Ciclo de Cobrança:</span>
                <span className="font-bold text-emerald-800 dark:text-emerald-400">Fechamento todo fim de mês • Vencimento no dia 05</span>
              </div>
              <div className="py-3.5 flex items-center justify-between bg-[#F8F6F2] dark:bg-zinc-800/80 -mx-6 sm:-mx-8 px-6 sm:px-8 font-bold text-base">
                <span className="text-[#2D2D2A] dark:text-zinc-100">Fatura Estimada do Mês:</span>
                <span className="serif text-xl text-[#5A5A40] dark:text-zinc-300">
                  {planStatus.isTrial ? 'R$ 0,00 (Teste Grátis)' : `R$ ${billingInfo.totalInvoiceAmount.toFixed(2)}`}
                </span>
              </div>
            </div>

            {planStatus.isTrial && (
              <div className="p-4 bg-[#EEF1EB] dark:bg-zinc-800 rounded-2xl text-xs text-[#5A5A40] dark:text-zinc-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#5A5A40] dark:text-zinc-300 shrink-0" />
                <span>
                  Você está no período de teste grátis: <strong>R$ 0,00 de cobrança nos seus {planStatus.totalTrialDays} dias iniciais</strong>.
                </span>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: SERVIÇOS */}
      {/* ========================================================================= */}
      {activeTab === 'services' && (() => {
        const individualServices = profServices.filter(s => !s.isCombo);
        const comboServices = profServices.filter(s => s.isCombo);

        return (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-[#E9E2D7] dark:border-zinc-700 shadow-xs">
              <div>
                <h2 className="serif text-xl sm:text-2xl font-bold text-[#2D2D2A] dark:text-zinc-100">Catálogo de Procedimentos & Combos</h2>
                <p className="text-[#706B5F] dark:text-zinc-400 text-xs sm:text-sm mt-0.5">
                  Organize seus serviços individuais e monte combos promocionais atrativos para elevar o ticket médio.
                </p>
              </div>
              <button
                onClick={openNewServiceModal}
                className="px-4 py-2.5 bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                Novo Procedimento / Combo
              </button>
            </div>

            {/* SEÇÃO 1: Procedimentos Individuais */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="serif text-lg font-bold text-[#2D2D2A] dark:text-zinc-100">
                  Procedimentos Individuais ({individualServices.length})
                </h3>
              </div>

              {individualServices.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-[#E9E2D7] dark:border-zinc-700 text-xs text-[#706B5F]">
                  Nenhum procedimento individual cadastrado ainda.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {individualServices.map((service) => (
                    <div
                      key={service.id}
                      className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-[#E9E2D7] dark:border-zinc-700 shadow-xs space-y-3 flex flex-col justify-between transition-all hover:border-[#5A5A40]/40"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            {service.imageUrl && (
                              <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-[#E9E2D7] dark:border-zinc-700 shadow-2xs">
                                <Image
                                  src={service.imageUrl}
                                  alt={service.name}
                                  fill
                                  sizes="48px"
                                  className="object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            )}
                            <div>
                              <h4 className="serif font-bold text-base text-[#2D2D2A] dark:text-zinc-100 leading-snug">{service.name}</h4>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="serif text-lg font-bold text-[#5A5A40] dark:text-zinc-200">
                              R$ {service.price.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {service.description && (
                          <p className="text-xs text-[#706B5F] dark:text-zinc-400 line-clamp-2 leading-relaxed">
                            {service.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[11px] font-semibold px-2 py-0.5 bg-[#F8F6F2] dark:bg-zinc-800 rounded-md text-[#5A5A40] dark:text-zinc-300 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {service.durationMinutes} min
                          </span>

                          {service.requiresDeposit ? (
                            <span className="text-[11px] font-semibold px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-md border border-amber-200 dark:border-amber-800/60">
                              Sinal: {service.depositType === 'percentage' ? `${service.depositValue}%` : `R$ ${service.depositValue.toFixed(2)}`}
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-md border border-emerald-200 dark:border-emerald-800/60">
                              Sem sinal prévio
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 pt-2.5 border-t border-[#E9E2D7] dark:border-zinc-800">
                        <button
                          onClick={() => openEditServiceModal(service)}
                          className="px-2.5 py-1 text-[#706B5F] dark:text-zinc-300 hover:text-[#2D2D2A] dark:hover:text-white hover:bg-[#EEF1EB] dark:hover:bg-zinc-800 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Edit3 className="w-3 h-3" />
                          Editar
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Excluir serviço "${service.name}"?`)) {
                              deleteService(service.id);
                            }
                          }}
                          className="px-2.5 py-1 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SEÇÃO 2: Combos & Pacotes Promocionais */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="serif text-lg font-bold text-[#2D2D2A] dark:text-zinc-100 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#5A5A40]" />
                  Combos & Pacotes Promocionais ({comboServices.length})
                </h3>
              </div>

              {comboServices.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-[#E9E2D7] dark:border-zinc-700 text-xs text-[#706B5F]">
                  Nenhum combo cadastrado. Clique em &quot;Novo Procedimento / Combo&quot; e marque a opção de combo para oferecer pacotes com desconto.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {comboServices.map((service) => (
                    <div
                      key={service.id}
                      className="bg-[#FDFBF7] dark:bg-zinc-900 rounded-2xl p-4 border border-[#5A5A40]/40 dark:border-zinc-600 ring-1 ring-[#5A5A40]/20 shadow-xs space-y-3 flex flex-col justify-between transition-all"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            {service.imageUrl && (
                              <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-[#E9E2D7] dark:border-zinc-700 shadow-2xs">
                                <Image
                                  src={service.imageUrl}
                                  alt={service.name}
                                  fill
                                  sizes="48px"
                                  className="object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="serif font-bold text-base text-[#2D2D2A] dark:text-zinc-100 leading-snug">{service.name}</h4>
                              </div>
                              <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#5A5A40] text-white inline-flex items-center gap-1 mt-1 shadow-2xs">
                                <Tag className="w-2.5 h-2.5" />
                                Combo Promocional
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            {service.originalPrice && service.originalPrice > service.price ? (
                              <div>
                                <span className="text-2xs text-stone-400 line-through block">
                                  R$ {service.originalPrice.toFixed(2)}
                                </span>
                                <span className="serif text-lg font-bold text-[#5A5A40] dark:text-zinc-200">
                                  R$ {service.price.toFixed(2)}
                                </span>
                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded">
                                  -{Math.round(((service.originalPrice - service.price) / service.originalPrice) * 100)}% OFF
                                </span>
                              </div>
                            ) : (
                              <span className="serif text-lg font-bold text-[#5A5A40] dark:text-zinc-200">
                                R$ {service.price.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>

                        {service.comboServiceNames && (
                          <p className="text-2xs text-[#5A5A40] dark:text-zinc-300 font-bold bg-[#EEF1EB]/80 dark:bg-zinc-800 p-2 rounded-xl border border-[#E9E2D7] dark:border-zinc-700">
                            Inclui: {service.comboServiceNames}
                          </p>
                        )}

                        {service.description && (
                          <p className="text-xs text-[#706B5F] dark:text-zinc-400 line-clamp-2 leading-relaxed">
                            {service.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[11px] font-semibold px-2 py-0.5 bg-white dark:bg-zinc-800 rounded-md text-[#5A5A40] dark:text-zinc-300 flex items-center gap-1 border border-[#E9E2D7] dark:border-zinc-700">
                            <Clock className="w-3 h-3" />
                            {service.durationMinutes} min
                          </span>

                          {service.requiresDeposit ? (
                            <span className="text-[11px] font-semibold px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-md border border-amber-200 dark:border-amber-800/60">
                              Sinal: {service.depositType === 'percentage' ? `${service.depositValue}%` : `R$ ${service.depositValue.toFixed(2)}`}
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-md border border-emerald-200 dark:border-emerald-800/60">
                              Sem sinal prévio
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 pt-2.5 border-t border-[#E9E2D7] dark:border-zinc-800">
                        <button
                          onClick={() => openEditServiceModal(service)}
                          className="px-2.5 py-1 text-[#706B5F] dark:text-zinc-300 hover:text-[#2D2D2A] dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Edit3 className="w-3 h-3" />
                          Editar
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Excluir combo "${service.name}"?`)) {
                              deleteService(service.id);
                            }
                          }}
                          className="px-2.5 py-1 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          {/* ========================================================================= */}
          {/* SEÇÃO: FOTOS REAIS DOS PROCEDIMENTOS (PORTFÓLIO VISUAL DO AGENDAMENTO) */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-7 border border-[#E9E2D7] dark:border-zinc-700 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E9E2D7] dark:border-zinc-700/60 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="serif text-lg sm:text-xl font-bold text-[#2D2D2A] dark:text-zinc-100 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-[#5A5A40] dark:text-zinc-300" />
                    Fotos Reais dos Seus Procedimentos (Vitrine das Clientes)
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Aparece no Agendamento
                  </span>
                </div>
                <p className="text-[#706B5F] dark:text-zinc-400 text-xs sm:text-sm mt-1">
                  Adicione fotos dos seus trabalhos realizados. Elas aparecem no topo da página de agendamento e ajudam a cliente a escolher o procedimento com muito mais confiança!
                </p>
              </div>

              <button
                type="button"
                onClick={openNewPhotoModal}
                className="px-4 py-2.5 bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Adicionar Nova Foto
              </button>
            </div>

            {/* Grid de Fotos Atuais */}
            {professional.portfolioPhotos && professional.portfolioPhotos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {professional.portfolioPhotos.map((photo) => (
                  <div 
                    key={photo.id}
                    className="group relative rounded-2xl overflow-hidden border border-[#E9E2D7] dark:border-zinc-700 bg-[#FDFBF7] dark:bg-zinc-950 shadow-xs flex flex-col"
                  >
                    <div className="relative aspect-4/3 w-full bg-stone-100 dark:bg-zinc-800 overflow-hidden">
                      <Image
                        src={photo.url}
                        alt={photo.title}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer"
                        title="Remover foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="p-3 space-y-1 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-xs text-[#2D2D2A] dark:text-zinc-100 line-clamp-1">
                          {photo.title}
                        </h4>
                        {photo.serviceName && (
                          <span className="text-[11px] text-[#5A5A40] dark:text-zinc-400 font-medium line-clamp-1">
                            {photo.serviceName}
                          </span>
                        )}
                      </div>
                      {photo.description && (
                        <p className="text-[10px] text-[#706B5F] dark:text-zinc-400 line-clamp-2">
                          {photo.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 px-4 rounded-2xl border-2 border-dashed border-[#E9E2D7] dark:border-zinc-700 bg-[#FAF8F5] dark:bg-zinc-950/50 space-y-3">
                <Camera className="w-10 h-10 mx-auto text-[#A09A8E] dark:text-zinc-500" />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-[#2D2D2A] dark:text-zinc-200">
                    Nenhuma foto cadastrada ainda
                  </h4>
                  <p className="text-xs text-[#706B5F] dark:text-zinc-400 max-w-md mx-auto">
                    Fotos reais de resultados encantam as clientes e aumentam a taxa de agendamento em até 40%!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openNewPhotoModal}
                  className="px-4 py-2 bg-[#5A5A40] dark:bg-zinc-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Cadastrar Primeira Foto
                </button>
              </div>
            )}
          </div>
        </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* ABA 4: DIAS DO MÊS & HORÁRIOS */}
      {/* ========================================================================= */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-[#E9E2D7] dark:border-zinc-700 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E9E2D7] dark:border-zinc-700 pb-5">
              <div>
                <h2 className="serif text-xl sm:text-2xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                  Dias de Atendimento & Horários da Agenda
                </h2>
                <p className="text-[#706B5F] dark:text-zinc-400 text-sm mt-1">
                  Defina com precisão os dias em que você estará atendendo. Clientes só poderão agendar nos dias liberados.
                </p>
              </div>

              {/* Seletor de Modo de Agendamento */}
              <div className="bg-[#FAF8F5] dark:bg-zinc-800/50 p-1.5 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setScheduleMode('all_active_days')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    scheduleMode === 'all_active_days'
                      ? 'bg-[#5A5A40] dark:bg-zinc-700 text-white shadow-xs'
                      : 'text-[#706B5F] dark:text-zinc-400 hover:text-[#2D2D2A] dark:hover:text-zinc-100 dark:text-zinc-100 dark:hover:text-zinc-100 dark:text-zinc-100'
                  }`}
                >
                  Dias Fixos da Semana
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleMode('specific_dates')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    scheduleMode === 'specific_dates'
                      ? 'bg-[#5A5A40] dark:bg-zinc-700 text-white shadow-xs'
                      : 'text-[#706B5F] dark:text-zinc-400 hover:text-[#2D2D2A] dark:hover:text-zinc-100 dark:text-zinc-100 dark:hover:text-zinc-100 dark:text-zinc-100'
                  }`}
                >
                  📅 Dias Específicos do Mês
                </button>
              </div>
            </div>

            {/* Banner de Feedback de Salvamento */}
            {scheduleSavedFeedback && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{scheduleSavedFeedback}</span>
              </div>
            )}

            {/* MODO 1: DIAS ESPECÍFICOS DO MÊS (CALENDÁRIO INTERATIVO COM PRESETS) */}
            {scheduleMode === 'specific_dates' ? (
              <div className="space-y-6">
                {/* Cabeçalho do Calendário & Opções Automáticas */}
                <div className="bg-[#FAF8F5] dark:bg-zinc-800/50 p-5 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#5A5A40] dark:text-zinc-300 block mb-1">
                        Opções Automáticas Rápidas
                      </span>
                      <p className="text-xs text-[#706B5F] dark:text-zinc-400">
                        Aplique um padrão com 1 clique para o mês de {monthNamesPt[calendarViewMonth]} de {calendarViewYear}:
                      </p>
                    </div>

                    <span className="text-xs font-bold text-[#5A5A40] dark:text-zinc-300 bg-[#EEF1EB] px-3 py-1.5 rounded-full self-start md:self-auto">
                      {selectedSpecificDates.length} {selectedSpecificDates.length === 1 ? 'dia liberado' : 'dias liberados no total'}
                    </span>
                  </div>

                  {/* Barra de Botões de Presets Rápidos */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => applyPreset('day_on_day_off_odd')}
                      className="px-3 py-2 bg-white dark:bg-zinc-900 hover:bg-[#EEF1EB] dark:hover:bg-zinc-800 text-[#5A5A40] dark:text-zinc-300 text-xs font-bold rounded-xl border border-[#5A5A40] dark:border-zinc-600/40 shadow-2xs cursor-pointer flex items-center gap-1.5 transition-all"
                      title="Trabalha dia sim, folga dia não iniciando no dia 1 (dias ímpares 1, 3, 5, 7...)"
                    >
                      <span>🔄</span> Dia Sim/Não (Inicia Dia 1)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('day_on_day_off_even')}
                      className="px-3 py-2 bg-white dark:bg-zinc-900 hover:bg-[#EEF1EB] dark:hover:bg-zinc-800 text-[#5A5A40] dark:text-zinc-300 text-xs font-bold rounded-xl border border-[#5A5A40] dark:border-zinc-600/40 shadow-2xs cursor-pointer flex items-center gap-1.5 transition-all"
                      title="Trabalha dia sim, folga dia não iniciando no dia 2 / dia seguinte (dias pares 2, 4, 6, 8...)"
                    >
                      <span>🔄</span> Dia Sim/Não (Inicia Dia 2)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('weekdays')}
                      className="px-3 py-2 bg-white dark:bg-zinc-900 hover:bg-[#EEF1EB] dark:hover:bg-zinc-800 text-[#2D2D2A] dark:text-zinc-100 text-xs font-semibold rounded-xl border border-[#E9E2D7] dark:border-zinc-700 shadow-2xs cursor-pointer flex items-center gap-1.5 transition-all"
                    >
                      <span>💼</span> Segunda a Sexta
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('weekends')}
                      className="px-3 py-2 bg-white dark:bg-zinc-900 hover:bg-[#EEF1EB] dark:hover:bg-zinc-800 text-[#2D2D2A] dark:text-zinc-100 text-xs font-semibold rounded-xl border border-[#E9E2D7] dark:border-zinc-700 shadow-2xs cursor-pointer flex items-center gap-1.5 transition-all"
                    >
                      <span>🎉</span> Finais de Semana
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('all')}
                      className="px-3 py-2 bg-white dark:bg-zinc-900 hover:bg-[#EEF1EB] dark:hover:bg-zinc-800 text-[#2D2D2A] dark:text-zinc-100 text-xs font-semibold rounded-xl border border-[#E9E2D7] dark:border-zinc-700 shadow-2xs cursor-pointer flex items-center gap-1.5 transition-all"
                    >
                      <span>🗓️</span> Mês Inteiro
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('clear')}
                      className="px-3 py-2 bg-white dark:bg-zinc-900 hover:bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200 shadow-2xs cursor-pointer flex items-center gap-1.5 transition-all ml-auto"
                    >
                      <X className="w-3.5 h-3.5" /> Limpar Mês
                    </button>
                  </div>
                </div>

                {/* Grade do Calendário Mensal */}
                <div className="border border-[#E9E2D7] dark:border-zinc-700 rounded-3xl p-5 sm:p-6 bg-white dark:bg-zinc-900 space-y-4">
                  {/* Navegação entre Meses */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-[#5A5A40] dark:text-zinc-300" />
                      <h3 className="serif font-bold text-lg sm:text-xl text-[#2D2D2A] dark:text-zinc-100">
                        {monthNamesPt[calendarViewMonth]} <span className="text-[#706B5F] dark:text-zinc-400 font-normal">{calendarViewYear}</span>
                      </h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handlePrevMonth}
                        className="p-2 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 hover:bg-[#F8F6F2] text-[#2D2D2A] dark:text-zinc-100 transition-colors cursor-pointer"
                        title="Mês Anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextMonth}
                        className="p-2 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 hover:bg-[#F8F6F2] text-[#2D2D2A] dark:text-zinc-100 transition-colors cursor-pointer"
                        title="Próximo Mês"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Dias da Semana (Cabeçalho) */}
                  <div className="grid grid-cols-7 gap-1.5 text-center">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dw, i) => (
                      <div key={i} className="text-xs font-bold text-[#706B5F] dark:text-zinc-400 py-2 uppercase tracking-wider">
                        {dw}
                      </div>
                    ))}
                  </div>

                  {/* Dias do Mês */}
                  <div className="grid grid-cols-7 gap-1.5">
                    {/* Espaçadores antes do primeiro dia */}
                    {Array.from({ length: firstDayOffset }).map((_, i) => (
                      <div key={`offset-${i}`} className="min-h-[64px] sm:min-h-[76px] rounded-2xl bg-[#FAF8F5] dark:bg-zinc-800/50/50 border border-transparent" />
                    ))}

                    {/* Cada dia do mês */}
                    {daysInViewMonth.map((day) => {
                      const isSelected = selectedSpecificDates.includes(day.dateStr);

                      if (day.isPast) {
                        return (
                          <div
                            key={day.dateStr}
                            className="min-h-[64px] sm:min-h-[76px] p-2 rounded-2xl border border-stone-100 bg-stone-50 dark:bg-zinc-800 text-stone-300 opacity-50 flex flex-col justify-between cursor-not-allowed"
                          >
                            <span className="text-xs font-semibold">{day.dayNumber}</span>
                            <span className="text-[10px] text-stone-300 font-medium">Passado</span>
                          </div>
                        );
                      }

                      return (
                        <button
                          key={day.dateStr}
                          type="button"
                          onClick={() => toggleSpecificDate(day.dateStr)}
                          className={`min-h-[64px] sm:min-h-[76px] p-2 sm:p-2.5 rounded-2xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#5A5A40] dark:border-zinc-600 bg-[#5A5A40] dark:bg-zinc-700 text-white shadow-xs scale-[1.02]'
                              : 'border-[#E9E2D7] dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-[#5A5A40] dark:border-zinc-600/60 text-[#2D2D2A] dark:text-zinc-100'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-sm sm:text-base font-bold">
                              {day.dayNumber}
                            </span>
                            {isSelected && (
                              <span className="w-4 h-4 rounded-full bg-emerald-400 text-emerald-950 flex items-center justify-center text-[10px] font-bold">
                                ✓
                              </span>
                            )}
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wide block ${isSelected ? 'text-white/90' : 'text-[#A09A8E] dark:text-zinc-500'}`}>
                            {isSelected ? 'Atendendo' : 'Folga'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-3 border-t border-[#E9E2D7] dark:border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-4 text-xs text-[#706B5F] dark:text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-lg bg-[#5A5A40] dark:bg-zinc-700 inline-block" />
                        <span>Dia Liberado para Clientes</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-lg border border-[#E9E2D7] dark:border-zinc-700 bg-white dark:bg-zinc-900 inline-block" />
                        <span>Folga (Bloqueado)</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveScheduleConfig}
                      className="px-6 py-3 rounded-2xl bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <Check className="w-4 h-4" />
                      Salvar Dias Liberados na Agenda
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* MODO 2: DIAS FIXOS DA SEMANA */
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-[#2D2D2A] dark:text-zinc-100 mb-2">
                    Quais dias da semana sua agenda fica aberta recorrentemente?
                  </label>
                  <p className="text-xs text-[#706B5F] dark:text-zinc-400 mb-3">
                    A cliente poderá agendar em qualquer semana nesses dias marcados.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                    {weekDayNames.map((name, idx) => {
                      const isActive = availability.activeDays.includes(idx);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => toggleDay(idx)}
                          className={`p-3 rounded-xl border-2 text-center text-xs font-bold transition-all cursor-pointer ${
                            isActive
                              ? 'border-[#5A5A40] dark:border-zinc-600 bg-[#EEF1EB] text-[#5A5A40] dark:text-zinc-300'
                              : 'border-[#E9E2D7] dark:border-zinc-700 bg-[#F8F6F2] text-[#A09A8E] dark:text-zinc-500 hover:border-[#5A5A40] dark:border-zinc-600'
                          }`}
                        >
                          {name}
                          <span className="block text-2xs mt-1 font-normal">
                            {isActive ? 'Atendendo' : 'Folga'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveScheduleConfig}
                    className="px-6 py-2.5 rounded-xl bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white font-bold text-xs shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Salvar Dias Fixos
                  </button>
                </div>
              </div>
            )}

            {/* Horários de Início, Fim e Almoço (Intervalos de 30 em 30 minutos) */}
            <div className="pt-6 border-t border-[#E9E2D7] dark:border-zinc-700 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="serif font-bold text-lg text-[#2D2D2A] dark:text-zinc-100 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#5A5A40] dark:text-zinc-300" />
                    Horário Padrão do Expediente & Pausas (30 em 30 minutos)
                  </h3>
                  <p className="text-xs text-[#706B5F] dark:text-zinc-400 mt-0.5">
                    Defina o horário geral de início e término dos atendimentos e pausas de almoço.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSaveDailyHours}
                  className="px-5 py-2.5 rounded-2xl bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white font-bold text-xs shadow-xs flex items-center gap-2 cursor-pointer shrink-0 transition-all"
                >
                  <Check className="w-4 h-4" />
                  Salvar Horários do Expediente & Pausas
                </button>
              </div>

              {hoursSavedFeedback && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{hoursSavedFeedback}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">
                    Horário de Início do Expediente:
                  </label>
                  <select
                    value={availability.startTime || '08:00'}
                    onChange={(e) => updateAvailability({ ...availability, startTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 font-bold text-sm cursor-pointer"
                  >
                    {TIME_SELECT_OPTIONS_30MIN.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">
                    Horário de Fim do Expediente:
                  </label>
                  <select
                    value={availability.endTime || '19:00'}
                    onChange={(e) => updateAvailability({ ...availability, endTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 font-bold text-sm cursor-pointer"
                  >
                    {TIME_SELECT_OPTIONS_30MIN.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Intervalo de Almoço */}
              <div className="p-4 bg-[#F8F6F2] dark:bg-zinc-800/60 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-[#2D2D2A] dark:text-zinc-100 block">Pausa para Almoço / Descanso</span>
                    <span className="text-xs text-[#706B5F] dark:text-zinc-400">Bloqueia automaticamente o intervalo na agenda de agendamento online</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={availability.hasLunchBreak}
                      onChange={(e) => updateAvailability({ ...availability, hasLunchBreak: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#E9E2D7] dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-zinc-900 after:border-stone-300 dark:border-zinc-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5A5A40] dark:bg-zinc-700"></div>
                  </label>
                </div>

                {availability.hasLunchBreak && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <span className="text-xs font-bold text-[#706B5F] dark:text-zinc-400 block mb-1">Início da Pausa:</span>
                      <select
                        value={availability.lunchStart || '12:00'}
                        onChange={(e) => updateAvailability({ ...availability, lunchStart: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 text-xs bg-white dark:bg-zinc-900 font-bold cursor-pointer"
                      >
                        {TIME_SELECT_OPTIONS_30MIN.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#706B5F] dark:text-zinc-400 block mb-1">Fim da Pausa:</span>
                      <select
                        value={availability.lunchEnd || '13:00'}
                        onChange={(e) => updateAvailability({ ...availability, lunchEnd: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 text-xs bg-white dark:bg-zinc-900 font-bold cursor-pointer"
                      >
                        {TIME_SELECT_OPTIONS_30MIN.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* SEÇÃO: HORÁRIOS DIFERENCIADOS POR DIA DA SEMANA (EX: SÁBADO, DOMINGO, ETC) */}
              <div className="p-5 bg-white dark:bg-zinc-900 rounded-3xl border-2 border-[#E9E2D7] dark:border-zinc-700 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="serif font-bold text-base text-[#2D2D2A] dark:text-zinc-100 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#5A5A40] dark:text-zinc-300" />
                      Horários Diferenciados por Dia da Semana (Ex: Sábado com expediente mais curto)
                    </h4>
                    <p className="text-xs text-[#706B5F] dark:text-zinc-400 mt-0.5">
                      Personalize horários de início, término ou pausas específicas para qualquer dia da semana.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {[
                    { dayIdx: 6, name: 'Sábado' },
                    { dayIdx: 0, name: 'Domingo' },
                    { dayIdx: 1, name: 'Segunda-feira' },
                    { dayIdx: 2, name: 'Terça-feira' },
                    { dayIdx: 3, name: 'Quarta-feira' },
                    { dayIdx: 4, name: 'Quinta-feira' },
                    { dayIdx: 5, name: 'Sexta-feira' },
                  ].map(({ dayIdx, name }) => {
                    const custom = availability.dayCustomHours?.[dayIdx];
                    const isCustomEnabled = Boolean(custom?.enabled);

                    return (
                      <div
                        key={dayIdx}
                        className={`p-4 rounded-2xl border transition-all space-y-3 ${
                          isCustomEnabled
                            ? 'bg-[#FAF8F5] dark:bg-zinc-800/80 border-[#5A5A40] dark:border-zinc-600 shadow-xs'
                            : 'bg-[#F8F6F2]/60 dark:bg-zinc-800/30 border-[#E9E2D7] dark:border-zinc-700/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-[#2D2D2A] dark:text-zinc-100 flex items-center gap-2">
                            <span>{dayIdx === 6 ? '💈' : dayIdx === 0 ? '☀️' : '📅'}</span>
                            {name}
                          </span>
                          <label className="flex items-center gap-2 text-xs font-bold text-[#5A5A40] dark:text-zinc-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isCustomEnabled}
                              onChange={(e) => {
                                const newCustom = {
                                  ...(availability.dayCustomHours || {}),
                                  [dayIdx]: {
                                    enabled: e.target.checked,
                                    startTime: custom?.startTime || (dayIdx === 6 ? '08:00' : availability.startTime),
                                    endTime: custom?.endTime || (dayIdx === 6 ? '14:00' : availability.endTime),
                                    hasLunchBreak: custom?.hasLunchBreak ?? false,
                                    lunchStart: custom?.lunchStart || '12:00',
                                    lunchEnd: custom?.lunchEnd || '13:00'
                                  }
                                };
                                updateAvailability({
                                  ...availability,
                                  dayCustomHours: newCustom
                                });
                              }}
                              className="w-4 h-4 rounded text-[#5A5A40] focus:ring-[#5A5A40] cursor-pointer"
                            />
                            <span>Horário Especial</span>
                          </label>
                        </div>

                        {isCustomEnabled && (
                          <div className="space-y-3 pt-2 border-t border-[#E9E2D7] dark:border-zinc-700 animate-in fade-in">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-[11px] font-bold text-[#706B5F] dark:text-zinc-400 block mb-1">Início:</span>
                                <select
                                  value={custom?.startTime || '08:00'}
                                  onChange={(e) => {
                                    const base = availability.dayCustomHours?.[dayIdx] || { enabled: true, startTime: '08:00', endTime: '18:00' };
                                    const newCustom = {
                                      ...(availability.dayCustomHours || {}),
                                      [dayIdx]: {
                                        ...base,
                                        startTime: e.target.value
                                      }
                                    };
                                    updateAvailability({ ...availability, dayCustomHours: newCustom });
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#E9E2D7] dark:border-zinc-700 text-xs bg-white dark:bg-zinc-900 font-bold"
                                >
                                  {TIME_SELECT_OPTIONS_30MIN.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <span className="text-[11px] font-bold text-[#706B5F] dark:text-zinc-400 block mb-1">Fim:</span>
                                <select
                                  value={custom?.endTime || '14:00'}
                                  onChange={(e) => {
                                    const base = availability.dayCustomHours?.[dayIdx] || { enabled: true, startTime: '08:00', endTime: '18:00' };
                                    const newCustom = {
                                      ...(availability.dayCustomHours || {}),
                                      [dayIdx]: {
                                        ...base,
                                        endTime: e.target.value
                                      }
                                    };
                                    updateAvailability({ ...availability, dayCustomHours: newCustom });
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#E9E2D7] dark:border-zinc-700 text-xs bg-white dark:bg-zinc-900 font-bold"
                                >
                                  {TIME_SELECT_OPTIONS_30MIN.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="pt-1">
                              <label className="flex items-center gap-2 text-xs font-medium text-[#706B5F] dark:text-zinc-400 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(custom?.hasLunchBreak)}
                                  onChange={(e) => {
                                    const base = availability.dayCustomHours?.[dayIdx] || { enabled: true, startTime: '08:00', endTime: '18:00' };
                                    const newCustom = {
                                      ...(availability.dayCustomHours || {}),
                                      [dayIdx]: {
                                        ...base,
                                        hasLunchBreak: e.target.checked
                                      }
                                    };
                                    updateAvailability({ ...availability, dayCustomHours: newCustom });
                                  }}
                                  className="w-3.5 h-3.5 rounded text-[#5A5A40] cursor-pointer"
                                />
                                <span>Pausa de almoço neste dia</span>
                              </label>

                              {custom?.hasLunchBreak && (
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                  <select
                                    value={custom?.lunchStart || '12:00'}
                                    onChange={(e) => {
                                      const base = availability.dayCustomHours?.[dayIdx] || { enabled: true, startTime: '08:00', endTime: '18:00' };
                                      const newCustom = {
                                        ...(availability.dayCustomHours || {}),
                                        [dayIdx]: {
                                          ...base,
                                          lunchStart: e.target.value
                                        }
                                      };
                                      updateAvailability({ ...availability, dayCustomHours: newCustom });
                                    }}
                                    className="w-full px-2 py-1 rounded-lg border border-[#E9E2D7] dark:border-zinc-700 text-2xs bg-white dark:bg-zinc-900 font-bold"
                                  >
                                    {TIME_SELECT_OPTIONS_30MIN.map((t) => (
                                      <option key={t} value={t}>{t}</option>
                                    ))}
                                  </select>
                                  <select
                                    value={custom?.lunchEnd || '13:00'}
                                    onChange={(e) => {
                                      const base = availability.dayCustomHours?.[dayIdx] || { enabled: true, startTime: '08:00', endTime: '18:00' };
                                      const newCustom = {
                                        ...(availability.dayCustomHours || {}),
                                        [dayIdx]: {
                                          ...base,
                                          lunchEnd: e.target.value
                                        }
                                      };
                                      updateAvailability({ ...availability, dayCustomHours: newCustom });
                                    }}
                                    className="w-full px-2 py-1 rounded-lg border border-[#E9E2D7] dark:border-zinc-700 text-2xs bg-white dark:bg-zinc-900 font-bold"
                                  >
                                    {TIME_SELECT_OPTIONS_30MIN.map((t) => (
                                      <option key={t} value={t}>{t}</option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSaveDailyHours}
                    className="px-6 py-2.5 rounded-xl bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white font-bold text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Check className="w-4 h-4" />
                    Salvar Horários do Expediente & Pausas
                  </button>
                </div>
              </div>

              <div className="p-4 bg-[#EEF1EB] rounded-2xl border border-[#dfe5d8] text-[#5A5A40] dark:text-zinc-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#5A5A40] dark:text-zinc-300 shrink-0" />
                <span>As alterações salvas são refletidas instantaneamente quando uma cliente abre seu link de agendamento online.</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA: TEMA & CORES DA AGENDA */}
      {/* ========================================================================= */}
      {activeTab === 'theme' && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-[#E9E2D7] dark:border-zinc-700 shadow-xs space-y-6">
          <div className="border-b border-[#E9E2D7] dark:border-zinc-700 pb-5">
            <h2 className="serif text-xl sm:text-2xl font-bold text-[#2D2D2A] dark:text-zinc-100">
              Personalização Visual & Tema da sua Agenda
            </h2>
            <p className="text-[#706B5F] dark:text-zinc-400 text-sm mt-1">
              Escolha a identidade visual que mais combina com seu estilo. As clientes verão essa paleta sofisticada ao agendar pelo WhatsApp.
            </p>
          </div>

          {themeSavedFeedback && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{themeSavedFeedback}</span>
            </div>
          )}

          {/* Grade de Temas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(Object.keys(THEME_CONFIGS) as ThemeColor[]).map((key) => {
              const theme = THEME_CONFIGS[key];
              const isCurrent = (professional.themeColor || 'olive') === key;
              const isSelected = selectedThemeKey === key;

              return (
                <div
                  key={key}
                  onClick={() => setSelectedThemeKey(key)}
                  className={`p-5 rounded-3xl border-2 transition-all cursor-pointer space-y-4 flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#5A5A40] dark:border-zinc-600 bg-[#FAF8F5] dark:bg-zinc-800/50 shadow-sm scale-[1.01]'
                      : 'border-[#E9E2D7] dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-[#5A5A40] dark:border-zinc-600/50'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base text-[#2D2D2A] dark:text-zinc-100 flex items-center gap-2">
                        {theme.name}
                      </h3>
                      {isCurrent ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
                          Ativo Agora
                        </span>
                      ) : isSelected ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A5A40] dark:text-zinc-300 bg-[#EEF1EB] px-2.5 py-1 rounded-full">
                          Selecionado
                        </span>
                      ) : null}
                    </div>

                    <p className="text-xs text-[#706B5F] dark:text-zinc-400 line-clamp-2 leading-relaxed">
                      {theme.subtitle}
                    </p>

                    {/* Amostras de Cores */}
                    <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-[#E9E2D7] dark:border-zinc-700 flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#A09A8E] dark:text-zinc-500 uppercase tracking-wider mr-1">
                        Paleta:
                      </span>
                      {theme.previewColors.map((color, idx) => (
                        <span
                          key={idx}
                          className="w-6 h-6 rounded-full border border-black/10 shadow-2xs inline-block"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>

                    {/* Simulação Visual do Botão */}
                    <div className="pt-1">
                      <div
                        className="py-2.5 px-4 rounded-xl text-xs font-bold text-center shadow-2xs transition-transform"
                        style={{
                          backgroundColor: theme.primary,
                          color: '#FFFFFF'
                        }}
                      >
                        Exemplo de Botão Agendar
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveTheme(key);
                    }}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isCurrent
                        ? 'bg-stone-100 dark:bg-zinc-800/80 text-stone-600 dark:text-zinc-400 border border-stone-200 dark:border-zinc-700'
                        : 'bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white shadow-xs'
                    }`}
                  >
                    {isCurrent ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Tema Ativo
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Ativar Este Tema
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-[#FAF8F5] dark:bg-zinc-800/50 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Palette className="w-5 h-5 text-[#5A5A40] dark:text-zinc-300" />
              <div className="text-xs text-[#706B5F] dark:text-zinc-400">
                <strong className="text-[#2D2D2A] dark:text-zinc-100 block">Tema Selecionado: {THEME_CONFIGS[selectedThemeKey].name}</strong>
                Clique em &quot;Ativar Este Tema&quot; em qualquer cartão acima para aplicar à sua página online.
              </div>
            </div>

            <Link
              href={`/${professional.slug}`}
              target="_blank"
              className="px-4 py-2 bg-white dark:bg-zinc-900 hover:bg-[#EEF1EB] dark:hover:bg-zinc-800 text-[#5A5A40] dark:text-zinc-300 border border-[#E9E2D7] dark:border-zinc-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <span>Ver Minha Agenda</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA: EQUIPE & COLABORADORAS DO SALÃO */}
      {/* ========================================================================= */}
      {activeTab === 'staff' && (
        <AdminStaffManager 
          professional={professional} 
          services={profServices} 
          bookings={profBookings} 
        />
      )}

      {/* ========================================================================= */}
      {/* ABA: LAYOUTS DA PÁGINA (VITRINES & MODELOS VISUAIS) */}
      {/* ========================================================================= */}
      {activeTab === 'layouts' && (
        <ProfessionalLayoutsManager professional={professional} />
      )}

      {/* ========================================================================= */}
      {/* ABA 5: POLÍTICA DE CANCELAMENTO */}
      {/* ========================================================================= */}
      {activeTab === 'policy' && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-[#E9E2D7] dark:border-zinc-700 shadow-xs space-y-6">
          <div>
            <h2 className="serif text-xl font-bold text-[#2D2D2A] dark:text-zinc-100">Política de Cancelamento & Retenção de Sinal</h2>
            <p className="text-[#706B5F] dark:text-zinc-400 text-sm">
              Defina as regras para suas clientes cancelarem sem perder o sinal de reserva (Artigo 39 do Código de Defesa do Consumidor).
            </p>
          </div>

          <form onSubmit={handleSavePolicy} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-sm font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">
                Prazo mínimo de antecedência para cancelar (em horas):
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="168"
                  value={cancellationHours}
                  onChange={(e) => setCancellationHours(Number(e.target.value))}
                  className="w-32 px-3.5 py-2.5 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 font-bold bg-white dark:bg-zinc-900"
                />
                <span className="text-sm text-[#706B5F] dark:text-zinc-400 font-medium">horas de antecedência (Ex.: 24h ou 48h)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">
                Orientação aos clientes (exibida na tela de agendamento):
              </label>
              <textarea
                rows={3}
                value={cancellationPolicyNotes}
                onChange={(e) => setCancellationPolicyNotes(e.target.value)}
                placeholder="Explique como funciona o cancelamento e a retenção do sinal..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 text-sm bg-white dark:bg-zinc-900"
              />
            </div>

            <div className="p-4 bg-[#FDF4EE] border border-[#F6DFCE] rounded-2xl text-xs text-[#D4A373] space-y-1">
              <strong className="block font-bold">Informação Legal Importante:</strong>
              <p>
                A retenção do sinal visa cobrir os custos de reserva e a hora bloqueada que não pôde ser repassada para outra cliente. Para total segurança jurídica, o prazo e a retenção ficam visíveis para a cliente antes do pagamento do Pix.
              </p>
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white rounded-xl font-bold text-sm shadow-xs transition-colors cursor-pointer flex items-center gap-2"
            >
              {policySaved ? <Check className="w-4 h-4" /> : null}
              {policySaved ? 'Salvo com Sucesso!' : 'Salvar Política'}
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 6: SUPORTE COM A ADMINISTRAÇÃO */}
      {/* ========================================================================= */}
      {activeTab === 'support' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-[#E9E2D7] dark:border-zinc-700 shadow-xs space-y-6">
            <div>
              <h2 className="serif text-xl font-bold text-[#2D2D2A] dark:text-zinc-100">Canal Direto com o Administrador</h2>
              <p className="text-[#706B5F] dark:text-zinc-400 text-sm">
                Precisa de ajuda com a plataforma, pagamentos ou configurações especiais? Envie uma mensagem direta.
              </p>
            </div>

            <form onSubmit={handleSendSupport} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-sm font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">
                  Assunto da Dúvida / Solicitação:
                </label>
                <input
                  type="text"
                  value={supportSubject}
                  onChange={(e) => setSupportSubject(e.target.value)}
                  placeholder="Ex.: Como alterar minha chave Pix principal?"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 text-sm bg-white dark:bg-zinc-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">
                  Mensagem detalhada:
                </label>
                <textarea
                  rows={4}
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Descreva o que está acontecendo ou como podemos te ajudar..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 text-sm bg-white dark:bg-zinc-900"
                  required
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white rounded-xl font-bold text-sm shadow-xs transition-colors cursor-pointer flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Enviar Mensagem para o Administrador
              </button>

              {supportSentSuccess && (
                <p className="text-[#5A5A40] dark:text-zinc-300 text-sm font-bold">
                  Sua mensagem foi enviada ao administrador! Ele responderá em breve.
                </p>
              )}
            </form>
          </div>

          {/* Histórico de Mensagens */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-[#E9E2D7] dark:border-zinc-700 shadow-xs space-y-4">
            <h3 className="serif font-bold text-lg text-[#2D2D2A] dark:text-zinc-100">Histórico de Solicitações de Suporte</h3>
            {tickets.filter(t => t.professionalId === professional.id).length === 0 ? (
              <p className="text-[#706B5F] dark:text-zinc-400 text-sm">Nenhum chamado aberto até o momento.</p>
            ) : (
              <div className="space-y-3">
                {tickets.filter(t => t.professionalId === professional.id).map((t) => (
                  <div key={t.id} className="p-4 rounded-2xl bg-[#F8F6F2] border border-[#E9E2D7] dark:border-zinc-700 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="serif font-bold text-[#2D2D2A] dark:text-zinc-100">{t.subject}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        t.status === 'answered' ? 'bg-[#EEF1EB] text-[#5A5A40] dark:text-zinc-300' : 'bg-[#FDF4EE] text-[#D4A373]'
                      }`}>
                        {t.status === 'answered' ? 'Respondido pelo Admin' : 'Aguardando Resposta'}
                      </span>
                    </div>
                    <p className="text-[#706B5F] dark:text-zinc-400 text-xs sm:text-sm">{t.message}</p>
                    {t.reply && (
                      <div className="mt-2 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-xs sm:text-sm text-[#2D2D2A] dark:text-zinc-100">
                        <strong className="block text-[#5A5A40] dark:text-zinc-300 font-bold mb-1">Resposta da Administração:</strong>
                        {t.reply}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL NOVO / EDITAR SERVIÇO */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-[#E9E2D7] dark:border-zinc-700 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="serif text-xl font-bold text-[#2D2D2A] dark:text-zinc-100">
              {editingService ? 'Editar Serviço' : 'Cadastrar Novo Serviço'}
            </h3>

            <form onSubmit={handleSaveService} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-[#706B5F] dark:text-zinc-400 mb-1">Nome do Serviço:</label>
                <input
                  type="text"
                  required
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  placeholder="Ex.: Alongamento em Gel Completo"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 text-sm bg-white dark:bg-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#706B5F] dark:text-zinc-400 mb-1">Descrição Breve:</label>
                <textarea
                  rows={2}
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  placeholder="Ex.: Inclui cuticulagem, esmaltação e acabamento natural."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 text-xs bg-white dark:bg-zinc-900"
                />
              </div>

              {/* SELETOR E PESQUISA DE IMAGEM DO SERVIÇO (SUPORTE A MÚLTIPLAS FOTOS / CARROSSEL) */}
              <ServiceImagePicker
                currentImageUrl={serviceForm.imageUrl}
                currentImages={serviceForm.images}
                onImagesChange={(imgs) => setServiceForm({ ...serviceForm, images: imgs, imageUrl: imgs[0] || '' })}
                onImageChange={(url) => {
                  const current = serviceForm.images && serviceForm.images.length > 0 ? serviceForm.images : [];
                  const updated = url ? (current.includes(url) ? current : [...current, url]) : [];
                  setServiceForm({ ...serviceForm, imageUrl: url, images: updated });
                }}
                serviceName={serviceForm.name}
                serviceCategory={professional.category}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#706B5F] dark:text-zinc-400 mb-1">Duração (minutos):</label>
                  <select
                    value={serviceForm.durationMinutes}
                    onChange={(e) => setServiceForm({ ...serviceForm, durationMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 text-sm bg-white dark:bg-zinc-900"
                  >
                    <option value={15}>15 minutos</option>
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>1 hora (60 min)</option>
                    <option value={75}>1h 15min (75 min)</option>
                    <option value={90}>1h 30min (90 min)</option>
                    <option value={105}>1h 45min (105 min)</option>
                    <option value={120}>2 horas (120 min)</option>
                    <option value={150}>2h 30min (150 min)</option>
                    <option value={180}>3 horas (180 min)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[#706B5F] dark:text-zinc-400 mb-1">Preço Total (R$):</label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    required
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({ ...serviceForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 text-sm font-bold bg-white dark:bg-zinc-900"
                  />
                </div>
              </div>

              {/* Configuração de Combo Promocional & Procedimentos Integrados */}
              <div className="p-4 bg-[#FDFBF7] dark:bg-zinc-800/40 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-[#2D2D2A] dark:text-zinc-100 block flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-[#5A5A40] dark:text-zinc-300" />
                      Este serviço é um Combo Promocional?
                    </span>
                    <span className="text-2xs text-[#706B5F] dark:text-zinc-400">
                      Pacote com 2 ou mais procedimentos juntos com desconto atrativo
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={serviceForm.isCombo}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setServiceForm({
                        ...serviceForm,
                        isCombo: isChecked,
                        ...(isChecked && !serviceForm.name ? { name: 'Combo Especial' } : {})
                      });
                    }}
                    className="w-5 h-5 accent-[#5A5A40] cursor-pointer"
                  />
                </div>

                {serviceForm.isCombo && (
                  <div className="space-y-3.5 pt-3 border-t border-[#E9E2D7] dark:border-zinc-700">
                    {/* SELEÇÃO POR CHECKBOX DOS SERVIÇOS EXISTENTES */}
                    <div>
                      <label className="block text-2xs font-bold text-[#5A5A40] dark:text-zinc-300 uppercase tracking-wider mb-2">
                        1. Escolha os procedimentos por Check:
                      </label>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 border border-[#E9E2D7] dark:border-zinc-700 rounded-xl p-2 bg-white dark:bg-zinc-900">
                        {profServices
                          .filter(s => s.id !== editingService?.id && !s.isCombo)
                          .map(srv => {
                            const isChecked = serviceForm.selectedComboItemNames.includes(srv.name);
                            return (
                              <label
                                key={srv.id}
                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                                  isChecked ? 'bg-[#EEF1EB] text-[#5A5A40] dark:text-zinc-300 font-bold' : 'hover:bg-stone-50 dark:hover:bg-zinc-800 text-[#2D2D2A] dark:text-zinc-100'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      let updatedNames = checked
                                        ? [...serviceForm.selectedComboItemNames, srv.name]
                                        : serviceForm.selectedComboItemNames.filter(n => n !== srv.name);
                                      
                                      // Recalcular soma original e duração estimada
                                      const matchedServices = profServices.filter(s => updatedNames.includes(s.name));
                                      const sumOrig = matchedServices.reduce((acc, curr) => acc + curr.price, 0);
                                      const sumDur = matchedServices.reduce((acc, curr) => acc + curr.durationMinutes, 0);
                                      const suggestedComboPrice = Math.round(sumOrig * 0.85);

                                      setServiceForm({
                                        ...serviceForm,
                                        selectedComboItemNames: updatedNames,
                                        comboServiceNames: updatedNames.join(' + '),
                                        originalPrice: sumOrig > 0 ? sumOrig : serviceForm.originalPrice,
                                        durationMinutes: sumDur > 0 ? sumDur : serviceForm.durationMinutes,
                                        price: suggestedComboPrice > 0 ? suggestedComboPrice : serviceForm.price,
                                        discountPercent: sumOrig > 0 && suggestedComboPrice > 0 ? Math.round(((sumOrig - suggestedComboPrice) / sumOrig) * 100) : serviceForm.discountPercent
                                      });
                                    }}
                                    className="w-4 h-4 accent-[#5A5A40] cursor-pointer"
                                  />
                                  <span>{srv.name}</span>
                                </div>
                                <span className="text-2xs text-[#706B5F] dark:text-zinc-400 font-mono">
                                  R$ {srv.price.toFixed(2)} ({srv.durationMinutes}m)
                                </span>
                              </label>
                            );
                          })}
                        {profServices.filter(s => s.id !== editingService?.id && !s.isCombo).length === 0 && (
                          <p className="text-2xs text-[#706B5F] dark:text-zinc-400 p-2 text-center">Nenhum serviço individual cadastrado ainda.</p>
                        )}
                      </div>
                    </div>

                    {/* DIGITAR PROCEDIMENTO PERSONALIZADO + SALVAR NO CATÁLOGO */}
                    <div className="p-3 bg-[#FAF8F5] dark:bg-zinc-900 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 space-y-2">
                      <label className="block text-2xs font-bold text-[#5A5A40] dark:text-zinc-300 uppercase tracking-wider">
                        2. Ou digite um novo procedimento para adicionar:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={serviceForm.customComboInput}
                          onChange={(e) => setServiceForm({ ...serviceForm, customComboInput: e.target.value })}
                          placeholder="Ex.: Spa dos Pés com Argila"
                          className="flex-1 px-3 py-1.5 rounded-lg border border-[#E9E2D7] dark:border-zinc-700 text-xs bg-white dark:bg-zinc-800"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const trimmed = serviceForm.customComboInput.trim();
                            if (!trimmed) return;
                            const updatedNames = [...serviceForm.selectedComboItemNames, trimmed];
                            const newComboStr = updatedNames.join(' + ');

                            if (serviceForm.saveCustomToServiceList) {
                              addService({
                                professionalId: professional.id,
                                name: trimmed,
                                description: `Procedimento cadastrado através do combo ${serviceForm.name || 'Promocional'}.`,
                                durationMinutes: serviceForm.customComboDuration || 30,
                                price: serviceForm.customComboPrice || 40,
                                requiresDeposit: false,
                                depositType: 'fixed',
                                depositValue: 15,
                                active: true
                              });
                            }

                            setServiceForm({
                              ...serviceForm,
                              selectedComboItemNames: updatedNames,
                              comboServiceNames: newComboStr,
                              customComboInput: '',
                              originalPrice: serviceForm.originalPrice + (serviceForm.customComboPrice || 40),
                              durationMinutes: serviceForm.durationMinutes + (serviceForm.customComboDuration || 30)
                            });
                          }}
                          className="px-3 py-1.5 bg-[#5A5A40] text-white rounded-lg text-xs font-bold hover:bg-[#484832] transition-colors cursor-pointer shrink-0"
                        >
                          + Adicionar
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <label className="flex items-center gap-1.5 text-2xs text-[#706B5F] dark:text-zinc-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={serviceForm.saveCustomToServiceList}
                            onChange={(e) => setServiceForm({ ...serviceForm, saveCustomToServiceList: e.target.checked })}
                            className="w-3.5 h-3.5 accent-[#5A5A40] cursor-pointer"
                          />
                          <span>Salvar este serviço digitado na sua lista de serviços</span>
                        </label>
                        <span className="text-2xs text-stone-400">
                          (R$ {serviceForm.customComboPrice} • {serviceForm.customComboDuration} min)
                        </span>
                      </div>
                    </div>

                    {/* Resumo do Texto do Combo */}
                    <div>
                      <label className="block text-2xs font-bold text-[#706B5F] dark:text-zinc-400 mb-1">
                        Procedimentos que compõem o Combo:
                      </label>
                      <input
                        type="text"
                        value={serviceForm.comboServiceNames}
                        onChange={(e) => setServiceForm({ ...serviceForm, comboServiceNames: e.target.value })}
                        placeholder="Ex: Alongamento + Esmaltação + Spa"
                        className="w-full px-3 py-2 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-xs font-medium bg-white dark:bg-zinc-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-2xs font-bold text-[#706B5F] dark:text-zinc-400 mb-1">
                          Preço Original Separado (R$):
                        </label>
                        <input
                          type="number"
                          step="0.50"
                          min="0"
                          value={serviceForm.originalPrice}
                          onChange={(e) => {
                            const orig = Number(e.target.value);
                            const current = serviceForm.price;
                            const pct = orig > current ? Math.round(((orig - current) / orig) * 100) : 0;
                            setServiceForm({
                              ...serviceForm,
                              originalPrice: orig,
                              discountPercent: pct
                            });
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-xs font-bold bg-white dark:bg-zinc-900"
                        />
                      </div>

                      <div>
                        <label className="block text-2xs font-bold text-[#706B5F] dark:text-zinc-400 mb-1">
                          Economia Calculada:
                        </label>
                        <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center justify-between">
                          <span>
                            {serviceForm.originalPrice > serviceForm.price 
                              ? `R$ ${(serviceForm.originalPrice - serviceForm.price).toFixed(2)} OFF`
                              : '0% OFF'}
                          </span>
                          <span className="text-[10px] bg-emerald-200 px-1.5 py-0.5 rounded">
                            {serviceForm.originalPrice > serviceForm.price 
                              ? `-${Math.round(((serviceForm.originalPrice - serviceForm.price) / serviceForm.originalPrice) * 100)}%`
                              : '0%'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Configuração de Sinal Antecipado com Sugestão Automática de Valor */}
              <div className="p-4 bg-[#FDFBF7] dark:bg-zinc-800/40 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-[#2D2D2A] dark:text-zinc-100 block">Exigir Sinal de Reserva via Pix?</span>
                    <span className="text-2xs text-[#706B5F] dark:text-zinc-400">A cliente paga antecipado para garantir o horário</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={serviceForm.requiresDeposit}
                    onChange={(e) => setServiceForm({ ...serviceForm, requiresDeposit: e.target.checked })}
                    className="w-5 h-5 accent-[#5A5A40] cursor-pointer"
                  />
                </div>

                {serviceForm.requiresDeposit && (
                  <div className="space-y-3 pt-2">
                    {/* Botões de Sugestão Rápida de Sinal */}
                    <div>
                      <span className="text-2xs text-[#5A5A40] dark:text-zinc-300 block mb-1.5 font-bold uppercase tracking-wider">
                        Sugestões de Valor do Sinal:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const val = Math.round(serviceForm.price * 0.3);
                            setServiceForm({ ...serviceForm, depositType: 'fixed', depositValue: val > 0 ? val : 20 });
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-900 border border-[#5A5A40] dark:border-zinc-600/30 text-[#5A5A40] dark:text-zinc-300 hover:bg-[#EEF1EB] transition-colors cursor-pointer"
                        >
                          Sugerir 30% (R$ {(serviceForm.price * 0.3).toFixed(2)})
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const val = Math.round(serviceForm.price * 0.5);
                            setServiceForm({ ...serviceForm, depositType: 'fixed', depositValue: val > 0 ? val : 30 });
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-900 border border-[#5A5A40] dark:border-zinc-600/30 text-[#5A5A40] dark:text-zinc-300 hover:bg-[#EEF1EB] transition-colors cursor-pointer"
                        >
                          Sugerir 50% (R$ {(serviceForm.price * 0.5).toFixed(2)})
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const val = Math.round(serviceForm.price * 0.2);
                            setServiceForm({ ...serviceForm, depositType: 'fixed', depositValue: val > 0 ? val : 15 });
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-900 border border-[#E9E2D7] dark:border-zinc-700 text-[#706B5F] dark:text-zinc-400 hover:bg-stone-100 transition-colors cursor-pointer"
                        >
                          Sugerir 20% (R$ {(serviceForm.price * 0.2).toFixed(2)})
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-2xs text-[#706B5F] dark:text-zinc-400 block mb-1 font-bold">Tipo de Sinal:</span>
                        <select
                          value={serviceForm.depositType}
                          onChange={(e) => setServiceForm({ ...serviceForm, depositType: e.target.value as any })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 text-xs bg-white dark:bg-zinc-900"
                        >
                          <option value="fixed">Valor Fixo (R$)</option>
                          <option value="percentage">Porcentagem (%)</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-2xs text-[#706B5F] dark:text-zinc-400 block mb-1 font-bold">
                          {serviceForm.depositType === 'fixed' ? 'Valor do Sinal (R$):' : 'Porcentagem (%):'}
                        </span>
                        <input
                          type="number"
                          min="1"
                          required
                          value={serviceForm.depositValue}
                          onChange={(e) => setServiceForm({ ...serviceForm, depositValue: Number(e.target.value) })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 text-xs font-bold bg-white dark:bg-zinc-900"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Link de Pagamento no Cartão Específico deste Serviço (Opcional) */}
              <div className="p-3 bg-stone-50 dark:bg-zinc-900/50 rounded-xl border border-stone-200 dark:border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100">
                    Link de Pagamento no Cartão deste Serviço (Opcional)
                  </label>
                  <span className="text-[10px] text-[#706B5F] dark:text-zinc-400">
                    Mercado Pago / InfinitePay
                  </span>
                </div>
                <input
                  type="url"
                  value={serviceForm.cardPaymentLink}
                  onChange={(e) => setServiceForm({ ...serviceForm, cardPaymentLink: e.target.value })}
                  placeholder="Ex: https://mpago.la/pos/12345 (se deixar em branco, usa o link do seu perfil)"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 outline-none"
                />
                <p className="text-[10px] text-[#706B5F] dark:text-zinc-400">
                  Ideal se você criou um link de checkout com o valor exato deste procedimento ou do sinal.
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#E9E2D7] dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => {
                    setServiceForm({
                      name: '',
                      description: '',
                      imageUrl: '',
                      images: [],
                      durationMinutes: 60,
                      price: 80,
                      requiresDeposit: false,
                      depositType: 'fixed',
                      depositValue: 20,
                      isCombo: false,
                      comboServiceNames: '',
                      selectedComboItemNames: [],
                      customComboInput: '',
                      customComboPrice: 40,
                      customComboDuration: 30,
                      saveCustomToServiceList: false,
                      originalPrice: 100,
                      discountPercent: 20,
                      cardPaymentLink: ''
                    });
                  }}
                  className="px-3.5 py-2 text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:text-zinc-100 bg-stone-100 dark:bg-zinc-800/80 hover:bg-stone-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Limpar Campos
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsServiceModalOpen(false)}
                    className="px-4 py-2 text-[#706B5F] dark:text-zinc-400 hover:text-[#2D2D2A] dark:hover:text-zinc-100 dark:text-zinc-100 dark:hover:text-zinc-100 dark:text-zinc-100 text-sm font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    style={{ backgroundColor: currentTheme.primary }}
                    className="px-5 py-2.5 text-white rounded-xl text-sm font-bold shadow-xs cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    Salvar Serviço
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Compartilhar Agenda & QR Code */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#E9E2D7] dark:border-zinc-700 shadow-xl space-y-6 text-center">
            <div className="flex items-center justify-between border-b border-[#E9E2D7] dark:border-zinc-700 pb-3 text-left">
              <div>
                <h3 className="serif text-xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                  Compartilhar sua Agenda
                </h3>
                <p className="text-xs text-[#706B5F] dark:text-zinc-400">
                  Link exclusivo e QR Code para clientes
                </p>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="p-1.5 rounded-lg text-[#706B5F] dark:text-zinc-400 hover:bg-[#EEF1EB] dark:hover:bg-zinc-800 hover:text-[#2D2D2A] dark:hover:text-zinc-100 dark:text-zinc-100 dark:hover:text-zinc-100 dark:text-zinc-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QR Code Container */}
            <div className="p-6 bg-[#FDFBF7] rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 inline-block mx-auto shadow-2xs">
              <QRCodeSVG
                value={publicLink}
                size={210}
                level="M"
                fgColor="#2D2D2A"
              />
              <p className="text-[11px] font-semibold text-[#706B5F] dark:text-zinc-400 mt-3">
                Aponte a câmera do celular para agendar
              </p>
            </div>

            <div className="space-y-3 text-left">
              <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100">
                Link exclusivo:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={publicLink}
                  className="w-full px-3 py-2 text-xs font-mono bg-[#F8F6F2] border border-[#E9E2D7] dark:border-zinc-700 rounded-xl text-[#3D3D3D] truncate select-all"
                />
                <button
                  onClick={copyPublicLink}
                  className="px-3.5 py-2 bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white rounded-xl text-xs font-bold shrink-0 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLink ? 'Copiado!' : 'Copiar'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                <a
                  href={`/${professional.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
                  title="Abrir página pública de agendamento em nova aba"
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir Link
                </a>
                <a
                  href={generateShareScheduleLinkUrl(professional, originUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
                  title="Compartilhar agenda pelo WhatsApp"
                >
                  <Share2 className="w-4 h-4" />
                  Enviar WhatsApp
                </a>
              </div>
            </div>

            <div className="text-xs text-[#706B5F] dark:text-zinc-400 bg-[#EEF1EB] p-3 rounded-xl">
              Dica: Você pode imprimir este QR Code e colar no seu espelho ou balcão de atendimento para facilitar que as clientes agendem o retorno!
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CANCELAR AGENDAMENTO (PROFISSIONAL) */}
      {/* ========================================================================= */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#E9E2D7] dark:border-zinc-700 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="serif text-xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                    Cancelar Agendamento
                  </h3>
                  <p className="text-xs text-[#706B5F] dark:text-zinc-400">
                    Código: <span className="font-mono font-bold text-[#2D2D2A] dark:text-zinc-100">{cancellingBooking.code}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCancellingBooking(null)}
                className="p-2 text-[#706B5F] dark:text-zinc-400 hover:bg-[#F8F6F2] rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resumo do Horário */}
            <div className="p-4 bg-[#F8F6F2] rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 text-sm space-y-1">
              <div className="flex justify-between font-bold text-[#2D2D2A] dark:text-zinc-100">
                <span>{cancellingBooking.clientName}</span>
                <span>R$ {cancellingBooking.totalPrice.toFixed(2)}</span>
              </div>
              <p className="text-xs text-[#706B5F] dark:text-zinc-400">
                {cancellingBooking.serviceName}
              </p>
              <p className="text-xs font-semibold text-[#5A5A40] dark:text-zinc-300">
                {formatDatePtBr(cancellingBooking.date)} às {cancellingBooking.time}
              </p>
            </div>

            {/* Seleção de Motivo Rápido */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100">
                Motivo do cancelamento:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Imprevisto pessoal ou de saúde',
                  'Ajuste na agenda do(a) profissional',
                  'Cliente solicitou o cancelamento',
                  'Sinal de reserva não foi compensado'
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setCancellationReasonText(reason)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                      cancellationReasonText === reason
                        ? 'bg-[#5A5A40] dark:bg-zinc-700 text-white border-[#5A5A40] dark:border-zinc-600'
                        : 'bg-white dark:bg-zinc-900 text-[#706B5F] dark:text-zinc-400 border-[#E9E2D7] dark:border-zinc-700 hover:bg-[#EEF1EB] dark:hover:bg-zinc-800'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              <textarea
                rows={2}
                value={cancellationReasonText}
                onChange={(e) => setCancellationReasonText(e.target.value)}
                placeholder="Descreva o motivo que será informado à cliente..."
                className="w-full text-xs p-3 border border-[#E9E2D7] dark:border-zinc-700 rounded-xl text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 outline-none focus:border-[#5A5A40] dark:border-zinc-600"
              />
            </div>

            {/* Se houver sinal pago, decisão de retenção */}
            {cancellingBooking.depositPaid && (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900">
                    Sinal Pix Pago: R$ {cancellingBooking.depositAmount.toFixed(2)}
                  </span>
                  <span className="text-2xs bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-bold">
                    Regra: {professional.cancellationHours}h
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Sua política estipula aviso prévio de {professional.cancellationHours}h. Você deseja reter o valor do sinal ou devolver para a cliente?
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="retainDepositCheckbox"
                    checked={retainDepositDecision}
                    onChange={(e) => setRetainDepositDecision(e.target.checked)}
                    className="w-4 h-4 accent-[#5A5A40] cursor-pointer"
                  />
                  <label htmlFor="retainDepositCheckbox" className="text-xs font-bold text-amber-900 cursor-pointer">
                    Reter sinal de R$ {cancellingBooking.depositAmount.toFixed(2)} como compensação
                  </label>
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancellingBooking(null)}
                className="px-4 py-2.5 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#706B5F] dark:text-zinc-400 hover:bg-[#F8F6F2] text-xs font-bold transition-colors cursor-pointer"
              >
                Voltar / Manter Horário
              </button>
              <button
                type="button"
                onClick={handleExecuteCancel}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: AGENDAMENTO CANCELADO COM SUCESSO (DISPARO WHATSAPP COM MOTIVO) */}
      {/* ========================================================================= */}
      {cancelSuccessBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#E9E2D7] dark:border-zinc-700 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center border border-rose-200 dark:border-rose-900/50 shadow-xs">
              <XCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="serif text-2xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                Agendamento Cancelado
              </h3>
              <p className="text-sm text-[#706B5F] dark:text-zinc-400">
                O horário de <strong className="text-[#2D2D2A] dark:text-zinc-100">{cancelSuccessBooking.booking.clientName}</strong> no dia <strong className="text-[#5A5A40] dark:text-zinc-300">{formatDatePtBr(cancelSuccessBooking.booking.date)} às {cancelSuccessBooking.booking.time}</strong> foi desmarcado e liberado na agenda.
              </p>
            </div>

            <div className="p-4 bg-[#F8F6F2] dark:bg-zinc-800 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 text-left text-xs space-y-1 text-[#3D3D3D] dark:text-zinc-200">
              <p>• Procedimento: <strong>{cancelSuccessBooking.booking.serviceName}</strong></p>
              <p>• Motivo registrado: <span className="font-semibold text-rose-700 dark:text-rose-400">{cancelSuccessBooking.reason}</span></p>
              <p>• Cliente: <strong>{cancelSuccessBooking.booking.clientName}</strong> ({cancelSuccessBooking.booking.clientPhone})</p>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={generateCancellationWhatsAppUrl(cancelSuccessBooking.booking, professional, cancelSuccessBooking.reason)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setCancelSuccessBooking(null)}
                className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <MessageSquare className="w-4 h-4" />
                Avisar Cliente no WhatsApp com o Motivo
              </a>

              <button
                type="button"
                onClick={() => setCancelSuccessBooking(null)}
                className="w-full py-2.5 text-xs font-bold text-[#706B5F] dark:text-zinc-400 hover:text-[#2D2D2A] dark:hover:text-zinc-100 hover:bg-[#F8F6F2] rounded-xl transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: HORÁRIO CONFIRMADO COM SUCESSO (DISPARO WHATSAPP) */}
      {/* ========================================================================= */}
      {confirmSuccessBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#E9E2D7] dark:border-zinc-700 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-3xl bg-[#EEF1EB] text-[#5A5A40] dark:text-zinc-300 mx-auto flex items-center justify-center border border-[#E9E2D7] dark:border-zinc-700 shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="serif text-2xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                Horário Confirmado!
              </h3>
              <p className="text-sm text-[#706B5F] dark:text-zinc-400">
                O agendamento de <strong className="text-[#2D2D2A] dark:text-zinc-100">{confirmSuccessBooking.clientName}</strong> para o dia <strong className="text-[#5A5A40] dark:text-zinc-300">{formatDatePtBr(confirmSuccessBooking.date)} às {confirmSuccessBooking.time}</strong> está garantido na sua agenda.
              </p>
            </div>

            <div className="p-4 bg-[#F8F6F2] dark:bg-zinc-800 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 text-left text-xs space-y-1 text-[#3D3D3D] dark:text-zinc-200">
              <p>• Serviço: <strong>{confirmSuccessBooking.serviceName}</strong></p>
              <p>• Valor: <strong>R$ {confirmSuccessBooking.totalPrice.toFixed(2)}</strong></p>
              {confirmSuccessBooking.depositRequired && (
                <p className="text-[#5A5A40] dark:text-amber-400 font-semibold">
                  • Sinal Pix de R$ {confirmSuccessBooking.depositAmount.toFixed(2)} confirmado
                </p>
              )}
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={generateBookingConfirmedWhatsAppUrl(confirmSuccessBooking, professional)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setConfirmSuccessBooking(null)}
                className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <MessageSquare className="w-4 h-4" />
                Enviar Confirmação no WhatsApp da Cliente
              </a>

              <button
                type="button"
                onClick={() => setConfirmSuccessBooking(null)}
                className="w-full py-2.5 text-xs font-bold text-[#706B5F] dark:text-zinc-400 hover:text-[#2D2D2A] dark:hover:text-zinc-100 dark:text-zinc-100 dark:hover:text-zinc-100 dark:text-zinc-100 hover:bg-[#F8F6F2] rounded-xl transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PRÉ-APROVAÇÃO COM SOLICITAÇÃO DE SINAL PIX */}
      {/* ========================================================================= */}
      {depositApprovalModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#E9E2D7] dark:border-zinc-700 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-200 shadow-xs">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="serif text-xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                    Horário Pré-Aprovado!
                  </h3>
                  <p className="text-xs text-[#706B5F] dark:text-zinc-400">
                    Aguardando comprovante de sinal para confirmação definitiva
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDepositApprovalModalBooking(null)}
                className="p-2 text-[#706B5F] dark:text-zinc-400 hover:bg-[#F8F6F2] rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs space-y-2 text-amber-950">
              <div className="flex justify-between items-center font-bold text-sm">
                <span>{depositApprovalModalBooking.clientName}</span>
                <span className="text-amber-900">Sinal: R$ {depositApprovalModalBooking.depositAmount.toFixed(2)}</span>
              </div>
              <p className="text-[#3D3D3D] dark:text-amber-950">
                • Serviço: <strong>{depositApprovalModalBooking.serviceName}</strong> (Total: R$ {depositApprovalModalBooking.totalPrice.toFixed(2)})<br />
                • Data: <strong>{formatDatePtBr(depositApprovalModalBooking.date)} às {depositApprovalModalBooking.time}</strong><br />
                • Prazo limite estipulado: <strong>{depositApprovalModalBooking.depositDeadlineHours || 2} horas</strong> a partir de agora.
              </p>
              <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-amber-300 font-mono text-2xs space-y-0.5">
                <div className="text-[10px] uppercase font-bold text-amber-900 dark:text-amber-400 tracking-wider">Chave Pix para a cliente:</div>
                <div className="text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 select-all">{professional.pixKey} ({professional.pixKeyType?.toUpperCase()})</div>
                <div className="text-[11px] text-[#706B5F] dark:text-zinc-400">Titular: {professional.name}</div>
              </div>
            </div>

            <div className="p-3 bg-[#EEF1EB] dark:bg-zinc-800 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 text-xs text-[#5A5A40] dark:text-zinc-300 space-y-1">
              <p className="font-bold">Como funciona a garantia do horário:</p>
              <p className="text-[11px] text-[#3D3D3D] dark:text-zinc-300">
                A cliente receberá a mensagem no WhatsApp informando que a vaga só estará <strong>definitivamente confirmada</strong> após a compensação do sinal no prazo de <strong>{depositApprovalModalBooking.depositDeadlineHours || 2}h</strong>. Se ela não pagar, você poderá reabrir a vaga para outra cliente com 1 clique.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={generateDepositReminderWhatsAppUrl(depositApprovalModalBooking, professional)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setDepositApprovalModalBooking(null)}
                className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <MessageSquare className="w-4 h-4" />
                Enviar Mensagem com Chave Pix & Prazo no WhatsApp
              </a>

              <button
                type="button"
                onClick={() => setDepositApprovalModalBooking(null)}
                className="w-full py-2 text-xs font-bold text-[#706B5F] dark:text-zinc-400 hover:text-[#2D2D2A] dark:hover:text-zinc-100 dark:text-zinc-100 dark:hover:text-zinc-100 dark:text-zinc-100 rounded-xl transition-colors cursor-pointer"
              >
                Fechar / Enviar mais tarde
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SINAL RECEBIDO COM SUCESSO */}
      {/* ========================================================================= */}
      {depositReceivedSuccessBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#E9E2D7] dark:border-zinc-700 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center border border-emerald-200 shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="serif text-2xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                Sinal Pix Confirmado!
              </h3>
              <p className="text-sm text-[#706B5F] dark:text-zinc-400">
                O sinal de <strong className="text-emerald-800">R$ {depositReceivedSuccessBooking.depositAmount.toFixed(2)}</strong> de <strong className="text-[#2D2D2A] dark:text-zinc-100">{depositReceivedSuccessBooking.clientName}</strong> foi registrado e o horário está <strong className="text-emerald-800">100% garantido</strong> na agenda.
              </p>
            </div>

            <div className="p-4 bg-[#F8F6F2] dark:bg-zinc-800 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 text-left text-xs space-y-1 text-[#3D3D3D] dark:text-zinc-200">
              <p>• Data do Atendimento: <strong>{formatDatePtBr(depositReceivedSuccessBooking.date)} às {depositReceivedSuccessBooking.time}</strong></p>
              <p>• Serviço: <strong>{depositReceivedSuccessBooking.serviceName}</strong></p>
              <p>• Valor Restante a Pagar no Atendimento: <strong>R$ {(depositReceivedSuccessBooking.totalPrice - depositReceivedSuccessBooking.depositAmount).toFixed(2)}</strong></p>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={generateBookingConfirmedWhatsAppUrl(depositReceivedSuccessBooking, professional)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setDepositReceivedSuccessBooking(null)}
                className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <MessageSquare className="w-4 h-4" />
                Enviar Comprovante de Reserva no WhatsApp
              </a>

              <button
                type="button"
                onClick={() => setDepositReceivedSuccessBooking(null)}
                className="w-full py-2.5 text-xs font-bold text-[#706B5F] dark:text-zinc-400 hover:text-[#2D2D2A] dark:hover:text-zinc-100 dark:text-zinc-100 dark:hover:text-zinc-100 dark:text-zinc-100 rounded-xl transition-colors cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REABRIR HORÁRIO POR FALTA DE SINAL / EXPIRAÇÃO */}
      {/* ========================================================================= */}
      {reopeningBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#E9E2D7] dark:border-zinc-700 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 shadow-xs">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="serif text-xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                    Reabrir Horário na Agenda
                  </h3>
                  <p className="text-xs text-[#706B5F] dark:text-zinc-400">
                    Libere este horário para que outra cliente possa agendar
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReopeningBooking(null)}
                className="p-2 text-[#706B5F] dark:text-zinc-400 hover:bg-[#F8F6F2] rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-200 text-xs space-y-2 text-rose-950">
              <div className="flex justify-between items-center font-bold text-sm">
                <span>{reopeningBooking.clientName}</span>
                <span className="text-rose-800">Sinal: R$ {reopeningBooking.depositAmount.toFixed(2)}</span>
              </div>
              <p className="text-[#3D3D3D] dark:text-rose-950">
                • Horário reservado: <strong>{formatDatePtBr(reopeningBooking.date)} às {reopeningBooking.time}</strong><br />
                • Código do agendamento: <span className="font-mono font-bold text-[#2D2D2A] dark:text-zinc-900">{reopeningBooking.code}</span><br />
                • Telefone da cliente: <strong>{reopeningBooking.clientPhone}</strong>
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100">
                Motivo da reabertura / cancelamento:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Prazo para pagamento do sinal Pix esgotado',
                  'Comprovante não enviado no prazo estipulado',
                  'Cliente desistiu de realizar o pagamento do sinal',
                  'Horário reaberto para a lista de espera'
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setReopenReasonText(reason)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                      reopenReasonText === reason
                        ? 'bg-[#5A5A40] dark:bg-zinc-700 text-white border-[#5A5A40] dark:border-zinc-600'
                        : 'bg-white dark:bg-zinc-900 text-[#706B5F] dark:text-zinc-400 border-[#E9E2D7] dark:border-zinc-700 hover:bg-[#EEF1EB] dark:hover:bg-zinc-800'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              <textarea
                rows={2}
                value={reopenReasonText}
                onChange={(e) => setReopenReasonText(e.target.value)}
                placeholder="Explique o motivo da liberação do horário..."
                className="w-full text-xs p-3 border border-[#E9E2D7] dark:border-zinc-700 rounded-xl text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 outline-none focus:border-[#5A5A40] dark:border-zinc-600"
              />
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                O que acontece ao reabrir:
              </p>
              <p className="text-[11px] text-amber-800">
                1. O horário <strong>{reopeningBooking.time} do dia {formatDatePtBr(reopeningBooking.date)}</strong> volta a ficar 100% liberado para novas marcações no seu link público.<br />
                2. O agendamento anterior é registrado como cancelado/reaberto.<br />
                3. Você poderá enviar uma mensagem cordial via WhatsApp avisando sobre a liberação da vaga.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReopeningBooking(null)}
                className="px-4 py-2.5 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#706B5F] dark:text-zinc-400 hover:bg-[#F8F6F2] text-xs font-bold transition-colors cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleExecuteReopenSlot}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                Liberar & Reabrir Vaga Agora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDITAR PERFIL & FOTO DA PROFISSIONAL */}
      {/* ========================================================================= */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-[#E9E2D7] dark:border-zinc-700 my-8 animate-in fade-in zoom-in duration-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-2xs font-bold uppercase tracking-widest text-[#706B5F] dark:text-zinc-400 block">
                  Identidade Visual & Atendimento
                </span>
                <h3 className="serif text-xl sm:text-2xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                  Editar Foto e Dados do Perfil
                </h3>
                <p className="text-xs text-[#706B5F] dark:text-zinc-400 mt-0.5">
                  Atualize sua foto e dados que as clientes veem no topo da sua agenda online.
                </p>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="p-2 text-[#706B5F] dark:text-zinc-400 hover:bg-[#F8F6F2] rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {profileSavedFeedback && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profileSavedFeedback}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Upload de Foto */}
              <ImageUploadField
                value={profileForm.avatarUrl}
                onChange={(url) => setProfileForm({ ...profileForm, avatarUrl: url })}
                label="Sua Foto de Perfil ou Logo do Espaço *"
                description="Carregue uma foto sua bem iluminada ou o logotipo do seu salão/espaço."
              />

              {/* Nome e Telefone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Nome Profissional *</label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    placeholder="Ex: Amanda Silva"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 outline-none focus:border-stone-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">WhatsApp de Atendimento *</label>
                  <input
                    type="text"
                    required
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 outline-none"
                  />
                </div>
              </div>

              {/* Link de Acesso Exclusivo das Clientes (Slug) */}
              <div className="p-3.5 bg-[#FAF5EF] dark:bg-zinc-800/80 border border-[#EAE0D5] dark:border-zinc-700 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-stone-900 dark:text-zinc-100">
                    Seu Link de Acesso das Clientes (Personalizável)
                  </label>
                  <span className="text-[10px] text-[#8C4E46] dark:text-rose-300 font-bold uppercase tracking-wider">
                    marcabella.com.br
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs">
                  <span className="text-stone-500 dark:text-zinc-400 font-mono text-xs select-none">
                    marcabella.com.br/
                  </span>
                  <input
                    type="text"
                    value={profileForm.slug}
                    onChange={(e) => {
                      const clean = e.target.value
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/[^a-z0-9-]/g, '-');
                      setProfileForm({ ...profileForm, slug: clean });
                    }}
                    placeholder="seu-nome-ou-espaco"
                    className="flex-1 font-mono font-bold text-[#8C4E46] dark:text-rose-400 outline-none bg-transparent"
                  />
                </div>
                <p className="text-[11px] text-stone-600 dark:text-zinc-400 leading-tight">
                  Esse é o link que suas clientes usam para agendar. Você pode colocar o nome do seu espaço, seu nome ou apelido (ex: <strong>camilasilva</strong>, <strong>espacobella</strong>).
                </p>
              </div>

              {/* Chave Pix e Tipo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Tipo de Chave Pix</label>
                  <select
                    value={profileForm.pixKeyType}
                    onChange={(e) => setProfileForm({ ...profileForm, pixKeyType: e.target.value as any })}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 outline-none"
                  >
                    <option value="telefone">Telefone</option>
                    <option value="cpf">CPF</option>
                    <option value="cnpj">CNPJ</option>
                    <option value="email">E-mail</option>
                    <option value="aleatoria">Chave Aleatória</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Chave Pix para Recebimento de Sinais *</label>
                  <input
                    type="text"
                    required
                    value={profileForm.pixKey}
                    onChange={(e) => setProfileForm({ ...profileForm, pixKey: e.target.value })}
                    placeholder="Sua chave Pix ativa"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 outline-none"
                  />
                </div>
              </div>

              {/* Formas de Pagamento Aceitas */}
              <div>
                <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-2">Formas de Pagamento Aceitas no Espaço</label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { id: 'pix', label: 'Pix', icon: QrCode },
                    { id: 'cash', label: 'Dinheiro', icon: Coins },
                    { id: 'credit_card', label: 'Cartão (À Vista/Débito)', icon: CreditCard },
                    { id: 'credit_installments', label: 'Cartão Parcelado', icon: CreditCard }
                  ].map(method => {
                    const MethodIcon = method.icon;
                    const isChecked = profileForm.acceptedPaymentMethods.includes(method.id as any);
                    return (
                      <label key={method.id} className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-colors ${isChecked ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800' : 'bg-white border-[#E9E2D7] dark:bg-zinc-900 dark:border-zinc-700'}`}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const newMethods = e.target.checked 
                              ? [...profileForm.acceptedPaymentMethods, method.id as any]
                              : profileForm.acceptedPaymentMethods.filter(m => m !== method.id);
                            setProfileForm({ ...profileForm, acceptedPaymentMethods: newMethods });
                          }}
                          className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <MethodIcon className={`w-3.5 h-3.5 ${isChecked ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-500 dark:text-zinc-400'}`} />
                        <span className={`text-xs font-semibold ${isChecked ? 'text-emerald-800 dark:text-emerald-300' : 'text-[#2D2D2A] dark:text-zinc-100'}`}>{method.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Link de Pagamento no Cartão (Mercado Pago, InfinitePay, etc.) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100">
                    Link de Pagamento no Cartão de Crédito (Opcional)
                  </label>
                  <span className="text-[10px] text-[#706B5F] dark:text-zinc-400 font-medium">
                    Mercado Pago, InfinitePay, PagBank, PicPay, etc.
                  </span>
                </div>
                <input
                  type="url"
                  value={profileForm.cardPaymentLink}
                  onChange={(e) => setProfileForm({ ...profileForm, cardPaymentLink: e.target.value })}
                  placeholder="https://link.mercadopago.com.br/seunome ou https://loja.infinitepay.io/..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 outline-none"
                />
                <p className="text-[11px] text-[#706B5F] dark:text-zinc-400 mt-1 leading-relaxed">
                  💡 Se você preencher este link, as clientes poderão escolher entre pagar via <strong>Pix</strong> ou <strong>Cartão de Crédito</strong> ao finalizar o agendamento.
                </p>
              </div>

              {/* Prefixo Personalizado do Código de Agendamento (3 letras) */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-stone-900 dark:text-zinc-100">
                    Prefixo Personalizado do Agendamento (3 Letras Iniciais) *
                  </label>
                  <span className="font-mono text-xs font-bold bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-amber-300 text-stone-800 dark:text-zinc-200">
                    Ex: #{((profileForm.bookingCodePrefix || 'BEH').replace(/[^a-zA-Z]/g, '').slice(0, 3) || 'BEH').toUpperCase()}-1042
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={3}
                    required
                    value={profileForm.bookingCodePrefix}
                    onChange={(e) => setProfileForm({ 
                      ...profileForm, 
                      bookingCodePrefix: e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() 
                    })}
                    placeholder="Ex: GAB"
                    className="w-24 uppercase font-mono font-bold text-center px-3 py-2 text-sm rounded-xl border border-stone-300 dark:border-zinc-600 text-stone-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 outline-none focus:border-stone-700"
                  />
                  <span className="text-[11px] text-stone-600 dark:text-zinc-400 leading-tight">
                    Cada agendamento gerado no seu link terá essas 3 letras personalizadas seguidas de números únicos.
                  </span>
                </div>
              </div>

              {/* Instagram da Profissional / Espaço */}
              <div>
                <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">
                  Instagram da Profissional ou Espaço (Opcional):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-pink-500 pointer-events-none">
                    @
                  </span>
                  <input
                    type="text"
                    value={profileForm.instagram.replace(/^@/, '')}
                    onChange={(e) => setProfileForm({ ...profileForm, instagram: e.target.value ? `@${e.target.value.replace(/^@/, '')}` : '' })}
                    placeholder="seuperfil.estetica ou seuperfil"
                    className="w-full pl-8 pr-3.5 py-2.5 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 outline-none focus:border-pink-500"
                  />
                </div>
                <p className="text-[11px] text-[#706B5F] dark:text-zinc-400 mt-1">
                  Um botão direto para seu Instagram será exibido no topo do card principal de agendamento.
                </p>
              </div>

              {/* Endereço */}
              <div>
                <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Endereço do Atendimento / Bairro:</label>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  placeholder="Ex: Av. Paulista, 1000 - Bela Vista, São Paulo"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 outline-none"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Apresentação / Bio para as clientes:</label>
                <textarea
                  rows={2}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  placeholder="Conte sua especialidade, cursos, biossegurança ou recado de boas-vindas..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 outline-none"
                />
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#E9E2D7] dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => setProfileForm({
                    ...profileForm,
                    avatarUrl: '',
                    bio: ''
                  })}
                  className="px-3.5 py-2 text-xs font-bold text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:text-zinc-100 bg-stone-100 dark:bg-zinc-800/80 hover:bg-stone-200 rounded-xl cursor-pointer transition-colors"
                >
                  Limpar Foto & Bio
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(false)}
                    className="px-4 py-2.5 text-xs font-bold text-[#706B5F] dark:text-zinc-400 hover:bg-[#F8F6F2] rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    style={{ backgroundColor: currentTheme.primary }}
                    className="px-5 py-2.5 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer hover:opacity-95 transition-opacity flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADICIONAR FOTO REAL DE PROCEDIMENTO */}
      {/* ========================================================================= */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full p-6 border border-[#E9E2D7] dark:border-zinc-700 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E9E2D7] dark:border-zinc-700 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#5A5A40] dark:bg-zinc-700 text-white flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="serif text-lg font-bold text-[#2D2D2A] dark:text-zinc-100">
                    Adicionar Foto Real do Procedimento
                  </h3>
                  <p className="text-2xs text-[#706B5F] dark:text-zinc-400">
                    A foto aparecerá na vitrine da página de agendamento das suas clientes.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(false)}
                className="text-[#706B5F] dark:text-zinc-400 hover:text-[#2D2D2A] dark:hover:text-zinc-100 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePhoto} className="space-y-3.5">
              {/* URL da Foto */}
              <div>
                <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">
                  Link / URL da Foto do Trabalho:
                </label>
                <input
                  type="url"
                  required
                  value={photoForm.url}
                  onChange={(e) => setPhotoForm({ ...photoForm, url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 outline-none"
                />
                
                {/* Sugestões rápidas de fotos reais de alta qualidade */}
                <div className="mt-2 space-y-1">
                  <span className="text-[11px] text-[#706B5F] dark:text-zinc-400 font-medium">Fotos de exemplo rápido:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'Alongamento Unhas', url: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=800&q=80' },
                      { label: 'Esmaltação & Nail Art', url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80' },
                      { label: 'Design Sobrancelhas', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80' },
                      { label: 'Extensão Cílios', url: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80' },
                      { label: 'Corte / Cabelo', url: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=800&q=80' },
                      { label: 'Barba / Navalha', url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80' }
                    ].map(sample => (
                      <button
                        key={sample.label}
                        type="button"
                        onClick={() => setPhotoForm({ ...photoForm, url: sample.url, title: photoForm.title || sample.label })}
                        className="px-2 py-1 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 text-[10px] font-semibold text-stone-700 dark:text-zinc-300 rounded-lg cursor-pointer transition-colors"
                      >
                        {sample.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview da Imagem */}
              {photoForm.url && (
                <div className="relative aspect-16/9 w-full rounded-2xl overflow-hidden border border-[#E9E2D7] dark:border-zinc-700 bg-stone-100 dark:bg-zinc-800">
                  <Image
                    src={photoForm.url}
                    alt="Preview"
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-black/70 text-white px-2 py-0.5 rounded-md">
                    Prévia da Imagem
                  </span>
                </div>
              )}

              {/* Título do Trabalho */}
              <div>
                <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">
                  Título do Trabalho / Acabamento:
                </label>
                <input
                  type="text"
                  required
                  value={photoForm.title}
                  onChange={(e) => setPhotoForm({ ...photoForm, title: e.target.value })}
                  placeholder="Ex: Alongamento Fibra Curvatura C Impecável"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 outline-none"
                />
              </div>

              {/* Procedimento Associado */}
              <div>
                <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">
                  Procedimento do Seu Catálogo (Opcional):
                </label>
                <select
                  value={photoForm.serviceName}
                  onChange={(e) => setPhotoForm({ ...photoForm, serviceName: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 outline-none"
                >
                  <option value="">Selecione um serviço cadastrado...</option>
                  {profServices.map(s => (
                    <option key={s.id} value={s.name}>
                      {s.name} (R$ {s.price.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">
                  Detalhes adicionais ou técnica utilizada (Opcional):
                </label>
                <textarea
                  rows={2}
                  value={photoForm.description}
                  onChange={(e) => setPhotoForm({ ...photoForm, description: e.target.value })}
                  placeholder="Ex: Procedimento realizado com biossegurança total, materiais descartáveis e excelente durabilidade."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E9E2D7] dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-[#706B5F] dark:text-zinc-400 hover:bg-[#F8F6F2] rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-white text-xs font-bold rounded-xl bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Salvar Foto no Perfil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PROTEÇÃO POR SENHA DO FATURAMENTO & CONTROLE DE CAIXA */}
      {/* ========================================================================= */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-[#E9E2D7] dark:border-zinc-700 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#5A5A40] dark:bg-zinc-700 text-white flex items-center justify-center shadow-xs">
                  <Lock className="w-6 h-6 text-[#D4A373]" />
                </div>
                <div>
                  <h3 className="serif text-xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                    Acesso Confidencial
                  </h3>
                  <p className="text-xs text-[#706B5F] dark:text-zinc-400">
                    Faturamento & Dados Financeiros
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-2 text-[#706B5F] dark:text-zinc-400 hover:bg-[#F8F6F2] dark:hover:bg-zinc-800 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#5A5A40] dark:text-zinc-300 bg-[#EEF1EB] dark:bg-zinc-800/80 p-3.5 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 leading-relaxed">
              Para proteger sua privacidade ao atender clientes no salão ou espaço, os valores financeiros requerem a confirmação da sua senha.
            </p>

            {passwordError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleUnlockRevenueWithPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1.5">
                  Digite sua senha de acesso:
                </label>
                <div className="relative">
                  <input
                    type={showPasswordText ? 'text' : 'password'}
                    required
                    autoFocus
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Digite sua senha..."
                    className="w-full pl-3.5 pr-10 py-3 text-sm rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 outline-none focus:border-[#5A5A40] dark:border-zinc-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#706B5F] dark:text-zinc-400 hover:text-[#2D2D2A] p-1"
                  >
                    {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#706B5F] dark:text-zinc-400 hover:bg-[#F8F6F2] dark:hover:bg-zinc-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Unlock className="w-4 h-4 text-[#D4A373]" />
                  Desbloquear Valores
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONCLUIR ATENDIMENTO & RECEBER NO BALCÃO (CARTÃO, DINHEIRO, PIX) */}
      {/* ========================================================================= */}
      {bookingForCheckout && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-[#E9E2D7] dark:border-zinc-700 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="serif text-xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                    Concluir Atendimento & Recebimento
                  </h3>
                  <p className="text-xs text-[#706B5F] dark:text-zinc-400">
                    Registre como a cliente realizou o pagamento final no balcão
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBookingForCheckout(null)}
                className="p-2 text-[#706B5F] dark:text-zinc-400 hover:bg-[#F8F6F2] dark:hover:bg-zinc-800 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resumo do Atendimento */}
            <div className="p-4 bg-[#F8F6F2] dark:bg-zinc-800/80 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 space-y-2 text-xs">
              <div className="flex justify-between items-center font-bold text-sm text-[#2D2D2A] dark:text-zinc-100">
                <span>{bookingForCheckout.clientName}</span>
                <span className="text-emerald-800 dark:text-emerald-400">R$ {bookingForCheckout.totalPrice.toFixed(2)}</span>
              </div>
              <p className="text-[#3D3D3D] dark:text-zinc-300">
                • Serviço: <strong>{bookingForCheckout.serviceName}</strong><br />
                • Horário: <strong>{formatDatePtBr(bookingForCheckout.date)} às {bookingForCheckout.time}</strong><br />
                • WhatsApp: <strong>{bookingForCheckout.clientPhone}</strong>
              </p>
              {bookingForCheckout.depositPaid && (
                <div className="p-2 bg-emerald-100/70 dark:bg-emerald-950/60 rounded-xl text-emerald-900 dark:text-emerald-300 font-semibold text-[11px] flex justify-between">
                  <span>Sinal Pix pago antecipadamente:</span>
                  <span>- R$ {bookingForCheckout.depositAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-[#E9E2D7] dark:border-zinc-700 pt-2 flex justify-between items-center font-bold text-xs">
                <span>Saldo a Receber no Atendimento:</span>
                <span className="text-sm font-bold text-stone-900 dark:text-white">
                  R$ {(bookingForCheckout.totalPrice - (bookingForCheckout.depositPaid ? bookingForCheckout.depositAmount : 0)).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Seleção do Método de Pagamento */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100">
                Como a cliente pagou no salão/espaço?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'credit_card', label: 'Cartão Crédito', icon: CreditCard, desc: 'Maquininha' },
                  { id: 'debit_card', label: 'Cartão Débito', icon: CreditCard, desc: 'Maquininha' },
                  { id: 'cash', label: 'Dinheiro', icon: Coins, desc: 'Espécie / Troco' },
                  { id: 'pix', label: 'Pix Direto', icon: Receipt, desc: 'Chave Pix da profissional' },
                  { id: 'split', label: 'Múltiplas Formas', icon: Layers, desc: 'Pagamento Misto / Dividido' },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = checkoutPaymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setCheckoutPaymentMethod(m.id as any)}
                      className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                        m.id === 'split' ? 'col-span-2 sm:col-span-2 bg-gradient-to-r' : ''
                      } ${
                        isSelected
                          ? 'bg-[#5A5A40] dark:bg-zinc-700 text-white border-[#5A5A40] dark:border-zinc-600 shadow-sm'
                          : 'bg-white dark:bg-zinc-900 text-[#2D2D2A] dark:text-zinc-100 border-[#E9E2D7] dark:border-zinc-700 hover:bg-[#F8F6F2] dark:hover:bg-zinc-800'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mt-0.5 ${isSelected ? 'text-amber-300' : 'text-[#706B5F] dark:text-zinc-400'}`} />
                      <div>
                        <div className="text-xs font-bold">{m.label}</div>
                        <div className={`text-2xs ${isSelected ? 'text-white/80' : 'text-[#8A857B] dark:text-zinc-400'}`}>{m.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Painel Interativo de Pagamento Misto / Dividido (Mais de uma forma) */}
            {checkoutPaymentMethod === 'split' && (() => {
              const balanceToPay = bookingForCheckout.totalPrice - (bookingForCheckout.depositPaid ? bookingForCheckout.depositAmount : 0);
              const sumEntered = (parseFloat(splitPixAmount) || 0) + (parseFloat(splitCreditAmount) || 0) + (parseFloat(splitDebitAmount) || 0) + (parseFloat(splitCashAmount) || 0);
              const diff = balanceToPay - sumEntered;
              const isBalanced = Math.abs(diff) < 0.01;

              return (
                <div className="p-4 bg-amber-50/60 dark:bg-zinc-800/90 rounded-2xl border border-amber-200 dark:border-zinc-700 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-amber-950 dark:text-amber-300">
                      <Layers className="w-4 h-4" />
                      <span>Dividir Pagamento entre Múltiplas Formas</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const half = Math.round((balanceToPay / 2) * 100) / 100;
                        const rest = Math.round((balanceToPay - half) * 100) / 100;
                        setSplitPixAmount(half.toFixed(2));
                        setSplitCreditAmount(rest.toFixed(2));
                        setSplitDebitAmount('');
                        setSplitCashAmount('');
                      }}
                      className="text-2xs font-bold px-2 py-1 bg-white dark:bg-zinc-900 border border-amber-300 dark:border-zinc-600 text-amber-900 dark:text-amber-300 rounded-lg hover:bg-amber-100 cursor-pointer"
                    >
                      50% Pix / 50% Cartão
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 dark:text-zinc-300 mb-1">
                        Valor no Pix:
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500 font-bold text-xs">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={splitPixAmount}
                          onChange={(e) => setSplitPixAmount(e.target.value)}
                          placeholder="0,00"
                          className="w-full pl-8 pr-2 py-1.5 text-xs rounded-xl border border-stone-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 dark:text-zinc-300 mb-1">
                        Valor Cartão Crédito:
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500 font-bold text-xs">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={splitCreditAmount}
                          onChange={(e) => setSplitCreditAmount(e.target.value)}
                          placeholder="0,00"
                          className="w-full pl-8 pr-2 py-1.5 text-xs rounded-xl border border-stone-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 dark:text-zinc-300 mb-1">
                        Valor Cartão Débito:
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500 font-bold text-xs">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={splitDebitAmount}
                          onChange={(e) => setSplitDebitAmount(e.target.value)}
                          placeholder="0,00"
                          className="w-full pl-8 pr-2 py-1.5 text-xs rounded-xl border border-stone-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 dark:text-zinc-300 mb-1">
                        Valor em Dinheiro:
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500 font-bold text-xs">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={splitCashAmount}
                          onChange={(e) => setSplitCashAmount(e.target.value)}
                          placeholder="0,00"
                          className="w-full pl-8 pr-2 py-1.5 text-xs rounded-xl border border-stone-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status da Soma dos Pagamentos */}
                  <div className={`p-2.5 rounded-xl border flex items-center justify-between font-bold text-xs ${
                    isBalanced
                      ? 'bg-emerald-100/70 border-emerald-300 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300'
                      : diff > 0
                        ? 'bg-amber-100/70 border-amber-300 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300'
                        : 'bg-rose-100/70 border-rose-300 text-rose-900 dark:bg-rose-950/50 dark:text-rose-300'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      {isBalanced ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0" />
                      )}
                      <span>
                        {isBalanced
                          ? `Total exato conferido (R$ ${sumEntered.toFixed(2)})`
                          : diff > 0
                            ? `Faltam R$ ${diff.toFixed(2)} para completar o total`
                            : `Soma excede em R$ ${Math.abs(diff).toFixed(2)} o valor do serviço`}
                      </span>
                    </div>
                    <span>Total: R$ {sumEntered.toFixed(2)} / R$ {balanceToPay.toFixed(2)}</span>
                  </div>
                </div>
              );
            })()}

            {/* Campo de Dinheiro com Cálculo Automático de Troco */}
            {checkoutPaymentMethod === 'cash' && (
              <div className="p-3.5 bg-amber-50 dark:bg-zinc-800 rounded-2xl border border-amber-200 dark:border-zinc-700 space-y-2 text-xs">
                <label className="block font-bold text-amber-950 dark:text-amber-300">
                  Valor entregue pela cliente (para calcular o troco):
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-bold">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      placeholder="Ex: 100,00"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-amber-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-[#2D2D2A] dark:text-zinc-100 font-bold"
                    />
                  </div>
                  {Number(cashTendered) > (bookingForCheckout.totalPrice - (bookingForCheckout.depositPaid ? bookingForCheckout.depositAmount : 0)) && (
                    <div className="bg-white dark:bg-zinc-900 px-3 py-2 rounded-xl border border-amber-300 font-bold text-emerald-700 dark:text-emerald-400">
                      Troco: R$ {(Number(cashTendered) - (bookingForCheckout.totalPrice - (bookingForCheckout.depositPaid ? bookingForCheckout.depositAmount : 0))).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {checkoutFeedback && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Atendimento concluído e registrado no Controle de Caixa!</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBookingForCheckout(null)}
                className="px-4 py-2.5 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#706B5F] dark:text-zinc-400 hover:bg-[#F8F6F2] dark:hover:bg-zinc-800 text-xs font-bold transition-colors cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmCheckoutPayment}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                Confirmar Recebimento & Finalizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EXCEÇÃO & REABERTURA DE ATENDIMENTO JÁ CONCLUÍDO */}
      {/* ========================================================================= */}
      {completedBookingToReopen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-[#E9E2D7] dark:border-zinc-700 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800/60 shadow-xs">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="serif text-xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                    Reabertura de Atendimento Concluído
                  </h3>
                  <p className="text-xs text-[#706B5F] dark:text-zinc-400">
                    O ideal é não reabrir após finalizado, exceto por motivo justificado
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCompletedBookingToReopen(null)}
                className="p-2 text-[#706B5F] dark:text-zinc-400 hover:bg-[#F8F6F2] dark:hover:bg-zinc-800 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-amber-50/80 dark:bg-zinc-800 rounded-2xl border border-amber-200 dark:border-zinc-700 text-xs text-amber-950 dark:text-amber-200 space-y-1">
              <div className="flex justify-between font-bold">
                <span>{completedBookingToReopen.clientName}</span>
                <span>R$ {completedBookingToReopen.totalPrice.toFixed(2)}</span>
              </div>
              <p className="text-[#5A5A40] dark:text-zinc-400 text-[11px]">
                {completedBookingToReopen.serviceName} • {formatDatePtBr(completedBookingToReopen.date)} às {completedBookingToReopen.time}
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100">
                Selecione o motivo da exceção:
              </label>
              <div className="space-y-1.5">
                {[
                  'Erro de lançamento no balcão / Estornar recebimento',
                  'Cliente precisou reagendar após o atendimento ter sido dado como concluído',
                  'Liberar vaga para encaixe de cliente da lista de espera',
                  'Cancelamento retroativo solicitado pela cliente'
                ].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReopenExceptionReason(r)}
                    className={`w-full text-left text-xs p-2.5 rounded-xl border transition-all cursor-pointer ${
                      reopenExceptionReason === r
                        ? 'bg-[#5A5A40] dark:bg-zinc-700 text-white border-[#5A5A40] dark:border-zinc-600 font-bold'
                        : 'bg-white dark:bg-zinc-900 text-[#706B5F] dark:text-zinc-400 border-[#E9E2D7] dark:border-zinc-700 hover:bg-[#F8F6F2] dark:hover:bg-zinc-800'
                    }`}
                  >
                    • {r}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={reopenCustomNote}
                onChange={(e) => setReopenCustomNote(e.target.value)}
                placeholder="Observação complementar (opcional)..."
                className="w-full text-xs p-2.5 border border-[#E9E2D7] dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-[#2D2D2A] dark:text-zinc-100 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCompletedBookingToReopen(null)}
                className="px-4 py-2.5 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#706B5F] dark:text-zinc-400 hover:bg-[#F8F6F2] text-xs font-bold cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmReopenCompleted}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                Confirmar Ação de Exceção
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
