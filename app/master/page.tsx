'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAppStore } from '@/lib/use-app-store';
import { useRouter } from 'next/navigation';
import { 
  Crown, 
  Users, 
  TrendingUp, 
  CalendarCheck, 
  DollarSign, 
  Search, 
  Filter, 
  Plus, 
  KeyRound, 
  ExternalLink, 
  ShieldAlert, 
  AlertCircle,
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Copy, 
  Check, 
  ArrowUpRight,
  BarChart3,
  Sparkles,
  Phone,
  Layers,
  X,
  LogOut,
  Lock,
  Mail,
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldCheck,
  Settings,
  Edit3,
  Sliders,
  Percent,
  Tag
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar 
} from 'recharts';
import { Professional, SubscriptionPlanType, PlanBillingCycle } from '@/types';
import ImageUploadField from '@/components/ImageUploadField';
import { saveSaaSPricing, SaaSPlatformPricing } from '@/lib/plan-utils';
import { 
  validateWhatsAppPhone, 
  isValidCPF, 
  isValidCNPJ, 
  formatCPF, 
  formatCNPJ, 
  validatePixKey,
  formatPixKey,
  BEAUTY_SPECIALTIES 
} from '@/lib/validation-utils';

export default function MasterDashboardPage() {
  const router = useRouter();
  const { 
    professionals, 
    bookings, 
    addProfessional, 
    updateProfessional, 
    setTenantStatus, 
    resetTenantPassword, 
    startImpersonation,
    changeProfessionalPlan,
    isMasterAuthenticated,
    loginMaster,
    logoutMaster,
    checkPrefixAvailability,
    globalPlanPricing,
    updateGlobalPlanPricing,
    updateProfessionalCustomPlan
  } = useAppStore();

  const [masterIdentifier, setMasterIdentifier] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [showMasterPassword, setShowMasterPassword] = useState(false);
  const [masterError, setMasterError] = useState<string | null>(null);
  const [isSubmittingMasterLogin, setIsSubmittingMasterLogin] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'delinquent'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [resetModalTenant, setResetModalTenant] = useState<Professional | null>(null);
  const [tempPassword, setTempPassword] = useState('');
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [prefixError, setPrefixError] = useState<string | null>(null);

  // Estados para Gestão Global de Preços dos Planos
  const [isGlobalPricingModalOpen, setIsGlobalPricingModalOpen] = useState(false);
  const [globalPricingForm, setGlobalPricingForm] = useState({
    proFixedMonthly: globalPlanPricing?.proFixedMonthly ?? 59.90,
    proFixedAnnual: globalPlanPricing?.proFixedAnnual ?? 42.90,
    flexFeeMonthly: globalPlanPricing?.flexFeeMonthly ?? 24.90,
    flexFeeBookingCharge: globalPlanPricing?.flexFeeBookingCharge ?? 0.99,
    trialDays: globalPlanPricing?.trialDays ?? 15
  });
  const [globalSuccessMsg, setGlobalSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (globalPlanPricing) {
      setGlobalPricingForm({
        proFixedMonthly: globalPlanPricing.proFixedMonthly ?? 59.90,
        proFixedAnnual: globalPlanPricing.proFixedAnnual ?? 42.90,
        flexFeeMonthly: globalPlanPricing.flexFeeMonthly ?? 24.90,
        flexFeeBookingCharge: globalPlanPricing.flexFeeBookingCharge ?? 0.99,
        trialDays: globalPlanPricing.trialDays ?? 15
      });
    }
  }, [globalPlanPricing]);

  // Estados para Gestão Individual de Preço da Profissional
  const [editingProfPlan, setEditingProfPlan] = useState<Professional | null>(null);
  const [individualPlanForm, setIndividualPlanForm] = useState<{
    planType: SubscriptionPlanType;
    planMonthlyPrice: number;
    feePerBooking: number;
    planBillingCycle: PlanBillingCycle;
    hasCustomBackgroundAddon: boolean;
  }>({
    planType: 'pro_fixed',
    planMonthlyPrice: 59.90,
    feePerBooking: 0,
    planBillingCycle: 'monthly',
    hasCustomBackgroundAddon: false
  });
  const [individualSuccessMsg, setIndividualSuccessMsg] = useState<string | null>(null);

  const handleOpenIndividualPlanModal = (tenant: Professional) => {
    setEditingProfPlan(tenant);
    setIndividualPlanForm({
      planType: tenant.planType || 'pro_fixed',
      planMonthlyPrice: tenant.planMonthlyPrice !== undefined 
        ? tenant.planMonthlyPrice 
        : (tenant.planType === 'flex_fee' ? (globalPlanPricing?.flexFeeMonthly || 24.90) : (globalPlanPricing?.proFixedMonthly || 59.90)),
      feePerBooking: tenant.feePerBooking !== undefined 
        ? tenant.feePerBooking 
        : (tenant.planType === 'flex_fee' ? (globalPlanPricing?.flexFeeBookingCharge || 0.99) : 0),
      planBillingCycle: tenant.planBillingCycle || 'monthly',
      hasCustomBackgroundAddon: Boolean(tenant.hasCustomBackgroundAddon)
    });
    setIndividualSuccessMsg(null);
  };

  const handleSaveIndividualPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfPlan) return;
    updateProfessionalCustomPlan(editingProfPlan.id, {
      planType: individualPlanForm.planType,
      planMonthlyPrice: Number(individualPlanForm.planMonthlyPrice) || 0,
      feePerBooking: Number(individualPlanForm.feePerBooking) || 0,
      planBillingCycle: individualPlanForm.planBillingCycle,
      hasCustomBackgroundAddon: individualPlanForm.hasCustomBackgroundAddon
    });
    setIndividualSuccessMsg(`Valores do plano de ${editingProfPlan.name} atualizados com sucesso!`);
    setTimeout(() => {
      setIndividualSuccessMsg(null);
      setEditingProfPlan(null);
    }, 1400);
  };

  const handleSaveGlobalPricing = (applyToAllExisting: boolean) => {
    const fullPayload: SaaSPlatformPricing = {
      trialDays: Number(globalPricingForm.trialDays),
      proFixedMonthly: Number(globalPricingForm.proFixedMonthly),
      proFixedAnnual: Number(globalPricingForm.proFixedAnnual),
      proFixedSemiannual: Math.round(Number(globalPricingForm.proFixedMonthly) * 0.85 * 100) / 100,
      proFixedBianual: Math.round(Number(globalPricingForm.proFixedMonthly) * 0.57 * 100) / 100,
      flexBaseMonthly: Number(globalPricingForm.flexFeeMonthly),
      flexFeePerBooking: Number(globalPricingForm.flexFeeBookingCharge),
      flexBaseSemiannual: Math.round(Number(globalPricingForm.flexFeeMonthly) * 0.85 * 100) / 100,
      flexBaseAnnual: Math.round(Number(globalPricingForm.flexFeeMonthly) * 0.72 * 100) / 100,
      flexBaseBianual: Math.round(Number(globalPricingForm.flexFeeMonthly) * 0.57 * 100) / 100,
      singleLayoutPrice: 49.90,
      customLayoutRequestPrice: 149.00,
      autoCalculateDiscounts: true,
      semiannualDiscountPercent: 15,
      annualDiscountPercent: 28,
      bianualDiscountPercent: 43
    };
    saveSaaSPricing(fullPayload);
    updateGlobalPlanPricing(globalPricingForm, applyToAllExisting, fullPayload);
    setGlobalSuccessMsg(
      applyToAllExisting
        ? '✓ Valores globais salvos e aplicados com sucesso a TODAS as profissionais cadastradas!'
        : '✓ Valores padrão globais salvos com sucesso para futuros cadastros!'
    );
    setTimeout(() => {
      setGlobalSuccessMsg(null);
      setIsGlobalPricingModalOpen(false);
    }, 2500);
  };

  // Formulário para novo Tenant
  const [formData, setFormData] = useState({
    name: '', // Nome Completo do Profissional
    spaceName: '', // Nome do Espaço / Estúdio
    slug: '',
    category: 'Manicure & Nail Designer',
    whatsapp: '',
    documentNumber: '',
    documentType: 'cpf' as 'cpf' | 'cnpj',
    pixKey: '',
    pixKeyType: 'telefone' as 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria',
    email: '',
    password: '123456',
    bookingCodePrefix: '',
    planType: 'trial' as SubscriptionPlanType,
    planBillingCycle: 'monthly' as PlanBillingCycle,
    status: 'active' as 'active' | 'inactive' | 'delinquent',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80'
  });

  // Filtros
  const filteredTenants = professionals.filter(p => {
    const contactNumber = p.phone || p.whatsapp || '';
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          contactNumber.includes(searchTerm) || 
                          p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const tenantStatus = p.status || (p.active ? 'active' : 'inactive');
    const matchesStatus = statusFilter === 'all' || tenantStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Métricas do SaaS
  const totalTenants = professionals.length;
  const activeTenants = professionals.filter(p => (p.status || (p.active ? 'active' : 'inactive')) === 'active').length;
  const delinquentTenants = professionals.filter(p => p.status === 'delinquent').length;
  const inactiveTenants = professionals.filter(p => (p.status || (p.active ? 'active' : 'inactive')) === 'inactive').length;

  // Cálculo de MRR (Receita Recorrente Mensal estimada)
  const estimatedMRR = professionals.reduce((acc, p) => {
    const status = p.status || (p.active ? 'active' : 'inactive');
    if (status !== 'active') return acc;
    if (p.planMonthlyPrice) return acc + p.planMonthlyPrice;
    if (p.planType === 'pro_fixed') return acc + 59.90;
    if (p.planType === 'flex_fee') return acc + 24.90;
    return acc;
  }, 0);

  // Total de agendamentos no sistema
  const totalBookingsCount = bookings.length;
  const completedBookingsCount = bookings.filter(b => b.status === 'completed').length;

  // Dados para gráficos de faturamento e volume
  const revenueChartData = [
    { month: 'Mai', mrr: 180, agendamentos: 45 },
    { month: 'Jun', mrr: 240, agendamentos: 62 },
    { month: 'Jul', mrr: 310, agendamentos: 88 },
    { month: 'Ago', mrr: 390, agendamentos: 110 },
    { month: 'Set', mrr: estimatedMRR, agendamentos: totalBookingsCount },
    { month: 'Out (Proj.)', mrr: estimatedMRR * 1.25, agendamentos: Math.round(totalBookingsCount * 1.3) }
  ];

  // Ações de gerenciamento
  const handleOpenResetModal = (tenant: Professional) => {
    setResetModalTenant(tenant);
    setTempPassword(`Bella@${Math.floor(1000 + Math.random() * 9000)}`);
    setCopiedPassword(false);
  };

  const handleConfirmResetPassword = () => {
    if (!resetModalTenant) return;
    resetTenantPassword(resetModalTenant.id, tempPassword);
    alert(`Senha de ${resetModalTenant.name} redefinida com sucesso para: ${tempPassword}`);
    setResetModalTenant(null);
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(tempPassword);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const handleImpersonate = (tenantId: string) => {
    startImpersonation(tenantId);
    router.push('/painel');
  };

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Por favor, informe o Nome Completo da Profissional.');
      return;
    }

    const phoneValidation = validateWhatsAppPhone(formData.whatsapp);
    if (!phoneValidation.isValid) {
      alert(`WhatsApp inválido: ${phoneValidation.message}`);
      return;
    }

    if (formData.documentNumber.trim()) {
      const isDocValid = formData.documentType === 'cpf' 
        ? isValidCPF(formData.documentNumber) 
        : isValidCNPJ(formData.documentNumber);
      if (!isDocValid) {
        alert(`${formData.documentType.toUpperCase()} inválido. Verifique os números digitados.`);
        return;
      }
    }

    if (formData.pixKey.trim()) {
      const pixCheck = validatePixKey(formData.pixKey, formData.pixKeyType);
      if (!pixCheck.isValid) {
        alert(`Chave Pix inválida: ${pixCheck.message}`);
        return;
      }
    }

    const baseName = formData.spaceName.trim() || formData.name.trim();
    const slug = formData.slug || baseName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const cleanPrefix = (formData.bookingCodePrefix || '').replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 3);
    if (cleanPrefix && cleanPrefix.length >= 2) {
      const check = checkPrefixAvailability(cleanPrefix);
      if (!check.available) {
        setPrefixError(`O código/prefixo "${cleanPrefix}" já pertence a ${check.takenBy}. Não é permitido criar um código que outra profissional já tenha.`);
        return;
      }
    }

    const newProf = addProfessional({
      name: formData.spaceName.trim() ? `${formData.spaceName.trim()} (${formData.name.trim()})` : formData.name.trim(),
      professionalName: formData.name.trim(),
      spaceName: formData.spaceName.trim() || undefined,
      slug,
      category: formData.category as any,
      bookingCodePrefix: cleanPrefix || undefined,
      phone: formData.whatsapp,
      whatsapp: formData.whatsapp,
      email: formData.email,
      documentNumber: formData.documentNumber.trim() || undefined,
      documentType: formData.documentType,
      password: formData.password || '123456',
      createdAt: new Date().toISOString(),
      status: formData.status,
      active: formData.status === 'active',
      planType: formData.planType,
      planBillingCycle: formData.planBillingCycle,
      planMonthlyPrice: formData.planType === 'pro_fixed' 
        ? (formData.planBillingCycle === 'annual' ? 42.90 : 59.90) 
        : (formData.planBillingCycle === 'annual' ? 17.90 : 24.90),
      feePerBooking: formData.planType === 'flex_fee' ? 0.99 : 0,
      avatarUrl: formData.photoUrl,
      photoUrl: formData.photoUrl,
      themeColor: 'terracotta',
      requireDeposit: false,
      depositPercentage: 30,
      pixKey: formData.pixKey.trim() || formData.whatsapp,
      pixKeyType: formData.pixKeyType || 'telefone',
      bio: `Atendimento profissional de alta qualidade no ${formData.spaceName.trim() || formData.name.trim()}.`,
      address: 'Espaço de Atendimento',
      cancellationHours: 24,
      cancellationPolicyNotes: 'Avisar com 24h de antecedência em caso de imprevisto.'
    });

    setIsAddModalOpen(false);
    setPrefixError(null);
    // Limpar form
    setFormData({
      name: '',
      spaceName: '',
      slug: '',
      category: 'Manicure & Nail Designer',
      whatsapp: '',
      documentNumber: '',
      documentType: 'cpf',
      pixKey: '',
      pixKeyType: 'telefone',
      email: '',
      password: '123456',
      bookingCodePrefix: '',
      planType: 'trial',
      planBillingCycle: 'monthly',
      status: 'active',
      photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80'
    });
  };

  const handleMasterLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMasterError(null);

    const cleanUser = masterIdentifier.trim();
    const cleanPass = masterPassword.trim();

    if (!cleanUser) {
      setMasterError('Informe o e-mail ou usuário master.');
      return;
    }

    if (!cleanPass) {
      setMasterError('Informe a senha master.');
      return;
    }

    setIsSubmittingMasterLogin(true);
    setTimeout(() => {
      const res = loginMaster(cleanUser, cleanPass);
      setIsSubmittingMasterLogin(false);
      if (!res.success) {
        setMasterError(res.message || 'Credenciais master inválidas. Verifique usuário e senha.');
      } else {
        setMasterPassword('');
        setMasterIdentifier('');
      }
    }, 250);
  };

  // TELA DE LOGIN DO MASTER (SE NÃO AUTENTICADO)
  if (!isMasterAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full mx-auto space-y-6">
          
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Página Inicial
            </button>

            <button
              onClick={() => router.push('/painel')}
              className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
            >
              Painel Profissional →
            </button>
          </div>

          <div className="bg-stone-800/90 rounded-3xl p-8 border border-stone-700 shadow-2xl space-y-6 backdrop-blur-md">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                <Crown className="w-7 h-7" />
              </div>
              <h1 className="serif text-2xl font-bold text-white tracking-tight">
                Painel Master SaaS
              </h1>
              <p className="text-xs text-stone-400 max-w-xs mx-auto">
                Acesso exclusivo para a administração geral da plataforma. Digite suas credenciais para continuar.
              </p>
            </div>

            {masterError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{masterError}</span>
              </div>
            )}

            <form onSubmit={handleMasterLoginSubmit} className="space-y-4">
              {/* Campo E-mail / Usuário */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                  E-mail ou Usuário Master
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500 dark:text-zinc-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={masterIdentifier}
                    onChange={(e) => setMasterIdentifier(e.target.value)}
                    placeholder="secao10@gmail.com ou admin"
                    className="w-full pl-10 pr-4 py-3 bg-stone-900 border border-stone-700 rounded-xl text-white text-sm placeholder:text-stone-500 dark:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent font-medium"
                    autoFocus
                  />
                </div>
              </div>

              {/* Campo Senha Master */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                  Senha Master
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500 dark:text-zinc-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showMasterPassword ? 'text' : 'password'}
                    value={masterPassword}
                    onChange={(e) => setMasterPassword(e.target.value)}
                    placeholder="Digite sua senha master"
                    className="w-full pl-10 pr-11 py-3 bg-stone-900 border border-stone-700 rounded-xl text-white text-sm placeholder:text-stone-500 dark:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMasterPassword(!showMasterPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-500 dark:text-zinc-500 hover:text-stone-300 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showMasterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingMasterLogin}
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 dark:text-zinc-50 font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmittingMasterLogin ? (
                  <>
                    <div className="w-4 h-4 border-2 border-stone-950/40 border-t-stone-950 rounded-full animate-spin" />
                    Autenticando com credenciais...
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4" />
                    Entrar com Credenciais
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-stone-800 dark:text-zinc-200 pb-24">
      {/* Header do Painel Master */}
      <div className="bg-stone-900 text-white border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-amber-500/20 text-amber-400 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1 uppercase tracking-wider">
                  <Crown className="w-3 h-3" /> Master SaaS Admin
                </span>
                <span className="text-xs text-stone-400">Ambiente de Operações & Tenants</span>
                <span className="text-xs bg-stone-800 border border-stone-700 text-stone-300 px-2 py-0.5 rounded-md font-mono">
                  secao10@gmail.com
                </span>
              </div>
              <h1 className="serif text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Painel Master da Plataforma
              </h1>
              <p className="text-sm text-stone-400 mt-1">
                Gestão centralizada de assinaturas, profissionais cadastradas, faturamento e suporte técnico.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsGlobalPricingModalOpen(true)}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer text-sm"
                title="Editar valores dos planos para todos ou padrão global"
              >
                <Sliders className="w-4 h-4" />
                Valores dos Planos (Global)
              </button>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-amber-500 hover:bg-amber-400 text-stone-950 dark:text-zinc-50 font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer text-sm"
              >
                <Plus className="w-4 h-4" />
                Cadastrar Nova Profissional
              </button>

              <button
                onClick={() => logoutMaster()}
                className="bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white px-3.5 py-2.5 rounded-xl border border-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer text-sm font-semibold"
                title="Sair da sessão de Administrador Master"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                Sair do Master
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* Cards de Métricas Principais (Dashboard Financeiro) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          
          {/* Card 1: MRR */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-stone-200 dark:border-zinc-700 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 dark:text-zinc-500 uppercase tracking-wider">MRR Estimado</span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold text-stone-900 dark:text-zinc-100 tracking-tight">
                R$ {estimatedMRR.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-stone-500 dark:text-zinc-500 block mt-1">
                Receita Recorrente Mensal de assinaturas ativas
              </span>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18.4% vs mês anterior</span>
            </div>
          </div>

          {/* Card 2: Profissionais Ativas */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-stone-200 dark:border-zinc-700 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 dark:text-zinc-500 uppercase tracking-wider">Profissionais Ativas</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold text-stone-900 dark:text-zinc-100 tracking-tight">
                {activeTenants} <span className="text-sm font-normal text-stone-500 dark:text-zinc-500">/ {totalTenants}</span>
              </span>
              <span className="text-xs text-stone-500 dark:text-zinc-500 block mt-1">
                {delinquentTenants > 0 ? `${delinquentTenants} inadimplente(s)` : 'Nenhuma inadimplência'}
              </span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-stone-500 dark:text-zinc-500">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{Math.round((activeTenants / Math.max(1, totalTenants)) * 100)}% de retenção da base</span>
            </div>
          </div>

          {/* Card 3: Total de Agendamentos */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-stone-200 dark:border-zinc-700 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 dark:text-zinc-500 uppercase tracking-wider">Agendamentos Totais</span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <CalendarCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold text-stone-900 dark:text-zinc-100 tracking-tight">
                {totalBookingsCount}
              </span>
              <span className="text-xs text-stone-500 dark:text-zinc-500 block mt-1">
                {completedBookingsCount} concluídos com sucesso
              </span>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Alta adesão no WhatsApp</span>
            </div>
          </div>

          {/* Card 4: Ticket Médio & Gestão dos Planos */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-stone-200 dark:border-zinc-700 shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500 dark:text-zinc-500 uppercase tracking-wider">Planos do SaaS</span>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-bold text-stone-900 dark:text-zinc-100 tracking-tight">
                  PRO & Flex
                </span>
                <span className="text-xs text-stone-500 dark:text-zinc-500 block mt-1">
                  PRO: R$ {globalPlanPricing?.proFixedMonthly?.toFixed(2) || '59.90'}/mês • Flex: R$ {globalPlanPricing?.flexFeeMonthly?.toFixed(2) || '24.90'} + R$ {globalPlanPricing?.flexFeeBookingCharge?.toFixed(2) || '0.99'}/reserva
                </span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
              <span className="text-[11px] text-stone-500 dark:text-zinc-500">Trial: {globalPlanPricing?.trialDays || 15} dias</span>
              <button
                onClick={() => setIsGlobalPricingModalOpen(true)}
                className="text-xs font-bold text-purple-700 hover:text-purple-900 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                Alterar Preços Globais
              </button>
            </div>
          </div>
        </div>

        {/* Gráfico Financeiro com Recharts */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-stone-200 dark:border-zinc-700 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-600" />
                Evolução da Receita Recorrente (MRR) & Agendamentos
              </h2>
              <p className="text-xs text-stone-500 dark:text-zinc-500">
                Histórico recente e projeção do faturamento de mensalidades do SaaS
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                <span>MRR (R$)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-stone-400 inline-block"></span>
                <span>Agendamentos</span>
              </div>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} />
                <Tooltip 
                  formatter={(value: any, name: any) => {
                    if (name === 'mrr') return [`R$ ${Number(value).toFixed(2)}`, 'MRR Recorrente'];
                    return [value, 'Agendamentos'];
                  }}
                  contentStyle={{ backgroundColor: '#1C1917', borderRadius: '12px', border: 'none', color: '#fff' }}
                />
                <Area type="monotone" dataKey="mrr" stroke="#d97706" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMrr)" />
                <Bar dataKey="agendamentos" fill="#94A3B8" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gestão Completa de Tenants */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200 dark:border-zinc-700 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-stone-200 dark:border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-zinc-100">
                Gestão de Tenants ({filteredTenants.length} profissionais)
              </h2>
              <p className="text-xs text-stone-500 dark:text-zinc-500">
                Alterne planos, mude status, redefina senhas ou acerte configurações técnicas via Impersonate
              </p>
            </div>

            {/* Barra de Busca e Filtros */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar profissional, whats..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-xs bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-stone-800 dark:text-zinc-200 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500 w-52"
                />
              </div>

              {/* Filtro de Status */}
              <div className="flex items-center bg-stone-100 dark:bg-zinc-800/80 p-0.5 rounded-xl border border-stone-200 dark:border-zinc-700 text-xs font-semibold">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'all' ? 'bg-white dark:bg-zinc-900 text-stone-900 dark:text-zinc-100 shadow-2xs' : 'text-stone-500 dark:text-zinc-500'}`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'active' ? 'bg-white dark:bg-zinc-900 text-emerald-700 shadow-2xs' : 'text-stone-500 dark:text-zinc-500'}`}
                >
                  Ativas
                </button>
                <button
                  onClick={() => setStatusFilter('delinquent')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'delinquent' ? 'bg-white dark:bg-zinc-900 text-amber-700 shadow-2xs' : 'text-stone-500 dark:text-zinc-500'}`}
                >
                  Inadimplentes
                </button>
                <button
                  onClick={() => setStatusFilter('inactive')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'inactive' ? 'bg-white dark:bg-zinc-900 text-rose-700 shadow-2xs' : 'text-stone-500 dark:text-zinc-500'}`}
                >
                  Inativos
                </button>
              </div>
            </div>
          </div>

          {/* Tabela de Tenants */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-zinc-800 text-stone-500 dark:text-zinc-500 font-bold uppercase tracking-wider border-b border-stone-200 dark:border-zinc-700">
                <tr>
                  <th className="py-3.5 px-6">Profissional & Contato</th>
                  <th className="py-3.5 px-6">Plano & Ciclo</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Senha & Acesso</th>
                  <th className="py-3.5 px-6 text-right">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredTenants.map((tenant) => {
                  const currentStatus = tenant.status || (tenant.active ? 'active' : 'inactive');

                  return (
                    <tr key={tenant.id} className="hover:bg-stone-50 dark:bg-zinc-800/75 transition-colors">
                      {/* Profissional */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden relative shrink-0 border border-stone-200 dark:border-zinc-700">
                            <Image
                              src={tenant.avatarUrl || tenant.photoUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80'}
                              alt={tenant.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-stone-900 dark:text-zinc-100 text-sm flex items-center gap-1.5">
                              {tenant.name}
                              <a
                                href={`/${tenant.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-stone-400 hover:text-stone-700 dark:text-zinc-300"
                                title="Abrir agenda pública"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                            <div className="text-stone-500 dark:text-zinc-500 text-[11px]">{tenant.category}</div>
                            <div className="text-stone-400 text-[11px] flex items-center gap-1 mt-0.5">
                              <Phone className="w-2.5 h-2.5" />
                              {tenant.phone || tenant.whatsapp}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Plano & Valores */}
                      <td className="py-4 px-6">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                              tenant.planType === 'pro_fixed' 
                                ? 'bg-purple-50 text-purple-700 border-purple-200' 
                                : tenant.planType === 'flex_fee'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {tenant.planType === 'pro_fixed' ? 'PRO Fixo' : tenant.planType === 'flex_fee' ? 'Flex' : 'Trial'}
                            </span>
                            <span className="text-stone-400 text-[10px]">•</span>
                            <span className="text-[11px] text-stone-500 dark:text-zinc-500 font-medium">
                              {tenant.planBillingCycle === 'annual' ? 'Anual' : 'Mensal'}
                            </span>
                          </div>

                          <div className="text-xs font-bold text-stone-900 dark:text-zinc-100">
                            R$ {tenant.planMonthlyPrice !== undefined ? tenant.planMonthlyPrice.toFixed(2) : '59.90'}/mês
                            {tenant.planType === 'flex_fee' && (
                              <span className="text-stone-500 dark:text-zinc-500 font-normal text-[11px] block">
                                + R$ {tenant.feePerBooking !== undefined ? tenant.feePerBooking.toFixed(2) : '0.99'}/reserva
                              </span>
                            )}
                          </div>

                          {tenant.hasCustomBackgroundAddon && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                              <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                              Fundo Custom Liberado
                            </span>
                          )}

                          <button
                            onClick={() => handleOpenIndividualPlanModal(tenant)}
                            className="mt-1 text-[11px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer w-fit"
                            title="Personalizar plano e valores desta profissional"
                          >
                            <Edit3 className="w-3 h-3" />
                            Editar Plano & Valores
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <select
                          value={currentStatus}
                          onChange={(e) => setTenantStatus(tenant.id, e.target.value as any)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none ${
                            currentStatus === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : currentStatus === 'delinquent'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          <option value="active">🟢 Ativo</option>
                          <option value="delinquent">🟡 Inadimplente</option>
                          <option value="inactive">🔴 Inativo</option>
                        </select>
                        <span className="block text-[10px] text-stone-400 mt-1">
                          {currentStatus === 'active' ? 'Acesso liberado' : currentStatus === 'delinquent' ? 'Cobrança pendente' : 'Suspenso'}
                        </span>
                      </td>

                      {/* Senha & Acesso */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-stone-600 dark:text-zinc-400 bg-stone-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded text-[11px] border border-stone-200 dark:border-zinc-700">
                            {tenant.password || '••••••••'}
                          </span>
                          <button
                            onClick={() => handleOpenResetModal(tenant)}
                            className="text-stone-500 dark:text-zinc-500 hover:text-stone-900 dark:text-zinc-100 p-1 rounded hover:bg-stone-100 dark:bg-zinc-800/80 transition-colors"
                            title="Redefinir senha rapidamente"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Ações Rápidas (Impersonate) */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleImpersonate(tenant.id)}
                            className="bg-stone-900 hover:bg-black text-white px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all text-xs cursor-pointer shadow-2xs"
                            title="Acessar o painel administrativo exatamente como este(a) profissional"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>Acessar Painel</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Cadastro de Nova Profissional */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 dark:border-zinc-700 my-8">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-6">
              <div>
                <h3 className="serif text-xl font-bold text-stone-900 dark:text-zinc-100">Cadastrar Nova Profissional</h3>
                <p className="text-xs text-stone-500 dark:text-zinc-500">Crie a conta, defina o plano e habilite o acesso imediato</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 dark:text-zinc-400 p-1 rounded-full hover:bg-stone-100 dark:bg-zinc-800/80"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-4">
              {/* Nome Completo e Nome do Espaço em campos separados */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Nome Completo da Profissional (PF) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Beatriz Alencar da Silva"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-sm border border-stone-300 dark:border-zinc-600 rounded-xl px-3 py-2 text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Nome do Espaço / Estúdio / Salão
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Studio Bia Nails & Spa"
                    value={formData.spaceName}
                    onChange={(e) => setFormData({ ...formData, spaceName: e.target.value })}
                    className="w-full text-sm border border-stone-300 dark:border-zinc-600 rounded-xl px-3 py-2 text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Slug da Agenda e Categoria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Slug da Agenda (URL do Link)
                  </label>
                  <input
                    type="text"
                    placeholder="studio-bia-nails"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full text-sm border border-stone-300 dark:border-zinc-600 rounded-xl px-3 py-2 text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Especialidade Principal
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full text-sm border border-stone-300 dark:border-zinc-600 rounded-xl px-3 py-2 text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="Manicure & Nail Designer">Manicure & Nail Designer</option>
                    <option value="Estética Facial & Corporal">Estética Facial & Corporal</option>
                    <option value="Cabelereira & Terapeuta Capilar">Cabelereira & Terapeuta Capilar</option>
                    <option value="Lash Designer & Sobrancelhas">Lash Designer & Sobrancelhas</option>
                    <option value="Maquiadora Profissional">Maquiadora Profissional</option>
                    <option value="Podologia & Spa">Podologia & Spa</option>
                    <option value="Barbearia & Barbeiro">Barbearia & Barbeiro</option>
                    <option value="Salão de Beleza">Salão de Beleza Completo</option>
                  </select>
                </div>
              </div>

              {/* WhatsApp e Documento (CPF/CNPJ) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    WhatsApp (com DDD) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 99999-8888"
                    value={formData.whatsapp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                      let formatted = val;
                      if (val.length > 2) formatted = `(${val.slice(0, 2)}) ${val.slice(2)}`;
                      if (val.length > 7) formatted = `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;
                      setFormData({ ...formData, whatsapp: formatted });
                    }}
                    className="w-full text-sm border border-stone-300 dark:border-zinc-600 rounded-xl px-3 py-2 text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                      Documento Oficial ({formData.documentType.toUpperCase()})
                    </label>
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, documentType: 'cpf', documentNumber: '' })}
                        className={`font-semibold cursor-pointer ${formData.documentType === 'cpf' ? 'text-amber-600 dark:text-amber-400 underline' : 'text-stone-400'}`}
                      >
                        CPF
                      </button>
                      <span className="text-stone-300">|</span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, documentType: 'cnpj', documentNumber: '' })}
                        className={`font-semibold cursor-pointer ${formData.documentType === 'cnpj' ? 'text-amber-600 dark:text-amber-400 underline' : 'text-stone-400'}`}
                      >
                        CNPJ
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder={formData.documentType === 'cpf' ? '000.000.000-00' : '00.000.000/0001-00'}
                    value={formData.documentNumber}
                    onChange={(e) => {
                      const formatted = formData.documentType === 'cpf' ? formatCPF(e.target.value) : formatCNPJ(e.target.value);
                      setFormData({ ...formData, documentNumber: formatted });
                    }}
                    className="w-full text-sm border border-stone-300 dark:border-zinc-600 rounded-xl px-3 py-2 text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono text-xs"
                  />
                </div>
              </div>

              {/* Chave Pix para Recebimento de Sinais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Tipo de Chave Pix (Recebimento dos Sinais)
                  </label>
                  <select
                    value={formData.pixKeyType}
                    onChange={(e) => setFormData({ ...formData, pixKeyType: e.target.value as any })}
                    className="w-full text-sm border border-stone-300 dark:border-zinc-600 rounded-xl px-3 py-2 text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="telefone">Telefone (Celular)</option>
                    <option value="cpf">CPF</option>
                    <option value="cnpj">CNPJ</option>
                    <option value="email">E-mail</option>
                    <option value="aleatoria">Chave Aleatória (EVP)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Chave Pix da Profissional
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: (11) 99999-8888 ou chave aleatória"
                    value={formData.pixKey}
                    onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                    className="w-full text-sm border border-stone-300 dark:border-zinc-600 rounded-xl px-3 py-2 text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono text-xs"
                  />
                </div>
              </div>

              {/* E-mail de Acesso e Foto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    E-mail de Login
                  </label>
                  <input
                    type="email"
                    placeholder="prof@exemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full text-sm border border-stone-300 dark:border-zinc-600 rounded-xl px-3 py-2 text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Foto de Perfil / Logo
                  </label>
                  <input
                    type="text"
                    placeholder="URL da foto (opcional)"
                    value={formData.photoUrl}
                    onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                    className="w-full text-sm border border-stone-300 dark:border-zinc-600 rounded-xl px-3 py-2 text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
                  />
                </div>
              </div>

              {/* Configurações de Plano e Acesso */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-stone-100">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Plano Inicial
                  </label>
                  <select
                    value={formData.planType}
                    onChange={(e) => setFormData({ ...formData, planType: e.target.value as any })}
                    className="w-full text-xs font-semibold border border-stone-300 dark:border-zinc-600 rounded-xl px-3 py-2 text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="pro_fixed">PRO Fixo</option>
                    <option value="flex_fee">Flex + Taxa</option>
                    <option value="trial">Testes Grátis</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Faturamento
                  </label>
                  <select
                    value={formData.planBillingCycle}
                    onChange={(e) => setFormData({ ...formData, planBillingCycle: e.target.value as any })}
                    className="w-full text-xs font-semibold border border-stone-300 dark:border-zinc-600 rounded-xl px-3 py-2 text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="monthly">Mensal</option>
                    <option value="annual">Anual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Status Inicial
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full text-xs font-semibold border border-stone-300 dark:border-zinc-600 rounded-xl px-3 py-2 text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="active">Ativo (Liberado)</option>
                    <option value="delinquent">Inadimplente</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
              </div>

              {/* Senha inicial e Prefixo de Código Exclusivo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Senha Inicial de Acesso
                  </label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full font-mono text-xs border border-stone-300 dark:border-zinc-600 rounded-xl px-3 py-2 text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-stone-50 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700"
                  />
                  <p className="text-[11px] text-stone-400 dark:text-zinc-400 mt-1">Padrão da plataforma: 123456</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                      Prefixo de Código (Exclusivo)
                    </label>
                    <span className="text-[10px] text-stone-400">Até 3 letras</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-stone-400 text-xs">
                      #
                    </span>
                    <input
                      type="text"
                      maxLength={3}
                      placeholder="Ex: BEA"
                      value={formData.bookingCodePrefix}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 3);
                        setFormData({ ...formData, bookingCodePrefix: val });
                        setPrefixError(null);
                      }}
                      className="w-full font-mono font-bold text-xs uppercase pl-7 pr-3 py-2 border border-stone-300 dark:border-zinc-600 rounded-xl text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  {/* Validação de prefixo em tempo real */}
                  {formData.bookingCodePrefix && (
                    <div className="mt-1 text-[11px]">
                      {(() => {
                        const check = checkPrefixAvailability(formData.bookingCodePrefix);
                        if (!check.available) {
                          return (
                            <span className="text-rose-600 font-semibold flex items-center gap-1">
                              ❌ Prefixo já em uso por {check.takenBy}!
                            </span>
                          );
                        }
                        return (
                          <span className="text-emerald-600 font-medium flex items-center gap-1">
                            ✓ Disponível (#{formData.bookingCodePrefix}-XXXX)
                          </span>
                        );
                      })()}
                    </div>
                  )}
                  {!formData.bookingCodePrefix && (
                    <p className="text-[11px] text-stone-400 mt-1">Deixe vazio para gerar automaticamente</p>
                  )}
                </div>
              </div>

              {prefixError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{prefixError}</span>
                </div>
              )}

              {/* Botões do Modal com Limpar e Cancelar */}
              <div className="flex items-center justify-between pt-6 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      name: '',
                      spaceName: '',
                      slug: '',
                      category: 'Manicure & Nail Designer',
                      whatsapp: '',
                      documentNumber: '',
                      documentType: 'cpf',
                      pixKey: '',
                      pixKeyType: 'telefone',
                      email: '',
                      password: '123456',
                      bookingCodePrefix: '',
                      planType: 'trial',
                      planBillingCycle: 'monthly',
                      status: 'active',
                      photoUrl: ''
                    });
                  }}
                  className="text-xs text-stone-500 dark:text-zinc-500 hover:text-stone-800 dark:text-zinc-200 font-semibold cursor-pointer underline"
                >
                  Limpar Formulário
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 border border-stone-300 dark:border-zinc-600 rounded-xl text-stone-700 dark:text-zinc-300 text-xs font-semibold hover:bg-stone-50 dark:bg-zinc-800 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-400 text-stone-950 dark:text-zinc-50 px-5 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer transition-colors"
                  >
                    Salvar e Ativar Tenant
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Gestão Global de Preços dos Planos */}
      {isGlobalPricingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-zinc-100 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 dark:border-zinc-800 my-8">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-zinc-800 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="serif text-lg font-bold text-stone-900 dark:text-zinc-100">
                    Valores dos Planos do SaaS (Global)
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-zinc-400">
                    Configure os preços padrão do sistema e escolha aplicar apenas a novos ou a todos.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsGlobalPricingModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 dark:text-zinc-400 p-1 rounded-lg hover:bg-stone-100 dark:bg-zinc-800/80 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {globalSuccessMsg && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{globalSuccessMsg}</span>
              </div>
            )}

            <div className="space-y-6">
              {/* Bloco Plano PRO Fixo */}
              <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-600" />
                    Plano PRO Fixo
                  </span>
                  <span className="text-[11px] text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-full font-semibold">
                    Sem taxas por agendamento
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1">
                      Mensalidade (R$/mês)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">R$</span>
                      <input
                        type="number"
                        step="0.10"
                        min="0"
                        value={globalPricingForm.proFixedMonthly}
                        onChange={(e) => setGlobalPricingForm(prev => ({ ...prev, proFixedMonthly: parseFloat(e.target.value) || 0 }))}
                        className="w-full pl-9 pr-3 py-2 text-sm font-bold border border-stone-300 dark:border-zinc-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white dark:bg-zinc-900"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1">
                      Anual (R$/mês equivalente)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">R$</span>
                      <input
                        type="number"
                        step="0.10"
                        min="0"
                        value={globalPricingForm.proFixedAnnual}
                        onChange={(e) => setGlobalPricingForm(prev => ({ ...prev, proFixedAnnual: parseFloat(e.target.value) || 0 }))}
                        className="w-full pl-9 pr-3 py-2 text-sm font-bold border border-stone-300 dark:border-zinc-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white dark:bg-zinc-900"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloco Plano Flex */}
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Percent className="w-4 h-4 text-blue-600" />
                    Plano Flex + Taxa
                  </span>
                  <span className="text-[11px] text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full font-semibold">
                    Mensalidade baixa + taxa por agendamento
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1">
                      Mensalidade Base (R$/mês)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">R$</span>
                      <input
                        type="number"
                        step="0.10"
                        min="0"
                        value={globalPricingForm.flexFeeMonthly}
                        onChange={(e) => setGlobalPricingForm(prev => ({ ...prev, flexFeeMonthly: parseFloat(e.target.value) || 0 }))}
                        className="w-full pl-9 pr-3 py-2 text-sm font-bold border border-stone-300 dark:border-zinc-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-zinc-900"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1">
                      Taxa por Agendamento Concluído (R$)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">R$</span>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        value={globalPricingForm.flexFeeBookingCharge}
                        onChange={(e) => setGlobalPricingForm(prev => ({ ...prev, flexFeeBookingCharge: parseFloat(e.target.value) || 0 }))}
                        className="w-full pl-9 pr-3 py-2 text-sm font-bold border border-stone-300 dark:border-zinc-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-zinc-900"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dias de Teste Grátis */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-amber-900 block">Dias de Período de Teste (Trial)</span>
                  <span className="text-[11px] text-stone-500 dark:text-zinc-500">Período gratuito padrão para novas profissionais cadastradas</span>
                </div>
                <div className="w-28">
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={globalPricingForm.trialDays}
                    onChange={(e) => setGlobalPricingForm(prev => ({ ...prev, trialDays: parseInt(e.target.value) || 15 }))}
                    className="w-full px-3 py-2 text-sm font-bold border border-stone-300 dark:border-zinc-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white dark:bg-zinc-900 text-center"
                  />
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="pt-4 border-t border-stone-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsGlobalPricingModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 border border-stone-300 dark:border-zinc-700 rounded-xl text-stone-700 dark:text-zinc-300 text-xs font-semibold hover:bg-stone-50 dark:bg-zinc-800 dark:hover:bg-zinc-800 cursor-pointer text-center transition-colors"
                >
                  Fechar
                </button>

                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleSaveGlobalPricing(false)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-stone-800 hover:bg-stone-900 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-100 border border-stone-700 dark:border-zinc-600 text-xs font-bold rounded-xl transition-colors cursor-pointer text-center shadow-xs"
                    title="Salva apenas como padrão para novas profissionais cadastradas a partir de agora"
                  >
                    Salvar para Novos Cadastros
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveGlobalPricing(true)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5"
                    title="Aplica os novos valores a todas as profissionais já cadastradas"
                  >
                    <Check className="w-4 h-4" />
                    Salvar e Aplicar a TODAS
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Gestão Individual de Plano da Profissional */}
      {editingProfPlan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200 dark:border-zinc-700 my-8">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="serif text-lg font-bold text-stone-900 dark:text-zinc-100">
                    Valores do Plano Individual
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-zinc-500">
                    Profissional: <span className="font-bold text-stone-800 dark:text-zinc-200">{editingProfPlan.name}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingProfPlan(null)}
                className="text-stone-400 hover:text-stone-600 dark:text-zinc-400 p-1 rounded-lg hover:bg-stone-100 dark:bg-zinc-800/80 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {individualSuccessMsg && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{individualSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveIndividualPlan} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1">
                  Tipo de Plano
                </label>
                <select
                  value={individualPlanForm.planType}
                  onChange={(e) => {
                    const newType = e.target.value as SubscriptionPlanType;
                    const defaultMonthly = newType === 'pro_fixed' 
                      ? (globalPlanPricing?.proFixedMonthly || 59.90)
                      : newType === 'flex_fee' 
                      ? (globalPlanPricing?.flexFeeMonthly || 24.90)
                      : 0;
                    const defaultFee = newType === 'flex_fee' ? (globalPlanPricing?.flexFeeBookingCharge || 0.99) : 0;
                    setIndividualPlanForm(prev => ({
                      ...prev,
                      planType: newType,
                      planMonthlyPrice: defaultMonthly,
                      feePerBooking: defaultFee
                    }));
                  }}
                  className="w-full p-2.5 text-xs font-bold border border-stone-300 dark:border-zinc-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white dark:bg-zinc-900"
                >
                  <option value="pro_fixed">Plano PRO Fixo (Mensalidade Fixa, Sem Taxas)</option>
                  <option value="flex_fee">Plano Flex (Mensalidade Menor + Taxa por Agendamento)</option>
                  <option value="trial">Período de Testes (Gratuito Temporário)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1">
                    Mensalidade Personalizada (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">R$</span>
                    <input
                      type="number"
                      step="0.10"
                      min="0"
                      value={individualPlanForm.planMonthlyPrice}
                      onChange={(e) => setIndividualPlanForm(prev => ({ ...prev, planMonthlyPrice: parseFloat(e.target.value) || 0 }))}
                      className="w-full pl-9 pr-3 py-2 text-sm font-bold border border-stone-300 dark:border-zinc-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1">
                    Taxa por Agendamento (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">R$</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      value={individualPlanForm.feePerBooking}
                      onChange={(e) => setIndividualPlanForm(prev => ({ ...prev, feePerBooking: parseFloat(e.target.value) || 0 }))}
                      className="w-full pl-9 pr-3 py-2 text-sm font-bold border border-stone-300 dark:border-zinc-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-stone-400 block mt-0.5">Cobrada apenas no plano Flex ou se configurado</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1">
                  Ciclo de Faturamento
                </label>
                <select
                  value={individualPlanForm.planBillingCycle}
                  onChange={(e) => setIndividualPlanForm(prev => ({ ...prev, planBillingCycle: e.target.value as PlanBillingCycle }))}
                  className="w-full p-2.5 text-xs font-bold border border-stone-300 dark:border-zinc-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white dark:bg-zinc-900"
                >
                  <option value="monthly">Faturamento Mensal</option>
                  <option value="annual">Faturamento Anual</option>
                </select>
              </div>

              {/* Add-on de Fundo Customizado */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    Função Adicional: Capa & Fundo Customizado
                  </span>
                  <span className="text-[11px] text-indigo-700/80 block mt-0.5">
                    Permite que a profissional envie papel de parede de fundo e capa da página.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={individualPlanForm.hasCustomBackgroundAddon}
                  onChange={(e) => setIndividualPlanForm(prev => ({ ...prev, hasCustomBackgroundAddon: e.target.checked }))}
                  className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              {/* Botões do Modal */}
              <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    const isFlex = editingProfPlan.planType === 'flex_fee';
                    setIndividualPlanForm({
                      planType: editingProfPlan.planType || 'pro_fixed',
                      planMonthlyPrice: isFlex ? (globalPlanPricing?.flexFeeMonthly || 24.90) : (globalPlanPricing?.proFixedMonthly || 59.90),
                      feePerBooking: isFlex ? (globalPlanPricing?.flexFeeBookingCharge || 0.99) : 0,
                      planBillingCycle: editingProfPlan.planBillingCycle || 'monthly',
                      hasCustomBackgroundAddon: Boolean(editingProfPlan.hasCustomBackgroundAddon)
                    });
                  }}
                  className="text-[11px] text-stone-500 dark:text-zinc-500 hover:text-stone-800 dark:text-zinc-200 font-semibold underline cursor-pointer"
                >
                  Restaurar Padrão Global
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingProfPlan(null)}
                    className="px-4 py-2 border border-stone-300 dark:border-zinc-600 rounded-xl text-stone-700 dark:text-zinc-300 text-xs font-semibold hover:bg-stone-50 dark:bg-zinc-800 cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer transition-colors"
                  >
                    Salvar Valores Desta Profissional
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Reset de Senha */}
      {resetModalTenant && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-stone-200 dark:border-zinc-700">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <h3 className="serif text-lg font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-600" />
                Resetar Senha de {resetModalTenant.name}
              </h3>
              <button
                onClick={() => setResetModalTenant(null)}
                className="text-stone-400 hover:text-stone-600 dark:text-zinc-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-600 dark:text-zinc-400 mb-4">
              Defina uma nova senha ou use a senha gerada aleatoriamente abaixo para enviar à profissional:
            </p>

            <div className="space-y-3 mb-6">
              <div className="relative">
                <input
                  type="text"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  className="w-full font-mono text-sm border-2 border-amber-300 bg-amber-50/50 rounded-xl pl-3 pr-20 py-2.5 text-stone-900 dark:text-zinc-100 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-white dark:bg-zinc-900 hover:bg-stone-100 dark:bg-zinc-800/80 border border-stone-200 dark:border-zinc-700 px-2.5 py-1 rounded-lg font-semibold text-stone-700 dark:text-zinc-300 flex items-center gap-1 cursor-pointer"
                >
                  {copiedPassword ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPassword ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setResetModalTenant(null)}
                className="px-4 py-2 border border-stone-300 dark:border-zinc-600 rounded-xl text-stone-700 dark:text-zinc-300 text-xs font-semibold hover:bg-stone-50 dark:bg-zinc-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmResetPassword}
                className="bg-amber-500 hover:bg-amber-400 text-stone-950 dark:text-zinc-50 px-4 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer transition-colors"
              >
                Confirmar Redefinição
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
