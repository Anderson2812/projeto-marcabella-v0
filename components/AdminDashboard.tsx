'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAppStore } from '@/lib/use-app-store';
import { formatDatePtBr } from '@/lib/whatsapp-utils';
import { Professional, Booking, BookingStatus, ProfessionalCategory, SubscriptionPlanType, ThemeColor } from '@/types';
import { getProfessionalPlanStatus, PLAN_CONFIGS, calculateProfessionalMonthlyBilling, getSaaSPricing } from '@/lib/plan-utils';
import { deduplicateBookings } from '@/lib/data-store';
import { 
  validatePixKey,
  validateWhatsAppPhone,
  isValidCPF,
  isValidCNPJ,
  formatCPF,
  formatCNPJ,
  formatPhoneMask,
  buildWhatsAppUrl,
  openWhatsAppSafely
} from '@/lib/validation-utils';
import ImageUploadField from '@/components/ImageUploadField';

const CATEGORIES_LIST: ProfessionalCategory[] = [
  'Manicure & Pedicure',
  'Cabeleireira & Colorista',
  'Estética Facial & Corporal',
  'Depilação',
  'Design de Sobrancelhas & Cílios',
  'Maquiagem & Penteados',
  'Salão de Beleza',
  'Barbearia & Barbeiro',
  'Barba, Cabelo & Bigode',
  'Estética Masculina & Visagismo',
  'Tatuagem & Piercing'
];

const AVAILABLE_SPECIALTIES = [
  'Lash Design / Extensão de Cílios',
  'Design de Sobrancelhas & Visagismo',
  'Micropigmentação Labial / Fio a Fio',
  'Nails Designer / Alongamento em Gel',
  'Manicure & Pedicure Russa',
  'Cabeleireira & Cortes',
  'Colorimetria, Mechas & Loiros',
  'Escovista & Tratamentos Capilares',
  'Estética Facial & Limpeza de Pele',
  'Depilação a Cera / Linha',
  'Massoterapia & Drenagem Linfática',
  'Maquiagem Profissional & Penteados',
  'Corte Masculino Clássico & Fade/Degradê',
  'Barba com Toalha Quente & Navalha',
  'Pigmentação de Barba & Cabelo',
  'Sobrancelha Masculina na Navalha/Pinça',
  'Limpeza de Pele & Visagismo Masculino',
  'Platinado / Nevou & Luzes Masculinas'
];

const PRESET_PROFESSIONAL_TEMPLATES = [
  {
    name: 'Carolina Mendes Lash & Brow',
    slug: 'carolina-lash-brow',
    category: 'Design de Sobrancelhas & Cílios' as ProfessionalCategory,
    specialties: ['Lash Design / Extensão de Cílios', 'Design de Sobrancelhas & Visagismo', 'Micropigmentação Labial / Fio a Fio'],
    phone: '(11) 98765-4321',
    email: 'carolina.lash@bellahora.com.br',
    address: 'Vila Madalena, São Paulo - SP',
    bio: 'Especialista em Volume Russo, Lash Lifting e Visagismo Facial com atendimento individualizado.',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
    pixKey: 'carolina.lash@bellahora.com.br',
    pixKeyType: 'email' as const,
    cancellationHours: 24,
    cancellationPolicyNotes: 'Cancelamentos com menos de 24h implicam na retenção do sinal de 30% para cobrir o horário reservado.',
    themeColor: 'rose' as const,
    genderPreference: 'feminine' as const,
    pageLayoutTemplate: 'classic_elegant' as const
  },
  {
    name: 'Rodrigo Navalha Barber Lounge',
    slug: 'rodrigo-barber-club',
    category: 'Barbearia & Barbeiro' as ProfessionalCategory,
    specialties: ['Corte Masculino Clássico & Fade/Degradê', 'Barba com Toalha Quente & Navalha', 'Pigmentação de Barba & Cabelo'],
    phone: '(11) 90000-0005',
    email: 'rodrigo.barber@bellahora.com.br',
    address: 'Pinheiros, São Paulo - SP',
    bio: 'Especialista em barbearia clássica, visagismo masculino, cortes na tesoura e barba alinhada com toalha quente.',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    pixKey: '11900000005',
    pixKeyType: 'telefone' as const,
    cancellationHours: 24,
    cancellationPolicyNotes: 'Cancelamentos com menos de 24h implicam em retenção do sinal de reserva de horário.',
    themeColor: 'barber_navy' as const,
    genderPreference: 'masculine' as const,
    pageLayoutTemplate: 'barber_club' as const
  },
  {
    name: 'Juliana Nails & SPA',
    slug: 'juliana-nails-spa',
    category: 'Manicure & Pedicure' as ProfessionalCategory,
    specialties: ['Nails Designer / Alongamento em Gel', 'Manicure & Pedicure Russa'],
    phone: '(11) 90000-0006',
    email: 'juliana.nails@bellahora.com.br',
    address: 'Moema, São Paulo - SP',
    bio: 'Alongamento em fibra de vidro, esmaltação em gel e nail art autoral de alto padrão.',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    pixKey: '11900000006',
    pixKeyType: 'telefone' as const,
    cancellationHours: 24,
    cancellationPolicyNotes: 'Avisar com antecedência de 24h para reagendar sem perda do sinal.',
    themeColor: 'olive' as const,
    genderPreference: 'feminine' as const,
    pageLayoutTemplate: 'classic_elegant' as const
  },
  {
    name: 'Aline Studio Hair & Colors',
    slug: 'aline-studio-hair',
    category: 'Cabeleireira & Colorista' as ProfessionalCategory,
    specialties: ['Cabeleireira & Cortes', 'Colorimetria, Mechas & Loiros', 'Escovista & Tratamentos Capilares'],
    phone: '(11) 90000-0007',
    email: 'aline.hair@bellahora.com.br',
    address: 'Jardins, São Paulo - SP',
    bio: 'Colorista premiada, especialista em loiros saudáveis, morenas iluminadas e corte em camadas.',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
    pixKey: '11900000007',
    pixKeyType: 'telefone' as const,
    cancellationHours: 48,
    cancellationPolicyNotes: 'Procedimentos químicos exigem cancelamento prévio de 48 horas.',
    themeColor: 'lavender' as const,
    genderPreference: 'feminine' as const,
    pageLayoutTemplate: 'boutique_glamour' as const
  }
];
import { 
  ShieldCheck, 
  Users, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  ExternalLink, 
  Send, 
  RotateCcw,
  Sparkles,
  Phone,
  Search,
  Edit3,
  Trash2,
  Plus,
  Clock,
  Hourglass,
  X,
  Calculator,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Check,
  Share2,
  Info,
  FileText,
  Sliders,
  Key,
  Mail,
  Copy
} from 'lucide-react';
import AdminReportsManager from './AdminReportsManager';
import AdminSaaSPricingManager from './AdminSaaSPricingManager';

export default function AdminDashboard() {
  const { 
    professionals, 
    addProfessional,
    updateProfessional,
    toggleProfessionalStatus, 
    bookings, 
    confirmBooking,
    cancelBooking,
    completeBooking,
    updateBooking,
    deleteBooking,
    createBooking,
    services, 
    tickets, 
    replySupportTicket, 
    resetToDefaults,
    changeProfessionalPlan,
    extendTrialDays,
    updateProfessionalCustomPlan,
    globalPlanPricing
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'professionals' | 'bookings' | 'reports' | 'pricing' | 'support' | 'pitch'>('professionals');
  const [copiedAccessId, setCopiedAccessId] = useState<string | null>(null);
  
  // Filtros profissionais
  const [searchTerm, setSearchTerm] = useState('');
  const [profPlanFilter, setProfPlanFilter] = useState<'all' | 'trial' | 'pro_fixed' | 'flex_fee'>('all');
  const [planActionFeedback, setPlanActionFeedback] = useState<string | null>(null);

  // Filtros agendamentos
  const [bookingSearchTerm, setBookingSearchTerm] = useState('');
  const [bookingProfFilter, setBookingProfFilter] = useState('all');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<'all' | BookingStatus>('all');
  const [bookingDateFilter, setBookingDateFilter] = useState('');

  // Suporte
  const [replyInputs, setReplyInputs] = useState<{ [ticketId: string]: string }>({});

  // Modais de Edição Super Admin
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [isNewProfModalOpen, setIsNewProfModalOpen] = useState(false);
  const [isPitchModalOpen, setIsPitchModalOpen] = useState(false);

  // Form para novo agendamento manual do Admin
  const [newBookingForm, setNewBookingForm] = useState({
    professionalId: professionals[0]?.id || '',
    clientName: '',
    clientPhone: '',
    serviceName: 'Atendimento Personalizado',
    serviceDuration: 60,
    date: new Date().toISOString().split('T')[0],
    time: '14:00',
    endTime: '15:00',
    totalPrice: 100,
    depositRequired: true,
    depositAmount: 30,
    depositPaid: true,
    notes: 'Agendado manualmente via Central Admin'
  });

  // Form para nova profissional (campos limpos sem pré-cadastros)
  const initialNewProfState = {
    name: '',
    slug: '',
    categoryMode: 'select' as 'select' | 'custom',
    category: 'Manicure & Pedicure' as ProfessionalCategory,
    customCategory: '',
    specialties: [] as string[],
    phone: '',
    documentType: 'cpf' as 'cpf' | 'cnpj',
    documentNumber: '',
    email: '',
    password: '123456',
    address: '',
    bio: '',
    avatarUrl: '',
    pixKey: '',
    pixKeyType: 'telefone' as 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria',
    cancellationHours: 24,
    cancellationPolicyNotes: 'Cancelamentos com menos de 24h implicam em retenção do sinal para cobrir a reserva.',
    themeColor: 'olive' as ThemeColor
  };

  const [newProfForm, setNewProfForm] = useState(initialNewProfState);
  const [customSpecialty, setCustomSpecialty] = useState('');
  const [pixValidationError, setPixValidationError] = useState<string | null>(null);
  const [phoneValidationError, setPhoneValidationError] = useState<string | null>(null);
  const [docValidationError, setDocValidationError] = useState<string | null>(null);
  const [categoryValidationError, setCategoryValidationError] = useState<string | null>(null);
  const [profCreateSuccess, setProfCreateSuccess] = useState<string | null>(null);

  const handleClearNewProfForm = () => {
    setNewProfForm({ ...initialNewProfState });
    setCustomSpecialty('');
    setPixValidationError(null);
    setPhoneValidationError(null);
    setDocValidationError(null);
    setCategoryValidationError(null);
  };

  // Modal de edição individual de valores do plano da profissional
  const [editingProfPlan, setEditingProfPlan] = useState<Professional | null>(null);
  const [profPlanForm, setProfPlanForm] = useState<{
    planType: SubscriptionPlanType;
    planMonthlyPrice: number;
    feePerBooking: number;
    planBillingCycle: 'monthly' | 'semiannual' | 'annual' | 'bianual';
    extraTrialDays: number;
  }>({
    planType: 'pro_fixed',
    planMonthlyPrice: 79.90,
    feePerBooking: 0,
    planBillingCycle: 'monthly',
    extraTrialDays: 0
  });

  const handleOpenEditProfPlan = (prof: Professional) => {
    const currentPricing = getSaaSPricing();
    const defaultMonthly = prof.planType === 'flex_fee' ? currentPricing.flexBaseMonthly : currentPricing.proFixedMonthly;
    const defaultFee = prof.planType === 'flex_fee' ? currentPricing.flexFeePerBooking : 0;
    
    setEditingProfPlan(prof);
    setProfPlanForm({
      planType: prof.planType || 'trial',
      planMonthlyPrice: prof.planMonthlyPrice !== undefined ? prof.planMonthlyPrice : defaultMonthly,
      feePerBooking: prof.feePerBooking !== undefined ? prof.feePerBooking : defaultFee,
      planBillingCycle: prof.planBillingCycle || 'monthly',
      extraTrialDays: 0
    });
  };

  const handleSaveProfPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfPlan) return;
    
    updateProfessionalCustomPlan(editingProfPlan.id, {
      planType: profPlanForm.planType,
      planMonthlyPrice: Number(profPlanForm.planMonthlyPrice),
      feePerBooking: Number(profPlanForm.feePerBooking),
      planBillingCycle: profPlanForm.planBillingCycle
    });
    
    if (profPlanForm.extraTrialDays > 0) {
      extendTrialDays(editingProfPlan.id, profPlanForm.extraTrialDays);
    }
    
    setPlanActionFeedback(`✓ Valores do plano de "${editingProfPlan.name}" atualizados com sucesso!`);
    setTimeout(() => setPlanActionFeedback(null), 4000);
    setEditingProfPlan(null);
  };

  const handleResetProfPlanToDefault = () => {
    if (!editingProfPlan) return;
    const currentPricing = getSaaSPricing();
    const defaultMonthly = profPlanForm.planType === 'flex_fee' ? currentPricing.flexBaseMonthly : currentPricing.proFixedMonthly;
    const defaultFee = profPlanForm.planType === 'flex_fee' ? currentPricing.flexFeePerBooking : 0;
    
    setProfPlanForm(prev => ({
      ...prev,
      planMonthlyPrice: defaultMonthly,
      feePerBooking: defaultFee
    }));
  };

  // Alternar especialidade selecionada
  const toggleSpecialty = (spec: string) => {
    setNewProfForm(prev => {
      const exists = prev.specialties.includes(spec);
      return {
        ...prev,
        specialties: exists ? prev.specialties.filter(s => s !== spec) : [...prev.specialties, spec]
      };
    });
  };

  const handleAddCustomSpecialty = () => {
    if (!customSpecialty.trim()) return;
    if (!newProfForm.specialties.includes(customSpecialty.trim())) {
      setNewProfForm(prev => ({
        ...prev,
        specialties: [...prev.specialties, customSpecialty.trim()]
      }));
    }
    setCustomSpecialty('');
  };

  const handleLoadPresetTemplate = (preset: typeof PRESET_PROFESSIONAL_TEMPLATES[0]) => {
    setNewProfForm({
      name: preset.name,
      slug: preset.slug,
      categoryMode: 'select',
      category: preset.category,
      customCategory: '',
      specialties: [...preset.specialties],
      phone: preset.phone,
      documentType: 'cpf',
      documentNumber: '',
      email: preset.email,
      password: '123456',
      address: preset.address,
      bio: preset.bio,
      avatarUrl: preset.avatarUrl,
      pixKey: preset.pixKey,
      pixKeyType: preset.pixKeyType,
      cancellationHours: preset.cancellationHours,
      cancellationPolicyNotes: preset.cancellationPolicyNotes,
      themeColor: preset.themeColor
    });
    setPixValidationError(null);
    setPhoneValidationError(null);
    setDocValidationError(null);
    setCategoryValidationError(null);
  };

  // Calculadora Comercial Interativa (Pitch)
  const [pitchAvgTicket, setPitchAvgTicket] = useState(90);
  const [pitchMonthlyClients, setPitchMonthlyClients] = useState(70);
  const [pitchNoShowCount, setPitchNoShowCount] = useState(4);
  const [pitchPlanPrice, setPitchPlanPrice] = useState(49.90);

  const pitchMonthlyLoss = pitchNoShowCount * pitchAvgTicket;
  const pitchAnnualLoss = pitchMonthlyLoss * 12;
  const pitchNetMonthlyGain = pitchMonthlyLoss - pitchPlanPrice;

  // Métricas globais
  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  const completedBookings = bookings.filter(b => b.status === 'completed');
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled');

  const totalVolume = bookings.reduce((sum, b) => sum + (b.status !== 'cancelled' ? b.totalPrice : 0), 0);
  const totalDeposits = bookings
    .filter(b => b.depositPaid)
    .reduce((sum, b) => sum + b.depositAmount, 0);

  const activeProfessionalsCount = professionals.filter(p => p.status === 'active').length;

  const trialTenants = professionals.filter(p => (p.planType || 'trial') === 'trial');
  const proFixedTenants = professionals.filter(p => p.planType === 'pro_fixed');
  const flexTenants = professionals.filter(p => p.planType === 'flex_fee');

  const estimatedSaaSMRR = (proFixedTenants.length * 79.90) + 
    (flexTenants.length * 29.90) + 
    flexTenants.reduce((sum, p) => {
      const confirmedCount = bookings.filter(b => b.professionalId === p.id && (b.status === 'confirmed' || b.status === 'completed')).length;
      return sum + (confirmedCount * 1.50);
    }, 0);

  const filteredProfessionals = professionals.filter(p => {
    const currentPlan = p.planType || 'trial';
    if (profPlanFilter !== 'all' && currentPlan !== profPlanFilter) return false;
    if (searchTerm.trim()) {
      const matchName = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = p.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSlug = p.slug.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchName && !matchCat && !matchSlug) return false;
    }
    return true;
  });

  const filteredBookings = deduplicateBookings(bookings.filter(b => {
    if (bookingProfFilter !== 'all' && b.professionalId !== bookingProfFilter) return false;
    if (bookingStatusFilter !== 'all' && b.status !== bookingStatusFilter) return false;
    if (bookingDateFilter && b.date !== bookingDateFilter) return false;
    if (bookingSearchTerm.trim()) {
      const q = bookingSearchTerm.toLowerCase().trim();
      const matchClient = b.clientName.toLowerCase().includes(q);
      const matchPhone = b.clientPhone.toLowerCase().includes(q);
      const matchService = b.serviceName.toLowerCase().includes(q);
      const matchProf = b.professionalName.toLowerCase().includes(q);
      const matchCode = b.code.toLowerCase().includes(q);
      if (!matchClient && !matchPhone && !matchService && !matchProf && !matchCode) return false;
    }
    return true;
  }));

  const handleSendReply = (ticketId: string) => {
    const text = replyInputs[ticketId];
    if (!text) return;
    replySupportTicket(ticketId, text);
    setReplyInputs(prev => ({ ...prev, [ticketId]: '' }));
  };

  const handleSaveBookingEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;
    updateBooking(editingBooking);
    setEditingBooking(null);
  };

  const handleSaveProfessionalEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfessional) return;
    updateProfessional(editingProfessional);
    setEditingProfessional(null);
  };

  const handleCreateManualBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const prof = professionals.find(p => p.id === newBookingForm.professionalId) || professionals[0];
    createBooking({
      professionalId: prof.id,
      professionalName: prof.name,
      professionalPhone: prof.phone,
      professionalAddress: prof.address,
      serviceId: 'srv-manual',
      serviceName: newBookingForm.serviceName,
      serviceDuration: Number(newBookingForm.serviceDuration),
      clientName: newBookingForm.clientName.trim(),
      clientPhone: newBookingForm.clientPhone.trim(),
      date: newBookingForm.date,
      time: newBookingForm.time,
      endTime: newBookingForm.endTime,
      status: 'confirmed',
      totalPrice: Number(newBookingForm.totalPrice),
      depositRequired: newBookingForm.depositRequired,
      depositAmount: Number(newBookingForm.depositAmount),
      depositPaid: newBookingForm.depositPaid,
      depositStatus: newBookingForm.depositPaid ? 'paid' : 'pending',
      notes: newBookingForm.notes
    });
    setIsNewBookingModalOpen(false);
  };

  const handleCreateNewProfessional = (e: React.FormEvent) => {
    e.preventDefault();
    setPixValidationError(null);
    setPhoneValidationError(null);
    setDocValidationError(null);
    setCategoryValidationError(null);

    if (!newProfForm.name.trim() || !newProfForm.slug.trim()) {
      return;
    }

    // 1. Validação de Especialidade / Categoria (Obrigatório e permite digitar)
    const finalCategory = newProfForm.categoryMode === 'custom'
      ? newProfForm.customCategory.trim()
      : (newProfForm.category || '').trim();

    if (!finalCategory) {
      setCategoryValidationError('A especialidade / categoria é obrigatória.');
      return;
    }

    // 2. Validação rigorosa de WhatsApp com DDD
    const phoneVal = validateWhatsAppPhone(newProfForm.phone);
    if (!phoneVal.isValid) {
      setPhoneValidationError(phoneVal.message);
      return;
    }

    // 3. Validação rigorosa de CPF ou CNPJ
    if (!newProfForm.documentNumber.trim()) {
      setDocValidationError(`O campo ${newProfForm.documentType.toUpperCase()} é obrigatório.`);
      return;
    }
    const isDocValid = newProfForm.documentType === 'cpf'
      ? isValidCPF(newProfForm.documentNumber)
      : isValidCNPJ(newProfForm.documentNumber);

    if (!isDocValid) {
      setDocValidationError(`${newProfForm.documentType.toUpperCase()} inválido. Verifique os dígitos digitados.`);
      return;
    }

    // 4. Validação da Chave Pix de acordo com o tipo selecionado
    if (newProfForm.pixKey.trim()) {
      const pixValidation = validatePixKey(newProfForm.pixKey, newProfForm.pixKeyType);
      if (!pixValidation.isValid) {
        setPixValidationError(pixValidation.message);
        return;
      }
    }

    const currentSaaSPricing = getSaaSPricing();
    const newProfId = `prof-${Date.now()}`;
    const cleanSlug = newProfForm.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    const trialDaysVal = currentSaaSPricing.trialDays || 15;
    const nowIso = new Date().toISOString();
    const trialExpIso = new Date(Date.now() + trialDaysVal * 24 * 60 * 60 * 1000).toISOString();

    const newProf: Professional = {
      id: newProfId,
      name: newProfForm.name.trim(),
      slug: cleanSlug,
      category: finalCategory as ProfessionalCategory,
      specialties: newProfForm.specialties.length > 0 ? newProfForm.specialties : [finalCategory],
      phone: phoneVal.cleanDigits.length === 11 ? formatPhoneMask(phoneVal.cleanDigits) : newProfForm.phone.trim(),
      documentType: newProfForm.documentType,
      documentNumber: newProfForm.documentNumber.trim(),
      email: newProfForm.email.trim() || `${cleanSlug}@bellahora.com.br`,
      password: newProfForm.password?.trim() || '123456',
      address: newProfForm.address.trim() || 'São Paulo - SP',
      bio: newProfForm.bio.trim() || `Especialista em ${finalCategory} cadastrada no BellaHora.`,
      avatarUrl: newProfForm.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
      pixKey: newProfForm.pixKey.trim() || newProfForm.phone.replace(/\D/g, ''),
      pixKeyType: newProfForm.pixKeyType,
      cancellationHours: Number(newProfForm.cancellationHours) || 24,
      cancellationPolicyNotes: newProfForm.cancellationPolicyNotes || 'Cancelamentos com menos de 24h implicam em retenção do sinal.',
      status: 'active',
      planType: 'trial',
      trialDays: trialDaysVal,
      trialStartedAt: nowIso,
      trialStartDate: nowIso,
      trialExpiresAt: trialExpIso,
      customTrialDaysExtended: 0,
      themeColor: newProfForm.themeColor || 'olive',
      createdAt: nowIso
    };

    // Salvar profissional e inicializar serviços padrão e horários no store
    addProfessional(newProf);
    setProfCreateSuccess(`Profissional "${newProf.name}" cadastrada e ativada com sucesso com ${trialDaysVal} dias de teste! Link: /${newProf.slug}`);

    setTimeout(() => {
      setProfCreateSuccess(null);
      setIsNewProfModalOpen(false);
    }, 1800);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Admin Top Header */}
      <div className="bg-[#2D2D2A] rounded-3xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-[#3D3D3D]">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="p-2 rounded-xl bg-[#5A5A40] dark:bg-zinc-700 text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-[#D4A373]">
              Painel Central da Plataforma
            </span>
          </div>
          <h1 className="serif text-2xl sm:text-3xl font-bold">Administração Geral BellaHora</h1>
          <p className="text-[#A09A8E] dark:text-zinc-500 text-sm mt-1 max-w-xl">
            Super Administrador: você pode alterar tudo, editar horários, cadastrar e moderar profissionais e apresentar o modelo comercial pronto.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setActiveTab('pitch')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white text-xs font-bold transition-all shadow-md cursor-pointer border border-[#6B6B4E]"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            Guia de Apresentação Comercial & Como Cobrar
          </button>

          <button
            onClick={() => {
              if (confirm('Deseja redefinir os dados da demonstração para o estado inicial?')) {
                resetToDefaults();
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900/10 hover:bg-white dark:bg-zinc-900/15 text-[#E9E2D7] hover:text-white text-xs font-bold transition-colors border border-white/10 cursor-pointer"
            title="Restaura os dados iniciais de demonstração"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restaurar Demo
          </button>
        </div>
      </div>

      {/* Métricas Principais da Plataforma */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 shadow-xs space-y-1">
          <span className="text-xs font-bold text-[#A09A8E] dark:text-zinc-500 uppercase tracking-wider block">
            Profissionais Cadastrados
          </span>
          <div className="serif text-3xl font-bold text-[#2D2D2A] dark:text-zinc-100">
            {professionals.length}
          </div>
          <p className="text-xs text-[#5A5A40] dark:text-zinc-300 font-medium">
            {activeProfessionalsCount} profissionais ativos recebendo clientes
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 shadow-xs space-y-1">
          <span className="text-xs font-bold text-[#D4A373] uppercase tracking-wider block">
            Total de Agendamentos
          </span>
          <div className="serif text-3xl font-bold text-[#D4A373]">
            {totalBookings}
          </div>
          <p className="text-xs text-[#706B5F] dark:text-zinc-400">
            {confirmedBookings.length} confirmados • {pendingBookings.length} pendentes
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 shadow-xs space-y-1">
          <span className="text-xs font-bold text-[#5A5A40] dark:text-zinc-300 uppercase tracking-wider block">
            Volume de Serviços
          </span>
          <div className="serif text-3xl font-bold text-[#5A5A40] dark:text-zinc-300">
            R$ {totalVolume.toFixed(2)}
          </div>
          <p className="text-xs text-[#706B5F] dark:text-zinc-400">
            Soma dos atendimentos não cancelados
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 shadow-xs space-y-1">
          <span className="text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 uppercase tracking-wider block">
            Sinais Pagos (Pix)
          </span>
          <div className="serif text-3xl font-bold text-[#2D2D2A] dark:text-zinc-100">
            R$ {totalDeposits.toFixed(2)}
          </div>
          <p className="text-xs text-[#706B5F] dark:text-zinc-400">
            Garantias antecipadas arrecadadas
          </p>
        </div>

      </div>

      {/* Tabs de Controle Admin */}
      <div className="flex overflow-x-auto gap-2 border-b border-[#E9E2D7] dark:border-zinc-700 pb-2 scrollbar-thin">
        {[
          { id: 'professionals', label: `Profissionais & Acessos (${professionals.length})`, icon: Users },
          { id: 'bookings', label: `Todos Agendamentos (${bookings.length})`, icon: Calendar },
          { id: 'reports', label: `Relatórios & Auditoria`, icon: FileText },
          { id: 'pricing', label: `Valores Planos & Layouts`, icon: Sliders },
          { id: 'pitch', label: `Apresentação Comercial`, icon: Sparkles },
          { id: 'support', label: `Central de Suporte (${tickets.length})`, icon: MessageSquare }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#2D2D2A] text-white shadow-xs'
                  : 'text-[#706B5F] dark:text-zinc-400 hover:bg-[#EEF1EB] dark:hover:bg-zinc-800 hover:text-[#2D2D2A] dark:hover:text-zinc-100 dark:text-zinc-100 dark:hover:text-zinc-100 dark:text-zinc-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: PROFISSIONAIS */}
      {/* ========================================================================= */}
      {activeTab === 'professionals' && (
        <div className="space-y-4">
          
          {/* Barra Resumo de Planos e MRR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 shadow-xs">
              <span className="text-2xs font-bold text-[#A09A8E] dark:text-zinc-500 uppercase tracking-wider block">15 Dias de Teste Grátis</span>
              <div className="serif text-2xl font-bold text-[#2D2D2A] dark:text-zinc-100">{trialTenants.length} profissionais</div>
              <p className="text-xs text-[#706B5F] dark:text-zinc-400">Degustação sem cobrança</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 shadow-xs">
              <span className="text-2xs font-bold text-[#5A5A40] dark:text-zinc-300 uppercase tracking-wider block">Plano Pro Fixo (R$ 79,90)</span>
              <div className="serif text-2xl font-bold text-[#5A5A40] dark:text-zinc-300">{proFixedTenants.length} assinantes</div>
              <p className="text-xs text-[#706B5F] dark:text-zinc-400">Ilimitado sem taxa por cliente</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 shadow-xs">
              <span className="text-2xs font-bold text-[#D4A373] uppercase tracking-wider block">Plano Flex (R$ 29,90 + R$ 1,50)</span>
              <div className="serif text-2xl font-bold text-[#D4A373]">{flexTenants.length} assinantes</div>
              <p className="text-xs text-[#706B5F] dark:text-zinc-400">Cobrança por cliente ativa</p>
            </div>
            <div className="bg-[#2D2D2A] p-4 rounded-2xl border border-[#3D3D3A] text-white shadow-xs">
              <span className="text-2xs font-bold text-[#D4A373] uppercase tracking-wider block">MRR Mensal Estimado</span>
              <div className="serif text-2xl font-bold text-white">R$ {estimatedSaaSMRR.toFixed(2)}</div>
              <p className="text-xs text-[#A09A8E] dark:text-zinc-500">Faturamento recorrente da plataforma</p>
            </div>
          </div>

          {planActionFeedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs sm:text-sm text-emerald-900 font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{planActionFeedback}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#A09A8E] dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Buscar por nome, especialidade ou slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-[#E9E2D7] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[#2D2D2A] dark:text-zinc-100 outline-none focus:border-[#5A5A40] dark:border-zinc-600"
              />
            </div>

            {/* Filtros de Plano */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setProfPlanFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  profPlanFilter === 'all' ? 'bg-[#2D2D2A] text-white' : 'bg-[#F8F6F2] text-[#706B5F] dark:text-zinc-400 hover:bg-[#EEF1EB] dark:hover:bg-zinc-800'
                }`}
              >
                Todos ({professionals.length})
              </button>
              <button
                onClick={() => setProfPlanFilter('trial')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  profPlanFilter === 'trial' ? 'bg-amber-800 text-white' : 'bg-[#F8F6F2] text-[#706B5F] dark:text-zinc-400 hover:bg-[#EEF1EB] dark:hover:bg-zinc-800'
                }`}
              >
                Teste Grátis ({trialTenants.length})
              </button>
              <button
                onClick={() => setProfPlanFilter('pro_fixed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  profPlanFilter === 'pro_fixed' ? 'bg-[#5A5A40] dark:bg-zinc-700 text-white' : 'bg-[#F8F6F2] text-[#706B5F] dark:text-zinc-400 hover:bg-[#EEF1EB] dark:hover:bg-zinc-800'
                }`}
              >
                Pro Fixo ({proFixedTenants.length})
              </button>
              <button
                onClick={() => setProfPlanFilter('flex_fee')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  profPlanFilter === 'flex_fee' ? 'bg-[#D4A373] text-white' : 'bg-[#F8F6F2] text-[#706B5F] dark:text-zinc-400 hover:bg-[#EEF1EB] dark:hover:bg-zinc-800'
                }`}
              >
                Flex ({flexTenants.length})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('pricing')}
                className="px-3.5 py-2 bg-white dark:bg-zinc-900 hover:bg-[#FAF8F5] dark:hover:bg-zinc-800 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 text-[#5A5A40] dark:text-zinc-300 border border-[#E9E2D7] dark:border-zinc-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                title="Editar valores e regras dos planos SaaS em conjunto"
              >
                <Sliders className="w-3.5 h-3.5" />
                Editar Valores Globais (Em Conjunto)
              </button>

              <button
                onClick={() => setIsNewProfModalOpen(true)}
                className="px-4 py-2 bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Cadastrar Nova Profissional
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredProfessionals.map((prof) => {
              const profServicesCount = services.filter(s => s.professionalId === prof.id).length;
              const profBookingsCount = bookings.filter(b => b.professionalId === prof.id).length;
              const isActive = prof.status === 'active';
              const pStatus = getProfessionalPlanStatus(prof);

              return (
                <div
                  key={prof.id}
                  className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-[#E9E2D7] dark:border-zinc-700 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden relative border-2 border-[#E9E2D7] dark:border-zinc-700 shrink-0 mt-1 sm:mt-0">
                      <Image 
                        src={prof.avatarUrl} 
                        alt={prof.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="serif font-bold text-lg text-[#2D2D2A] dark:text-zinc-100">{prof.name}</h3>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          isActive ? 'bg-[#EEF1EB] text-[#5A5A40] dark:text-zinc-300' : 'bg-[#F8F6F2] text-[#706B5F] dark:text-zinc-400'
                        }`}>
                          {isActive ? 'Conta Ativa' : 'Conta Inativa'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-2xs font-bold bg-[#FAF8F5] dark:bg-zinc-800/50 text-[#5A5A40] dark:text-zinc-300 border border-[#E9E2D7] dark:border-zinc-700">
                          {prof.category}
                        </span>
                        {prof.documentNumber && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-2xs font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {prof.documentType ? prof.documentType.toUpperCase() : 'DOC'}: {prof.documentNumber}
                          </span>
                        )}
                        <span className="text-xs text-[#706B5F] dark:text-zinc-400 font-medium">
                          {prof.phone}
                        </span>
                        <span className="text-xs text-[#A09A8E] dark:text-zinc-500">•</span>
                        <span className="text-xs text-[#706B5F] dark:text-zinc-400">
                          Pix: <code className="font-mono font-bold text-[#2D2D2A] dark:text-zinc-100">{prof.pixKey}</code> ({prof.pixKeyType})
                        </span>
                      </div>

                      <div className="text-xs text-[#A09A8E] dark:text-zinc-500 mt-1 flex flex-wrap items-center gap-2">
                        <span>Link: <code className="text-[#5A5A40] dark:text-zinc-300 font-semibold">/{prof.slug}</code></span>
                        <span>•</span>
                        <span>{profServicesCount} serviços cadastrados</span>
                        <span>•</span>
                        <span>{profBookingsCount} agendamentos</span>
                        <span>•</span>
                        <span>Aviso cancelamento: {prof.cancellationHours}h</span>
                      </div>

                      {/* PAINEL VISUAL DE GESTÃO DE DIAS RESTANTES / PLANO */}
                      <div className={`mt-3 p-3.5 rounded-2xl border transition-all ${
                        pStatus.isTrial
                          ? pStatus.isExpired
                            ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                            : pStatus.daysRemaining <= 3
                              ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                              : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                          : 'bg-[#FAF8F5] dark:bg-zinc-800/50 border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100'
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-2 rounded-xl shrink-0 ${
                              pStatus.isTrial
                                ? pStatus.isExpired
                                  ? 'bg-rose-200/80 text-rose-800'
                                  : pStatus.daysRemaining <= 3
                                    ? 'bg-amber-200/80 text-amber-800'
                                    : 'bg-emerald-200/80 text-emerald-800'
                                : 'bg-[#EEF1EB] text-[#5A5A40] dark:text-zinc-300'
                            }`}>
                              {pStatus.isTrial ? (
                                <Hourglass className="w-4 h-4 animate-pulse" />
                              ) : (
                                <ShieldCheck className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                  pStatus.isTrial
                                    ? pStatus.isExpired
                                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                      : 'bg-white dark:bg-zinc-900 text-emerald-800 border border-emerald-300 shadow-2xs'
                                    : 'bg-[#EEF1EB] text-[#5A5A40] dark:text-zinc-300 border border-[#ced6c6]'
                                }`}>
                                  {pStatus.isTrial
                                    ? pStatus.isExpired
                                      ? 'Degustação Expirada'
                                      : `${pStatus.daysRemaining} ${pStatus.daysRemaining === 1 ? 'Dia Restante' : 'Dias Restantes'} de Degustação`
                                    : 'Assinatura Ativa'}
                                </span>
                                <span className="text-2xs font-semibold opacity-75">
                                  {pStatus.isTrial
                                    ? `Vigência: ${pStatus.daysRemaining} de ${prof.trialDays || 15} dias de teste`
                                    : prof.planType === 'pro_fixed' ? 'Plano Pro Fixo (Ilimitado)' : 'Plano Flex'}
                                </span>
                              </div>
                              <p className="text-2xs mt-0.5 opacity-80">
                                {pStatus.isTrial ? (
                                  pStatus.isExpired ? (
                                    <strong className="text-rose-700">O período de degustação encerrou. Mude de plano ou conceda dias extras abaixo.</strong>
                                  ) : (
                                    <>Vencimento do teste em: <strong>{new Date(prof.trialExpiresAt || (new Date(prof.trialStartedAt || prof.createdAt || new Date().toISOString()).getTime() + (prof.trialDays || 15) * 86400000)).toLocaleDateString('pt-BR')}</strong></>
                                  )
                                ) : (
                                  <>Assinatura ativa sem bloqueios. Cobrança gerenciada pelo painel SaaS.</>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Seletor Rápido de Plano & Ajuste de Preço */}
                          <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                            <select
                              value={prof.planType || 'trial'}
                              onChange={(e) => {
                                const newPlan = e.target.value as SubscriptionPlanType;
                                changeProfessionalPlan(prof.id, newPlan);
                                const pName = PLAN_CONFIGS[newPlan]?.name || newPlan;
                                setPlanActionFeedback(`Plano de "${prof.name}" alterado para ${pName}.`);
                                setTimeout(() => setPlanActionFeedback(null), 4000);
                              }}
                              className="text-2xs font-bold bg-white dark:bg-zinc-900 hover:bg-stone-50 dark:bg-zinc-800 border border-stone-300 dark:border-zinc-600 rounded-lg px-2 py-1 text-[#2D2D2A] dark:text-zinc-100 outline-none cursor-pointer shadow-2xs"
                            >
                              <option value="trial">Degustação ({getSaaSPricing().trialDays} Dias)</option>
                              <option value="pro_fixed">Plano Pro Fixo</option>
                              <option value="flex_fee">Plano Flex</option>
                            </select>

                            <button
                              onClick={() => handleOpenEditProfPlan(prof)}
                              className="text-2xs font-bold bg-white dark:bg-zinc-900 hover:bg-[#EEF1EB] dark:hover:bg-zinc-800 border border-stone-300 dark:border-zinc-600 text-[#5A5A40] dark:text-zinc-300 px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                              title="Editar valores personalizados para este profissional"
                            >
                              <DollarSign className="w-3 h-3 text-[#5A5A40] dark:text-zinc-300" />
                              Valores
                            </button>
                          </div>
                        </div>

                        {/* Barra de Progresso Visual dos Dias Restantes do Trial */}
                        {pStatus.isTrial && (
                          <div className="mt-2.5 pt-2.5 border-t border-black/5 space-y-1.5">
                            <div className="flex justify-between text-2xs font-bold">
                              <span>Progresso do período de testes:</span>
                              <span>
                                {pStatus.isExpired 
                                  ? '0% restante (Esgotado)' 
                                  : `${Math.round((pStatus.daysRemaining / (prof.trialDays || 15)) * 100)}% de tempo livre`}
                              </span>
                            </div>
                            <div className="w-full bg-black/10 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 rounded-full ${
                                  pStatus.isExpired
                                    ? 'bg-rose-500 w-full'
                                    : pStatus.daysRemaining <= 3
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500'
                                }`}
                                style={{
                                  width: pStatus.isExpired
                                    ? '100%'
                                    : `${Math.max(5, Math.min(100, (pStatus.daysRemaining / (prof.trialDays || 15)) * 100))}%`
                                }}
                              />
                            </div>

                            {/* Botões Rápidos de Concessão de Dias de Degustação */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              <span className="text-2xs font-bold opacity-75 mr-1">Conceder mais dias de teste:</span>
                              <button
                                onClick={() => {
                                  extendTrialDays(prof.id, 3);
                                  setPlanActionFeedback(`+3 dias concedidos para ${prof.name}!`);
                                  setTimeout(() => setPlanActionFeedback(null), 4000);
                                }}
                                className="text-2xs font-bold bg-white dark:bg-zinc-900 hover:bg-emerald-50 border border-emerald-300 text-emerald-800 px-2 py-0.5 rounded-md transition-colors cursor-pointer shadow-2xs flex items-center gap-0.5"
                              >
                                <Plus className="w-2.5 h-2.5" /> +3 Dias
                              </button>
                              <button
                                onClick={() => {
                                  extendTrialDays(prof.id, 7);
                                  setPlanActionFeedback(`+7 dias concedidos para ${prof.name}!`);
                                  setTimeout(() => setPlanActionFeedback(null), 4000);
                                }}
                                className="text-2xs font-bold bg-white dark:bg-zinc-900 hover:bg-emerald-50 border border-emerald-300 text-emerald-800 px-2 py-0.5 rounded-md transition-colors cursor-pointer shadow-2xs flex items-center gap-0.5"
                              >
                                <Plus className="w-2.5 h-2.5" /> +7 Dias
                              </button>
                              <button
                                onClick={() => {
                                  extendTrialDays(prof.id, 15);
                                  setPlanActionFeedback(`+15 dias concedidos para ${prof.name}!`);
                                  setTimeout(() => setPlanActionFeedback(null), 4000);
                                }}
                                className="text-2xs font-bold bg-white dark:bg-zinc-900 hover:bg-emerald-50 border border-emerald-300 text-emerald-800 px-2 py-0.5 rounded-md transition-colors cursor-pointer shadow-2xs flex items-center gap-0.5"
                              >
                                <Plus className="w-2.5 h-2.5" /> +15 Dias
                              </button>
                              {(prof.planMonthlyPrice !== undefined || prof.feePerBooking !== undefined) && (
                                <span className="ml-auto text-2xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                                  Sob Medida: R$ {prof.planMonthlyPrice !== undefined ? prof.planMonthlyPrice.toFixed(2) : '79.90'}/mês
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                        {/* Box de Acessos & Credenciais de Login Completas */}
                        <div className="mt-3 p-3.5 bg-[#FAF8F5] dark:bg-zinc-800/50 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5A5A40] dark:text-zinc-300 flex items-center gap-1.5">
                              <Key className="w-3.5 h-3.5 text-[#5A5A40] dark:text-zinc-300" />
                              Acesso & Credenciais de Login da Profissional
                            </span>
                            {copiedAccessId === prof.id && (
                              <span className="text-2xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <Check className="w-3 h-3 text-emerald-600" /> Todos os dados copiados!
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                            <div className="bg-white dark:bg-zinc-900 px-2.5 py-1.5 rounded-xl border border-[#E9E2D7] dark:border-zinc-700">
                              <span className="text-[10px] uppercase font-bold text-[#A09A8E] dark:text-zinc-500 block">E-mail de Login:</span>
                              <span className="font-mono font-bold text-[#2D2D2A] dark:text-zinc-100 select-all truncate block text-xs">
                                {prof.email || `${prof.slug}@bellahora.com.br`}
                              </span>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 px-2.5 py-1.5 rounded-xl border border-[#E9E2D7] dark:border-zinc-700">
                              <span className="text-[10px] uppercase font-bold text-[#A09A8E] dark:text-zinc-500 block">Senha de Acesso:</span>
                              <span className="font-mono font-bold text-[#2D2D2A] dark:text-zinc-100 select-all block text-xs">
                                {prof.password || '123456'}
                              </span>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 px-2.5 py-1.5 rounded-xl border border-[#E9E2D7] dark:border-zinc-700">
                              <span className="text-[10px] uppercase font-bold text-[#A09A8E] dark:text-zinc-500 block">WhatsApp / Contato:</span>
                              <span className="font-bold text-[#2D2D2A] dark:text-zinc-100 block text-xs">
                                {prof.phone}
                              </span>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 px-2.5 py-1.5 rounded-xl border border-[#E9E2D7] dark:border-zinc-700">
                              <span className="text-[10px] uppercase font-bold text-[#A09A8E] dark:text-zinc-500 block">Plano & Vigência:</span>
                              <span className="font-bold text-[#5A5A40] dark:text-zinc-300 block text-xs">
                                {pStatus.isTrial 
                                  ? `Teste Grátis (${pStatus.daysRemaining} dias restantes)` 
                                  : prof.planType === 'pro_fixed' ? 'Pro Fixo (Ilimitado)' : 'Flex (R$ 29,90 + R$ 1,50)'}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                            <div className="bg-white dark:bg-zinc-900 px-2.5 py-1.5 rounded-xl border border-[#E9E2D7] dark:border-zinc-700">
                              <span className="text-[10px] uppercase font-bold text-[#A09A8E] dark:text-zinc-500 block">Chave Pix ({prof.pixKeyType}):</span>
                              <span className="font-mono text-xs text-[#2D2D2A] dark:text-zinc-100 font-semibold select-all block truncate">
                                {prof.pixKey}
                              </span>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 px-2.5 py-1.5 rounded-xl border border-[#E9E2D7] dark:border-zinc-700">
                              <span className="text-[10px] uppercase font-bold text-[#A09A8E] dark:text-zinc-500 block">Endereço do Espaço:</span>
                              <span className="text-xs text-[#2D2D2A] dark:text-zinc-100 font-semibold block truncate">
                                {prof.address || 'Não informado'}
                              </span>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 px-2.5 py-1.5 rounded-xl border border-[#E9E2D7] dark:border-zinc-700">
                              <span className="text-[10px] uppercase font-bold text-[#A09A8E] dark:text-zinc-500 block">Layout Visual da Página:</span>
                              <span className="text-xs font-bold text-[#5A5A40] dark:text-zinc-300 block capitalize">
                                {prof.pageLayoutTemplate ? prof.pageLayoutTemplate.replace(/_/g, ' ') : 'Clássico Elegante'}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                const trialDaysCount = prof.trialDays || globalPlanPricing?.trialDays || 15;
                                const text = `Acesso ao BellaHora:\nLink do Painel: ${window.location.origin}/painel-profissional?prof=${prof.slug}\nLink da Agenda Pública: ${window.location.origin}/${prof.slug}\nE-mail de Login: ${prof.email || `${prof.slug}@bellahora.com.br`}\nSenha: ${prof.password || '123456'}\nPlano: ${pStatus.isTrial ? `Teste Grátis ${trialDaysCount} Dias` : prof.planType || 'Pro'}\nWhatsApp: ${prof.phone}\nChave Pix: ${prof.pixKey} (${prof.pixKeyType})`;
                                navigator.clipboard.writeText(text);
                                setCopiedAccessId(prof.id);
                                setTimeout(() => setCopiedAccessId(null), 3000);
                              }}
                              className="px-2.5 py-1 bg-white dark:bg-zinc-900 hover:bg-[#EEF1EB] dark:hover:bg-zinc-800 text-[#2D2D2A] dark:text-zinc-100 border border-[#E9E2D7] dark:border-zinc-700 rounded-lg text-2xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                            >
                              <Copy className="w-3 h-3 text-[#5A5A40] dark:text-zinc-300" />
                              Copiar Todos os Acessos
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const trialDaysCount = prof.trialDays || globalPlanPricing?.trialDays || 15;
                                const msg = `Olá ${prof.name}! Aqui estão seus dados de acesso ao painel BellaHora:\n\n🔗 Link do seu Painel: ${typeof window !== 'undefined' ? window.location.origin : ''}/painel-profissional?prof=${prof.slug}\n👉 Link da sua Agenda Pública: ${typeof window !== 'undefined' ? window.location.origin : ''}/${prof.slug}\n📧 E-mail de Login: ${prof.email || `${prof.slug}@bellahora.com.br`}\n🔑 Senha de Acesso: ${prof.password || '123456'}\n🎁 Plano Inicial: Teste Grátis (${trialDaysCount} dias de degustação completa)\n\nQualquer dúvida, estamos à disposição para te ajudar!`;
                                openWhatsAppSafely(prof.phone, msg);
                              }}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-2xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Send className="w-3 h-3 text-emerald-600" />
                              Enviar Acesso via WhatsApp
                            </button>

                          <Link
                            href={`/painel-profissional?prof=${prof.slug}`}
                            target="_blank"
                            className="px-2.5 py-1 bg-[#EEF1EB] hover:bg-[#5A5A40] dark:bg-zinc-700 text-[#5A5A40] dark:text-zinc-300 hover:text-white rounded-lg text-2xs font-bold flex items-center gap-1 transition-colors ml-auto"
                          >
                            <span>Acessar Painel Dela</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                    <button
                      onClick={() => setEditingProfessional(prof)}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Editar Dados
                    </button>

                    <Link
                      href={`/${prof.slug}`}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-[#F8F6F2] dark:bg-zinc-800 hover:bg-[#EEF1EB] dark:hover:bg-zinc-700 text-[#3D3D3D] dark:text-zinc-200 flex items-center gap-1 transition-colors"
                      target="_blank"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Ver Agenda
                    </Link>

                    <button
                      onClick={() => toggleProfessionalStatus(prof.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                        isActive
                          ? 'bg-[#FDF4EE] text-[#D4A373] hover:bg-[#fce9dc]'
                          : 'bg-[#EEF1EB] text-[#5A5A40] dark:text-zinc-300 hover:bg-[#e1e6db]'
                      }`}
                    >
                      {isActive ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      {isActive ? 'Desativar' : 'Ativar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: GERENCIAR TODOS OS AGENDAMENTOS (SUPER ADMIN COM PODER TOTAL) */}
      {/* ========================================================================= */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 p-4 shadow-xs space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#A09A8E] dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={bookingSearchTerm}
                  onChange={(e) => setBookingSearchTerm(e.target.value)}
                  placeholder="Buscar cliente, telefone, código, serviço ou profissional..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[#2D2D2A] dark:text-zinc-100 outline-none focus:border-[#5A5A40] dark:border-zinc-600"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={bookingProfFilter}
                  onChange={(e) => setBookingProfFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-xs font-bold bg-white dark:bg-zinc-900 text-[#2D2D2A] dark:text-zinc-100"
                >
                  <option value="all">Todas as Profissionais</option>
                  {professionals.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>

                <select
                  value={bookingStatusFilter}
                  onChange={(e) => setBookingStatusFilter(e.target.value as any)}
                  className="px-3 py-2 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-xs font-bold bg-white dark:bg-zinc-900 text-[#2D2D2A] dark:text-zinc-100"
                >
                  <option value="all">Todos os Status</option>
                  <option value="pending">Pendentes</option>
                  <option value="confirmed">Confirmados</option>
                  <option value="completed">Concluídos</option>
                  <option value="cancelled">Cancelados</option>
                </select>

                <input
                  type="date"
                  value={bookingDateFilter}
                  onChange={(e) => setBookingDateFilter(e.target.value)}
                  className="px-2.5 py-2 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-xs bg-white dark:bg-zinc-900 text-[#2D2D2A] dark:text-zinc-100"
                />

                {bookingDateFilter && (
                  <button
                    onClick={() => setBookingDateFilter('')}
                    className="text-xs font-bold text-[#5A5A40] dark:text-zinc-300 hover:underline cursor-pointer"
                  >
                    Limpar Data
                  </button>
                )}

                <button
                  onClick={() => setIsNewBookingModalOpen(true)}
                  className="px-3.5 py-2 bg-[#2D2D2A] hover:bg-[#1f1f1d] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs ml-auto"
                >
                  <Plus className="w-4 h-4" />
                  Novo Agendamento Manual
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs text-[#706B5F] dark:text-zinc-400 pt-1 border-t border-[#E9E2D7] dark:border-zinc-700">
              <span>Exibindo <strong>{filteredBookings.length}</strong> de {bookings.length} registros</span>
              <span className="text-[#5A5A40] dark:text-zinc-300 font-semibold">Super Admin: você pode editar valores, datas, status e excluir registros.</span>
            </div>
          </div>

          <div className="space-y-3">
            {filteredBookings.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-12 text-center text-[#706B5F] dark:text-zinc-400 border border-[#E9E2D7] dark:border-zinc-700">
                Nenhum agendamento encontrado para os filtros selecionados.
              </div>
            ) : (
              filteredBookings.map((b) => {
                const isPending = b.status === 'pending';
                const isConfirmed = b.status === 'confirmed';
                const isCompleted = b.status === 'completed';
                const isCancelled = b.status === 'cancelled';

                return (
                  <div
                    key={b.id}
                    className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-[#E9E2D7] dark:border-zinc-700 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="serif font-bold text-lg text-[#2D2D2A] dark:text-zinc-100">{b.clientName}</span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#F8F6F2] text-[#706B5F] dark:text-zinc-400 font-bold">{b.code}</span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          isPending ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                          isConfirmed ? 'bg-[#EEF1EB] text-[#5A5A40] dark:text-zinc-300' :
                          isCompleted ? 'bg-[#FDF4EE] text-[#D4A373]' :
                          'bg-stone-100 dark:bg-zinc-800/80 text-stone-600 dark:text-zinc-400'
                        }`}>
                          {b.status.toUpperCase()}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F8F6F2] text-[#5A5A40] dark:text-zinc-300 font-semibold">
                          Profissional: {b.professionalName}
                        </span>
                      </div>

                      <p className="text-sm text-[#3D3D3D] dark:text-zinc-200">
                        <strong>{b.serviceName}</strong> • {formatDatePtBr(b.date)} às <strong>{b.time}{b.endTime ? ` às ${b.endTime}` : ''}</strong> ({b.serviceDuration} min)
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#706B5F] dark:text-zinc-400">
                        <span>WhatsApp: <strong>{b.clientPhone}</strong></span>
                        <span>Total: <strong className="text-[#2D2D2A] dark:text-zinc-100">R$ {b.totalPrice.toFixed(2)}</strong></span>
                        {b.depositRequired && (
                          <span className="text-[#5A5A40] dark:text-zinc-300 font-semibold">
                            Sinal: R$ {b.depositAmount.toFixed(2)} ({b.depositStatus === 'paid' ? 'Pago via Pix' : b.depositStatus === 'retained' ? 'Retido' : 'Pendente'})
                          </span>
                        )}
                      </div>

                      {b.notes && (
                        <p className="text-xs text-[#5A5A40] dark:text-zinc-300 bg-[#EEF1EB] px-2.5 py-1 rounded-lg inline-block">
                          Obs: {b.notes}
                        </p>
                      )}

                      {b.cancellationReason && (
                        <p className="text-xs text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg inline-block border border-rose-200">
                          Motivo cancelamento: {b.cancellationReason}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-[#E9E2D7] dark:border-zinc-700">
                      {/* Botão Super Admin: Editar Tudo */}
                      <button
                        onClick={() => setEditingBooking(b)}
                        className="px-3 py-2 bg-[#2D2D2A] hover:bg-[#1f1f1d] text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Editar qualquer detalhe deste agendamento"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Editar Tudo
                      </button>

                      {/* Ações Rápidas de Status */}
                      {isPending && (
                        <button
                          onClick={() => confirmBooking(b.id)}
                          className="px-3 py-2 bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Confirmar
                        </button>
                      )}

                      {isConfirmed && (
                        <button
                          onClick={() => completeBooking(b.id)}
                          className="px-3 py-2 bg-[#EEF1EB] hover:bg-[#e1e6db] text-[#5A5A40] dark:text-zinc-300 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Concluir
                        </button>
                      )}

                      {!isCancelled && (
                        <button
                          onClick={() => {
                            const reason = prompt('Motivo do cancelamento (Admin):') || 'Cancelado pelo administrador';
                            cancelBooking(b.id, reason, false);
                          }}
                          className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Cancelar
                        </button>
                      )}

                      {isCancelled && (
                        <button
                          onClick={() => confirmBooking(b.id)}
                          className="px-3 py-2 bg-[#EEF1EB] hover:bg-[#e1e6db] text-[#5A5A40] dark:text-zinc-300 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          Reativar
                        </button>
                      )}

                      {/* Excluir Definitivamente */}
                      <button
                        onClick={() => {
                          if (confirm(`Tem certeza que deseja excluir o agendamento ${b.code} de ${b.clientName}? Esta ação é permanente.`)) {
                            deleteBooking(b.id);
                          }
                        }}
                        className="p-2 text-[#A09A8E] dark:text-zinc-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Excluir agendamento permanentemente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {/* Link WhatsApp direto com cliente */}
                      <button
                        type="button"
                        onClick={() => openWhatsAppSafely(b.clientPhone, `Olá ${b.clientName}! Aqui é da administração referente ao agendamento ${b.code}.`)}
                        className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors cursor-pointer"
                        title="Conversar com a cliente no WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: APRESENTAÇÃO COMERCIAL & COMO COBRAR (PITCH MASTER) */}
      {/* ========================================================================= */}
      {activeTab === 'pitch' && (
        <div className="space-y-8">
          {/* Banner de Apresentação */}
          <div className="bg-gradient-to-br from-[#5A5A40] to-[#42422e] rounded-3xl p-6 sm:p-10 text-white shadow-md border border-[#484832] space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-zinc-900/20 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Modelo Pronto para Reunião & Apresentação Comercial
            </div>
            <h2 className="serif text-2xl sm:text-4xl font-bold leading-tight">
              Como Apresentar a BellaHora para Manicures, Lash Designers e Clínicas de Estética
            </h2>
            <p className="text-[#E9E2D7] text-sm sm:text-base max-w-3xl leading-relaxed">
              Use esta estrutura de 4 etapas para fechar contratos imediatos. As profissionais de beleza não compram &ldquo;tecnologia&rdquo; ou &ldquo;software&rdquo;, elas compram <strong>tempo livre de WhatsApp</strong> e o fim do <strong>prejuízo com clientes que furam</strong>.
            </p>
          </div>

          {/* Etapa 1: O Roteiro de Apresentação (Script de Vendas) */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-[#E9E2D7] dark:border-zinc-700 shadow-xs space-y-6">
            <h3 className="serif text-xl sm:text-2xl font-bold text-[#2D2D2A] dark:text-zinc-100 flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-[#5A5A40] dark:bg-zinc-700 text-white flex items-center justify-center text-sm font-bold">1</span>
              O Roteiro da Demonstração (5 Minutos Práticos)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 rounded-2xl bg-[#F8F6F2] border border-[#E9E2D7] dark:border-zinc-700 space-y-2">
                <span className="text-xs font-bold text-[#5A5A40] dark:text-zinc-300 uppercase tracking-wider block">Passo 1: A Dor do WhatsApp</span>
                <h4 className="font-bold text-[#2D2D2A] dark:text-zinc-100 text-base">&ldquo;Quanto tempo você perde respondendo cliente?&rdquo;</h4>
                <p className="text-xs text-[#706B5F] dark:text-zinc-400 leading-relaxed">
                  Mostre a ela: você está no meio de um alongamento de cílios ou unha em gel e o celular não para de apitar com mensagens como: <em>&ldquo;Tem horário amanhã às 15h? E sábado? Quanto custa a esmaltação?&rdquo;</em>.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#F8F6F2] border border-[#E9E2D7] dark:border-zinc-700 space-y-2">
                <span className="text-xs font-bold text-[#D4A373] uppercase tracking-wider block">Passo 2: A Mágica do Link</span>
                <h4 className="font-bold text-[#2D2D2A] dark:text-zinc-100 text-base">&ldquo;1 Link no WhatsApp e Instagram resolve tudo&rdquo;</h4>
                <p className="text-xs text-[#706B5F] dark:text-zinc-400 leading-relaxed">
                  Abra a agenda pública (ex: <code>/bella-beauty</code>) no celular dela. Mostre que a cliente escolhe os serviços, vê as vagas reais calculadas pelo tempo de cada procedimento e não precisa ficar trocando 20 áudios.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#F8F6F2] border border-[#E9E2D7] dark:border-zinc-700 space-y-2">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">Passo 3: Fim do Prejuízo</span>
                <h4 className="font-bold text-[#2D2D2A] dark:text-zinc-100 text-base">&ldquo;O Sinal Pix na hora do agendamento&rdquo;</h4>
                <p className="text-xs text-[#706B5F] dark:text-zinc-400 leading-relaxed">
                  Mostre a tela do QR Code Pix e Copia e Cola. Explique: <em>&ldquo;A cliente só reserva se pagar o sinal de R$ 20 ou 30%. Se ela faltar sem avisar com 24h, você não fica no prejuízo com a cadeira vazia!&rdquo;</em>.
                </p>
              </div>
            </div>
          </div>

          {/* Etapa 2: Calculadora de Lucro Interativa (Demonstre na frente dela!) */}
          <div className="bg-[#FAF8F5] dark:bg-zinc-800/50 rounded-3xl p-6 sm:p-8 border border-[#E9E2D7] dark:border-zinc-700 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="serif text-xl sm:text-2xl font-bold text-[#2D2D2A] dark:text-zinc-100 flex items-center gap-2">
                  <Calculator className="w-6 h-6 text-[#5A5A40] dark:text-zinc-300" />
                  Simulador de Retorno (Demonstre o ROI na Frente do(a) Profissional)
                </h3>
                <p className="text-xs sm:text-sm text-[#706B5F] dark:text-zinc-400 mt-1">
                  Mude os números junto com o(a) profissional para demonstrar que a mensalidade do sistema custa MENOS do que UM(A) cliente que falta!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Controles do Simulador */}
              <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 space-y-5">
                <div>
                  <div className="flex justify-between text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">
                    <span>Preço Médio do Atendimento:</span>
                    <span className="text-[#5A5A40] dark:text-zinc-300 text-sm">R$ {pitchAvgTicket}</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="300"
                    step="5"
                    value={pitchAvgTicket}
                    onChange={(e) => setPitchAvgTicket(Number(e.target.value))}
                    className="w-full accent-[#5A5A40] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#A09A8E] dark:text-zinc-500">
                    <span>R$ 30 (Manicure simples)</span>
                    <span>R$ 150 (Alongamento)</span>
                    <span>R$ 300 (Mega / Estética)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">
                    <span>Clientes atendidas no mês:</span>
                    <span className="text-[#5A5A40] dark:text-zinc-300 text-sm">{pitchMonthlyClients} clientes</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="200"
                    step="5"
                    value={pitchMonthlyClients}
                    onChange={(e) => setPitchMonthlyClients(Number(e.target.value))}
                    className="w-full accent-[#5A5A40] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">
                    <span>Quantas clientes faltam ou furam por mês sem avisar?</span>
                    <span className="text-rose-600 text-sm font-bold">{pitchNoShowCount} faltas/mês</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    step="1"
                    value={pitchNoShowCount}
                    onChange={(e) => setPitchNoShowCount(Number(e.target.value))}
                    className="w-full accent-rose-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">
                    <span>Sua Mensalidade Cobrada da Profissional:</span>
                    <span className="text-emerald-700 text-sm font-bold">R$ {pitchPlanPrice.toFixed(2)}/mês</span>
                  </div>
                  <input
                    type="range"
                    min="29.90"
                    max="149.90"
                    step="10"
                    value={pitchPlanPrice}
                    onChange={(e) => setPitchPlanPrice(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Resultado do ROI */}
              <div className="bg-[#2D2D2A] text-white p-6 rounded-2xl border border-[#3D3D3D] flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#D4A373]">
                    Resultado Financeiro
                  </span>
                  
                  <div>
                    <span className="text-xs text-[#A09A8E] dark:text-zinc-400 block">Prejuízo mensal estimado com ausências (no-show):</span>
                    <span className="serif text-2xl font-bold text-rose-400">
                      - R$ {pitchMonthlyLoss.toFixed(2)}/mês
                    </span>
                    <span className="text-[11px] text-[#A09A8E] dark:text-zinc-400">
                      (- R$ {pitchAnnualLoss.toFixed(2)} perdidos por ano)
                    </span>
                  </div>

                  <div className="pt-2 border-t border-[#3D3D3D]">
                    <span className="text-xs text-[#A09A8E] dark:text-zinc-400 block">Com a Confirmação e Sinal Pix:</span>
                    <span className="serif text-2xl font-bold text-emerald-400">
                      + R$ {pitchNetMonthlyGain.toFixed(2)}/mês
                    </span>
                    <span className="text-[11px] text-emerald-300 block mt-0.5">
                      Faturamento protegido e recuperado já descontando a mensalidade de R$ {pitchPlanPrice.toFixed(2)}!
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-white/10 dark:bg-zinc-900/40 rounded-xl text-xs text-[#E9E2D7] leading-relaxed">
                  💡 <strong>Argumento de Ouro:</strong> <em>&ldquo;Você não está gastando R$ {pitchPlanPrice.toFixed(2)}, você está investindo para recuperar R$ {pitchMonthlyLoss.toFixed(2)} que hoje são perdidos por faltas e horários desmarcados em cima da hora.&rdquo;</em>
                </div>
              </div>
            </div>
          </div>

          {/* Etapa 3: Como Cobrar (Nuances, Modelos de Preço & Dicas Estratégicas) */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-[#E9E2D7] dark:border-zinc-700 shadow-xs space-y-6">
            <h3 className="serif text-xl sm:text-2xl font-bold text-[#2D2D2A] dark:text-zinc-100 flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-[#5A5A40] dark:bg-zinc-700 text-white flex items-center justify-center text-sm font-bold">2</span>
              Como Cobrar: As 3 Estratégias de Precificação e Suas Nuances
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Modelo 1: Mensalidade Fixa (O mais recomendado) */}
              <div className="p-6 rounded-2xl border-2 border-[#5A5A40] dark:border-zinc-600 bg-[#FAF9F5] space-y-3 relative">
                <div className="absolute -top-3 right-4 px-2.5 py-0.5 bg-[#5A5A40] dark:bg-zinc-700 text-white text-[10px] font-bold rounded-full uppercase">
                  Mais Fácil de Vender
                </div>
                <h4 className="serif text-lg font-bold text-[#2D2D2A] dark:text-zinc-100">
                  Modelo 1: Mensalidade Fixa
                </h4>
                <div className="text-2xl font-bold text-[#5A5A40] dark:text-zinc-300">
                  R$ 39 a R$ 79<span className="text-xs font-normal text-[#706B5F] dark:text-zinc-400"> /mês</span>
                </div>
                <p className="text-xs text-[#706B5F] dark:text-zinc-400 leading-relaxed">
                  A profissional paga um valor fixo mensal com agendamentos ilimitados.
                </p>
                <div className="space-y-1.5 text-xs text-[#3D3D3D] dark:text-zinc-300 pt-2">
                  <p className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <strong>Previsibilidade:</strong> Você sabe quanto vai receber todo mês.
                  </p>
                  <p className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <strong>Sem atrito:</strong> Manicures adoram saber exatamente o custo.
                  </p>
                  <p className="flex items-center gap-1 text-rose-700 dark:text-rose-400">
                    <X className="w-3.5 h-3.5 shrink-0" />
                    Se ela crescer muito, você não ganha a mais pelo volume.
                  </p>
                </div>
              </div>

              {/* Modelo 2: Mensalidade Mínima + Escala (Híbrido) */}
              <div className="p-6 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-3">
                <h4 className="serif text-lg font-bold text-[#2D2D2A] dark:text-zinc-100">
                  Modelo 2: Mínimo + Volume
                </h4>
                <div className="text-2xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                  R$ 29<span className="text-xs font-normal text-[#706B5F] dark:text-zinc-400"> + R$ 1/cliente</span>
                </div>
                <p className="text-xs text-[#706B5F] dark:text-zinc-400 leading-relaxed">
                  Taxa base reduzida (ex: R$ 29/mês até 30 agendamentos) + R$ 0,90 por agendamento extra.
                </p>
                <div className="space-y-1.5 text-xs text-[#3D3D3D] dark:text-zinc-300 pt-2">
                  <p className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <strong>Barreira de entrada zero:</strong> Quem atende pouco aceita fácil.
                  </p>
                  <p className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <strong>Escala:</strong> Salões movimentados pagam R$ 120 a R$ 200/mês.
                  </p>
                  <p className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    Exige fechar a fatura todo mês com os relatórios do sistema.
                  </p>
                </div>
              </div>

              {/* Modelo 3: Taxa de Adesão / Implantação (A Mina de Ouro Rápida) */}
              <div className="p-6 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-3">
                <h4 className="serif text-lg font-bold text-[#2D2D2A] dark:text-zinc-100">
                  Taxa de Setup Inicial
                </h4>
                <div className="text-2xl font-bold text-[#D4A373]">
                  R$ 97 a R$ 197<span className="text-xs font-normal text-[#706B5F] dark:text-zinc-400"> (Taxa Única)</span>
                </div>
                <p className="text-xs text-[#706B5F] dark:text-zinc-400 leading-relaxed">
                  Cobrada uma única vez para você cadastrar a foto, fotos dos serviços, tabela de preços e colar o QR Code impresso no salão dela.
                </p>
                <div className="space-y-1.5 text-xs text-[#3D3D3D] dark:text-zinc-300 pt-2">
                  <p className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <strong>Dinheiro no bolso no dia 1:</strong> Paga seu tempo de onboarding.
                  </p>
                  <p className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <strong>Gera valor percebido:</strong> Ela sente que é um serviço VIP.
                  </p>
                  <p className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    Você pode oferecer <em>&ldquo;Setup grátis se fechar plano trimestral&rdquo;</em>.
                  </p>
                </div>
              </div>

            </div>

            {/* Dicas Cruciais de Nuances para Não Cometer Erros */}
            <div className="p-6 rounded-2xl bg-[#EEF1EB] dark:bg-zinc-800/80 border border-[#d6ded0] dark:border-zinc-700 space-y-4">
              <h4 className="serif font-bold text-lg text-[#2D2D2A] dark:text-zinc-100 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-[#5A5A40] dark:text-amber-400" />
                O que você NUNCA deve fazer ao cobrar de profissionais de beleza:
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#3D3D3D] dark:text-zinc-200">
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-[#d6ded0] dark:border-zinc-700">
                  <strong className="text-rose-700 dark:text-rose-400 block mb-1">❌ Não cobre porcentagem sobre o faturamento dela (ex: 5%)</strong>
                  Manicures e cabeleireiras não gostam que terceiros fiquem com porcentagem do atendimento braçal delas. Elas preferem muito mais uma mensalidade previsível.
                </div>

                <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-[#d6ded0] dark:border-zinc-700">
                  <strong className="text-emerald-700 dark:text-emerald-400 block mb-1">✅ Ofereça dias de teste com tudo configurado por você</strong>
                  Diga a ela: <em>&ldquo;Eu configuro seus serviços e sua chave Pix agora em 5 minutos. Você testa no próximo fim de semana. Se não economizar tempo, não me deve 1 centavo!&rdquo;</em>.
                </div>

                <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-[#d6ded0] dark:border-zinc-700">
                  <strong className="text-emerald-700 dark:text-emerald-400 block mb-1">✅ Entregue a plaquinha com o QR Code impresso</strong>
                  Uma simples folha impressa ou suporte acrílico com o QR Code gerado no painel do(a) profissional valoriza muito o espaço.
                </div>

                <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-[#d6ded0] dark:border-zinc-700">
                  <strong className="text-emerald-700 dark:text-emerald-400 block mb-1">✅ Venda planos Trimestrais ou Semestrais com desconto</strong>
                  Exemplo: R$ 49/mês avulso, ou 3 meses por R$ 119. Isso reduz o cancelamento a quase zero.
                </div>
              </div>
            </div>

            {/* Script Pronto de WhatsApp para Mandar para as Profissionais */}
            <div className="p-6 bg-[#FAF9F5] dark:bg-zinc-900/60 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="serif font-bold text-base text-[#2D2D2A] dark:text-zinc-100">
                  Mensagem Pronta para Mandar no WhatsApp da Profissional (Copie e Cole)
                </h4>
              </div>

              <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 font-mono text-xs text-[#3D3D3D] dark:text-zinc-200 leading-relaxed select-all">
                {`"Oi [Nome da Profissional], tudo bem? Admiro muito o seu trabalho aqui no Instagram! 💅✨

Eu desenvolvi um link exclusivo de agendamento online para profissionais de beleza que acaba com aquele estresse de ficar trocando 30 mensagens de áudio no WhatsApp pra marcar horário, e ainda cobra o sinal Pix automático pra cliente não furar.

Montei uma prévia da sua agenda pra você dar uma olhada sem compromisso nenhum:
👉 ${typeof window !== 'undefined' ? window.location.origin : ''}/bella-beauty

Dá uma olhada em como fica elegante! Se você gostar, eu deixo tudo configurado pra você testar grátis essa semana. Posso te mandar um áudio de 1 minutinho explicando?"`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 4: CENTRAL DE SUPORTE */}
      {/* ========================================================================= */}
      {activeTab === 'support' && (
        <div className="space-y-4">
          <h2 className="serif text-xl font-bold text-[#2D2D2A] dark:text-zinc-100">Chamados e Dúvidas das Profissionais</h2>

          {tickets.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-12 text-center text-[#706B5F] dark:text-zinc-400 border border-[#E9E2D7] dark:border-zinc-700">
              Nenhuma solicitação de suporte no momento.
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((t) => (
                <div key={t.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-[#E9E2D7] dark:border-zinc-700 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#D4A373]">
                        {t.professionalName}
                      </span>
                      <h3 className="serif font-bold text-lg text-[#2D2D2A] dark:text-zinc-100">{t.subject}</h3>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      t.status === 'answered' ? 'bg-[#EEF1EB] text-[#5A5A40] dark:text-zinc-300' : 'bg-[#FDF4EE] text-[#D4A373]'
                    }`}>
                      {t.status === 'answered' ? 'Respondido' : 'Pendente'}
                    </span>
                  </div>

                  <p className="text-[#3D3D3D] text-sm bg-[#F8F6F2] p-3.5 rounded-xl border border-[#E9E2D7] dark:border-zinc-700">
                    {t.message}
                  </p>

                  {t.reply ? (
                    <div className="p-3 bg-[#EEF1EB] rounded-xl border border-[#dfe5d8] text-xs text-[#2D2D2A] dark:text-zinc-100">
                      <strong className="block font-bold text-[#5A5A40] dark:text-zinc-300 mb-1">Sua Resposta:</strong>
                      {t.reply}
                    </div>
                  ) : (
                    <div className="pt-2 space-y-2">
                      <label className="block text-xs font-bold uppercase text-[#706B5F] dark:text-zinc-400">
                        Responder à profissional:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={replyInputs[t.id] || ''}
                          onChange={(e) => setReplyInputs({ ...replyInputs, [t.id]: e.target.value })}
                          placeholder="Digite aqui a orientação para o(a) profissional..."
                          className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 outline-none focus:border-[#5A5A40] dark:border-zinc-600"
                        />
                        <button
                          onClick={() => handleSendReply(t.id)}
                          className="px-4 py-2 bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Enviar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA: RELATÓRIOS & AUDITORIA */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <AdminReportsManager
          professionals={professionals}
          bookings={bookings}
          tickets={tickets}
        />
      )}

      {/* ========================================================================= */}
      {/* ABA: GESTÃO & PRECIFICAÇÃO DOS PLANOS SAAS */}
      {/* ========================================================================= */}
      {activeTab === 'pricing' && (
        <AdminSaaSPricingManager />
      )}

      {/* ========================================================================= */}
      {/* MODAL SUPER ADMIN: EDITAR AGENDAMENTO COMPLETO */}
      {/* ========================================================================= */}
      {editingBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-[#E9E2D7] dark:border-zinc-700 my-8 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-2xs font-bold uppercase tracking-widest text-[#D4A373] block">Super Admin Override</span>
                <h3 className="serif text-xl sm:text-2xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                  Editar Agendamento {editingBooking.code}
                </h3>
              </div>
              <button
                onClick={() => setEditingBooking(null)}
                className="p-2 text-[#706B5F] dark:text-zinc-400 hover:bg-[#F8F6F2] rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBookingEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Nome da Cliente:</label>
                  <input
                    type="text"
                    required
                    value={editingBooking.clientName}
                    onChange={(e) => setEditingBooking({ ...editingBooking, clientName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 outline-none focus:border-[#5A5A40] dark:border-zinc-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">WhatsApp da Cliente:</label>
                  <input
                    type="text"
                    required
                    value={editingBooking.clientPhone}
                    onChange={(e) => setEditingBooking({ ...editingBooking, clientPhone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 outline-none focus:border-[#5A5A40] dark:border-zinc-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Profissional Responsável:</label>
                  <select
                    value={editingBooking.professionalId}
                    onChange={(e) => {
                      const prof = professionals.find(p => p.id === e.target.value);
                      if (prof) {
                        setEditingBooking({
                          ...editingBooking,
                          professionalId: prof.id,
                          professionalName: prof.name,
                          professionalPhone: prof.phone,
                          professionalAddress: prof.address
                        });
                      }
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 font-bold"
                  >
                    {professionals.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Serviço(s):</label>
                  <input
                    type="text"
                    required
                    value={editingBooking.serviceName}
                    onChange={(e) => setEditingBooking({ ...editingBooking, serviceName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 outline-none focus:border-[#5A5A40] dark:border-zinc-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Data:</label>
                  <input
                    type="date"
                    required
                    value={editingBooking.date}
                    onChange={(e) => setEditingBooking({ ...editingBooking, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Horário de Início:</label>
                  <input
                    type="time"
                    required
                    value={editingBooking.time}
                    onChange={(e) => setEditingBooking({ ...editingBooking, time: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Horário de Término:</label>
                  <input
                    type="time"
                    value={editingBooking.endTime || ''}
                    onChange={(e) => setEditingBooking({ ...editingBooking, endTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Valor Total (R$):</label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    required
                    value={editingBooking.totalPrice}
                    onChange={(e) => setEditingBooking({ ...editingBooking, totalPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Status do Agendamento:</label>
                  <select
                    value={editingBooking.status}
                    onChange={(e) => setEditingBooking({ ...editingBooking, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 font-bold"
                  >
                    <option value="pending">Pendente</option>
                    <option value="confirmed">Confirmado</option>
                    <option value="completed">Concluído</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Status do Sinal Pix:</label>
                  <select
                    value={editingBooking.depositStatus || 'pending'}
                    onChange={(e) => setEditingBooking({ ...editingBooking, depositStatus: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 text-xs"
                  >
                    <option value="pending">Pendente de Pagamento</option>
                    <option value="paid">Pago / Confirmado</option>
                    <option value="retained">Retido (Política Cancelamento)</option>
                    <option value="refunded">Estornado / Devolvido</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Valor do Sinal Exigido (R$):</label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    value={editingBooking.depositAmount}
                    onChange={(e) => setEditingBooking({ 
                      ...editingBooking, 
                      depositAmount: Number(e.target.value),
                      depositRequired: Number(e.target.value) > 0
                    })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Motivo do Cancelamento (se houver):</label>
                  <input
                    type="text"
                    value={editingBooking.cancellationReason || ''}
                    onChange={(e) => setEditingBooking({ ...editingBooking, cancellationReason: e.target.value })}
                    placeholder="Ex: Cliente reagendou / Solicitou cancelamento"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Observações da Cliente:</label>
                <textarea
                  rows={2}
                  value={editingBooking.notes || ''}
                  onChange={(e) => setEditingBooking({ ...editingBooking, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E9E2D7] dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  className="px-4 py-2 text-xs font-bold text-[#706B5F] dark:text-zinc-400 hover:bg-[#F8F6F2] rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#2D2D2A] hover:bg-[#1f1f1d] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL SUPER ADMIN: EDITAR PROFISSIONAL */}
      {/* ========================================================================= */}
      {editingProfessional && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-[#E9E2D7] dark:border-zinc-700 my-8 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-2xs font-bold uppercase tracking-widest text-[#5A5A40] dark:text-zinc-300 block">Gestão de Parceira</span>
                <h3 className="serif text-xl sm:text-2xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                  Editar Dados de {editingProfessional.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingProfessional(null)}
                className="p-2 text-[#706B5F] dark:text-zinc-400 hover:bg-[#F8F6F2] rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfessionalEdit} className="space-y-4">
              {/* Upload e Foto da Profissional */}
              <ImageUploadField
                value={editingProfessional.avatarUrl || ''}
                onChange={(url) => setEditingProfessional({ ...editingProfessional, avatarUrl: url })}
                label="Foto de Perfil do(a) Profissional / Logo"
                description="Carregue ou substitua a foto do(a) profissional exibida no topo da agenda pública."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Nome Completo:</label>
                  <input
                    type="text"
                    required
                    value={editingProfessional.name}
                    onChange={(e) => setEditingProfessional({ ...editingProfessional, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 outline-none focus:border-[#5A5A40] dark:border-zinc-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Slug do Link (/slug):</label>
                  <input
                    type="text"
                    required
                    value={editingProfessional.slug}
                    onChange={(e) => setEditingProfessional({ ...editingProfessional, slug: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Categoria Principal:</label>
                  <select
                    value={editingProfessional.category}
                    onChange={(e) => setEditingProfessional({ ...editingProfessional, category: e.target.value as ProfessionalCategory })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 font-medium"
                  >
                    {CATEGORIES_LIST.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Telefone (WhatsApp):</label>
                  <input
                    type="text"
                    required
                    value={editingProfessional.phone}
                    onChange={(e) => setEditingProfessional({ ...editingProfessional, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Email:</label>
                  <input
                    type="email"
                    required
                    value={editingProfessional.email}
                    onChange={(e) => setEditingProfessional({ ...editingProfessional, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Chave Pix para Recebimento:</label>
                  <input
                    type="text"
                    required
                    value={editingProfessional.pixKey}
                    onChange={(e) => setEditingProfessional({ ...editingProfessional, pixKey: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Tipo de Chave:</label>
                  <select
                    value={editingProfessional.pixKeyType}
                    onChange={(e) => setEditingProfessional({ ...editingProfessional, pixKeyType: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900"
                  >
                    <option value="telefone">Telefone</option>
                    <option value="email">Email</option>
                    <option value="cpf">CPF</option>
                    <option value="cnpj">CNPJ</option>
                    <option value="aleatoria">Chave Aleatória</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Endereço de Atendimento:</label>
                  <input
                    type="text"
                    required
                    value={editingProfessional.address}
                    onChange={(e) => setEditingProfessional({ ...editingProfessional, address: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Aviso Prévio Cancelamento (horas):</label>
                  <input
                    type="number"
                    min="1"
                    max="72"
                    required
                    value={editingProfessional.cancellationHours}
                    onChange={(e) => setEditingProfessional({ ...editingProfessional, cancellationHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#F8F6F2] rounded-2xl border border-[#E9E2D7] dark:border-zinc-700">
                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">
                    Plano de Assinatura:
                  </label>
                  <select
                    value={editingProfessional.planType || 'trial'}
                    onChange={(e) => setEditingProfessional({ 
                      ...editingProfessional, 
                      planType: e.target.value as SubscriptionPlanType 
                    })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 font-bold"
                  >
                    <option value="trial">15 Dias Grátis (Degustação)</option>
                    <option value="pro_fixed">Plano Pro Fixo (R$ 59,90/mês)</option>
                    <option value="flex_fee">Plano Flex (R$ 24,90 + R$ 0,99/agendamento)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">
                    Duração do Teste Grátis (Dias):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={editingProfessional.trialDays !== undefined ? editingProfessional.trialDays : (globalPlanPricing?.trialDays || 15)}
                    onChange={(e) => setEditingProfessional({ 
                      ...editingProfessional, 
                      trialDays: Number(e.target.value) 
                    })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900"
                  />
                  <p className="text-2xs text-[#706B5F] dark:text-zinc-400 mt-1">Padrão do sistema: {globalPlanPricing?.trialDays || 15} dias gratuitos</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Bio / Apresentação:</label>
                <textarea
                  rows={2}
                  value={editingProfessional.bio}
                  onChange={(e) => setEditingProfessional({ ...editingProfessional, bio: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#E9E2D7] dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => setEditingProfessional({
                    ...editingProfessional,
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
                    onClick={() => setEditingProfessional(null)}
                    className="px-4 py-2 text-xs font-bold text-[#706B5F] dark:text-zinc-400 hover:bg-[#F8F6F2] rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                  >
                    Salvar Dados
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CRIAR AGENDAMENTO MANUAL (ADMIN) */}
      {/* ========================================================================= */}
      {isNewBookingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-[#E9E2D7] dark:border-zinc-700 my-8 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-2xs font-bold uppercase tracking-widest text-[#5A5A40] dark:text-zinc-300 block">Agendamento Manual</span>
                <h3 className="serif text-xl sm:text-2xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                  Inserir Novo Agendamento
                </h3>
              </div>
              <button
                onClick={() => setIsNewBookingModalOpen(false)}
                className="p-2 text-[#706B5F] dark:text-zinc-400 hover:bg-[#F8F6F2] rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Para qual Profissional?</label>
                <select
                  value={newBookingForm.professionalId}
                  onChange={(e) => setNewBookingForm({ ...newBookingForm, professionalId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 font-bold"
                >
                  {professionals.map(p => (
                    <option key={p.id} value={p.id}>{p.name} — {p.category}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Nome da Cliente:</label>
                  <input
                    type="text"
                    required
                    value={newBookingForm.clientName}
                    onChange={(e) => setNewBookingForm({ ...newBookingForm, clientName: e.target.value })}
                    placeholder="Ex: Mariana Santos"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">WhatsApp:</label>
                  <input
                    type="text"
                    required
                    value={newBookingForm.clientPhone}
                    onChange={(e) => setNewBookingForm({ ...newBookingForm, clientPhone: e.target.value })}
                    placeholder="(11) 99999-8888"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Nome do Serviço:</label>
                  <input
                    type="text"
                    required
                    value={newBookingForm.serviceName}
                    onChange={(e) => setNewBookingForm({ ...newBookingForm, serviceName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Duração (minutos):</label>
                  <input
                    type="number"
                    step="15"
                    min="15"
                    value={newBookingForm.serviceDuration}
                    onChange={(e) => setNewBookingForm({ ...newBookingForm, serviceDuration: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Data:</label>
                  <input
                    type="date"
                    required
                    value={newBookingForm.date}
                    onChange={(e) => setNewBookingForm({ ...newBookingForm, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Horário:</label>
                  <input
                    type="time"
                    required
                    value={newBookingForm.time}
                    onChange={(e) => setNewBookingForm({ ...newBookingForm, time: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Valor Total (R$):</label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    required
                    value={newBookingForm.totalPrice}
                    onChange={(e) => setNewBookingForm({ ...newBookingForm, totalPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E9E2D7] dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => setIsNewBookingModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#706B5F] dark:text-zinc-400 hover:bg-[#F8F6F2] rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#2D2D2A] hover:bg-[#1f1f1d] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Confirmar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CADASTRAR NOVA PROFISSIONAL (ADMIN) */}
      {/* ========================================================================= */}
      {isNewProfModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-[#E9E2D7] dark:border-zinc-700 my-8 animate-in fade-in zoom-in duration-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-2xs font-bold uppercase tracking-widest text-[#5A5A40] dark:text-zinc-300 block">Nova Parceira BellaHora</span>
                <h3 className="serif text-xl sm:text-2xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                  Cadastrar Profissional
                </h3>
                <p className="text-xs text-[#706B5F] dark:text-zinc-400 mt-0.5">
                  Preencha os dados ou clique em um modelo pré-preenchido para testar rapidamente.
                </p>
              </div>
              <button
                onClick={() => setIsNewProfModalOpen(false)}
                className="p-2 text-[#706B5F] dark:text-zinc-400 hover:bg-[#F8F6F2] rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {profCreateSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{profCreateSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateNewProfessional} className="space-y-4">
              {/* Campo para Carregar Foto / Avatar da Profissional */}
              <ImageUploadField
                value={newProfForm.avatarUrl}
                onChange={(url) => setNewProfForm({ ...newProfForm, avatarUrl: url })}
                label="Foto de Perfil da Profissional / Logo do Espaço *"
                description="Selecione um arquivo de foto (JPG, PNG, WEBP) ou arraste para cá. Essa foto aparecerá no topo da agenda online para as clientes."
              />

              {/* Nome e Link Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Nome Profissional / Salão *</label>
                  <input
                    type="text"
                    required
                    value={newProfForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
                      setNewProfForm({ ...newProfForm, name, slug: newProfForm.slug || slug });
                    }}
                    placeholder="Ex: Amanda Nails & Lash"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 focus:border-[#5A5A40] dark:border-zinc-600 focus:ring-1 focus:ring-[#5A5A40] dark:ring-zinc-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Link Exclusivo (/slug) *</label>
                  <input
                    type="text"
                    required
                    value={newProfForm.slug}
                    onChange={(e) => setNewProfForm({ ...newProfForm, slug: e.target.value })}
                    placeholder="amanda-nails"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 font-mono focus:border-[#5A5A40] dark:border-zinc-600 focus:ring-1 focus:ring-[#5A5A40] dark:ring-zinc-600"
                  />
                </div>
              </div>

              {/* Especialidade / Categoria e WhatsApp com DDD */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Especialidade / Categoria Principal (Obrigatório e permite digitar) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100">
                      Especialidade / Categoria Principal *
                    </label>
                    <div className="flex items-center gap-1 text-2xs">
                      <button
                        type="button"
                        onClick={() => {
                          setNewProfForm({ ...newProfForm, categoryMode: 'select' });
                          setCategoryValidationError(null);
                        }}
                        className={`px-2 py-0.5 rounded-md font-bold transition-colors cursor-pointer ${
                          newProfForm.categoryMode === 'select' ? 'bg-[#5A5A40] dark:bg-zinc-700 text-white' : 'bg-[#F8F6F2] text-[#706B5F] dark:text-zinc-400'
                        }`}
                      >
                        Lista
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewProfForm({ ...newProfForm, categoryMode: 'custom' });
                          setCategoryValidationError(null);
                        }}
                        className={`px-2 py-0.5 rounded-md font-bold transition-colors cursor-pointer ${
                          newProfForm.categoryMode === 'custom' ? 'bg-[#5A5A40] dark:bg-zinc-700 text-white' : 'bg-[#F8F6F2] text-[#706B5F] dark:text-zinc-400'
                        }`}
                      >
                        Digitar
                      </button>
                    </div>
                  </div>

                  {newProfForm.categoryMode === 'select' ? (
                    <select
                      value={newProfForm.category}
                      onChange={(e) => {
                        setNewProfForm({ ...newProfForm, category: e.target.value as ProfessionalCategory });
                        setCategoryValidationError(null);
                      }}
                      className={`w-full px-3.5 py-2.5 text-xs rounded-xl border font-medium ${
                        categoryValidationError ? 'border-rose-400 bg-rose-50/20' : 'border-[#E9E2D7] dark:border-zinc-700 bg-white dark:bg-zinc-900'
                      } text-[#2D2D2A] dark:text-zinc-100 focus:border-[#5A5A40] dark:border-zinc-600`}
                      required
                    >
                      <option value="">Selecione uma especialidade...</option>
                      {CATEGORIES_LIST.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={newProfForm.customCategory}
                      onChange={(e) => {
                        setNewProfForm({ ...newProfForm, customCategory: e.target.value });
                        setCategoryValidationError(null);
                      }}
                      placeholder="Digite a especialidade (ex: Lash Designer, Nail Artist, Visagista...)"
                      className={`w-full px-3.5 py-2.5 text-xs rounded-xl border font-medium ${
                        categoryValidationError ? 'border-rose-400 bg-rose-50/20' : 'border-[#E9E2D7] dark:border-zinc-700 bg-white dark:bg-zinc-900'
                      } text-[#2D2D2A] dark:text-zinc-100 focus:border-[#5A5A40] dark:border-zinc-600`}
                    />
                  )}
                  {categoryValidationError ? (
                    <p className="text-2xs text-rose-600 font-bold flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {categoryValidationError}
                    </p>
                  ) : (
                    <p className="text-2xs text-[#A09A8E] dark:text-zinc-500 mt-1">
                      Você pode selecionar na lista ou clicar em &quot;Digitar&quot; para definir livremente.
                    </p>
                  )}
                </div>

                {/* WhatsApp com DDD Validado */}
                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">
                    WhatsApp com DDD (Validado) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProfForm.phone}
                    onChange={(e) => {
                      const masked = formatPhoneMask(e.target.value);
                      setNewProfForm({ ...newProfForm, phone: masked });
                      if (masked.length >= 14) {
                        const valRes = validateWhatsAppPhone(masked);
                        setPhoneValidationError(valRes.isValid ? null : valRes.message);
                      } else {
                        setPhoneValidationError(null);
                      }
                    }}
                    onBlur={() => {
                      if (newProfForm.phone.trim()) {
                        const valRes = validateWhatsAppPhone(newProfForm.phone);
                        setPhoneValidationError(valRes.isValid ? null : valRes.message);
                      }
                    }}
                    placeholder="(11) 98888-7777"
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border font-medium ${
                      phoneValidationError ? 'border-rose-400 bg-rose-50/20' : 'border-[#E9E2D7] dark:border-zinc-700 bg-white dark:bg-zinc-900'
                    } text-[#2D2D2A] dark:text-zinc-100 focus:border-[#5A5A40] dark:border-zinc-600`}
                  />
                  {phoneValidationError ? (
                    <p className="text-2xs text-rose-600 font-bold flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {phoneValidationError}
                    </p>
                  ) : newProfForm.phone.replace(/\D/g, '').length >= 11 ? (
                    <p className="text-2xs text-emerald-700 font-medium flex items-center gap-1 mt-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      WhatsApp com DDD validado com sucesso!
                    </p>
                  ) : (
                    <p className="text-2xs text-[#A09A8E] dark:text-zinc-500 mt-1">
                      Formato: (DDD) 9XXXX-XXXX
                    </p>
                  )}
                </div>
              </div>

              {/* Documento Fiscal Validado (CPF ou CNPJ) */}
              <div className="p-3.5 bg-[#FAF8F5] dark:bg-zinc-800/50 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100">
                    Documento Fiscal da Profissional (Obrigatório e Validado) *
                  </label>
                  <div className="flex items-center gap-3 text-xs">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="docType"
                        checked={newProfForm.documentType === 'cpf'}
                        onChange={() => {
                          setNewProfForm({ ...newProfForm, documentType: 'cpf', documentNumber: '' });
                          setDocValidationError(null);
                        }}
                        className="text-[#5A5A40] dark:text-zinc-300"
                      />
                      <span className="font-bold text-2xs text-[#2D2D2A] dark:text-zinc-100">CPF (Pessoa Física)</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="docType"
                        checked={newProfForm.documentType === 'cnpj'}
                        onChange={() => {
                          setNewProfForm({ ...newProfForm, documentType: 'cnpj', documentNumber: '' });
                          setDocValidationError(null);
                        }}
                        className="text-[#5A5A40] dark:text-zinc-300"
                      />
                      <span className="font-bold text-2xs text-[#2D2D2A] dark:text-zinc-100">CNPJ (Pessoa Jurídica)</span>
                    </label>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    value={newProfForm.documentNumber}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const formatted = newProfForm.documentType === 'cpf' ? formatCPF(raw) : formatCNPJ(raw);
                      setNewProfForm({ ...newProfForm, documentNumber: formatted });
                      const cleanDigits = formatted.replace(/\D/g, '');
                      if (newProfForm.documentType === 'cpf' && cleanDigits.length === 11) {
                        setDocValidationError(isValidCPF(formatted) ? null : 'CPF inválido. Verifique os dígitos informados.');
                      } else if (newProfForm.documentType === 'cnpj' && cleanDigits.length === 14) {
                        setDocValidationError(isValidCNPJ(formatted) ? null : 'CNPJ inválido. Verifique os dígitos informados.');
                      } else {
                        setDocValidationError(null);
                      }
                    }}
                    onBlur={() => {
                      if (newProfForm.documentNumber.trim()) {
                        if (newProfForm.documentType === 'cpf') {
                          setDocValidationError(isValidCPF(newProfForm.documentNumber) ? null : 'CPF inválido. Verifique os dígitos informados.');
                        } else {
                          setDocValidationError(isValidCNPJ(newProfForm.documentNumber) ? null : 'CNPJ inválido. Verifique os dígitos informados.');
                        }
                      }
                    }}
                    placeholder={newProfForm.documentType === 'cpf' ? '000.000.000-00' : '00.000.000/0001-00'}
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border font-mono ${
                      docValidationError ? 'border-rose-400 bg-rose-50/20' : 'border-[#E9E2D7] dark:border-zinc-700 bg-white dark:bg-zinc-900'
                    } text-[#2D2D2A] dark:text-zinc-100 focus:border-[#5A5A40] dark:border-zinc-600`}
                  />
                </div>

                {docValidationError ? (
                  <p className="text-2xs text-rose-600 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {docValidationError}
                  </p>
                ) : newProfForm.documentNumber.trim() && (
                  (newProfForm.documentType === 'cpf' && isValidCPF(newProfForm.documentNumber)) ||
                  (newProfForm.documentType === 'cnpj' && isValidCNPJ(newProfForm.documentNumber))
                ) ? (
                  <p className="text-2xs text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    {newProfForm.documentType.toUpperCase()} validado com sucesso pelos algoritmos oficiais da Receita!
                  </p>
                ) : (
                  <p className="text-2xs text-[#A09A8E] dark:text-zinc-500">
                    Validação em tempo real do {newProfForm.documentType.toUpperCase()} com verificação de dígitos calculados.
                  </p>
                )}
              </div>

              {/* Múltiplas Especialidades */}
              <div>
                <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">
                  Especialidades (Selecione uma ou mais):
                </label>
                <div className="p-3 bg-[#F8F6F2] rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 space-y-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_SPECIALTIES.map((spec, sIdx) => {
                      const isSelected = newProfForm.specialties.includes(spec);
                      return (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => toggleSpecialty(spec)}
                          className={`px-2.5 py-1 rounded-lg text-2xs font-semibold transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-[#5A5A40] dark:bg-zinc-700 text-white border-[#5A5A40] dark:border-zinc-600 shadow-xs'
                              : 'bg-white dark:bg-zinc-900 text-[#706B5F] dark:text-zinc-400 border-[#E9E2D7] dark:border-zinc-700 hover:border-[#5A5A40] dark:border-zinc-600'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {spec}
                        </button>
                      );
                    })}
                  </div>

                  {/* Adicionar Especialidade Customizada */}
                  <div className="flex gap-2 pt-1 border-t border-[#E9E2D7] dark:border-zinc-700/60">
                    <input
                      type="text"
                      value={customSpecialty}
                      onChange={(e) => setCustomSpecialty(e.target.value)}
                      placeholder="Outra especialidade customizada..."
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomSpecialty();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomSpecialty}
                      className="px-3 py-1.5 bg-[#706B5F] hover:bg-[#5A5A40] dark:bg-zinc-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>

              {/* Chave Pix e Validação Rigorosa */}
              <div className="p-3.5 bg-white dark:bg-zinc-900 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Tipo de Chave Pix:</label>
                    <select
                      value={newProfForm.pixKeyType}
                      onChange={(e) => {
                        const newType = e.target.value as any;
                        setNewProfForm({ ...newProfForm, pixKeyType: newType });
                        if (newProfForm.pixKey) {
                          const res = validatePixKey(newProfForm.pixKey, newType);
                          setPixValidationError(res.isValid ? null : res.message);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900"
                    >
                      <option value="telefone">Telefone celular com DDD</option>
                      <option value="cpf">CPF (11 dígitos)</option>
                      <option value="cnpj">CNPJ (14 dígitos)</option>
                      <option value="email">E-mail</option>
                      <option value="aleatoria">Chave Aleatória (EVP / UUID)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Chave Pix da Profissional:</label>
                    <input
                      type="text"
                      value={newProfForm.pixKey}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewProfForm({ ...newProfForm, pixKey: val });
                        if (val.trim()) {
                          const res = validatePixKey(val, newProfForm.pixKeyType);
                          setPixValidationError(res.isValid ? null : res.message);
                        } else {
                          setPixValidationError(null);
                        }
                      }}
                      placeholder="Digite a chave Pix correspondente"
                      className={`w-full px-3.5 py-2.5 text-xs rounded-xl border text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 font-mono ${
                        pixValidationError ? 'border-rose-400 focus:ring-rose-400' : 'border-[#E9E2D7] dark:border-zinc-700 focus:ring-[#5A5A40] dark:ring-zinc-600'
                      }`}
                    />
                  </div>
                </div>

                {/* Feedback da Chave Pix */}
                {pixValidationError && (
                  <p className="text-2xs text-rose-600 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {pixValidationError}
                  </p>
                )}
                {!pixValidationError && newProfForm.pixKey.trim() && (
                  <p className="text-2xs text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Chave Pix válida para o tipo {newProfForm.pixKeyType}.
                  </p>
                )}
              </div>

              {/* Endereço, E-mail e Senha de Acesso */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Endereço / Local:</label>
                  <input
                    type="text"
                    value={newProfForm.address}
                    onChange={(e) => setNewProfForm({ ...newProfForm, address: e.target.value })}
                    placeholder="Ex: Rua Oscar Freire, 120 - Jardins, SP"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">E-mail para Login:</label>
                  <input
                    type="email"
                    value={newProfForm.email}
                    onChange={(e) => setNewProfForm({ ...newProfForm, email: e.target.value })}
                    placeholder="contato@exemplo.com.br"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Senha Inicial de Acesso:</label>
                  <input
                    type="text"
                    value={newProfForm.password}
                    onChange={(e) => setNewProfForm({ ...newProfForm, password: e.target.value })}
                    placeholder="bella2025"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900 font-mono"
                  />
                </div>
              </div>

              {/* Informação do Plano Padrão Inicial */}
              <div className="p-3.5 bg-[#EEF1EB] rounded-2xl border border-[#dfe5d8] flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#5A5A40] dark:text-zinc-300 shrink-0 mt-0.5" />
                <div className="text-xs text-[#2D2D2A] dark:text-zinc-100 space-y-0.5">
                  <span className="font-bold text-[#5A5A40] dark:text-zinc-300 block">Plano Padrão: 15 Dias de Degustação Gratuita (Teste Grátis)</span>
                  <p className="text-[#706B5F] dark:text-zinc-400">
                    Todo(a) novo(a) profissional cadastrado(a) inicia automaticamente no modo <strong>Teste Grátis</strong> por 15 dias com acesso liberado a todos os recursos. Você poderá estender o prazo ou trocar para plano Pro Fixo / Flex na lista de profissionais a qualquer momento.
                  </p>
                </div>
              </div>

              {/* Biografia / Descrição */}
              <div>
                <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Apresentação / Bio do(a) Profissional:</label>
                <textarea
                  rows={2}
                  value={newProfForm.bio}
                  onChange={(e) => setNewProfForm({ ...newProfForm, bio: e.target.value })}
                  placeholder="Conte um pouco sobre sua trajetória, especializações e diferenciais..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#2D2D2A] dark:text-zinc-100 bg-white dark:bg-zinc-900"
                />
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#E9E2D7] dark:border-zinc-700">
                <button
                  type="button"
                  onClick={handleClearNewProfForm}
                  className="px-4 py-2.5 text-xs font-bold text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:text-zinc-100 bg-stone-100 dark:bg-zinc-800/80 hover:bg-stone-200 rounded-xl cursor-pointer transition-colors"
                >
                  Limpar Formulário
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewProfModalOpen(false);
                      handleClearNewProfForm();
                    }}
                    className="px-4 py-2.5 text-xs font-bold text-[#706B5F] dark:text-zinc-400 hover:bg-[#F8F6F2] rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={Boolean(pixValidationError)}
                    className="px-6 py-2.5 bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
                  >
                    <Check className="w-4 h-4" />
                    Salvar e Ativar Profissional
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Edição Individual de Valores do Plano da Profissional */}
      {editingProfPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#E9E2D7] dark:border-zinc-700 shadow-xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#E9E2D7] dark:border-zinc-700 pb-4">
              <div>
                <span className="text-2xs font-bold uppercase tracking-wider text-[#5A5A40] dark:text-zinc-300">Ajuste Individual de Assinatura</span>
                <h2 className="serif text-xl font-bold text-[#2D2D2A] dark:text-zinc-100">{editingProfPlan.name}</h2>
                <p className="text-xs text-[#706B5F] dark:text-zinc-400">Edite valores específicos e condições sob medida para esta profissional.</p>
              </div>
              <button
                onClick={() => setEditingProfPlan(null)}
                className="p-2 text-[#A09A8E] dark:text-zinc-500 hover:text-[#2D2D2A] dark:hover:text-zinc-100 dark:text-zinc-100 dark:hover:text-zinc-100 dark:text-zinc-100 rounded-xl hover:bg-[#FAF8F5] dark:hover:bg-zinc-800 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfPlan} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Tipo de Plano:</label>
                <select
                  value={profPlanForm.planType}
                  onChange={(e) => {
                    const newPlan = e.target.value as SubscriptionPlanType;
                    const currentPricing = getSaaSPricing();
                    const defaultMonthly = newPlan === 'flex_fee' 
                      ? currentPricing.flexBaseMonthly 
                      : newPlan === 'pro_fixed' 
                        ? currentPricing.proFixedMonthly 
                        : 0;
                    const defaultFee = newPlan === 'flex_fee' ? currentPricing.flexFeePerBooking : 0;
                    setProfPlanForm(prev => ({
                      ...prev,
                      planType: newPlan,
                      planMonthlyPrice: defaultMonthly,
                      feePerBooking: defaultFee
                    }));
                  }}
                  className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border border-[#E9E2D7] dark:border-zinc-700 bg-[#FAF8F5] dark:bg-zinc-800/50 text-[#2D2D2A] dark:text-zinc-100 outline-none"
                >
                  <option value="trial">{getSaaSPricing().trialDays} Dias de Degustação Gratuita (Teste Grátis)</option>
                  <option value="pro_fixed">Plano Pro Fixo (Sem taxa por reserva)</option>
                  <option value="flex_fee">Plano Flex (Mensalidade menor + taxa por atendimento)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">
                    Mensalidade Cobrada (R$):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#706B5F] dark:text-zinc-400">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={profPlanForm.planMonthlyPrice}
                      onChange={(e) => setProfPlanForm({ ...profPlanForm, planMonthlyPrice: Number(e.target.value) })}
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs font-bold rounded-xl border border-[#E9E2D7] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[#2D2D2A] dark:text-zinc-100 outline-none focus:border-[#5A5A40] dark:border-zinc-600"
                      required
                    />
                  </div>
                  <span className="text-3xs text-[#706B5F] dark:text-zinc-400 mt-1 block">
                    Padrão global: R$ {profPlanForm.planType === 'flex_fee' ? getSaaSPricing().flexBaseMonthly.toFixed(2) : getSaaSPricing().proFixedMonthly.toFixed(2)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">
                    Taxa por Reserva Confirmada (R$):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#706B5F] dark:text-zinc-400">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={profPlanForm.feePerBooking}
                      onChange={(e) => setProfPlanForm({ ...profPlanForm, feePerBooking: Number(e.target.value) })}
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs font-bold rounded-xl border border-[#E9E2D7] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[#2D2D2A] dark:text-zinc-100 outline-none focus:border-[#5A5A40] dark:border-zinc-600"
                      required
                    />
                  </div>
                  <span className="text-3xs text-[#706B5F] dark:text-zinc-400 mt-1 block">
                    Padrão Pro: R$ 0,00 | Flex: R$ {getSaaSPricing().flexFeePerBooking.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Ciclo de Cobrança:</label>
                  <select
                    value={profPlanForm.planBillingCycle}
                    onChange={(e) => setProfPlanForm({ ...profPlanForm, planBillingCycle: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border border-[#E9E2D7] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[#2D2D2A] dark:text-zinc-100 outline-none"
                  >
                    <option value="monthly">Mensal</option>
                    <option value="semiannual">Semestral</option>
                    <option value="annual">Anual</option>
                    <option value="bianual">Bianual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Conceder Dias Grátis Extras:</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="90"
                      value={profPlanForm.extraTrialDays}
                      onChange={(e) => setProfPlanForm({ ...profPlanForm, extraTrialDays: Number(e.target.value) })}
                      placeholder="0"
                      className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border border-[#E9E2D7] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[#2D2D2A] dark:text-zinc-100 outline-none focus:border-[#5A5A40] dark:border-zinc-600"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-3xs font-bold text-[#706B5F] dark:text-zinc-400">dias extras</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#E9E2D7] dark:border-zinc-700">
                <button
                  type="button"
                  onClick={handleResetProfPlanToDefault}
                  className="px-3.5 py-2 text-xs font-bold text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:text-zinc-100 bg-stone-100 dark:bg-zinc-800/80 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
                >
                  Usar Preços Padrão
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingProfPlan(null)}
                    className="px-4 py-2 text-xs font-bold text-[#706B5F] dark:text-zinc-400 hover:bg-[#FAF8F5] dark:hover:bg-zinc-800 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    Salvar Valores Desta Profissional
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
