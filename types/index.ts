export type UserRole = 'admin' | 'professional' | 'client' | 'master';

export type ProfessionalCategory =
  | 'Manicure & Pedicure'
  | 'Cabeleireira & Colorista'
  | 'Estética Facial & Corporal'
  | 'Depilação'
  | 'Design de Sobrancelhas & Cílios'
  | 'Maquiagem & Penteados'
  | 'Salão de Beleza'
  | 'Barbearia & Barbeiro'
  | 'Barba, Cabelo & Bigode'
  | 'Estética Masculina & Visagismo'
  | 'Tatuagem & Piercing';

export type SubscriptionPlanType = 'trial' | 'pro_fixed' | 'flex_fee';

export type PlanBillingCycle = 'monthly' | 'semiannual' | 'annual' | 'bianual';

export type ThemeColor = 
  | 'olive' 
  | 'rose' 
  | 'lavender' 
  | 'champagne' 
  | 'terracotta' 
  | 'dark_minimal'
  | 'barber_navy'
  | 'barber_noir'
  | 'slate_graphite'
  | 'forest_wood';

export type PageLayoutTemplate = 'classic_elegant' | 'barber_club' | 'boutique_glamour' | 'dark_minimal';

export interface StaffMember {
  id: string;
  professionalId: string;
  name: string;
  roleOrSpecialty: string;
  avatarUrl?: string;
  phone?: string;
  email?: string;
  commissionPercentage?: number; // ex: 50% ou 60%
  pixKey?: string;
  active: boolean;
  assignedServiceIds?: string[]; // IDs dos serviços que ela realiza (ou vazio para todos)
  vacationPeriods?: VacationPeriod[];
  useCustomSchedule?: boolean;
  customSchedule?: {
    activeDays: number[];
    startTime: string;
    endTime: string;
    intervalMinutes: number;
    hasLunchBreak: boolean;
    lunchStart: string;
    lunchEnd: string;
  };
  createdAt?: string;
}

export interface PlanPricingConfig {
  proFixedMonthly: number;
  proFixedAnnual: number;
  flexFeeMonthly: number;
  flexFeeBookingCharge: number;
  trialDaysDefault: number;
  trialDays?: number;
  extraStaffMonthlyFee?: number; // ex: 19.90 por profissional adicional na equipe
  extraStaffRevenueCapPerMember?: number; // ex: +R$ 5.000 de teto por membro extra
}

export interface LoyaltyConfig {
  active: boolean;
  bookingsRequired: number; // ex: 5 ou 10 atendimentos
  rewardType: 'discount_percent' | 'fixed_discount' | 'free_service';
  rewardValue: number; // ex: 20 (% ou R$)
  rewardDescription: string;
}

export interface Professional {
  id: string;
  name: string; // Nome do Espaço ou Nome Exibido
  professionalName?: string; // Nome Completo da Profissional (Pessoa Física)
  spaceName?: string; // Nome do Espaço / Estúdio / Salão
  slug: string;
  email: string;
  phone: string; // WhatsApp: (11) 98765-4321
  whatsapp?: string; // Alias de phone para compatibilidade
  category: ProfessionalCategory;
  genderPreference?: 'masculine' | 'feminine' | 'neutral';
  specialties?: string[]; // Múltiplas especialidades selecionadas
  bio: string;
  instagram?: string; // Ex: @camilasilva.marcabella ou link completo
  address: string;
  avatarUrl: string;
  photoUrl?: string; // Alias de avatarUrl para compatibilidade
  active?: boolean; // Alias para status === 'active'
  requireDeposit?: boolean;
  depositPercentage?: number;
  pixKey: string;
  pixKeyType: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
  cancellationHours: number; // ex: 24h
  cancellationPolicyNotes: string;
  depositDeadlineHours?: number; // Prazo para a cliente pagar o sinal após aprovação (em horas, default: 2)
  status: 'active' | 'inactive' | 'delinquent';
  daysOverdue?: number; // Dias de atraso do pagamento da mensalidade (1-5: aviso / >5: inativo)
  subscriptionDueDate?: string; // Data de vencimento da mensalidade
  subscriptionPaymentStatus?: 'paid' | 'overdue' | 'suspended';
  lastPaymentDate?: string;
  password?: string; // Senha de acesso / reset
  createdAt?: string;
  themeColor?: ThemeColor; // Tema visual escolhido pela profissional ou barbeiro
  pageLayoutTemplate?: PageLayoutTemplate; // Template de página: Clássico, Barber Club, Boutique Glamour, Minimal
  unlockedLayouts?: string[]; // Layouts comprados avulso (ex: ['barber_club', 'boutique_glamour'])
  hasCustomLayoutRequested?: boolean; // Se solicitou layout exclusivo
  customLayoutRequestNotes?: string;
  // Plano de Assinatura & Período de Teste Grátis
  planType?: SubscriptionPlanType;
  planBillingCycle?: PlanBillingCycle; // Ciclo: mensal, semestral, anual, bianual
  trialDays?: number;
  trialStartDate?: string;
  trialStartedAt?: string;
  trialExpiresAt?: string;
  customTrialDaysExtended?: number;
  planMonthlyPrice?: number; // 79.90 (Pro Fixo) ou 29.90 (Flex)
  feePerBooking?: number; // 0.00 (Pro) ou 1.50 (Flex)
  planActivatedAt?: string;
  // Fidelidade & Sorteios
  loyaltyConfig?: LoyaltyConfig;
  bookingCodePrefix?: string; // Prefixo de 3 letras personalizado (ex: CAM, BAR, JUL)
  // Documento Fiscal Obrigatório (CPF ou CNPJ validado)
  documentNumber?: string;
  documentType?: 'cpf' | 'cnpj';
  // Endereço e Atendimento
  addressMode?: 'cep' | 'manual' | 'home_visit';
  addressCep?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressCity?: string;
  addressState?: string;
  serviceCoverageArea?: string; // Região atendida em caso de visitas/domicílio
  // Funções Adicionais Pagas: Imagem de Capa e Fundo da Tela
  customCoverUrl?: string; // Imagem de capa do topo da página
  customBackgroundUrl?: string; // Papel de parede de fundo de tela
  hasCustomBackgroundAddon?: boolean; // Se a função adicional paga está ativada
  customBackgroundEnabled?: boolean;
  // Gateway de Pagamento e Auto-confirmação
  hasPaymentGateway?: boolean;
  pixGatewayActive?: boolean;
  autoConfirmPix?: boolean;

  // Formas de Pagamento Aceitas
  acceptedPaymentMethods?: ('pix' | 'credit_card' | 'credit_installments' | 'cash')[];
  // Modo do Sistema: Simples (Direto ao ponto, sem integrações pesadas) vs Completo
  systemMode?: 'simple' | 'complete';
  // Portfólio de Fotos Reais dos Serviços da Profissional
  portfolioPhotos?: PortfolioPhoto[];
  // Link de Pagamento no Cartão (Mercado Pago, InfinitePay, PagBank, PicPay, etc.)
  cardPaymentLink?: string;
  // Conta de Demonstração / Teste (isolamento estrito de dados contra profissionais cadastradas)
  isDemo?: boolean;
  // Equipe / Múltiplas Profissionais no mesmo Salão ou Espaço
  staffMembers?: StaffMember[];
  // Férias & Recesso
  vacation?: {
    isActive: boolean;
    startDate?: string;
    endDate?: string;
    reason?: string;
    notes?: string;
    returnDate?: string;
  };
}

export interface PortfolioPhoto {
  id: string;
  url: string;
  title: string;
  serviceId?: string;
  serviceName?: string;
  category?: string;
  description?: string;
  isBeforeAfter?: boolean;
}

export interface ServiceItem {
  id: string;
  professionalId: string;
  name: string;
  description: string;
  durationMinutes: number; // 30, 45, 60, 90, etc.
  price: number; // ex: 80.00
  requiresDeposit: boolean;
  depositType: 'fixed' | 'percentage';
  depositValue: number; // ex: 30.00 fixo ou 30%
  active: boolean;
  variations?: string[]; // ex: ['Fibra de Vidro', 'Tips', 'Gel Moldado']
  imageUrl?: string; // Foto ilustrativa ou principal
  images?: string[]; // Múltiplas fotos do serviço / carrossel
  // Gestão de Combos e Preços Dinâmicos
  isCombo?: boolean;
  comboServiceNames?: string[]; // ex: ['Corte Feminino', 'Escova Modeladora']
  originalPrice?: number; // Preço original sem desconto
  discountPercent?: number; // Desconto embutido
  // Link de Pagamento no Cartão específico deste serviço (opcional)
  cardPaymentLink?: string;
  // Profissionais da equipe designadas para este serviço
  assignedStaffMemberIds?: string[];
}

export interface BlockedTimeSlot {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  reason: string; // ex: "Pausa médica", "Almoço estendido", "Manutenção"
}

export interface VacationPeriod {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string; // ex: "Férias coletivas", "Recesso de fim de ano"
  customNote?: string; // Mensagem amigável para as clientes
  returnDate?: string; // Data prevista de retorno ao atendimento
}

export interface CustomDayHours {
  enabled: boolean;
  startTime: string; // "08:00"
  endTime: string; // "14:00"
  hasLunchBreak?: boolean;
  lunchStart?: string; // "12:00"
  lunchEnd?: string; // "13:00"
}

export interface AvailabilityConfig {
  id: string;
  professionalId: string;
  // Dias da semana ativos: 0 (dom), 1 (seg), 2 (ter), 3 (qua), 4 (qui), 5 (sex), 6 (sab)
  activeDays: number[];
  startTime: string; // "08:00"
  endTime: string; // "19:00"
  intervalMinutes: number; // 30 ou 60 min
  hasLunchBreak: boolean;
  lunchStart: string; // "12:00"
  lunchEnd: string; // "13:00"
  blockedDates: string[]; // ['2026-09-10', '2026-09-15']
  // Horários customizados por dia da semana (ex: Sábado com horário reduzido)
  dayCustomHours?: Record<number, CustomDayHours>;
  // Modo de atendimento mensal personalizado
  allowedDatesMode?: 'all_active_days' | 'specific_dates';
  allowedSpecificDates?: string[]; // Datas específicas liberadas para atendimento (ex: ['2026-09-08', '2026-09-09'])
  // Tempo de intervalo (buffer time) entre atendimentos para limpeza/descanso
  bufferMinutes?: number; // 0, 5, 10, 15, 20, 30 min
  // Bloqueio rápido e Férias
  blockedTimeSlots?: BlockedTimeSlot[];
  vacationPeriods?: VacationPeriod[];
}

export type BookingStatus = 'pending' | 'awaiting_deposit' | 'confirmed' | 'cancelled' | 'completed';

export type PaymentMethod = 'pix' | 'credit_card' | 'debit_card' | 'cash' | 'split' | 'courtesy';

export interface SplitPaymentEntry {
  method: 'pix' | 'credit_card' | 'debit_card' | 'cash';
  amount: number;
  notes?: string;
}

export type ReminderVariationType = 'standard' | 'custom';

export interface SlotHold {
  id: string;
  professionalId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  endTime?: string;
  createdAt: number; // timestamp ms
  expiresAt: number; // timestamp ms (ex: 10 minutos)
  sessionId: string; // identificador único temporário da sessão do cliente
}

export interface Booking {
  id: string;
  code: string; // Código de 6 dígitos amigável ex: #BE-4821
  professionalId: string;
  professionalSlug?: string;
  professionalName: string;
  professionalPhone: string;
  professionalAddress: string;
  serviceId: string;
  serviceName: string;
  serviceDuration: number;
  serviceVariation?: string; // ex: "Variação: Fibra de Vidro", "Esmaltação em Gel", etc.
  serviceIds?: string[];
  servicesList?: { id: string; name: string; price: number; durationMinutes: number; variation?: string }[];
  clientName: string;
  clientPhone: string; // WhatsApp
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  endTime?: string; // HH:MM
  status: BookingStatus;
  totalPrice: number;
  depositRequired: boolean;
  depositAmount: number;
  depositPaid: boolean;
  depositStatus?: 'pending' | 'paid' | 'retained' | 'refunded';
  depositDeadlineHours?: number; // ex: 2 horas
  depositDeadlineAt?: string; // ISO string de quando o prazo expira
  depositApprovedAt?: string; // ISO string de quando a profissional aprovou
  depositPaidAt?: string; // ISO string de quando o sinal foi pago
  pixCode?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  reminderSent?: boolean;
  reminderSentAt?: string;
  reminderTemplateUsed?: ReminderVariationType | string;
  rescheduledFrom?: { date: string; time: string; at: string };
  clientConfirmedMessageReceived?: boolean;
  createdAt: string;
  notes?: string;
  // Agendamento de Demonstração / Teste (isolamento de agenda)
  isDemo?: boolean;
  // Controle de Caixa e Formas de Pagamento
  paymentMethod?: PaymentMethod;
  splitPayments?: SplitPaymentEntry[];
  paymentRecordedAt?: string;
  isManualOrFit?: boolean; // Criado como Encaixe Manual pela profissional
  // Opção de Pagar no Atendimento ou Pix (Sinal vs Total)
  payOnArrival?: boolean;
  payFullInAdvance?: boolean;
  paymentOption?: 'pay_on_arrival' | 'pay_pix_now' | 'pay_deposit_pix' | 'pay_full_pix';
  attended?: boolean; // Presença confirmada no atendimento
  // Encaixes e Divisão de Serviços com Aprovação Obrigatória
  isEncaixe?: boolean; // Solicitado como Encaixe Especial
  encaixeReason?: string; // Motivo do encaixe (ex: sobreposição de horário ou tempo estendido)
  requiresSpecialApproval?: boolean; // Exige aprovação manual da profissional
  isSplitSchedule?: boolean; // Procedimentos divididos em horários distintos
  splitParts?: {
    serviceId: string;
    serviceName: string;
    durationMinutes: number;
    price: number;
    time: string;
    endTime: string;
    date?: string;
  }[];
  // Agendamento Recorrente (ex: cliente toda sexta-feira)
  isRecurring?: boolean;
  recurrenceFrequency?: 'weekly' | 'biweekly' | 'monthly';
  recurrenceGroupId?: string;
  recurrenceIndex?: number;
  recurrenceTotal?: number;
  // Membro da Equipe / Profissional Responsável
  staffMemberId?: string;
  staffMemberName?: string;
  staffId?: string;
  staffName?: string;
  commissionPercentage?: number;
  commissionAmount?: number;
}

export type ManualBookingInput = {
  professionalId: string;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  serviceName: string;
  serviceDuration: number;
  totalPrice: number;
  date: string;
  time: string;
  endTime?: string;
  status?: BookingStatus;
  professionalName?: string;
  professionalPhone?: string;
  professionalAddress?: string;
  depositRequired?: boolean;
  depositAmount?: number;
  depositPaid?: boolean;
  notes?: string;
  serviceVariation?: string;
  // Recorrência opcional no encaixe manual
  isRecurring?: boolean;
  recurrenceFrequency?: 'weekly' | 'biweekly' | 'monthly';
  recurrenceCount?: number;
  // Membro da Equipe
  staffMemberId?: string;
  staffMemberName?: string;
  commissionPercentage?: number;
  commissionAmount?: number;
};

export interface WaitlistEntry {
  id: string;
  professionalId: string;
  clientName: string;
  clientPhone: string;
  desiredDate: string;
  preferredPeriod: 'any' | 'morning' | 'afternoon' | 'evening';
  serviceIds: string[];
  serviceNames: string;
  notes?: string;
  status: 'waiting' | 'notified' | 'scheduled' | 'booked' | 'cancelled';
  createdAt: string;
}

export interface Review {
  id: string;
  professionalId: string;
  bookingId?: string;
  clientName: string;
  clientPhoneMasked?: string;
  rating: number; // 1 a 5
  comment: string;
  serviceName?: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  professionalId: string;
  professionalName: string;
  subject: string;
  message: string;
  reply?: string;
  status: 'open' | 'answered' | 'closed';
  createdAt: string;
  answeredAt?: string;
}

export interface GiveawayCampaign {
  id: string;
  professionalId: string;
  title: string;
  prizeDescription?: string;
  prize?: string;
  description?: string;
  rules: string;
  drawDate: string; // YYYY-MM-DD
  status: 'active' | 'drawn' | 'completed' | 'cancelled';
  minSpendAmount?: number;
  winnerClientName?: string;
  winnerClientPhone?: string;
  winnerBookingCode?: string;
  drawnAt?: string;
  createdAt: string;
}

export interface PromotionalGift {
  id: string;
  professionalId: string;
  title: string;
  description: string;
  triggerType?: 'min_spend' | 'first_time' | 'specific_days' | 'all_clients';
  eligibilityType?: 'first_time' | 'min_spend' | 'service_type' | 'all_clients' | 'specific_days';
  minSpend?: number;
  minSpendAmount?: number;
  serviceKeyword?: string;
  specificDaysOfWeek?: number[]; // [0..6]
  active: boolean;
  createdAt: string;
}

export type ExpenseCategory = 'material' | 'salary' | 'commission' | 'rent' | 'utilities' | 'marketing' | 'taxes' | 'other';

export interface Expense {
  id: string;
  professionalId: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: string; // YYYY-MM-DD
  createdAt: string;
  isRecurring?: boolean;
  recurrence?: 'monthly' | 'weekly' | 'yearly';
  staffMemberId?: string; // Optional: If it's a commission or salary payout
  status: 'paid' | 'pending';
}

