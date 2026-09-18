import { Professional, SubscriptionPlanType, PlanBillingCycle, Booking } from '@/types';

export interface PlanBillingOption {
  cycle: PlanBillingCycle;
  label: string;
  months: number;
  discountPercent: number;
  monthlyEquivalent: number;
  totalPrice: number;
  badge?: string;
  savingsVsMonthly: number;
}

export interface PlanDefinition {
  id: SubscriptionPlanType;
  name: string;
  tag: string;
  baseMonthlyPrice: number;
  feePerBooking: number;
  description: string;
  features: string[];
  billingOptions: PlanBillingOption[];
  marketComparison: {
    competitorName: string;
    competitorMonthlyPrice: number;
    monthlySavingsAmount: number;
  };
}

export const PLAN_CONFIGS: Record<SubscriptionPlanType, PlanDefinition> = {
  trial: {
    id: 'trial',
    name: 'Teste Grátis (15 Dias)',
    tag: 'Degustação & Adaptação 100% Grátis',
    baseMonthlyPrice: 0,
    feePerBooking: 0,
    description: 'Acesso liberado a todas as ferramentas por 15 dias para você se adaptar e solicitar mudanças ou personalizações.',
    features: [
      '15 dias de uso 100% gratuito (R$ 0,00)',
      'Período completo de adaptação com suporte prioritário',
      'Link público exclusivo com seu nome no WhatsApp',
      'Cobrança opcional de sinal Pix com QR Code & Copia e Cola',
      'Agendamentos ilimitados no período de teste',
      'Sem cartão de crédito prévio ou fidelidade'
    ],
    billingOptions: [],
    marketComparison: {
      competitorName: 'Plataformas Tradicionais',
      competitorMonthlyPrice: 89.90,
      monthlySavingsAmount: 89.90
    }
  },
  pro_fixed: {
    id: 'pro_fixed',
    name: 'Plano Pro Ilimitado',
    tag: 'Mais Escolhido • Melhor Custo-Benefício do Brasil',
    baseMonthlyPrice: 59.90,
    feePerBooking: 0,
    description: 'Mensalidade fixa previsível sem cobrança de taxas por atendimento. Atenda 30, 80 ou 200 clientes pelo mesmo valor.',
    features: [
      'Agendamentos 100% Ilimitados sem taxas extras',
      'Zero taxa por agendamento (R$ 0,00 por cliente)',
      'Retenção de 100% dos sinais Pix direto na sua conta',
      'Lembretes automáticos 24h antes pelo WhatsApp',
      'Múltiplas especialidades & personalização de tema visual',
      'Possibilidade de adicionar Colaboradoras (+ R$ 19,90/mês cada)',
      'Suporte prioritário via WhatsApp'
    ],
    billingOptions: [
      {
        cycle: 'monthly',
        label: 'Mensal',
        months: 1,
        discountPercent: 0,
        monthlyEquivalent: 59.90,
        totalPrice: 59.90,
        savingsVsMonthly: 0
      },
      {
        cycle: 'semiannual',
        label: 'Semestral (6 meses)',
        months: 6,
        discountPercent: 15,
        monthlyEquivalent: 50.90,
        totalPrice: 305.40,
        badge: '15% OFF',
        savingsVsMonthly: 54.00
      },
      {
        cycle: 'annual',
        label: 'Anual (1 ano)',
        months: 12,
        discountPercent: 28,
        monthlyEquivalent: 42.90,
        totalPrice: 514.80,
        badge: 'Mais Popular • 28% OFF',
        savingsVsMonthly: 204.00
      },
      {
        cycle: 'bianual',
        label: 'Bianual (2 anos)',
        months: 24,
        discountPercent: 43,
        monthlyEquivalent: 33.90,
        totalPrice: 813.60,
        badge: 'Maior Economia • 43% OFF',
        savingsVsMonthly: 624.00
      }
    ],
    marketComparison: {
      competitorName: 'Avec / Trinks / Booksy (Média R$ 99 a R$ 149/mês)',
      competitorMonthlyPrice: 119.00,
      monthlySavingsAmount: 59.10 // Comparado ao mensal do BellaHora
    }
  },
  flex_fee: {
    id: 'flex_fee',
    name: 'Plano Flex Inicial',
    tag: 'Mensalidade Mínima para Quem Está no Início',
    baseMonthlyPrice: 24.90,
    feePerBooking: 0.99,
    description: 'Mensalidade super acessível de R$ 24,90 + R$ 0,99 apenas por cliente que realmente for atendida. Pague só conforme seu faturamento.',
    features: [
      'Mensalidade de entrada mínima (R$ 24,90/mês)',
      'Apenas R$ 0,99 por agendamento confirmado (contra R$ 3 a 5 de concorrentes)',
      'Sem cobrança sobre horários cancelados',
      'Acesso completo a todas as funções e temas',
      'Migre para o Plano Pro quando sua agenda encher'
    ],
    billingOptions: [
      {
        cycle: 'monthly',
        label: 'Mensal',
        months: 1,
        discountPercent: 0,
        monthlyEquivalent: 24.90,
        totalPrice: 24.90,
        savingsVsMonthly: 0
      },
      {
        cycle: 'semiannual',
        label: 'Semestral (6 meses)',
        months: 6,
        discountPercent: 15,
        monthlyEquivalent: 21.15,
        totalPrice: 126.90,
        badge: '15% OFF',
        savingsVsMonthly: 22.50
      },
      {
        cycle: 'annual',
        label: 'Anual (1 ano)',
        months: 12,
        discountPercent: 28,
        monthlyEquivalent: 17.90,
        totalPrice: 214.80,
        badge: '28% OFF',
        savingsVsMonthly: 84.00
      },
      {
        cycle: 'bianual',
        label: 'Bianual (2 anos)',
        months: 24,
        discountPercent: 43,
        monthlyEquivalent: 13.90,
        totalPrice: 333.60,
        badge: '43% OFF',
        savingsVsMonthly: 264.00
      }
    ],
    marketComparison: {
      competitorName: 'Sistemas com taxa de 10% a 20% do serviço',
      competitorMonthlyPrice: 89.00,
      monthlySavingsAmount: 64.10
    }
  }
};

export interface TrialStatus {
  isTrial: boolean;
  planType: SubscriptionPlanType;
  planName: string;
  daysRemaining: number;
  totalTrialDays: number;
  isExpired: boolean;
  percentRemaining: number;
  trialExpiresAtDate: Date;
  statusBadgeText: string;
  statusColor: 'emerald' | 'amber' | 'rose' | 'neutral';
  billingCycleText?: string;
  effectiveMonthlyPrice: number;
}

/**
 * Calcula o tempo de uso da profissional no sistema (ex: "7 meses", "15 dias")
 */
export function formatProfessionalUsageStats(createdAt?: string): {
  formattedDate: string;
  timeUsingText: string;
  totalDaysUsing: number;
} {
  if (!createdAt) {
    return {
      formattedDate: 'Data não informada',
      timeUsingText: 'Recém-chegada',
      totalDaysUsing: 1
    };
  }

  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const totalDaysUsing = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  const day = String(created.getDate()).padStart(2, '0');
  const month = String(created.getMonth() + 1).padStart(2, '0');
  const year = created.getFullYear();
  const formattedDate = `${day}/${month}/${year}`;

  let timeUsingText = '';
  if (totalDaysUsing < 30) {
    timeUsingText = `${totalDaysUsing} ${totalDaysUsing === 1 ? 'dia' : 'dias'}`;
  } else if (totalDaysUsing < 365) {
    const months = Math.floor(totalDaysUsing / 30);
    timeUsingText = `${months} ${months === 1 ? 'mês' : 'meses'}`;
  } else {
    const years = Math.floor(totalDaysUsing / 365);
    const remMonths = Math.floor((totalDaysUsing % 365) / 30);
    timeUsingText = `${years} ${years === 1 ? 'ano' : 'anos'}${remMonths > 0 ? ` e ${remMonths} m` : ''}`;
  }

  return {
    formattedDate,
    timeUsingText,
    totalDaysUsing
  };
}

/**
 * Calcula o status de teste e plano da profissional
 */
export function getProfessionalPlanStatus(professional: Professional): TrialStatus {
  const currentPricing = getSaaSPricing();
  const planType: SubscriptionPlanType = professional.planType || 'trial';
  const baseTrialDays = professional.trialDays !== undefined ? professional.trialDays : (currentPricing.trialDays || 15);
  const totalDays = baseTrialDays + (professional.customTrialDaysExtended || 0);

  // Data de referência de criação e expiração
  const createdDate = new Date(professional.trialStartDate || professional.createdAt || Date.now());
  let trialExpiresAtDate: Date;
  trialExpiresAtDate = new Date(createdDate.getTime() + totalDays * 24 * 60 * 60 * 1000);

  const now = new Date();
  const diffMs = trialExpiresAtDate.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const isExpired = daysRemaining <= 0;

  const cycle = professional.planBillingCycle || 'monthly';
  const cycleLabels: Record<PlanBillingCycle, string> = {
    monthly: 'Mensal',
    semiannual: 'Semestral (15% OFF)',
    annual: 'Anual (28% OFF)',
    bianual: 'Bianual (43% OFF)'
  };

  if (planType === 'pro_fixed') {
    const opt = PLAN_CONFIGS.pro_fixed.billingOptions.find(o => o.cycle === cycle) || PLAN_CONFIGS.pro_fixed.billingOptions[0];
    return {
      isTrial: false,
      planType: 'pro_fixed',
      planName: PLAN_CONFIGS.pro_fixed.name,
      daysRemaining: 30,
      totalTrialDays: totalDays,
      isExpired: false,
      percentRemaining: 100,
      trialExpiresAtDate,
      statusBadgeText: `Plano Pro Fixo • Ciclo ${cycleLabels[cycle] || 'Mensal'}`,
      statusColor: 'emerald',
      billingCycleText: cycleLabels[cycle],
      effectiveMonthlyPrice: opt ? opt.monthlyEquivalent : 59.90
    };
  }

  if (planType === 'flex_fee') {
    const opt = PLAN_CONFIGS.flex_fee.billingOptions.find(o => o.cycle === cycle) || PLAN_CONFIGS.flex_fee.billingOptions[0];
    return {
      isTrial: false,
      planType: 'flex_fee',
      planName: PLAN_CONFIGS.flex_fee.name,
      daysRemaining: 30,
      totalTrialDays: totalDays,
      isExpired: false,
      percentRemaining: 100,
      trialExpiresAtDate,
      statusBadgeText: `Plano Flex • Ciclo ${cycleLabels[cycle] || 'Mensal'}`,
      statusColor: 'amber',
      billingCycleText: cycleLabels[cycle],
      effectiveMonthlyPrice: opt ? opt.monthlyEquivalent : 24.90
    };
  }

  // Plano é TRIAL (15 dias grátis)
  const percentRemaining = Math.min(100, Math.max(0, Math.round((daysRemaining / totalDays) * 100)));

  return {
    isTrial: true,
    planType: 'trial',
    planName: PLAN_CONFIGS.trial.name,
    daysRemaining,
    totalTrialDays: totalDays,
    isExpired,
    percentRemaining,
    trialExpiresAtDate,
    statusBadgeText: isExpired 
      ? 'Período de Teste Grátis Encerrado' 
      : `Teste Grátis: ${daysRemaining} ${daysRemaining === 1 ? 'dia restante' : 'dias restantes'} (R$ 0)`,
    statusColor: isExpired ? 'rose' : (daysRemaining <= 2 ? 'amber' : 'emerald'),
    effectiveMonthlyPrice: 0
  };
}

/**
 * Calcula a fatura atual do mês para a profissional
 */
export function calculateProfessionalMonthlyBilling(
  professional: Professional, 
  bookings: Booking[]
): {
  planType: SubscriptionPlanType;
  fixedMonthly: number;
  confirmedBookingsCount: number;
  feePerBooking: number;
  totalFeesAmount: number;
  totalInvoiceAmount: number;
} {
  const planType: SubscriptionPlanType = professional.planType || 'trial';
  const profBookings = bookings.filter(b => b.professionalId === professional.id && (b.status === 'confirmed' || b.status === 'completed'));
  
  if (planType === 'trial') {
    return {
      planType: 'trial',
      fixedMonthly: 0,
      confirmedBookingsCount: profBookings.length,
      feePerBooking: 0,
      totalFeesAmount: 0,
      totalInvoiceAmount: 0
    };
  }

  if (planType === 'pro_fixed') {
    const cycle = professional.planBillingCycle || 'monthly';
    const opt = PLAN_CONFIGS.pro_fixed.billingOptions.find(o => o.cycle === cycle) || PLAN_CONFIGS.pro_fixed.billingOptions[0];
    const fixed = opt ? opt.monthlyEquivalent : 59.90;
    return {
      planType: 'pro_fixed',
      fixedMonthly: fixed,
      confirmedBookingsCount: profBookings.length,
      feePerBooking: 0,
      totalFeesAmount: 0,
      totalInvoiceAmount: fixed
    };
  }

  // flex_fee
  const cycle = professional.planBillingCycle || 'monthly';
  const opt = PLAN_CONFIGS.flex_fee.billingOptions.find(o => o.cycle === cycle) || PLAN_CONFIGS.flex_fee.billingOptions[0];
  const fixed = opt ? opt.monthlyEquivalent : 24.90;
  const fee = PLAN_CONFIGS.flex_fee.feePerBooking;
  const totalFees = profBookings.length * fee;
  return {
    planType: 'flex_fee',
    fixedMonthly: fixed,
    confirmedBookingsCount: profBookings.length,
    feePerBooking: fee,
    totalFeesAmount: totalFees,
    totalInvoiceAmount: fixed + totalFees
  };
}

export interface SaaSPlatformPricing {
  proFixedMonthly: number;
  proFixedSemiannual: number;
  proFixedAnnual: number;
  proFixedBianual: number;
  flexBaseMonthly: number;
  flexFeePerBooking: number;
  trialDays: number;
  singleLayoutPrice: number;
  customLayoutRequestPrice: number;
  autoCalculateDiscounts?: boolean;
  semiannualDiscountPercent?: number;
  annualDiscountPercent?: number;
  bianualDiscountPercent?: number;
  flexBaseSemiannual?: number;
  flexBaseAnnual?: number;
  flexBaseBianual?: number;
  extraStaffMonthlyFee?: number;
  extraStaffRevenueCapPerMember?: number;
}

export const DEFAULT_SAAS_PRICING: SaaSPlatformPricing = {
  proFixedMonthly: 59.90,
  proFixedSemiannual: 50.90,
  proFixedAnnual: 42.90,
  proFixedBianual: 33.90,
  flexBaseMonthly: 24.90,
  flexFeePerBooking: 0.99,
  trialDays: 15,
  singleLayoutPrice: 49.90,
  customLayoutRequestPrice: 149.00,
  autoCalculateDiscounts: true,
  semiannualDiscountPercent: 15,
  annualDiscountPercent: 28,
  bianualDiscountPercent: 43,
  extraStaffMonthlyFee: 19.90,
  extraStaffRevenueCapPerMember: 5000
};

const SAAS_PRICING_STORAGE_KEY = 'bellahora_saas_pricing_v1';

export function getSaaSPricing(): SaaSPlatformPricing {
  if (typeof window === 'undefined') return DEFAULT_SAAS_PRICING;
  try {
    const raw = localStorage.getItem(SAAS_PRICING_STORAGE_KEY);
    if (!raw) return DEFAULT_SAAS_PRICING;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SAAS_PRICING, ...parsed };
  } catch {
    return DEFAULT_SAAS_PRICING;
  }
}

export function syncPlanConfigsWithPricing(pricing?: SaaSPlatformPricing): void {
  const current = pricing || getSaaSPricing();
  try {
    // Atualiza dinamicamente as estruturas em memória para Trial
    const days = current.trialDays || 15;
    PLAN_CONFIGS.trial.name = `Teste Grátis (${days} Dias)`;
    PLAN_CONFIGS.trial.description = `Acesso liberado a todas as ferramentas por ${days} dias para você se adaptar e solicitar mudanças ou personalizações.`;
    PLAN_CONFIGS.trial.features = [
      `${days} dias de uso 100% gratuito (R$ 0,00)`,
      'Período completo de adaptação com suporte prioritário',
      'Link público exclusivo com seu nome no WhatsApp',
      'Cobrança de sinal Pix antecipado para evitar faltas',
      'Lembretes automáticos para clientes no WhatsApp',
      'Suporte humanizado para tirar dúvidas e ajustes'
    ];

    // Atualiza dinamicamente as estruturas em memória para Pro Fixo
    PLAN_CONFIGS.pro_fixed.baseMonthlyPrice = current.proFixedMonthly;
    PLAN_CONFIGS.pro_fixed.features = [
      'Agendamentos 100% Ilimitados sem taxas extras',
      'Zero taxa por agendamento (R$ 0,00 por cliente)',
      'Retenção de 100% dos sinais Pix direto na sua conta',
      'Lembretes automáticos 24h antes pelo WhatsApp',
      'Múltiplas especialidades & personalização de tema visual',
      `Possibilidade de adicionar Colaboradoras (+ R$ ${(current.extraStaffMonthlyFee || 19.9).toFixed(2).replace('.', ',')}/mês cada)`,
      'Suporte prioritário via WhatsApp'
    ];
    if (PLAN_CONFIGS.pro_fixed.billingOptions[0]) {
      PLAN_CONFIGS.pro_fixed.billingOptions[0].monthlyEquivalent = current.proFixedMonthly;
      PLAN_CONFIGS.pro_fixed.billingOptions[0].totalPrice = current.proFixedMonthly;
    }
    if (PLAN_CONFIGS.pro_fixed.billingOptions[1]) {
      PLAN_CONFIGS.pro_fixed.billingOptions[1].monthlyEquivalent = current.proFixedSemiannual;
      PLAN_CONFIGS.pro_fixed.billingOptions[1].totalPrice = Number((current.proFixedSemiannual * 6).toFixed(2));
      PLAN_CONFIGS.pro_fixed.billingOptions[1].savingsVsMonthly = Number(((current.proFixedMonthly - current.proFixedSemiannual) * 6).toFixed(2));
      if (current.semiannualDiscountPercent !== undefined) {
        PLAN_CONFIGS.pro_fixed.billingOptions[1].discountPercent = current.semiannualDiscountPercent;
        PLAN_CONFIGS.pro_fixed.billingOptions[1].badge = `${current.semiannualDiscountPercent}% OFF`;
      }
    }
    if (PLAN_CONFIGS.pro_fixed.billingOptions[2]) {
      PLAN_CONFIGS.pro_fixed.billingOptions[2].monthlyEquivalent = current.proFixedAnnual;
      PLAN_CONFIGS.pro_fixed.billingOptions[2].totalPrice = Number((current.proFixedAnnual * 12).toFixed(2));
      PLAN_CONFIGS.pro_fixed.billingOptions[2].savingsVsMonthly = Number(((current.proFixedMonthly - current.proFixedAnnual) * 12).toFixed(2));
      if (current.annualDiscountPercent !== undefined) {
        PLAN_CONFIGS.pro_fixed.billingOptions[2].discountPercent = current.annualDiscountPercent;
        PLAN_CONFIGS.pro_fixed.billingOptions[2].badge = `Mais Popular • ${current.annualDiscountPercent}% OFF`;
      }
    }
    if (PLAN_CONFIGS.pro_fixed.billingOptions[3]) {
      PLAN_CONFIGS.pro_fixed.billingOptions[3].monthlyEquivalent = current.proFixedBianual;
      PLAN_CONFIGS.pro_fixed.billingOptions[3].totalPrice = Number((current.proFixedBianual * 24).toFixed(2));
      PLAN_CONFIGS.pro_fixed.billingOptions[3].savingsVsMonthly = Number(((current.proFixedMonthly - current.proFixedBianual) * 24).toFixed(2));
      if (current.bianualDiscountPercent !== undefined) {
        PLAN_CONFIGS.pro_fixed.billingOptions[3].discountPercent = current.bianualDiscountPercent;
        PLAN_CONFIGS.pro_fixed.billingOptions[3].badge = `Maior Economia • ${current.bianualDiscountPercent}% OFF`;
      }
    }

    // Flex Fee
    PLAN_CONFIGS.flex_fee.baseMonthlyPrice = current.flexBaseMonthly;
    PLAN_CONFIGS.flex_fee.feePerBooking = current.flexFeePerBooking;
    if (PLAN_CONFIGS.flex_fee.billingOptions[0]) {
      PLAN_CONFIGS.flex_fee.billingOptions[0].monthlyEquivalent = current.flexBaseMonthly;
      PLAN_CONFIGS.flex_fee.billingOptions[0].totalPrice = current.flexBaseMonthly;
    }
  } catch (e) {
    console.error('Error syncing plan configs:', e);
  }
}

export function saveSaaSPricing(pricing: SaaSPlatformPricing): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SAAS_PRICING_STORAGE_KEY, JSON.stringify(pricing));
    syncPlanConfigsWithPricing(pricing);
    window.dispatchEvent(new CustomEvent('saas_pricing_updated', { detail: pricing }));
  } catch (e) {
    console.error('Error saving SaaS pricing:', e);
  }
}

if (typeof window !== 'undefined') {
  try {
    syncPlanConfigsWithPricing();
  } catch {
    // Ignore during SSR
  }
}
