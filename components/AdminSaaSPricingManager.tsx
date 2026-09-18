'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Save, 
  RotateCcw, 
  Check, 
  Sparkles, 
  Percent,
  Sliders,
  Calculator,
  Layers,
  ArrowRight,
  CheckCircle2,
  Settings2,
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Crown, Zap, Gift,
  Palette,
} from 'lucide-react';
import { 
  getSaaSPricing, 
  saveSaaSPricing, 
  SaaSPlatformPricing, 
  DEFAULT_SAAS_PRICING,
  PLAN_CONFIGS
} from '@/lib/plan-utils';
import { useAppStore } from '@/lib/use-app-store';
import { SubscriptionPlanType, PlanBillingCycle } from '@/types';

export default function AdminSaaSPricingManager() {
  const { 
    professionals, 
    updateProfessionalCustomPlan, 
    updateGlobalPlanPricing 
  } = useAppStore();

  const [activeSubTab, setActiveSubTab] = useState<'global' | 'individual'>('global');
  const [pricing, setPricing] = useState<SaaSPlatformPricing>(() => getSaaSPricing());
  const [savedSnapshot, setSavedSnapshot] = useState<SaaSPlatformPricing>(() => getSaaSPricing());
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Modo: Automático por porcentagem OU Personalização Livre / Critérios Próprios
  const [autoCalc, setAutoCalc] = useState<boolean>(pricing.autoCalculateDiscounts !== false);

  // Porcentagens customizáveis de desconto
  const [semiPct, setSemiPct] = useState<number>(pricing.semiannualDiscountPercent ?? 15);
  const [annPct, setAnnPct] = useState<number>(pricing.annualDiscountPercent ?? 28);
  const [biPct, setBiPct] = useState<number>(pricing.bianualDiscountPercent ?? 43);

  // Estado local para edição individual rápida na aba "Por Profissional"
  const [profEdits, setProfEdits] = useState<Record<string, {
    planType: SubscriptionPlanType;
    planMonthlyPrice: number;
    feePerBooking: number;
    planBillingCycle: PlanBillingCycle;
    customTrialDaysExtended?: number;
  }>>(() => {
    const initial: Record<string, any> = {};
    for (const p of professionals) {
      const currentPricing = getSaaSPricing();
      const defaultMonthly = p.planType === 'flex_fee' ? currentPricing.flexBaseMonthly : currentPricing.proFixedMonthly;
      const defaultFee = p.planType === 'flex_fee' ? currentPricing.flexFeePerBooking : 0;
      initial[p.id] = {
        planType: p.planType || 'trial',
        planMonthlyPrice: p.planMonthlyPrice !== undefined ? p.planMonthlyPrice : defaultMonthly,
        feePerBooking: p.feePerBooking !== undefined ? p.feePerBooking : defaultFee,
        planBillingCycle: p.planBillingCycle || 'monthly'
      };
    }
    return initial;
  });

  // Função para recalcular os equivalentes com base no mensal e nas porcentagens
  const recalculateFromMonthly = (monthly: number, sPct: number, aPct: number, bPct: number) => {
    const sEquiv = Number((monthly * (1 - sPct / 100)).toFixed(2));
    const aEquiv = Number((monthly * (1 - aPct / 100)).toFixed(2));
    const bEquiv = Number((monthly * (1 - bPct / 100)).toFixed(2));
    return { sEquiv, aEquiv, bEquiv };
  };

  // Manipulador quando o valor mensal muda
  const handleMonthlyChange = (newMonthly: number) => {
    if (autoCalc) {
      const { sEquiv, aEquiv, bEquiv } = recalculateFromMonthly(newMonthly, semiPct, annPct, biPct);
      setPricing(prev => ({
        ...prev,
        proFixedMonthly: newMonthly,
        proFixedSemiannual: sEquiv,
        proFixedAnnual: aEquiv,
        proFixedBianual: bEquiv,
        autoCalculateDiscounts: true,
        semiannualDiscountPercent: semiPct,
        annualDiscountPercent: annPct,
        bianualDiscountPercent: biPct
      }));
    } else {
      setPricing(prev => ({
        ...prev,
        proFixedMonthly: newMonthly
      }));
    }
  };

  // Manipulador de porcentagens
  const handleSemiPctChange = (newPct: number) => {
    setSemiPct(newPct);
    if (autoCalc) {
      const sEquiv = Number((pricing.proFixedMonthly * (1 - newPct / 100)).toFixed(2));
      setPricing(prev => ({
        ...prev,
        proFixedSemiannual: sEquiv,
        semiannualDiscountPercent: newPct
      }));
    }
  };

  const handleAnnPctChange = (newPct: number) => {
    setAnnPct(newPct);
    if (autoCalc) {
      const aEquiv = Number((pricing.proFixedMonthly * (1 - newPct / 100)).toFixed(2));
      setPricing(prev => ({
        ...prev,
        proFixedAnnual: aEquiv,
        annualDiscountPercent: newPct
      }));
    }
  };

  const handleBiPctChange = (newPct: number) => {
    setBiPct(newPct);
    if (autoCalc) {
      const bEquiv = Number((pricing.proFixedMonthly * (1 - newPct / 100)).toFixed(2));
      setPricing(prev => ({
        ...prev,
        proFixedBianual: bEquiv,
        bianualDiscountPercent: newPct
      }));
    }
  };

  // Campo genérico
  const handleGenericChange = (field: keyof SaaSPlatformPricing, value: number) => {
    setPricing(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleToggleAutoCalc = (enabled: boolean) => {
    setAutoCalc(enabled);
    if (enabled) {
      const { sEquiv, aEquiv, bEquiv } = recalculateFromMonthly(pricing.proFixedMonthly, semiPct, annPct, biPct);
      setPricing(prev => ({
        ...prev,
        autoCalculateDiscounts: true,
        semiannualDiscountPercent: semiPct,
        annualDiscountPercent: annPct,
        bianualDiscountPercent: biPct,
        proFixedSemiannual: sEquiv,
        proFixedAnnual: aEquiv,
        proFixedBianual: bEquiv
      }));
    } else {
      setPricing(prev => ({
        ...prev,
        autoCalculateDiscounts: false
      }));
    }
  };

  // Reajuste em Massa / Lote (+5%, +10%, +15%, -10%)
  const handleMassPercentageAdjust = (pct: number) => {
    const factor = 1 + pct / 100;
    const newProFixed = Number((pricing.proFixedMonthly * factor).toFixed(2));
    const newFlexBase = Number((pricing.flexBaseMonthly * factor).toFixed(2));
    const newFlexFee = Number((pricing.flexFeePerBooking * factor).toFixed(2));
    
    const { sEquiv, aEquiv, bEquiv } = recalculateFromMonthly(newProFixed, semiPct, annPct, biPct);
    
    setPricing(prev => ({
      ...prev,
      proFixedMonthly: newProFixed,
      proFixedSemiannual: sEquiv,
      proFixedAnnual: aEquiv,
      proFixedBianual: bEquiv,
      flexBaseMonthly: newFlexBase,
      flexFeePerBooking: newFlexFee
    }));

    setSaveSuccess(`Reajuste de ${pct > 0 ? `+${pct}%` : `${pct}%`} simulado com sucesso. Clique em "Salvar Novos Valores" para oficializar.`);
    setTimeout(() => setSaveSuccess(null), 4000);
  };

  // Salvar valores globais da plataforma
  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const payload: SaaSPlatformPricing = {
      ...pricing,
      autoCalculateDiscounts: autoCalc,
      semiannualDiscountPercent: semiPct,
      annualDiscountPercent: annPct,
      bianualDiscountPercent: biPct
    };
    saveSaaSPricing(payload);
    setSavedSnapshot(payload);
    
    updateGlobalPlanPricing({
      trialDays: pricing.trialDays,
      proFixedMonthly: pricing.proFixedMonthly,
      proFixedAnnual: pricing.proFixedAnnual,
      flexFeeMonthly: pricing.flexBaseMonthly,
      flexFeeBookingCharge: pricing.flexFeePerBooking
    }, false);

    setSaveSuccess(`✓ Salvo com sucesso! Teste Grátis: ${pricing.trialDays} dias | Pro Fixo: R$ ${pricing.proFixedMonthly.toFixed(2)}/mês | Flex: R$ ${pricing.flexBaseMonthly.toFixed(2)}/mês + R$ ${pricing.flexFeePerBooking.toFixed(2)}/reserva.`);
    setTimeout(() => setSaveSuccess(null), 6000);
  };

  // Aplicar valores globais atualizados a todos os profissionais existentes (Em Conjunto)
  const handleApplyToAllProfessionalsInBulk = () => {
    const payload: SaaSPlatformPricing = {
      ...pricing,
      autoCalculateDiscounts: autoCalc,
      semiannualDiscountPercent: semiPct,
      annualDiscountPercent: annPct,
      bianualDiscountPercent: biPct
    };
    saveSaaSPricing(payload);
    setSavedSnapshot(payload);

    updateGlobalPlanPricing({
      trialDays: pricing.trialDays,
      proFixedMonthly: pricing.proFixedMonthly,
      proFixedAnnual: pricing.proFixedAnnual,
      flexFeeMonthly: pricing.flexBaseMonthly,
      flexFeeBookingCharge: pricing.flexFeePerBooking
    }, true, payload);

    // Sincroniza também o estado local profEdits de todas as profissionais
    setProfEdits(prev => {
      const next = { ...prev };
      professionals.forEach(p => {
        const cycle = p.planBillingCycle || 'monthly';
        let price = pricing.proFixedMonthly;
        if (p.planType === 'pro_fixed') {
          price = cycle === 'bianual'
            ? pricing.proFixedMonthly * 0.57
            : cycle === 'annual'
              ? pricing.proFixedAnnual
              : cycle === 'semiannual'
                ? pricing.proFixedMonthly * 0.85
                : pricing.proFixedMonthly;
        } else if (p.planType === 'flex_fee') {
          price = cycle === 'bianual'
            ? pricing.flexBaseMonthly * 0.57
            : cycle === 'annual'
              ? pricing.flexBaseMonthly * 0.72
              : cycle === 'semiannual'
                ? pricing.flexBaseMonthly * 0.85
                : pricing.flexBaseMonthly;
        }
        next[p.id] = {
          planType: p.planType || 'trial',
          planMonthlyPrice: Math.round(price * 100) / 100,
          feePerBooking: p.planType === 'flex_fee' ? pricing.flexFeePerBooking : 0,
          planBillingCycle: cycle
        };
      });
      return next;
    });

    setSaveSuccess(`✓ Salvo e Aplicado a Todas! Novos preços e ${pricing.trialDays} dias de teste aplicados a todas as ${professionals.length} profissionais cadastradas.`);
    setTimeout(() => setSaveSuccess(null), 7000);
  };

  const handleResetDefaults = () => {
    setPricing(DEFAULT_SAAS_PRICING);
    setSavedSnapshot(DEFAULT_SAAS_PRICING);
    setAutoCalc(true);
    setSemiPct(15);
    setAnnPct(28);
    setBiPct(43);
    saveSaaSPricing(DEFAULT_SAAS_PRICING);
    updateGlobalPlanPricing({
      trialDays: DEFAULT_SAAS_PRICING.trialDays,
      proFixedMonthly: DEFAULT_SAAS_PRICING.proFixedMonthly,
      proFixedAnnual: DEFAULT_SAAS_PRICING.proFixedAnnual,
      flexFeeMonthly: DEFAULT_SAAS_PRICING.flexBaseMonthly,
      flexFeeBookingCharge: DEFAULT_SAAS_PRICING.flexFeePerBooking
    }, false);
    setSaveSuccess(`✓ Valores restaurados para os padrões originais (${DEFAULT_SAAS_PRICING.trialDays} dias teste, R$ ${DEFAULT_SAAS_PRICING.proFixedMonthly.toFixed(2).replace('.', ',')} Pro, R$ ${DEFAULT_SAAS_PRICING.flexBaseMonthly.toFixed(2).replace('.', ',')} Flex)!`);
    setTimeout(() => setSaveSuccess(null), 4000);
  };

  // Salvar valores individuais de um profissional específico
  const handleSaveIndividualProf = (profId: string) => {
    const edit = profEdits[profId];
    if (!edit) return;

    updateProfessionalCustomPlan(profId, {
        customTrialDaysExtended: edit.customTrialDaysExtended,
      planType: edit.planType,
      planMonthlyPrice: Number(edit.planMonthlyPrice),
      feePerBooking: Number(edit.feePerBooking),
      planBillingCycle: edit.planBillingCycle
    });

    const prof = professionals.find(p => p.id === profId);
    setSaveSuccess(`✓ Valores personalizados de "${prof?.name || 'Profissional'}" salvos com sucesso!`);
    setTimeout(() => setSaveSuccess(null), 4000);
  };

  // Restaurar profissional para o padrão global
  const handleResetIndividualToGlobal = (profId: string) => {
    const edit = profEdits[profId];
    const defaultMonthly = edit?.planType === 'flex_fee' ? pricing.flexBaseMonthly : pricing.proFixedMonthly;
    const defaultFee = edit?.planType === 'flex_fee' ? pricing.flexFeePerBooking : 0;

    setProfEdits(prev => ({
      ...prev,
      [profId]: {
        ...prev[profId],
        planMonthlyPrice: defaultMonthly,
        feePerBooking: defaultFee
      }
    }));

    updateProfessionalCustomPlan(profId, {
      planMonthlyPrice: defaultMonthly,
      feePerBooking: defaultFee
    });

    const prof = professionals.find(p => p.id === profId);
    setSaveSuccess(`✓ "${prof?.name || 'Profissional'}" restaurado para os valores padrão da plataforma!`);
    setTimeout(() => setSaveSuccess(null), 3500);
  };

  return (
    <div className="space-y-6">
      
      {/* Banner de Sucesso */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Navegação entre Edição Em Conjunto vs. Individual */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 sm:p-4 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-[#FAF8F5] dark:bg-zinc-800/50 rounded-xl border border-[#E9E2D7] dark:border-zinc-700">
          <button
            type="button"
            onClick={() => setActiveSubTab('global')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'global'
                ? 'bg-[#5A5A40] dark:bg-zinc-700 text-white shadow-2xs'
                : 'text-[#706B5F] dark:text-zinc-300 hover:text-[#2D2D2A] dark:hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Valores Globais dos Planos (Em Conjunto)
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('individual')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'individual'
                ? 'bg-[#5A5A40] dark:bg-zinc-700 text-white shadow-2xs'
                : 'text-[#706B5F] dark:text-zinc-300 hover:text-[#2D2D2A] dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Valores por Profissional (Individualmente)
            <span className="px-1.5 py-0.2 bg-white dark:bg-zinc-900/40 rounded-full text-2xs font-bold ml-1 text-stone-700 dark:text-zinc-200">
              {professionals.length}
            </span>
          </button>
        </div>

        {activeSubTab === 'global' && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleApplyToAllProfessionalsInBulk}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Salva os valores e aplica imediatamente a todas as profissionais cadastradas"
            >
              <Zap className="w-3.5 h-3.5 text-white fill-white" />
              Salvar e Aplicar a Todas
            </button>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3 py-2 bg-stone-100 dark:bg-zinc-800/80 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-200 border border-stone-300 dark:border-zinc-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar Padrões
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:text-zinc-50 border border-stone-700 dark:border-zinc-600 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Salva os valores apenas como padrão para novos cadastros"
            >
              <Save className="w-4 h-4" />
              Salvar para Novos Cadastros
            </button>
          </div>
        )}
      </div>

      {/* PAINEL DE VALORES SALVOS E EM VIGOR NO SISTEMA (Exibição Visual Constante) */}
      <div className="bg-[#FAF8F5] dark:bg-zinc-800/50 p-4 sm:p-5 rounded-3xl border border-[#E9E2D7] dark:border-zinc-700 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E9E2D7] dark:border-zinc-700 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#5A5A40] dark:text-zinc-300">
              Valores Salvos &amp; em Vigor no Sistema
            </span>
          </div>
          <span className="text-2xs font-semibold text-[#706B5F] dark:text-zinc-400">
            Confirmados na plataforma para novas assinaturas e profissionais ativos
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-900/20 rounded-3xl border border-emerald-200/60 dark:border-emerald-800/50 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Gift className="w-16 h-16 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="inline-block px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-[10px] font-black uppercase tracking-widest rounded-lg mb-3">
              Período de Teste
            </span>
            <strong className="text-3xl font-extrabold text-emerald-950 dark:text-emerald-50 block font-mono tracking-tighter">
              {savedSnapshot.trialDays} <span className="text-base font-bold text-emerald-700 dark:text-emerald-400 tracking-normal">dias</span>
            </strong>
            <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-2 font-medium">Degustação 100% gratuita para novos cadastros.</p>
          </div>

          <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-900/20 rounded-3xl border border-amber-200/60 dark:border-amber-800/50 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Crown className="w-16 h-16 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="inline-block px-2.5 py-1 bg-amber-200 dark:bg-amber-900/50 text-amber-900 dark:text-amber-300 text-[10px] font-black uppercase tracking-widest rounded-lg mb-3">
              Pro Fixo (Mensal)
            </span>
            <strong className="text-3xl font-extrabold text-amber-950 dark:text-amber-50 block font-mono tracking-tighter">
              <span className="text-base font-bold text-amber-700 dark:text-amber-400 tracking-normal mr-1">R$</span>
              {savedSnapshot.proFixedMonthly.toFixed(2)}
            </strong>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-2 font-medium">Acesso ilimitado, sem taxas por agendamento.</p>
          </div>

          <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-900/20 rounded-3xl border border-blue-200/60 dark:border-blue-800/50 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap className="w-16 h-16 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="inline-block px-2.5 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-[10px] font-black uppercase tracking-widest rounded-lg mb-3">
              Plano Flex (Híbrido)
            </span>
            <strong className="text-3xl font-extrabold text-blue-950 dark:text-blue-50 block font-mono tracking-tighter">
              <span className="text-base font-bold text-blue-700 dark:text-blue-400 tracking-normal mr-1">R$</span>
              {savedSnapshot.flexBaseMonthly.toFixed(2)}
            </strong>
            <p className="text-xs text-blue-800/80 dark:text-blue-300/80 mt-2 font-medium">
              + <strong className="text-blue-900 dark:text-blue-200">R$ {savedSnapshot.flexFeePerBooking.toFixed(2)}</strong> por cada reserva.
            </p>
          </div>

          <div className="p-5 bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950/40 dark:to-fuchsia-900/20 rounded-3xl border border-purple-200/60 dark:border-purple-800/50 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Palette className="w-16 h-16 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="inline-block px-2.5 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 text-[10px] font-black uppercase tracking-widest rounded-lg mb-3">
              Vitrines & Extras
            </span>
            <strong className="text-3xl font-extrabold text-purple-950 dark:text-purple-50 block font-mono tracking-tighter">
              <span className="text-base font-bold text-purple-700 dark:text-purple-400 tracking-normal mr-1">R$</span>
              {savedSnapshot.singleLayoutPrice.toFixed(2)}
            </strong>
            <p className="text-xs text-purple-800/80 dark:text-purple-300/80 mt-2 font-medium">Preço de venda avulsa por cada tema premium.</p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: VALORES GLOBAIS DOS PLANOS (EM CONJUNTO) */}
      {/* ========================================================================= */}
      {activeSubTab === 'global' && (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Bloco Principal */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-[#E9E2D7] dark:border-zinc-700 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E9E2D7] dark:border-zinc-700 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-[#EEF1EB] rounded-xl text-[#5A5A40] dark:text-zinc-300">
                    <Sliders className="w-5 h-5" />
                  </span>
                  <h2 className="serif text-xl sm:text-2xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                    Tabela de Preços e Condições dos Planos SaaS
                  </h2>
                </div>
                <p className="text-[#706B5F] dark:text-zinc-400 text-xs sm:text-sm mt-1">
                  Altere as mensalidades oficiais da plataforma, configure descontos automáticos ou defina preços arbitrários livres.
                </p>
              </div>

              {/* Barra de Reajuste em Massa / Ajuste em Lote */}
              <div className="bg-[#FAF8F5] dark:bg-zinc-800/50 p-2 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 flex flex-wrap items-center gap-1.5">
                <span className="text-2xs font-bold text-[#706B5F] dark:text-zinc-400 uppercase px-1">Reajuste em Massa:</span>
                <button
                  type="button"
                  onClick={() => handleMassPercentageAdjust(5)}
                  className="px-2 py-1 bg-white dark:bg-zinc-900 hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-2xs font-bold transition-colors cursor-pointer"
                >
                  +5%
                </button>
                <button
                  type="button"
                  onClick={() => handleMassPercentageAdjust(10)}
                  className="px-2 py-1 bg-white dark:bg-zinc-900 hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-2xs font-bold transition-colors cursor-pointer"
                >
                  +10%
                </button>
                <button
                  type="button"
                  onClick={() => handleMassPercentageAdjust(15)}
                  className="px-2 py-1 bg-white dark:bg-zinc-900 hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-2xs font-bold transition-colors cursor-pointer"
                >
                  +15%
                </button>
                <button
                  type="button"
                  onClick={() => handleMassPercentageAdjust(-10)}
                  className="px-2 py-1 bg-white dark:bg-zinc-900 hover:bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-2xs font-bold transition-colors cursor-pointer"
                >
                  -10%
                </button>
              </div>
            </div>

            {/* Seletor de Modo de Cálculo */}
            <div className="p-4 bg-[#FAF8F5] dark:bg-zinc-800/50 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-white dark:bg-zinc-900 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-[#5A5A40] dark:text-zinc-300">
                  <Settings2 className="w-4 h-4" />
                </span>
                <div>
                  <span className="text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 block">
                    Modo de Formação de Preços:
                  </span>
                  <span className="text-[11px] text-[#706B5F] dark:text-zinc-400">
                    {autoCalc 
                      ? 'Cálculo Automático Ativo: Semestral e Anual mudam de acordo com as porcentagens selecionadas.' 
                      : 'Personalização Livre Ativa: Você digita qualquer valor que desejar para cada plano/ciclo.'}
                  </span>
                </div>
              </div>

              <div className="flex items-center bg-white dark:bg-zinc-900 p-1 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleAutoCalc(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    autoCalc ? 'bg-[#5A5A40] dark:bg-zinc-700 text-white shadow-2xs' : 'text-[#706B5F] dark:text-zinc-300 hover:text-[#2D2D2A] dark:hover:text-white'
                  }`}
                >
                  ⚡ Automático por Porcentagem
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleAutoCalc(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    !autoCalc ? 'bg-[#5A5A40] dark:bg-zinc-700 text-white shadow-2xs' : 'text-[#706B5F] dark:text-zinc-300 hover:text-[#2D2D2A] dark:hover:text-white'
                  }`}
                >
                  ✏️ Personalizar Livremente
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* CARD 1: PLANO TESTE GRÁTIS */}
              <div className="bg-[#FAF8F5] dark:bg-zinc-800/50 p-5 sm:p-6 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#5A5A40] dark:text-zinc-300 flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-[#5A5A40] dark:text-zinc-300" />
                    Plano de Entrada: Degustação Grátis
                  </span>
                  <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Automático no Cadastro
                  </span>
                </div>

                <p className="text-xs text-[#706B5F] dark:text-zinc-400 leading-relaxed">
                  Qualquer profissional ou barbeiro recém-cadastrado tem acesso gratuito e irrestrito durante o período abaixo.
                </p>

                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1.5">
                    Duração do Período de Teste Grátis (Dias):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="90"
                      step="1"
                      value={pricing.trialDays}
                      onChange={(e) => handleGenericChange('trialDays', Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-[#E9E2D7] dark:border-zinc-700 rounded-xl text-sm font-bold text-[#2D2D2A] dark:text-zinc-100 outline-none focus:ring-2 focus:ring-[#5A5A40] dark:ring-zinc-600"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#706B5F] dark:text-zinc-400 font-semibold">
                      dias corridos
                    </span>
                  </div>
                </div>
              </div>

              {/* CARD 2: PLANO PRO FIXO COM CÁLCULO DE PORCENTAGENS */}
              <div className="bg-white dark:bg-zinc-900 p-5 sm:p-6 rounded-2xl border-2 border-[#5A5A40] dark:border-zinc-600/30 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#5A5A40] dark:text-zinc-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#5A5A40] dark:text-zinc-300" />
                    Plano Pro Fixo (Sem Taxas por Reserva)
                  </span>
                  <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-[#EEF1EB] text-[#5A5A40] dark:text-zinc-300">
                    Mais Escolhido
                  </span>
                </div>

                <p className="text-xs text-[#706B5F] dark:text-zinc-400 leading-relaxed">
                  Mensalidade fixa com agendamentos ilimitados, lembretes automáticos no WhatsApp e sem nenhuma taxa por cliente atendido.
                </p>

                {/* Ciclo Mensal */}
                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1.5">
                    Mensalidade Padrão Pro Fixo (R$/mês):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#706B5F] dark:text-zinc-400">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={pricing.proFixedMonthly}
                      onChange={(e) => handleMonthlyChange(Number(e.target.value))}
                      className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-[#E9E2D7] dark:border-zinc-700 rounded-xl text-sm font-bold text-[#2D2D2A] dark:text-zinc-100 outline-none focus:ring-2 focus:ring-[#5A5A40] dark:ring-zinc-600"
                      required
                    />
                  </div>
                </div>

                {/* Ciclo Semestral */}
                <div className="p-3 bg-[#FAF8F5] dark:bg-zinc-800/50 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#2D2D2A] dark:text-zinc-100">Ciclo Semestral:</span>
                    {autoCalc && (
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-2xs text-[#706B5F] dark:text-zinc-400">Desconto:</span>
                        <input
                          type="number"
                          min="0"
                          max="90"
                          value={semiPct}
                          onChange={(e) => handleSemiPctChange(Number(e.target.value))}
                          className="w-12 px-1.5 py-0.5 text-center text-xs font-bold border border-[#E9E2D7] dark:border-zinc-700 rounded bg-white dark:bg-zinc-900"
                        />
                        <span className="text-xs font-bold">%</span>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#706B5F] dark:text-zinc-400">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={pricing.proFixedSemiannual}
                      disabled={autoCalc}
                      onChange={(e) => handleGenericChange('proFixedSemiannual', Number(e.target.value))}
                      className="w-full pl-9 pr-14 py-2 bg-white dark:bg-zinc-900 border border-[#E9E2D7] dark:border-zinc-700 rounded-lg text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 outline-none disabled:bg-stone-50 dark:bg-zinc-800"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-2xs text-[#706B5F] dark:text-zinc-400">/mês equiv.</span>
                  </div>
                </div>

                {/* Ciclo Anual */}
                <div className="p-3 bg-[#FAF8F5] dark:bg-zinc-800/50 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#2D2D2A] dark:text-zinc-100">Ciclo Anual:</span>
                    {autoCalc && (
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-2xs text-[#706B5F] dark:text-zinc-400">Desconto:</span>
                        <input
                          type="number"
                          min="0"
                          max="90"
                          value={annPct}
                          onChange={(e) => handleAnnPctChange(Number(e.target.value))}
                          className="w-12 px-1.5 py-0.5 text-center text-xs font-bold border border-[#E9E2D7] dark:border-zinc-700 rounded bg-white dark:bg-zinc-900"
                        />
                        <span className="text-xs font-bold">%</span>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#706B5F] dark:text-zinc-400">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={pricing.proFixedAnnual}
                      disabled={autoCalc}
                      onChange={(e) => handleGenericChange('proFixedAnnual', Number(e.target.value))}
                      className="w-full pl-9 pr-14 py-2 bg-white dark:bg-zinc-900 border border-[#E9E2D7] dark:border-zinc-700 rounded-lg text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 outline-none disabled:bg-stone-50 dark:bg-zinc-800"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-2xs text-[#706B5F] dark:text-zinc-400">/mês equiv.</span>
                  </div>
                </div>

                {/* Ciclo Bianual */}
                <div className="p-3 bg-[#FAF8F5] dark:bg-zinc-800/50 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#2D2D2A] dark:text-zinc-100">Ciclo Bianual (2 Anos):</span>
                    {autoCalc && (
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-2xs text-[#706B5F] dark:text-zinc-400">Desconto:</span>
                        <input
                          type="number"
                          min="0"
                          max="90"
                          value={biPct}
                          onChange={(e) => handleBiPctChange(Number(e.target.value))}
                          className="w-12 px-1.5 py-0.5 text-center text-xs font-bold border border-[#E9E2D7] dark:border-zinc-700 rounded bg-white dark:bg-zinc-900"
                        />
                        <span className="text-xs font-bold">%</span>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#706B5F] dark:text-zinc-400">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={pricing.proFixedBianual}
                      disabled={autoCalc}
                      onChange={(e) => handleGenericChange('proFixedBianual', Number(e.target.value))}
                      className="w-full pl-9 pr-14 py-2 bg-white dark:bg-zinc-900 border border-[#E9E2D7] dark:border-zinc-700 rounded-lg text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 outline-none disabled:bg-stone-50 dark:bg-zinc-800"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-2xs text-[#706B5F] dark:text-zinc-400">/mês equiv.</span>
                  </div>
                </div>
              </div>

              {/* CARD 3: PLANO FLEX (TAXA POR CLIENTE) */}
              <div className="bg-[#FAF8F5] dark:bg-zinc-800/50 p-5 sm:p-6 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#D4A373] flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-[#D4A373]" />
                    Plano Flex (Mensalidade Reduzida + Taxa)
                  </span>
                  <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                    Ideal para Iniciantes
                  </span>
                </div>

                <p className="text-xs text-[#706B5F] dark:text-zinc-400 leading-relaxed">
                  Perfeito para quem está começando na profissão e quer pagar pouco fixo, remunerando a plataforma apenas por cada atendimento agendado.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1.5">
                      Mensalidade Base (R$):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#706B5F] dark:text-zinc-400">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={pricing.flexBaseMonthly}
                        onChange={(e) => handleGenericChange('flexBaseMonthly', Number(e.target.value))}
                        className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-zinc-900 border border-[#E9E2D7] dark:border-zinc-700 rounded-xl text-sm font-bold text-[#2D2D2A] dark:text-zinc-100 outline-none focus:ring-2 focus:ring-[#D4A373]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1.5">
                      Taxa por Reserva (R$):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#706B5F] dark:text-zinc-400">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={pricing.flexFeePerBooking}
                        onChange={(e) => handleGenericChange('flexFeePerBooking', Number(e.target.value))}
                        className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-zinc-900 border border-[#E9E2D7] dark:border-zinc-700 rounded-xl text-sm font-bold text-[#2D2D2A] dark:text-zinc-100 outline-none focus:ring-2 focus:ring-[#D4A373]"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-xs text-[#706B5F] dark:text-zinc-400">
                  Exemplo: Com 40 clientes no mês = R$ {pricing.flexBaseMonthly.toFixed(2)} + (40 × R$ {pricing.flexFeePerBooking.toFixed(2)}) = <strong>R$ {(pricing.flexBaseMonthly + 40 * pricing.flexFeePerBooking).toFixed(2)}</strong> faturados pela plataforma.
                </div>
              </div>

              {/* CARD 4: VITRINES & ADICIONAIS */}
              <div className="bg-[#FAF8F5] dark:bg-zinc-800/50 p-5 sm:p-6 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-600" />
                    Vitrines & Layouts Visuais Exclusivos
                  </span>
                  <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                    Venda Avulsa
                  </span>
                </div>

                <p className="text-xs text-[#706B5F] dark:text-zinc-400 leading-relaxed">
                  Adicionais estéticos cobrados quando o profissional deseja vitrines temáticas ou personalizações especiais.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1.5">
                      Layout Temático Pronto (R$):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#706B5F] dark:text-zinc-400">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={pricing.singleLayoutPrice}
                        onChange={(e) => handleGenericChange('singleLayoutPrice', Number(e.target.value))}
                        className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-zinc-900 border border-[#E9E2D7] dark:border-zinc-700 rounded-xl text-sm font-bold text-[#2D2D2A] dark:text-zinc-100 outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1.5">
                      Layout Sob Medida (R$):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#706B5F] dark:text-zinc-400">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={pricing.customLayoutRequestPrice}
                        onChange={(e) => handleGenericChange('customLayoutRequestPrice', Number(e.target.value))}
                        className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-zinc-900 border border-[#E9E2D7] dark:border-zinc-700 rounded-xl text-sm font-bold text-[#2D2D2A] dark:text-zinc-100 outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Rodapé de Ações */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-[#E9E2D7] dark:border-zinc-800">
              <button
                type="button"
                onClick={handleApplyToAllProfessionalsInBulk}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                title="Aplica os novos valores a todas as profissionais já cadastradas"
              >
                <Zap className="w-4 h-4 text-white fill-white" />
                Salvar e Aplicar a Todas as Profissionais ({professionals.length})
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="w-1/2 sm:w-auto px-4 py-2.5 bg-stone-100 dark:bg-zinc-800/80 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-200 border border-stone-300 dark:border-zinc-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restaurar Padrões
                </button>
                <button
                  type="submit"
                  className="w-1/2 sm:w-auto px-5 py-2.5 bg-stone-800 hover:bg-stone-900 text-white dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:text-zinc-50 border border-stone-700 dark:border-zinc-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                  title="Salva os valores apenas como padrão para novos cadastros"
                >
                  <Save className="w-4 h-4" />
                  Salvar para Novos Cadastros
                </button>
              </div>
            </div>

          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: VALORES POR PROFISSIONAL (INDIVIDUALMENTE) */}
      {/* ========================================================================= */}
      {activeSubTab === 'individual' && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-[#E9E2D7] dark:border-zinc-700 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E9E2D7] dark:border-zinc-700 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 bg-[#EEF1EB] rounded-xl text-[#5A5A40] dark:text-zinc-300">
                  <Users className="w-5 h-5" />
                </span>
                <h2 className="serif text-xl sm:text-2xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                  Valores & Condições Individuais por Profissional
                </h2>
              </div>
              <p className="text-[#706B5F] dark:text-zinc-400 text-xs sm:text-sm mt-1">
                Aqui você ajusta a mensalidade e a taxa de cada profissional individualmente. Modificações aqui não afetam os demais parceiros.
              </p>
            </div>

            <button
              type="button"
              onClick={handleApplyToAllProfessionalsInBulk}
              className="px-4 py-2.5 bg-[#FAF8F5] dark:bg-zinc-800/50 hover:bg-[#EEF1EB] dark:hover:bg-zinc-800 text-[#5A5A40] dark:text-zinc-300 border border-[#d2dbcb] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar Todos para Padrão Global
            </button>
          </div>

          <div className="space-y-4">
            {professionals.map((prof) => {
              const edit = profEdits[prof.id] || {
                planType: prof.planType || 'trial',
                planMonthlyPrice: prof.planMonthlyPrice !== undefined ? prof.planMonthlyPrice : pricing.proFixedMonthly,
                feePerBooking: prof.feePerBooking !== undefined ? prof.feePerBooking : 0,
                planBillingCycle: prof.planBillingCycle || 'monthly',
                customTrialDaysExtended: prof.customTrialDaysExtended || 0
              };

              const isCustom = prof.planMonthlyPrice !== undefined || prof.feePerBooking !== undefined;

              return (
                <div
                  key={prof.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isCustom 
                      ? 'bg-[#FCFAF8] border-blue-200 shadow-2xs' 
                      : 'bg-white dark:bg-zinc-900 border-[#E9E2D7] dark:border-zinc-700'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    
                    {/* Info do Profissional */}
                    <div className="flex items-center gap-3.5 min-w-[240px]">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden relative border border-[#E9E2D7] dark:border-zinc-700 shrink-0">
                        <Image
                          src={prof.avatarUrl}
                          alt={prof.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-[#2D2D2A] dark:text-zinc-100">{prof.name}</h3>
                          {isCustom && (
                            <span className="text-3xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                              Sob Medida
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#706B5F] dark:text-zinc-400">{prof.category}</p>
                        <span className="text-3xs text-[#A09A8E] dark:text-zinc-500 font-mono">/{prof.slug}</span>
                      </div>
                    </div>

                    {/* Controles de Preço Individual */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                      {/* Tipo de Plano */}
                      <div>
                        <label className="block text-3xs font-bold text-[#706B5F] dark:text-zinc-400 uppercase mb-1">
                          Plano da Profissional:
                        </label>
                        <select
                          value={edit.planType}
                          onChange={(e) => {
                            const newPlan = e.target.value as SubscriptionPlanType;
                            const defaultMonthly = newPlan === 'flex_fee' 
                              ? pricing.flexBaseMonthly 
                              : newPlan === 'pro_fixed' 
                                ? pricing.proFixedMonthly 
                                : 0;
                            const defaultFee = newPlan === 'flex_fee' ? pricing.flexFeePerBooking : 0;
                            setProfEdits(prev => ({
                              ...prev,
                              [prof.id]: {
                                ...prev[prof.id],
                                planType: newPlan,
                                planMonthlyPrice: Math.round(defaultMonthly * 100) / 100,
                                feePerBooking: Math.round(defaultFee * 100) / 100
                              }
                            }));
                          }}
                          className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-[#E9E2D7] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#2D2D2A] dark:text-zinc-100 outline-none"
                        >
                          <option value="trial">Degustação (Grátis {pricing.trialDays || 15} Dias)</option>
                          <option value="pro_fixed">Plano Pro Fixo (R$ {pricing.proFixedMonthly.toFixed(2)}/mês)</option>
                          <option value="flex_fee">Plano Flex (R$ {pricing.flexBaseMonthly.toFixed(2)}/mês + R$ {pricing.flexFeePerBooking.toFixed(2)}/reserva)</option>
                        </select>
                      </div>

                      {edit.planType === 'trial' ? (
                      <div>
                        <label className="block text-3xs font-bold text-[#706B5F] dark:text-zinc-400 uppercase mb-1">
                          Dias Extras de Teste:
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="1"
                            value={edit.customTrialDaysExtended}
                            onChange={(e) => setProfEdits(prev => ({
                              ...prev,
                              [prof.id]: {
                                ...prev[prof.id],
                                customTrialDaysExtended: Number(e.target.value)
                              }
                            }))}
                            className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-[#E9E2D7] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[#2D2D2A] dark:text-zinc-100 outline-none focus:border-[#5A5A40] dark:border-zinc-600"
                          />
                        </div>
                      </div>
                      ) : (
                      <div>
                        <label className="block text-3xs font-bold text-[#706B5F] dark:text-zinc-400 uppercase mb-1">
                          Mensalidade Cobrada (R$):
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#706B5F] dark:text-zinc-400">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={edit.planMonthlyPrice}
                            onChange={(e) => setProfEdits(prev => ({
                              ...prev,
                              [prof.id]: {
                                ...prev[prof.id],
                                planMonthlyPrice: Number(e.target.value)
                              }
                            }))}
                            className="w-full pl-8 pr-2.5 py-1.5 text-xs font-bold rounded-lg border border-[#E9E2D7] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[#2D2D2A] dark:text-zinc-100 outline-none focus:border-[#5A5A40] dark:border-zinc-600"
                          />
                        </div>
                      </div>
                      )}

                      {/* Taxa por Reserva Individual Cobrada */}
                      <div>
                        <label className="block text-3xs font-bold text-[#706B5F] dark:text-zinc-400 uppercase mb-1">
                          Taxa por Reserva (R$):
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#706B5F] dark:text-zinc-400">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={edit.feePerBooking}
                            onChange={(e) => setProfEdits(prev => ({
                              ...prev,
                              [prof.id]: {
                                ...prev[prof.id],
                                feePerBooking: Number(e.target.value)
                              }
                            }))}
                            className="w-full pl-8 pr-2.5 py-1.5 text-xs font-bold rounded-lg border border-[#E9E2D7] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[#2D2D2A] dark:text-zinc-100 outline-none focus:border-[#5A5A40] dark:border-zinc-600"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Botões de Ação por Linha */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isCustom && (
                        <button
                          type="button"
                          onClick={() => handleResetIndividualToGlobal(prof.id)}
                          className="px-2.5 py-1.5 text-2xs font-bold text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:text-zinc-100 bg-stone-100 dark:bg-zinc-800/80 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
                          title="Restaurar valores padrão da plataforma"
                        >
                          Usar Padrão
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleSaveIndividualProf(prof.id)}
                        className="px-3.5 py-1.5 bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Salvar Deste Profissional
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
