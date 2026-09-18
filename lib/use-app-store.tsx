'use client';

import React, { createContext, useContext, useSyncExternalStore, useEffect, useMemo } from 'react';
import { db } from './firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc,
  getDocs,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { 
  Professional, 
  ServiceItem, 
  AvailabilityConfig, 
  Booking, 
  SupportTicket, 
  UserRole, 
  SubscriptionPlanType,
  PlanBillingCycle,
  ThemeColor,
  WaitlistEntry,
  Review,
  PaymentMethod,
  SplitPaymentEntry,
  LoyaltyConfig,
  ManualBookingInput,
  PageLayoutTemplate,
  GiveawayCampaign,
  PromotionalGift,
  PlanPricingConfig,
  SlotHold,
  StaffMember,
  Expense,
  ExpenseCategory
} from '@/types';
import { 
  INITIAL_PROFESSIONALS, 
  INITIAL_SERVICES, 
  INITIAL_AVAILABILITIES, 
  INITIAL_BOOKINGS, 
  INITIAL_TICKETS,
  INITIAL_WAITLIST,
  INITIAL_REVIEWS,
  INITIAL_GIVEAWAYS,
  INITIAL_PROMOTIONAL_GIFTS,
  DEFAULT_PLAN_PRICING,
  deduplicateBookings
} from './data-store';
import { findBestImageForService } from './service-images';

// Remove undefined properties before Firestore writes to prevent Firestore unsupported field value errors
function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined || typeof data !== 'object') {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(item => cleanForFirestore(item)) as unknown as T;
  }
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    if (value !== undefined) {
      clean[key] = cleanForFirestore(value);
    }
  }
  return clean as T;
}

interface StoreState {
  professionals: Professional[];
  services: ServiceItem[];
  availabilities: AvailabilityConfig[];
  bookings: Booking[];
  tickets: SupportTicket[];
  waitlist: WaitlistEntry[];
  reviews: Review[];
  giveaways: GiveawayCampaign[];
  promotionalGifts: PromotionalGift[];
  expenses: Expense[];
  currentRole: UserRole;
  selectedProfessionalId: string;
  impersonatedByMaster: boolean;
  themeMode: 'light' | 'dark';
  authenticatedProfId: string | null;
  globalPlanPricing: PlanPricingConfig;
  heldSlots: SlotHold[];
}

interface AppStoreContextType extends StoreState {
  isHydrated: boolean;
  isProfAuthenticated: boolean;
  authProfessionalId: string | null;
  loginProfessional: (identifier: string, pass: string) => { success: boolean; message?: string; professional?: Professional };
  syncFromCloud: () => Promise<void>;
  themeMode: 'light' | 'dark';
  toggleThemeMode: () => void;
  setThemeMode: (mode: 'light' | 'dark') => void;
  setRole: (role: UserRole) => void;
  setSelectedProfessionalId: (id: string) => void;
  loginAsProfessional: (identifier: string, pass: string) => { success: boolean; message?: string; professional?: Professional };
  loginAsMaster: (loginOrPass: string, pass?: string) => { success: boolean; message?: string };
  loginMaster: (loginOrPass: string, pass?: string) => { success: boolean; message?: string };
  logoutMaster: () => void;
  isMasterAuthenticated: boolean;
  checkPrefixAvailability: (prefix: string, currentProfId?: string) => { available: boolean; takenBy?: string };
  logout: () => void;
  startImpersonation: (profId: string) => void;
  stopImpersonation: () => void;
  getProfessionalBySlug: (slug: string) => Professional | undefined;
  getServicesForProf: (profId: string) => ServiceItem[];
  getAvailabilityForProf: (profId: string) => AvailabilityConfig;
  getReviewsForProf: (profId: string) => Review[];
  getWaitlistForProf: (profId: string) => WaitlistEntry[];
  getGiveawaysForProf: (profId: string) => GiveawayCampaign[];
  getPromotionalGiftsForProf: (profId: string) => PromotionalGift[];
  getExpensesForProf: (profId: string) => Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Expense;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  addGiveaway: (giveaway: Omit<GiveawayCampaign, 'id' | 'createdAt' | 'status'>) => GiveawayCampaign;
  updateGiveaway: (giveaway: GiveawayCampaign) => void;
  deleteGiveaway: (id: string) => void;
  drawGiveawayWinner: (id: string, winnerName: string, winnerPhone?: string, bookingCode?: string) => void;
  addPromotionalGift: (gift: Omit<PromotionalGift, 'id' | 'createdAt'>) => PromotionalGift;
  togglePromotionalGift: (id: string) => void;
  deletePromotionalGift: (id: string) => void;
  updateProfessionalBookingPrefix: (profId: string, prefix: string) => void;
  addService: (service: Omit<ServiceItem, 'id'>) => ServiceItem;
  updateService: (service: ServiceItem) => void;
  deleteService: (id: string) => void;
  addProfessional: (prof: Omit<Professional, 'id'> | Professional) => Professional;
  updateProfessional: (prof: Professional) => void;
  toggleProfessionalStatus: (id: string) => void;
  setTenantStatus: (id: string, status: 'active' | 'inactive' | 'delinquent') => void;
  resetTenantPassword: (id: string, newPass?: string) => string;
  updateGlobalPlanPricing: (config: Partial<PlanPricingConfig>, applyToAllExisting?: boolean, fullSaaSPricing?: any) => void;
  updateProfessionalCustomPlan: (profId: string, customPricing: {
    planType?: SubscriptionPlanType;
    customTrialDaysExtended?: number;
    planMonthlyPrice?: number;
    feePerBooking?: number;
    planBillingCycle?: PlanBillingCycle;
    hasCustomBackgroundAddon?: boolean;
    customBackgroundEnabled?: boolean;
  }) => void;
  changeProfessionalPlan: (profId: string, planType: SubscriptionPlanType, billingCycle?: PlanBillingCycle) => void;
  setProfessionalSystemMode: (profId: string, mode: 'simple' | 'complete') => void;
  extendTrialDays: (profId: string, extraDays: number) => void;
  updateAvailability: (config: AvailabilityConfig) => void;
  updateAllowedDates: (profId: string, mode: 'all_active_days' | 'specific_dates', dates: string[]) => void;
  setProfessionalTheme: (profId: string, themeColor: ThemeColor) => void;
  setProfessionalLayout: (profId: string, layout: PageLayoutTemplate) => void;
  unlockProfessionalLayout: (profId: string, layout: PageLayoutTemplate) => void;
  addBlockedTimeSlot: (profId: string, slot: { date: string; startTime: string; endTime: string; reason: string }) => void;
  removeBlockedTimeSlot: (profId: string, slotId: string) => void;
  addVacationPeriod: (profId: string, vacation: { startDate: string; endDate: string; reason: string; customNote?: string; returnDate?: string }) => void;
  removeVacationPeriod: (profId: string, vacationId: string) => void;
  addStaffMember: (profId: string, staff: Omit<StaffMember, 'id' | 'createdAt'>) => StaffMember;
  updateStaffMember: (profId: string, staff: StaffMember) => void;
  deleteStaffMember: (profId: string, staffId: string) => void;
  updateLoyaltyConfig: (profId: string, config: LoyaltyConfig) => void;
  createBooking: (bookingData: Omit<Booking, 'id' | 'code' | 'createdAt'>) => Booking;
  createManualBooking: (bookingData: ManualBookingInput) => Booking;
  cancelRecurringSeries: (recurrenceGroupId: string, reason?: string) => void;
  rescheduleBooking: (bookingId: string, newDate: string, newTime: string, newEndTime?: string) => void;
  updateBookingServices: (bookingId: string, newServicesList: { id: string; name: string; price: number; durationMinutes: number; variation?: string }[]) => void;
  confirmBooking: (id: string) => void;
  confirmMessageReceived: (id: string) => void;
  approveAndRequestDeposit: (id: string, deadlineHours?: number) => void;
  confirmDepositReceived: (id: string) => void;
  reopenExpiredSlot: (id: string, reason?: string) => void;
  cancelBooking: (id: string, reason?: string, retainDeposit?: boolean) => void;
  completeBooking: (id: string) => void;
  completeBookingWithPayment: (id: string, method?: PaymentMethod, splitPayments?: SplitPaymentEntry[]) => void;
  updateBooking: (booking: Booking) => void;
  deleteBooking: (id: string) => void;
  markReminderSent: (id: string, templateUsed?: string) => void;
  markAllRemindersSent: (bookingIds: string[], templateUsed?: string) => void;
  addWaitlistEntry: (entry: Omit<WaitlistEntry, 'id' | 'createdAt' | 'status'>) => WaitlistEntry;
  updateWaitlistStatus: (id: string, status: 'waiting' | 'notified' | 'scheduled' | 'booked' | 'cancelled') => void;
  deleteWaitlistEntry: (id: string) => void;
  addReview: (review: Omit<Review, 'id' | 'createdAt'>) => Review;
  payProfessionalSubscription: (profId: string, method?: 'pix' | 'card') => void;
  setProfessionalStatus: (profId: string, status: 'active' | 'inactive' | 'delinquent', daysOverdue?: number) => void;
  createSupportTicket: (ticket: { professionalId: string; professionalName: string; subject: string; message: string }) => void;
  replySupportTicket: (ticketId: string, reply: string) => void;
  holdSlot: (professionalId: string, date: string, time: string, endTime?: string, sessionId?: string) => { success: boolean; expiresAt: number; message?: string };
  releaseSlotHold: (professionalId: string, date: string, time: string, sessionId?: string) => void;
  isSlotHeldByOther: (professionalId: string, date: string, time: string, sessionId?: string) => boolean;
  getHeldSlotsForDay: (professionalId: string, date: string) => SlotHold[];
  resetToDefaults: () => void;
}

const AppStoreContext = createContext<AppStoreContextType | null>(null);

const STORAGE_KEYS = {
  PROFESSIONALS: 'beleza_agendamento_professionals_v1',
  SERVICES: 'beleza_agendamento_services_v1',
  AVAILABILITIES: 'beleza_agendamento_availabilities_v1',
  BOOKINGS: 'beleza_agendamento_bookings_v1',
  TICKETS: 'beleza_agendamento_tickets_v1',
  WAITLIST: 'beleza_agendamento_waitlist_v1',
  REVIEWS: 'beleza_agendamento_reviews_v1',
  GIVEAWAYS: 'beleza_agendamento_giveaways_v1',
  PROMOTIONAL_GIFTS: 'beleza_agendamento_promotional_gifts_v1',
  ROLE: 'beleza_agendamento_role_v1',
  SELECTED_PROF: 'beleza_agendamento_selected_prof_v1',
  IMPERSONATING: 'beleza_agendamento_impersonating_v1',
  THEME_MODE: 'beleza_agendamento_theme_mode_v1',
  AUTH_SESSION: 'beleza_agendamento_auth_session_v1',
  PLAN_PRICING: 'beleza_agendamento_plan_pricing_v1',
  SLOT_HOLDS: 'beleza_agendamento_slot_holds_v1',
  EXPENSES: 'beleza_agendamento_expenses_v1'
};

function getStoredItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Salva no localStorage de forma assíncrona/não-bloqueante
 * para não travar a renderização e o carregamento das páginas.
 */
function safeStorePersist(key: string, value: any) {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(value);
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        try { localStorage.setItem(key, serialized); } catch (e) {}
      });
    } else {
      setTimeout(() => {
        try { localStorage.setItem(key, serialized); } catch (e) {}
      }, 0);
    }
  } catch (e) {}
}

export function normalizeEstablishmentProfiles(profs: Professional[]): Professional[] {
  const initialProf1 = INITIAL_PROFESSIONALS.find(ip => ip.id === 'prof-1')!;
  return profs.map(p => {
    // Garante que o perfil prof-1 ou qualquer menção antiga ao espaço seja o estabelecimento oficial
    if (
      p.id === 'prof-1' || 
      p.name === 'Camila Silva' || 
      p.name === 'Studio MarcaBella' || 
      p.name === 'Studio Camila Nails & Beauty' ||
      p.slug === 'camilasilva-marcabella' || 
      p.slug === 'camila-nails' || 
      p.slug === 'camilasilva' ||
      p.slug === 'marcabella'
    ) {
      const activeStaff = (p.staffMembers && p.staffMembers.length >= 2) ? p.staffMembers : initialProf1.staffMembers;
      return {
        ...p,
        id: 'prof-1',
        name: 'Bella Beauty Studio',
        slug: 'bella-beauty',
        category: 'Salão de Beleza',
        avatarUrl: '/bella.jpg',
        bio: initialProf1.bio,
        instagram: 'https://www.instagram.com',
        email: initialProf1.email,
        phone: '(11) 90000-0001',
        staffMembers: activeStaff
      };
    }
    return p;
  });
}

const DEFAULT_STATE: StoreState = {
  professionals: normalizeEstablishmentProfiles(INITIAL_PROFESSIONALS),
  services: INITIAL_SERVICES,
  availabilities: INITIAL_AVAILABILITIES,
  bookings: INITIAL_BOOKINGS,
  tickets: INITIAL_TICKETS,
  waitlist: INITIAL_WAITLIST,
  reviews: INITIAL_REVIEWS,
  giveaways: INITIAL_GIVEAWAYS,
  promotionalGifts: INITIAL_PROMOTIONAL_GIFTS,
  expenses: [],
  currentRole: 'client',
  selectedProfessionalId: 'prof-1',
  impersonatedByMaster: false,
  themeMode: 'light',
  authenticatedProfId: null,
  globalPlanPricing: DEFAULT_PLAN_PRICING,
  heldSlots: []
};

let storeState: StoreState = DEFAULT_STATE;
let isStoreInitialized = false;
const storeListeners = new Set<() => void>();

function initClientStore() {
  if (typeof window === 'undefined' || isStoreInitialized) return;
  isStoreInitialized = true;
  try {
    const storedProfs = getStoredItem<Professional[] | null>(STORAGE_KEYS.PROFESSIONALS, null);
    const storedServices = getStoredItem<ServiceItem[] | null>(STORAGE_KEYS.SERVICES, null);
    const storedAvail = getStoredItem<AvailabilityConfig[] | null>(STORAGE_KEYS.AVAILABILITIES, null);
    const storedBookings = getStoredItem<Booking[] | null>(STORAGE_KEYS.BOOKINGS, null);
    const storedTickets = getStoredItem<SupportTicket[] | null>(STORAGE_KEYS.TICKETS, null);
    const storedWaitlist = getStoredItem<WaitlistEntry[] | null>(STORAGE_KEYS.WAITLIST, null);
    const storedReviews = getStoredItem<Review[] | null>(STORAGE_KEYS.REVIEWS, null);
    const storedGiveaways = getStoredItem<GiveawayCampaign[] | null>(STORAGE_KEYS.GIVEAWAYS, null);
    const storedGifts = getStoredItem<PromotionalGift[] | null>(STORAGE_KEYS.PROMOTIONAL_GIFTS, null);
    const storedExpenses = getStoredItem<Expense[] | null>(STORAGE_KEYS.EXPENSES, null);
    const storedRole = localStorage.getItem(STORAGE_KEYS.ROLE) as UserRole | null;
    const storedProfId = localStorage.getItem(STORAGE_KEYS.SELECTED_PROF);
    const storedImpersonating = localStorage.getItem(STORAGE_KEYS.IMPERSONATING) === 'true';
    const storedTheme = localStorage.getItem(STORAGE_KEYS.THEME_MODE) as 'light' | 'dark' | null;
    const storedAuthSession = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
    const storedPlanPricing = getStoredItem<PlanPricingConfig | null>(STORAGE_KEYS.PLAN_PRICING, null);
    const storedSlotHolds = getStoredItem<SlotHold[] | null>(STORAGE_KEYS.SLOT_HOLDS, null);

    const initialTheme: 'light' | 'dark' = storedTheme || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', initialTheme === 'dark');
    }

    // Merge default professionals so newly added profiles (e.g. Barber prof-4) are never lost
    let mergedProfs = INITIAL_PROFESSIONALS;
    if (storedProfs && Array.isArray(storedProfs) && storedProfs.length > 0) {
      const existingIds = new Set(storedProfs.map(p => p.id));
      const missingInitial = INITIAL_PROFESSIONALS.filter(p => !existingIds.has(p.id));
      mergedProfs = [...storedProfs, ...missingInitial];
    }

    // Normaliza Bella Beauty Studio como o estabelecimento com equipe
    mergedProfs = normalizeEstablishmentProfiles(mergedProfs);
    safeStorePersist(STORAGE_KEYS.PROFESSIONALS, mergedProfs);

    // Garante que todas as 4 profissionais de teste tenham telefones fictícios seguros (não enviam WhatsApp para pessoas reais)
    const fictionalProfPhones: Record<string, string> = {
      'prof-1': '(11) 90000-0001',
      'prof-2': '(11) 90000-0002',
      'prof-3': '(21) 90000-0003',
      'prof-4': '(11) 90000-0004'
    };
    const fictionalProfPix: Record<string, string> = {
      'prof-2': '11900000002',
      'prof-4': '11900000004'
    };
    mergedProfs = mergedProfs.map(p => {
      const initialProf = INITIAL_PROFESSIONALS.find(ip => ip.id === p.id);
      
      let modifiedProf = { ...p };
      
      // Patch global forces to ensure the establishment name is NOT Camila Silva
      if (modifiedProf.name === 'Camila Silva' || modifiedProf.name === 'Studio MarcaBella' || modifiedProf.name === 'Studio Camila Nails & Beauty') {
        modifiedProf.name = 'Bella Beauty Studio';
      }
      if (modifiedProf.slug === 'camilasilva-marcabella' || modifiedProf.slug === 'camilasilva' || modifiedProf.slug === 'marcabella') {
        modifiedProf.slug = 'bella-beauty';
      }
      if (
        modifiedProf.instagram === '@camilasilva.marcabella' || 
        modifiedProf.instagram === '@marcabella.studio' || 
        modifiedProf.instagram === '@bellabeauty.studio' ||
        modifiedProf.instagram?.includes('bellabeauty.studio')
      ) {
        modifiedProf.instagram = 'https://www.instagram.com';
      }

      if (modifiedProf.id === 'prof-1') {
        const initialP = INITIAL_PROFESSIONALS.find(ip => ip.id === 'prof-1')!;
        return {
          ...modifiedProf,
          name: initialP.name,
          slug: initialP.slug,
          instagram: initialP.instagram,
          email: initialP.email,
          bio: initialP.bio,
          address: initialP.address,
          phone: fictionalProfPhones[modifiedProf.id] || modifiedProf.phone,
          staffMembers: initialP.staffMembers || modifiedProf.staffMembers || []
        };
      }
      
      if (fictionalProfPhones[modifiedProf.id]) {
        return {
          ...modifiedProf,
          phone: fictionalProfPhones[modifiedProf.id],
          ...(fictionalProfPix[modifiedProf.id] ? { pixKey: fictionalProfPix[modifiedProf.id] } : {}),
          staffMembers: (!modifiedProf.staffMembers || modifiedProf.staffMembers.length === 0) ? (initialProf?.staffMembers || []) : modifiedProf.staffMembers
        };
      }
      return {
        ...modifiedProf,
        staffMembers: (!modifiedProf.staffMembers || modifiedProf.staffMembers.length === 0) ? (initialProf?.staffMembers || []) : modifiedProf.staffMembers
      };
    });

    let rawBookings = (storedBookings && Array.isArray(storedBookings)) ? storedBookings : INITIAL_BOOKINGS;
    const fictionalClientPhones: Record<string, string> = {
      'book-1': '(11) 90000-1001',
      'book-2': '(11) 90000-1002',
      'book-3': '(11) 90000-1003',
      'book-4': '(11) 90000-1004',
      'book-5': '(11) 90000-1005',
      'book-6': '(11) 90000-1006',
      'book-7': '(11) 90000-1007',
      'book-8': '(11) 90000-1008'
    };
    
    // Auto-conclusão de atendimentos cujo horário já passou
    const nowIso = new Date();
    const todayStr = nowIso.toISOString().slice(0, 10);
    const nowMinutes = nowIso.getHours() * 60 + nowIso.getMinutes();

    rawBookings = rawBookings.map(b => {
      const updateObj: Partial<Booking> = {};
      if (fictionalClientPhones[b.id]) {
        updateObj.clientPhone = fictionalClientPhones[b.id];
      }
      if (b.professionalId && fictionalProfPhones[b.professionalId]) {
        updateObj.professionalPhone = fictionalProfPhones[b.professionalId];
      }

      // Conclusão automática de atendimentos passados confirmados
      if (b.status === 'confirmed') {
        if (b.date < todayStr) {
          updateObj.status = 'completed';
        } else if (b.date === todayStr) {
          const timeToCheck = b.endTime || b.time || '23:59';
          const [h, m] = timeToCheck.split(':').map(Number);
          const endM = (h || 0) * 60 + (m || 0);
          if (nowMinutes >= endM) {
            updateObj.status = 'completed';
          }
        }
      }

      return Object.keys(updateObj).length > 0 ? { ...b, ...updateObj } : b;
    });

    let mergedServices = INITIAL_SERVICES;
    if (storedServices && Array.isArray(storedServices) && storedServices.length > 0) {
      mergedServices = storedServices.map(s => {
        const matchInit = INITIAL_SERVICES.find(is => is.id === s.id);
        const resolvedImageUrl = s.imageUrl || matchInit?.imageUrl || findBestImageForService(s.name);
        const resolvedImages = (s.images && s.images.length > 0) ? s.images : (matchInit?.images || (resolvedImageUrl ? [resolvedImageUrl] : []));
        return { 
          ...s, 
          imageUrl: resolvedImageUrl,
          images: resolvedImages
        };
      });
    }

    let resolvedAuthSession = storedAuthSession;
    let resolvedRole = storedRole || 'client';

    // Para a conta Master: NUNCA entrar diretamente, sempre exigir credenciais explícitas
    if (storedAuthSession === 'master' || storedRole === 'master') {
      let isMasterSessionActive = false;
      try {
        isMasterSessionActive = sessionStorage.getItem('bella_master_auth_verified') === 'true';
      } catch (e) {}

      if (!isMasterSessionActive) {
        resolvedAuthSession = null;
        resolvedRole = 'client';
        try {
          localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
          localStorage.setItem(STORAGE_KEYS.ROLE, 'client');
        } catch (e) {}
      }
    }

    storeState = {
      professionals: mergedProfs,
      services: mergedServices,
      availabilities: (storedAvail && Array.isArray(storedAvail)) ? storedAvail : INITIAL_AVAILABILITIES,
      bookings: deduplicateBookings(rawBookings),
      tickets: (storedTickets && Array.isArray(storedTickets)) ? storedTickets : INITIAL_TICKETS,
      waitlist: (storedWaitlist && Array.isArray(storedWaitlist)) ? storedWaitlist : INITIAL_WAITLIST,
      reviews: (storedReviews && Array.isArray(storedReviews)) ? storedReviews : INITIAL_REVIEWS,
      giveaways: (storedGiveaways && Array.isArray(storedGiveaways)) ? storedGiveaways : INITIAL_GIVEAWAYS,
      promotionalGifts: (storedGifts && Array.isArray(storedGifts)) ? storedGifts : INITIAL_PROMOTIONAL_GIFTS,
      expenses: (storedExpenses && Array.isArray(storedExpenses)) ? storedExpenses : [],
      currentRole: resolvedRole,
      selectedProfessionalId: storedProfId || 'prof-1',
      impersonatedByMaster: storedImpersonating,
      themeMode: initialTheme,
      authenticatedProfId: resolvedAuthSession || null,
      globalPlanPricing: storedPlanPricing || DEFAULT_PLAN_PRICING,
      heldSlots: (storedSlotHolds && Array.isArray(storedSlotHolds)) ? storedSlotHolds.filter(h => h.expiresAt > Date.now()) : []
    };

    if (typeof document !== 'undefined') {
      const isDark = initialTheme === 'dark';
      document.documentElement.classList.toggle('dark', isDark);
      document.body?.classList.toggle('dark', isDark);
    }
  } catch (e) {
    console.error('Erro ao ler localStorage:', e);
  }
}

export function reloadClientStoreFromStorage() {
  if (typeof window === 'undefined') return;
  try {
    const storedProfs = getStoredItem<Professional[] | null>(STORAGE_KEYS.PROFESSIONALS, null);
    const storedServices = getStoredItem<ServiceItem[] | null>(STORAGE_KEYS.SERVICES, null);
    const storedAvail = getStoredItem<AvailabilityConfig[] | null>(STORAGE_KEYS.AVAILABILITIES, null);
    const storedBookings = getStoredItem<Booking[] | null>(STORAGE_KEYS.BOOKINGS, null);
    const storedTickets = getStoredItem<SupportTicket[] | null>(STORAGE_KEYS.TICKETS, null);
    const storedWaitlist = getStoredItem<WaitlistEntry[] | null>(STORAGE_KEYS.WAITLIST, null);
    const storedReviews = getStoredItem<Review[] | null>(STORAGE_KEYS.REVIEWS, null);
    const storedGiveaways = getStoredItem<GiveawayCampaign[] | null>(STORAGE_KEYS.GIVEAWAYS, null);
    const storedGifts = getStoredItem<PromotionalGift[] | null>(STORAGE_KEYS.PROMOTIONAL_GIFTS, null);
    const storedExpenses = getStoredItem<Expense[] | null>(STORAGE_KEYS.EXPENSES, null);
    const storedRole = localStorage.getItem(STORAGE_KEYS.ROLE) as UserRole | null;
    const storedProfId = localStorage.getItem(STORAGE_KEYS.SELECTED_PROF);
    const storedImpersonating = localStorage.getItem(STORAGE_KEYS.IMPERSONATING) === 'true';
    const storedAuthSession = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
    const storedPlanPricing = getStoredItem<PlanPricingConfig | null>(STORAGE_KEYS.PLAN_PRICING, null);
    const storedSlotHolds = getStoredItem<SlotHold[] | null>(STORAGE_KEYS.SLOT_HOLDS, null);

    let mergedProfs = storeState.professionals;
    if (storedProfs && Array.isArray(storedProfs) && storedProfs.length > 0) {
      const existingIds = new Set(storedProfs.map(p => p.id));
      const missingInitial = INITIAL_PROFESSIONALS.filter(p => !existingIds.has(p.id));
      mergedProfs = [...storedProfs, ...missingInitial];
    }
    mergedProfs = normalizeEstablishmentProfiles(mergedProfs);

    storeState = {
      ...storeState,
      professionals: mergedProfs,
      services: (storedServices && Array.isArray(storedServices)) ? storedServices : storeState.services,
      availabilities: (storedAvail && Array.isArray(storedAvail)) ? storedAvail : storeState.availabilities,
      bookings: (storedBookings && Array.isArray(storedBookings)) ? deduplicateBookings(storedBookings) : deduplicateBookings(storeState.bookings),
      tickets: (storedTickets && Array.isArray(storedTickets)) ? storedTickets : storeState.tickets,
      waitlist: (storedWaitlist && Array.isArray(storedWaitlist)) ? storedWaitlist : storeState.waitlist,
      reviews: (storedReviews && Array.isArray(storedReviews)) ? storedReviews : storeState.reviews,
      giveaways: (storedGiveaways && Array.isArray(storedGiveaways)) ? storedGiveaways : storeState.giveaways,
      promotionalGifts: (storedGifts && Array.isArray(storedGifts)) ? storedGifts : storeState.promotionalGifts,
      currentRole: storedRole || storeState.currentRole,
      selectedProfessionalId: storedProfId || storeState.selectedProfessionalId,
      impersonatedByMaster: storedImpersonating,
      authenticatedProfId: storedAuthSession || storeState.authenticatedProfId,
      globalPlanPricing: storedPlanPricing || storeState.globalPlanPricing || DEFAULT_PLAN_PRICING,
      heldSlots: (storedSlotHolds && Array.isArray(storedSlotHolds)) ? storedSlotHolds.filter(h => h.expiresAt > Date.now()) : (storeState.heldSlots || [])
    };
    storeListeners.forEach(l => l());
  } catch (e) {
    console.error('Erro ao recarregar store:', e);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', () => {
    reloadClientStoreFromStorage();
  });
}

function subscribeToStore(listener: () => void) {
  storeListeners.add(listener);
  return () => {
    storeListeners.delete(listener);
  };
}

function getStoreSnapshot(): StoreState {
  initClientStore();
  return storeState;
}

function getServerStoreSnapshot(): StoreState {
  return DEFAULT_STATE;
}

function emitStoreChange(updater: (prev: StoreState) => StoreState) {
  storeState = updater(storeState);
  storeListeners.forEach(l => l());
}

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const store = useSyncExternalStore(subscribeToStore, getStoreSnapshot, getServerStoreSnapshot);

  // Sincronização em tempo real de agendamentos e profissionais via Firestore
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let unsubBookings: (() => void) | undefined;
    try {
      const bookingsQuery = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(100));
      unsubBookings = onSnapshot(bookingsQuery, (snapshot) => {
        if (!snapshot.empty) {
          const remoteBookings: Booking[] = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data();
            if (data && data.id) {
              remoteBookings.push(data as Booking);
            }
          });

          if (remoteBookings.length > 0) {
            emitStoreChange(prev => {
              const map = new Map<string, Booking>();
              // Mantém os existentes
              prev.bookings.forEach(b => map.set(b.id, b));
              // Mescla/atualiza com os do Firestore
              remoteBookings.forEach(b => map.set(b.id, b));
              const merged = deduplicateBookings(Array.from(map.values()).sort((a, b) => {
                return (b.createdAt || '').localeCompare(a.createdAt || '');
              }));

              // Verifica se houve mudança real antes de disparar re-render
              const isIdentical = prev.bookings.length === merged.length &&
                prev.bookings.every((b, idx) => b.id === merged[idx]?.id && b.status === merged[idx]?.status);

              if (isIdentical) {
                return prev;
              }

              safeStorePersist(STORAGE_KEYS.BOOKINGS, merged);
              return { ...prev, bookings: merged };
            });
          }
        }
      }, (err) => {
        console.warn('Firestore bookings snapshot fallback:', err);
      });
    } catch (err) {
      console.warn('Erro ao conectar listener do Firestore para bookings:', err);
    }

    let unsubProfs: (() => void) | undefined;
    try {
      unsubProfs = onSnapshot(collection(db, 'professionals'), (snapshot) => {
        if (!snapshot.empty) {
          const remoteProfs: Professional[] = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data();
            if (data && data.id) {
              remoteProfs.push(data as Professional);
            }
          });
          if (remoteProfs.length > 0) {
            emitStoreChange(prev => {
              const map = new Map<string, Professional>();
              prev.professionals.forEach(p => map.set(p.id, p));
              remoteProfs.forEach(p => map.set(p.id, p));
              const merged = normalizeEstablishmentProfiles(Array.from(map.values()));

              const isIdentical = prev.professionals.length === merged.length &&
                prev.professionals.every((p, idx) => p.id === merged[idx]?.id && p.status === merged[idx]?.status && p.name === merged[idx]?.name && (p.staffMembers?.length || 0) === (merged[idx]?.staffMembers?.length || 0));

              if (isIdentical) {
                return prev;
              }

              safeStorePersist(STORAGE_KEYS.PROFESSIONALS, merged);
              return { ...prev, professionals: merged };
            });
          }
        }
      }, (err) => {
        console.warn('Firestore profs snapshot fallback:', err);
      });
    } catch (err) {
      console.warn('Erro ao conectar listener do Firestore para profs:', err);
    }

    let unsubSlotHolds: (() => void) | undefined;
    try {
      unsubSlotHolds = onSnapshot(collection(db, 'slot_holds'), (snapshot) => {
        const now = Date.now();
        const remoteHolds: SlotHold[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          if (data && data.id && data.expiresAt && data.expiresAt > now) {
            remoteHolds.push(data as SlotHold);
          }
        });
        emitStoreChange(prev => {
          safeStorePersist(STORAGE_KEYS.SLOT_HOLDS, remoteHolds);
          return { ...prev, heldSlots: remoteHolds };
        });
      }, (err) => {
        console.warn('Firestore slot_holds snapshot fallback:', err);
      });
    } catch (err) {
      console.warn('Erro ao conectar listener de slot_holds:', err);
    }

    return () => {
      if (unsubBookings) unsubBookings();
      if (unsubProfs) unsubProfs();
      if (unsubSlotHolds) unsubSlotHolds();
    };
  }, []);

  const syncFromCloud = async () => {
    try {
      const snap = await getDocs(collection(db, 'bookings'));
      if (!snap.empty) {
        const remoteBookings: Booking[] = [];
        snap.forEach(d => {
          const data = d.data();
          if (data && data.id) remoteBookings.push(data as Booking);
        });
        if (remoteBookings.length > 0) {
          emitStoreChange(prev => {
            const map = new Map<string, Booking>();
            prev.bookings.forEach(b => map.set(b.id, b));
            remoteBookings.forEach(b => map.set(b.id, b));
            const merged = deduplicateBookings(Array.from(map.values()).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
            try {
              localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(merged));
            } catch (e) { console.error(e); }
            return { ...prev, bookings: merged };
          });
        }
      }
    } catch (err) {
      console.warn('Erro ao sincronizar manualmente da nuvem:', err);
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const isDark = store.themeMode === 'dark';
      document.documentElement.classList.toggle('dark', isDark);
      document.body?.classList.toggle('dark', isDark);
    }
  }, [store.themeMode]);

  const setThemeMode = (mode: 'light' | 'dark') => {
    emitStoreChange(prev => {
      try {
        localStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', mode === 'dark');
          document.body?.classList.toggle('dark', mode === 'dark');
        }
      } catch (e) { console.error(e); }
      return { ...prev, themeMode: mode };
    });
  };

  const toggleThemeMode = () => {
    const next = store.themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
  };

  const setRole = (role: UserRole) => {
    emitStoreChange(prev => ({ ...prev, currentRole: role }));
    try {
      localStorage.setItem(STORAGE_KEYS.ROLE, role);
    } catch (e) { console.error(e); }
  };

  const setSelectedProfessionalId = (id: string) => {
    emitStoreChange(prev => ({ ...prev, selectedProfessionalId: id }));
    try {
      localStorage.setItem(STORAGE_KEYS.SELECTED_PROF, id);
    } catch (e) { console.error(e); }
  };

  const getProfessionalBySlug = (slug: string) => {
    if (!slug) return undefined;
    const cleanSlug = slug.toLowerCase().trim();
    const directMatch = store.professionals.find(p => p.slug === cleanSlug);
    if (directMatch) return normalizeEstablishmentProfiles([directMatch])[0];

    // Fallback amigável para URLs antigas (ex: /camilasilva-marcabella, /camila-nails, /camilasilva ou /marcabella)
    if (cleanSlug === 'camilasilva-marcabella' || cleanSlug === 'camila-nails' || cleanSlug === 'camilasilva' || cleanSlug === 'marcabella') {
      const fallback = store.professionals.find(p => p.slug === 'bella-beauty') || store.professionals.find(p => p.id === 'prof-1') || store.professionals[0];
      return fallback ? normalizeEstablishmentProfiles([fallback])[0] : undefined;
    }

    return undefined;
  };

  const getServicesForProf = (profId: string) => {
    return store.services.filter(s => s.professionalId === profId && s.active);
  };

  const getAvailabilityForProf = (profId: string): AvailabilityConfig => {
    const found = store.availabilities.find(a => a.professionalId === profId);
    if (found) {
      return {
        ...found,
        bufferMinutes: found.bufferMinutes ?? 15
      };
    }
    return {
      id: `avail-${profId}`,
      professionalId: profId,
      activeDays: [1, 2, 3, 4, 5, 6],
      startTime: '09:00',
      endTime: '19:00',
      intervalMinutes: 30,
      hasLunchBreak: true,
      lunchStart: '12:00',
      lunchEnd: '13:00',
      bufferMinutes: 15,
      blockedDates: []
    };
  };

  const addService = (serviceData: Omit<ServiceItem, 'id'>): ServiceItem => {
    const newService: ServiceItem = {
      ...serviceData,
      id: `srv-${Date.now()}`
    };
    emitStoreChange(prev => {
      const nextServices = [newService, ...prev.services];
      try {
        localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(nextServices));
      } catch (e) { console.error(e); }
      return { ...prev, services: nextServices };
    });
    return newService;
  };

  const updateService = (updated: ServiceItem) => {
    emitStoreChange(prev => {
      const nextServices = prev.services.map(s => s.id === updated.id ? updated : s);
      try {
        localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(nextServices));
      } catch (e) { console.error(e); }
      return { ...prev, services: nextServices };
    });
  };

  const deleteService = (id: string) => {
    emitStoreChange(prev => {
      const nextServices = prev.services.filter(s => s.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(nextServices));
      } catch (e) { console.error(e); }
      return { ...prev, services: nextServices };
    });
  };

  const addProfessional = (profData: Omit<Professional, 'id'> | Professional): Professional => {
    const profId = ('id' in profData && profData.id) ? profData.id : `prof-${Date.now()}`;
    const trialDaysValue = profData.trialDays || 15;
    const newProf: Professional = {
      ...profData,
      id: profId,
      password: profData.password || '123456',
      createdAt: profData.createdAt || new Date().toISOString(),
      status: profData.status || 'active',
      planType: profData.planType || 'trial',
      trialDays: trialDaysValue,
      trialStartDate: profData.trialStartDate || new Date().toISOString(),
      trialExpiresAt: profData.trialExpiresAt || new Date(Date.now() + trialDaysValue * 24 * 60 * 60 * 1000).toISOString(),
      themeColor: profData.themeColor || 'olive',
      specialties: profData.specialties || [profData.category]
    };

    // Cria serviço padrão se não tiver
    const defaultServices: ServiceItem[] = [
      {
        id: `srv-${Date.now()}-1`,
        professionalId: profId,
        name: `Atendimento ${newProf.category}`,
        description: 'Procedimento completo com materiais esterilizados e atendimento personalizado.',
        durationMinutes: 60,
        price: 80,
        imageUrl: findBestImageForService(`Atendimento ${newProf.category}`, newProf.category),
        requiresDeposit: true,
        depositType: 'fixed',
        depositValue: 30,
        active: true
      },
      {
        id: `srv-${Date.now()}-2`,
        professionalId: profId,
        name: `Manutenção / Sessão Express`,
        description: 'Retoque ou sessão rápida para manter seus cuidados em dia.',
        durationMinutes: 45,
        price: 50,
        imageUrl: findBestImageForService('Manutenção', newProf.category),
        requiresDeposit: false,
        depositType: 'fixed',
        depositValue: 0,
        active: true
      }
    ];

    // Cria disponibilidade padrão para a nova profissional
    const defaultAvail: AvailabilityConfig = {
      id: `avail-${Date.now()}`,
      professionalId: profId,
      activeDays: [1, 2, 3, 4, 5, 6], // Seg a Sab
      startTime: '09:00',
      endTime: '19:00',
      intervalMinutes: 60,
      hasLunchBreak: true,
      lunchStart: '12:00',
      lunchEnd: '13:00',
      blockedDates: [],
      allowedDatesMode: 'all_active_days',
      allowedSpecificDates: []
    };

    emitStoreChange(prev => {
      const nextProfs = [newProf, ...prev.professionals];
      const nextServices = [...defaultServices, ...prev.services];
      const nextAvails = [defaultAvail, ...prev.availabilities];

      try {
        localStorage.setItem(STORAGE_KEYS.PROFESSIONALS, JSON.stringify(nextProfs));
        localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(nextServices));
        localStorage.setItem(STORAGE_KEYS.AVAILABILITIES, JSON.stringify(nextAvails));
      } catch (e) { console.error(e); }

      return {
        ...prev,
        professionals: nextProfs,
        services: nextServices,
        availabilities: nextAvails,
        selectedProfessionalId: profId
      };
    });

    return newProf;
  };

  const updateProfessional = (updated: Professional) => {
    emitStoreChange(prev => {
      // Recalcula data de expiração do teste caso trialDays tenha sido ajustado
      let profToSave = { ...updated };
      if (profToSave.trialDays !== undefined && (!profToSave.planType || profToSave.planType === 'trial')) {
        const createdDate = new Date(profToSave.trialStartDate || profToSave.createdAt || Date.now());
        const totalDays = Number(profToSave.trialDays) + (Number(profToSave.customTrialDaysExtended) || 0);
        profToSave.trialExpiresAt = new Date(createdDate.getTime() + totalDays * 24 * 60 * 60 * 1000).toISOString();
      }

      const exists = prev.professionals.some(p => p.id === profToSave.id);
      const nextProfs = exists 
        ? prev.professionals.map(p => p.id === profToSave.id ? profToSave : p)
        : [profToSave, ...prev.professionals];
      try {
        localStorage.setItem(STORAGE_KEYS.PROFESSIONALS, JSON.stringify(nextProfs));
      } catch (e) { console.error(e); }
      if (typeof window !== 'undefined' && db) {
        setDoc(doc(db, 'professionals', profToSave.id), cleanForFirestore(profToSave), { merge: true }).catch(console.warn);
      }
      return { ...prev, professionals: nextProfs };
    });
  };

  const setProfessionalTheme = (profId: string, themeColor: ThemeColor) => {
    emitStoreChange(prev => {
      const nextProfs = prev.professionals.map(p => {
        if (p.id === profId) {
          return { ...p, themeColor };
        }
        return p;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.PROFESSIONALS, JSON.stringify(nextProfs));
      } catch (e) { console.error(e); }
      return { ...prev, professionals: nextProfs };
    });
  };

  const setProfessionalLayout = (profId: string, layout: PageLayoutTemplate) => {
    emitStoreChange(prev => {
      const nextProfs = prev.professionals.map(p => {
        if (p.id === profId) {
          return { ...p, pageLayoutTemplate: layout };
        }
        return p;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.PROFESSIONALS, JSON.stringify(nextProfs));
      } catch (e) { console.error(e); }
      return { ...prev, professionals: nextProfs };
    });
  };

  const unlockProfessionalLayout = (profId: string, layout: PageLayoutTemplate) => {
    emitStoreChange(prev => {
      const nextProfs = prev.professionals.map(p => {
        if (p.id === profId) {
          const unlocked = new Set(p.unlockedLayouts || ['classic_elegant']);
          unlocked.add(layout);
          return {
            ...p,
            unlockedLayouts: Array.from(unlocked),
            pageLayoutTemplate: layout
          };
        }
        return p;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.PROFESSIONALS, JSON.stringify(nextProfs));
      } catch (e) { console.error(e); }
      return { ...prev, professionals: nextProfs };
    });
  };

  const toggleProfessionalStatus = (id: string) => {
    emitStoreChange(prev => {
      const nextProfs = prev.professionals.map(p => {
        if (p.id === id) {
          const nextStatus: 'active' | 'inactive' = p.status === 'active' ? 'inactive' : 'active';
          return { ...p, status: nextStatus };
        }
        return p;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.PROFESSIONALS, JSON.stringify(nextProfs));
      } catch (e) { console.error(e); }
      return { ...prev, professionals: nextProfs };
    });
  };

  const changeProfessionalPlan = (profId: string, planType: SubscriptionPlanType, billingCycle: PlanBillingCycle = 'monthly') => {
    emitStoreChange(prev => {
      const nextProfs = prev.professionals.map(p => {
        if (p.id === profId) {
          const now = new Date();
          let monthly = 0;
          let fee = 0;
          let trialExpiresAt = p.trialExpiresAt;

          if (planType === 'pro_fixed') {
            monthly = billingCycle === 'bianual' ? 33.90 : billingCycle === 'annual' ? 42.90 : billingCycle === 'semiannual' ? 50.90 : 59.90;
            fee = 0;
          } else if (planType === 'flex_fee') {
            monthly = billingCycle === 'bianual' ? 13.90 : billingCycle === 'annual' ? 17.90 : billingCycle === 'semiannual' ? 21.15 : 24.90;
            fee = 0.99;
          } else if (planType === 'trial') {
            monthly = 0;
            fee = 0;
            const trialDaysAmount = p.trialDays || 15;
            trialExpiresAt = new Date(Date.now() + trialDaysAmount * 24 * 60 * 60 * 1000).toISOString();
          }

          return {
            ...p,
            planType,
            planBillingCycle: billingCycle,
            planMonthlyPrice: monthly,
            feePerBooking: fee,
            planActivatedAt: now.toISOString(),
            trialExpiresAt: planType === 'trial' ? trialExpiresAt : p.trialExpiresAt
          };
        }
        return p;
      });

      try {
        localStorage.setItem(STORAGE_KEYS.PROFESSIONALS, JSON.stringify(nextProfs));
      } catch (e) { console.error(e); }
      if (typeof window !== 'undefined' && db) {
        const target = nextProfs.find(p => p.id === profId);
        if (target) {
          setDoc(doc(db, 'professionals', profId), cleanForFirestore(target), { merge: true }).catch(console.warn);
        }
      }
      return { ...prev, professionals: nextProfs };
    });
  };

  const updateGlobalPlanPricing = (config: Partial<PlanPricingConfig>, applyToAllExisting = false, fullSaaSPricing?: any) => {
    emitStoreChange(prev => {
      const nextPricing: PlanPricingConfig = {
        ...prev.globalPlanPricing,
        ...config,
        ...(config.trialDays !== undefined ? { trialDays: config.trialDays, trialDaysDefault: config.trialDays } : {})
      };

      // Atualiza profissionais
      let nextProfs = prev.professionals.map(p => {
        let updatedProf = { ...p };

        // Sempre atualiza o trialDays dos profissionais em degustação (trial) ou sem plano ativo
        if ((!updatedProf.planType || updatedProf.planType === 'trial') && config.trialDays !== undefined) {
          const daysToApply = Number(config.trialDays);
          updatedProf.trialDays = daysToApply;
          if (applyToAllExisting) {
            // Renova o teste a partir de hoje com a nova quantidade de dias
            updatedProf.trialStartDate = new Date().toISOString();
            updatedProf.trialExpiresAt = new Date(Date.now() + daysToApply * 24 * 60 * 60 * 1000).toISOString();
            updatedProf.customTrialDaysExtended = 0;
          } else {
            const createdDate = new Date(updatedProf.trialStartDate || updatedProf.createdAt || Date.now());
            const totalDays = daysToApply + (Number(updatedProf.customTrialDaysExtended) || 0);
            updatedProf.trialExpiresAt = new Date(createdDate.getTime() + totalDays * 24 * 60 * 60 * 1000).toISOString();
          }
        }

        if (applyToAllExisting) {
          const sp = fullSaaSPricing || {};
          const cycle = updatedProf.planBillingCycle || 'monthly';
          if (updatedProf.planType === 'flex_fee') {
            const base = cycle === 'bianual'
              ? (sp.flexBaseBianual ?? (nextPricing.flexFeeMonthly * 0.57))
              : cycle === 'annual'
                ? (sp.flexBaseAnnual ?? (nextPricing.flexFeeMonthly * 0.72))
                : cycle === 'semiannual'
                  ? (sp.flexBaseSemiannual ?? (nextPricing.flexFeeMonthly * 0.85))
                  : (sp.flexBaseMonthly ?? nextPricing.flexFeeMonthly);
            updatedProf.planMonthlyPrice = Math.round(Number(base) * 100) / 100;
            updatedProf.feePerBooking = sp.flexFeePerBooking !== undefined ? Number(sp.flexFeePerBooking) : nextPricing.flexFeeBookingCharge;
          } else {
            // pro_fixed ou trial/degustação
            const monthly = cycle === 'bianual'
              ? (sp.proFixedBianual ?? (nextPricing.proFixedMonthly * 0.57))
              : cycle === 'annual'
                ? (sp.proFixedAnnual ?? nextPricing.proFixedAnnual)
                : cycle === 'semiannual'
                  ? (sp.proFixedSemiannual ?? (nextPricing.proFixedMonthly * 0.85))
                  : (sp.proFixedMonthly ?? nextPricing.proFixedMonthly);
            updatedProf.planMonthlyPrice = Math.round(Number(monthly) * 100) / 100;
            updatedProf.feePerBooking = 0;
          }
        }

        return updatedProf;
      });

      try {
        localStorage.setItem(STORAGE_KEYS.PROFESSIONALS, JSON.stringify(nextProfs));
        localStorage.setItem(STORAGE_KEYS.PLAN_PRICING, JSON.stringify(nextPricing));
        if (fullSaaSPricing) {
          localStorage.setItem('bellahora_saas_pricing_v1', JSON.stringify(fullSaaSPricing));
        }
      } catch (e) { console.error(e); }

      // Persiste no Firestore para sincronização em tempo real permanente
      if (typeof window !== 'undefined' && db) {
        try {
          nextProfs.forEach(p => {
            setDoc(doc(db, 'professionals', p.id), cleanForFirestore(p), { merge: true }).catch(console.warn);
          });
          setDoc(doc(db, 'settings', 'globalPlanPricing'), cleanForFirestore(nextPricing), { merge: true }).catch(console.warn);
          if (fullSaaSPricing) {
            setDoc(doc(db, 'settings', 'saasPricing'), cleanForFirestore(fullSaaSPricing), { merge: true }).catch(console.warn);
          }
        } catch (e) {
          console.warn('Erro ao salvar no Firestore:', e);
        }
      }

      return {
        ...prev,
        globalPlanPricing: nextPricing,
        professionals: nextProfs
      };
    });
  };

  const updateProfessionalCustomPlan = (profId: string, customPricing: {
    planType?: SubscriptionPlanType;
    planMonthlyPrice?: number;
    feePerBooking?: number;
    planBillingCycle?: PlanBillingCycle;
    trialDays?: number;
    customTrialDaysExtended?: number;
    hasCustomBackgroundAddon?: boolean;
    customBackgroundEnabled?: boolean;
  }) => {
    emitStoreChange(prev => {
      let savedProf: Professional | null = null;
      const nextProfs = prev.professionals.map(p => {
        if (p.id === profId) {
          const updated: Professional = {
            ...p,
            ...(customPricing.planType !== undefined ? { planType: customPricing.planType } : {}),
            ...(customPricing.planMonthlyPrice !== undefined ? { planMonthlyPrice: customPricing.planMonthlyPrice } : {}),
            ...(customPricing.feePerBooking !== undefined ? { feePerBooking: customPricing.feePerBooking } : {}),
            ...(customPricing.planBillingCycle !== undefined ? { planBillingCycle: customPricing.planBillingCycle } : {}),
            ...(customPricing.trialDays !== undefined ? { trialDays: customPricing.trialDays } : {}),
            ...(customPricing.customTrialDaysExtended !== undefined ? { customTrialDaysExtended: customPricing.customTrialDaysExtended } : {}),
            ...(customPricing.hasCustomBackgroundAddon !== undefined ? { hasCustomBackgroundAddon: customPricing.hasCustomBackgroundAddon } : {}),
            ...(customPricing.customBackgroundEnabled !== undefined ? { customBackgroundEnabled: customPricing.customBackgroundEnabled,
            customTrialDaysExtended: customPricing.customTrialDaysExtended !== undefined ? customPricing.customTrialDaysExtended : p.customTrialDaysExtended } : {})
          };
          if (customPricing.trialDays !== undefined || customPricing.customTrialDaysExtended !== undefined) {
            const createdDate = new Date(updated.trialStartDate || updated.createdAt || Date.now());
            const totalDays = Number(updated.trialDays ?? 15) + (Number(updated.customTrialDaysExtended) || 0);
            updated.trialExpiresAt = new Date(createdDate.getTime() + totalDays * 24 * 60 * 60 * 1000).toISOString();
          }
          savedProf = updated;
          return updated;
        }
        return p;
      });

      try {
        localStorage.setItem(STORAGE_KEYS.PROFESSIONALS, JSON.stringify(nextProfs));
      } catch (e) { console.error(e); }

      if (typeof window !== 'undefined' && db && savedProf) {
        setDoc(doc(db, 'professionals', profId), cleanForFirestore(savedProf), { merge: true }).catch(console.warn);
      }

      return { ...prev, professionals: nextProfs };
    });
  };

  const setProfessionalSystemMode = (profId: string, mode: 'simple' | 'complete') => {
    emitStoreChange(prev => {
      const nextProfs = prev.professionals.map(p => {
        if (p.id === profId) {
          return { ...p, systemMode: mode };
        }
        return p;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.PROFESSIONALS, JSON.stringify(nextProfs));
      } catch (e) { console.error(e); }
      return { ...prev, professionals: nextProfs };
    });
  };

  const updateAllowedDates = (profId: string, mode: 'all_active_days' | 'specific_dates', dates: string[]) => {
    emitStoreChange(prev => {
      const exists = prev.availabilities.some(a => a.professionalId === profId);
      let nextAvails: AvailabilityConfig[];
      if (exists) {
        nextAvails = prev.availabilities.map(a => {
          if (a.professionalId === profId) {
            return {
              ...a,
              allowedDatesMode: mode,
              allowedSpecificDates: dates
            };
          }
          return a;
        });
      } else {
        const newAvail: AvailabilityConfig = {
          id: `avail-${Date.now()}`,
          professionalId: profId,
          activeDays: [1, 2, 3, 4, 5, 6],
          startTime: '08:00',
          endTime: '19:00',
          intervalMinutes: 60,
          hasLunchBreak: true,
          lunchStart: '12:00',
          lunchEnd: '13:00',
          blockedDates: [],
          allowedDatesMode: mode,
          allowedSpecificDates: dates
        };
        nextAvails = [newAvail, ...prev.availabilities];
      }
      try {
        localStorage.setItem(STORAGE_KEYS.AVAILABILITIES, JSON.stringify(nextAvails));
      } catch (e) { console.error(e); }
      return { ...prev, availabilities: nextAvails };
    });
  };

  const extendTrialDays = (profId: string, extraDays: number) => {
    emitStoreChange(prev => {
      const nextProfs = prev.professionals.map(p => {
        if (p.id === profId) {
          const currentExpiry = p.trialExpiresAt ? new Date(p.trialExpiresAt).getTime() : Date.now();
          const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
          const newExpiry = new Date(baseTime + extraDays * 24 * 60 * 60 * 1000).toISOString();
          return {
            ...p,
            planType: 'trial' as const,
            customTrialDaysExtended: (p.customTrialDaysExtended || 0) + extraDays,
            trialExpiresAt: newExpiry
          };
        }
        return p;
      });

      try {
        localStorage.setItem(STORAGE_KEYS.PROFESSIONALS, JSON.stringify(nextProfs));
      } catch (e) { console.error(e); }
      return { ...prev, professionals: nextProfs };
    });
  };

  const updateAvailability = (config: AvailabilityConfig) => {
    emitStoreChange(prev => {
      const idx = prev.availabilities.findIndex(a => a.professionalId === config.professionalId);
      let nextAvail: AvailabilityConfig[];
      if (idx >= 0) {
        nextAvail = [...prev.availabilities];
        nextAvail[idx] = config;
      } else {
        nextAvail = [...prev.availabilities, config];
      }
      try {
        localStorage.setItem(STORAGE_KEYS.AVAILABILITIES, JSON.stringify(nextAvail));
      } catch (e) { console.error(e); }
      return { ...prev, availabilities: nextAvail };
    });
  };

  const generateBookingCode = (prof?: Professional): string => {
    let prefix = 'BE';
    if (prof) {
      if (prof.bookingCodePrefix && prof.bookingCodePrefix.trim().length >= 2) {
        prefix = prof.bookingCodePrefix.trim().toUpperCase().slice(0, 3);
      } else if (prof.name) {
        const cleanName = prof.name.replace(/[^a-zA-Z]/g, '').toUpperCase();
        prefix = (cleanName.slice(0, 3) || 'BE').padEnd(3, 'X');
      }
    }
    const randomCodeNumber = Math.floor(10000 + Math.random() * 90000);
    return `#${prefix}-${randomCodeNumber}`;
  };

  const createBooking = (bookingData: Omit<Booking, 'id' | 'code' | 'createdAt'>): Booking => {
    const prof = store.professionals.find(p => p.id === bookingData.professionalId);
    const code = generateBookingCode(prof);
    const newBooking: Booking = {
      ...bookingData,
      id: `book-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      code,
      createdAt: new Date().toISOString()
    };
    emitStoreChange(prev => {
      const nextBookings = deduplicateBookings([newBooking, ...prev.bookings]);
      try {
        localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(nextBookings));
      } catch (e) { console.error(e); }
      return { ...prev, bookings: nextBookings };
    });

    // Gravação direta no Firestore para que apareça instantaneamente no painel da profissional
    try {
      setDoc(doc(db, 'bookings', newBooking.id), cleanForFirestore(newBooking)).catch(err => {
        console.warn('Firestore setDoc erro:', err);
      });
    } catch (e) {
      console.warn('Erro ao gravar booking no Firestore:', e);
    }

    // Libera qualquer slot temporário segurado após a confirmação do agendamento
    if (newBooking.time) {
      releaseSlotHold(newBooking.professionalId, newBooking.date, newBooking.time);
    }

    return newBooking;
  };

  const holdSlot = (
    professionalId: string, 
    date: string, 
    time: string, 
    endTime?: string, 
    sessionId?: string
  ): { success: boolean; expiresAt: number; message?: string } => {
    let sess = sessionId;
    if (!sess && typeof window !== 'undefined') {
      sess = sessionStorage.getItem('client_booking_session_id') || `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      sessionStorage.setItem('client_booking_session_id', sess);
    }
    if (!sess) sess = 'anonymous';

    const now = Date.now();
    const holdDurationMs = 5 * 60 * 1000; // 5 minutos de retenção temporária na fila
    const expiresAt = now + holdDurationMs;

    // Filtra holds ativos não expirados
    const currentHolds = (storeState.heldSlots || []).filter(h => h.expiresAt > now);

    // Conflito com agendamentos existentes ativos
    const hasBookingConflict = (storeState.bookings || []).some(b => {
      if (b.status === 'cancelled') return false;
      const isProf = b.professionalId === professionalId;
      return isProf && b.date === date && b.time === time;
    });

    if (hasBookingConflict) {
      return { 
        success: false, 
        expiresAt: 0, 
        message: 'Este horário acabou de ser confirmado por outra cliente. Por favor, selecione outro horário disponível.' 
      };
    }

    // Conflito com hold de outro cliente ativo
    const otherHold = currentHolds.find(h => 
      h.professionalId === professionalId && 
      h.date === date && 
      h.time === time && 
      h.sessionId !== sess
    );

    if (otherHold) {
      return { 
        success: false, 
        expiresAt: otherHold.expiresAt, 
        message: 'Este horário está sendo preenchido por outra cliente no momento. Caso ela não conclua em instantes, o horário será liberado automaticamente.' 
      };
    }

    const newHold: SlotHold = {
      id: `hold-${professionalId}-${date}-${time.replace(':', '')}`,
      professionalId,
      date,
      time,
      endTime,
      createdAt: now,
      expiresAt,
      sessionId: sess
    };

    const nextHolds = [
      ...currentHolds.filter(h => !(h.professionalId === professionalId && h.date === date && h.time === time)),
      newHold
    ];

    emitStoreChange(prev => {
      try {
        localStorage.setItem(STORAGE_KEYS.SLOT_HOLDS, JSON.stringify(nextHolds));
      } catch (e) { console.error(e); }
      return { ...prev, heldSlots: nextHolds };
    });

    try {
      setDoc(doc(db, 'slot_holds', newHold.id), cleanForFirestore(newHold)).catch(console.warn);
    } catch (e) {}

    return { success: true, expiresAt };
  };

  const releaseSlotHold = (professionalId: string, date: string, time: string, sessionId?: string) => {
    let sess = sessionId;
    if (!sess && typeof window !== 'undefined') {
      sess = sessionStorage.getItem('client_booking_session_id') || undefined;
    }
    const now = Date.now();
    const holdId = `hold-${professionalId}-${date}-${time.replace(':', '')}`;

    emitStoreChange(prev => {
      const nextHolds = (prev.heldSlots || []).filter(h => {
        if (h.expiresAt <= now) return false;
        if (h.professionalId === professionalId && h.date === date && h.time === time) {
          if (!sess || h.sessionId === sess) return false;
        }
        return true;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.SLOT_HOLDS, JSON.stringify(nextHolds));
      } catch (e) { console.error(e); }
      return { ...prev, heldSlots: nextHolds };
    });

    try {
      deleteDoc(doc(db, 'slot_holds', holdId)).catch(console.warn);
    } catch (e) {}
  };

  const isSlotHeldByOther = (professionalId: string, date: string, time: string, sessionId?: string): boolean => {
    let sess = sessionId;
    if (!sess && typeof window !== 'undefined') {
      sess = sessionStorage.getItem('client_booking_session_id') || undefined;
    }
    const now = Date.now();
    return (storeState.heldSlots || []).some(h => 
      h.expiresAt > now &&
      h.professionalId === professionalId && 
      h.date === date && 
      h.time === time && 
      (sess ? h.sessionId !== sess : true)
    );
  };

  const getHeldSlotsForDay = (professionalId: string, date: string): SlotHold[] => {
    const now = Date.now();
    return (storeState.heldSlots || []).filter(h => 
      h.expiresAt > now &&
      h.professionalId === professionalId && 
      h.date === date
    );
  };

  const updateBookingServices = (bookingId: string, newServicesList: { id: string; name: string; price: number; durationMinutes: number; variation?: string }[]) => {
    emitStoreChange(prev => {
      const nextBookings = prev.bookings.map(b => {
        if (b.id === bookingId) {
          const totalPrice = newServicesList.reduce((acc, s) => acc + s.price, 0);
          const totalDuration = newServicesList.reduce((acc, s) => acc + s.durationMinutes, 0);
          
          // Recalculate end time
          let endTime = b.endTime;
          if (b.time) {
            const [h, m] = b.time.split(':').map(Number);
            const totalMins = h * 60 + m + totalDuration;
            const endH = Math.floor(totalMins / 60) % 24;
            const endM = totalMins % 60;
            endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
          }

          return {
            ...b,
            servicesList: newServicesList,
            serviceId: newServicesList[0]?.id || b.serviceId,
            serviceName: newServicesList.length > 1 ? 'Combo Personalizado' : newServicesList[0]?.name || b.serviceName,
            serviceVariation: newServicesList.length === 1 ? newServicesList[0].variation : undefined,
            totalPrice,
            serviceDuration: totalDuration,
            endTime
          };
        }
        return b;
      });
      return { ...prev, bookings: nextBookings };
    });
  };

  const confirmBooking = (id: string) => {
    let targetBooking: Booking | undefined;
    emitStoreChange(prev => {
      const nextBookings = prev.bookings.map(b => {
        if (b.id === id) {
          targetBooking = {
            ...b,
            status: 'confirmed' as const,
            depositPaid: b.depositRequired ? true : b.depositPaid,
            depositStatus: b.depositRequired ? ('paid' as const) : b.depositStatus
          };
          return targetBooking;
        }
        return b;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(nextBookings));
      } catch (e) { console.error(e); }
      return { ...prev, bookings: nextBookings };
    });

    if (targetBooking) {
      try {
        setDoc(doc(db, 'bookings', id), cleanForFirestore(targetBooking), { merge: true }).catch(console.warn);
      } catch (e) { console.warn(e); }
    }
  };

  const approveAndRequestDeposit = (id: string, deadlineHours: number = 2) => {
    let targetBooking: Booking | undefined;
    emitStoreChange(prev => {
      const deadlineDate = new Date(Date.now() + deadlineHours * 60 * 60 * 1000).toISOString();
      const nextBookings = prev.bookings.map(b => {
        if (b.id === id) {
          if (b.depositRequired) {
            targetBooking = {
              ...b,
              status: 'awaiting_deposit' as const,
              depositDeadlineHours: deadlineHours,
              depositDeadlineAt: deadlineDate,
              depositApprovedAt: new Date().toISOString(),
              depositStatus: 'pending' as const
            };
          } else {
            targetBooking = {
              ...b,
              status: 'confirmed' as const,
              depositApprovedAt: new Date().toISOString()
            };
          }
          return targetBooking;
        }
        return b;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(nextBookings));
      } catch (e) { console.error(e); }
      return { ...prev, bookings: nextBookings };
    });

    if (targetBooking) {
      try {
        setDoc(doc(db, 'bookings', id), cleanForFirestore(targetBooking), { merge: true }).catch(console.warn);
      } catch (e) { console.warn(e); }
    }
  };

  const confirmDepositReceived = (id: string) => {
    let targetBooking: Booking | undefined;
    emitStoreChange(prev => {
      const nextBookings = prev.bookings.map(b => {
        if (b.id === id) {
          targetBooking = {
            ...b,
            status: 'confirmed' as const,
            depositPaid: true,
            depositStatus: 'paid' as const,
            depositPaidAt: new Date().toISOString()
          };
          return targetBooking;
        }
        return b;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(nextBookings));
      } catch (e) { console.error(e); }
      return { ...prev, bookings: nextBookings };
    });

    if (targetBooking) {
      try {
        setDoc(doc(db, 'bookings', id), cleanForFirestore(targetBooking), { merge: true }).catch(console.warn);
      } catch (e) { console.warn(e); }
    }
  };

  const reopenExpiredSlot = (id: string, reason?: string) => {
    let targetBooking: Booking | undefined;
    emitStoreChange(prev => {
      const nextBookings = prev.bookings.map(b => {
        if (b.id === id) {
          targetBooking = {
            ...b,
            status: 'cancelled' as const,
            cancellationReason: reason || 'Prazo de pagamento do sinal expirado (horário reaberto)',
            cancelledAt: new Date().toISOString(),
            depositStatus: 'refunded' as const
          };
          return targetBooking;
        }
        return b;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(nextBookings));
      } catch (e) { console.error(e); }
      return { ...prev, bookings: nextBookings };
    });

    if (targetBooking) {
      try {
        setDoc(doc(db, 'bookings', id), cleanForFirestore(targetBooking), { merge: true }).catch(console.warn);
      } catch (e) { console.warn(e); }
    }
  };

  const cancelBooking = (id: string, reason?: string, retainDeposit: boolean = false) => {
    let targetBooking: Booking | undefined;
    emitStoreChange(prev => {
      const nextBookings = prev.bookings.map(b => {
        if (b.id === id) {
          targetBooking = {
            ...b,
            status: 'cancelled' as const,
            cancellationReason: reason || 'Cancelado a pedido',
            cancelledAt: new Date().toISOString(),
            depositStatus: retainDeposit ? ('retained' as const) : (b.depositPaid ? ('refunded' as const) : undefined)
          };
          return targetBooking;
        }
        return b;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(nextBookings));
      } catch (e) { console.error(e); }
      return { ...prev, bookings: nextBookings };
    });

    if (targetBooking) {
      try {
        setDoc(doc(db, 'bookings', id), cleanForFirestore(targetBooking), { merge: true }).catch(console.warn);
      } catch (e) { console.warn(e); }
    }
  };

  const completeBooking = (id: string) => {
    let targetBooking: Booking | undefined;
    emitStoreChange(prev => {
      const nextBookings = prev.bookings.map(b => {
        if (b.id === id) {
          targetBooking = {
            ...b,
            status: 'completed' as const
          };
          return targetBooking;
        }
        return b;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(nextBookings));
      } catch (e) { console.error(e); }
      return { ...prev, bookings: nextBookings };
    });

    if (targetBooking) {
      try {
        setDoc(doc(db, 'bookings', id), cleanForFirestore(targetBooking), { merge: true }).catch(console.warn);
      } catch (e) { console.warn(e); }
    }
  };

  const rescheduleBooking = (bookingId: string, newDate: string, newTime: string, newEndTime?: string) => {
    let targetBooking: Booking | undefined;
    emitStoreChange(prev => {
      const nextBookings = prev.bookings.map(b => {
        if (b.id === bookingId) {
          targetBooking = {
            ...b,
            date: newDate,
            time: newTime,
            endTime: newEndTime || b.endTime,
            rescheduledFrom: {
              date: b.date,
              time: b.time,
              at: new Date().toISOString()
            },
            notes: b.notes 
              ? `${b.notes} • Reagendado de ${b.date} às ${b.time} para ${newDate} às ${newTime}`
              : `Reagendado de ${b.date} às ${b.time} para ${newDate} às ${newTime}`
          };
          return targetBooking;
        }
        return b;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(nextBookings));
      } catch (e) { console.error(e); }
      return { ...prev, bookings: nextBookings };
    });

    if (targetBooking) {
      try {
        setDoc(doc(db, 'bookings', bookingId), cleanForFirestore(targetBooking), { merge: true }).catch(console.warn);
      } catch (e) { console.warn(e); }
    }
  };

  const confirmMessageReceived = (id: string) => {
    emitStoreChange(prev => {
      const nextBookings = prev.bookings.map(b => {
        if (b.id === id) {
          return {
            ...b,
            clientConfirmedMessageReceived: true
          };
        }
        return b;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(nextBookings));
      } catch (e) { console.error(e); }
      return { ...prev, bookings: nextBookings };
    });
  };

  const updateBooking = (updated: Booking) => {
    emitStoreChange(prev => {
      const nextBookings = prev.bookings.map(b => b.id === updated.id ? updated : b);
      try {
        localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(nextBookings));
      } catch (e) { console.error(e); }
      return { ...prev, bookings: nextBookings };
    });
    try {
      setDoc(doc(db, 'bookings', updated.id), cleanForFirestore(updated), { merge: true }).catch(console.warn);
    } catch (e) { console.warn(e); }
  };

  const deleteBooking = (id: string) => {
    emitStoreChange(prev => {
      const nextBookings = prev.bookings.filter(b => b.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(nextBookings));
      } catch (e) { console.error(e); }
      return { ...prev, bookings: nextBookings };
    });
    try {
      deleteDoc(doc(db, 'bookings', id)).catch(console.warn);
    } catch (e) { console.warn(e); }
  };

  const markReminderSent = (id: string, templateUsed?: string) => {
    emitStoreChange(prev => {
      const nextBookings = prev.bookings.map(b => {
        if (b.id === id) {
          return {
            ...b,
            reminderSent: true,
            reminderSentAt: new Date().toISOString(),
            reminderTemplateUsed: templateUsed || b.reminderTemplateUsed || 'friendly'
          };
        }
        return b;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(nextBookings));
      } catch (e) { console.error(e); }
      return { ...prev, bookings: nextBookings };
    });
  };

  const markAllRemindersSent = (bookingIds: string[], templateUsed?: string) => {
    const idsSet = new Set(bookingIds);
    emitStoreChange(prev => {
      const nextBookings = prev.bookings.map(b => {
        if (idsSet.has(b.id)) {
          return {
            ...b,
            reminderSent: true,
            reminderSentAt: new Date().toISOString(),
            reminderTemplateUsed: templateUsed || b.reminderTemplateUsed || 'friendly'
          };
        }
        return b;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(nextBookings));
      } catch (e) { console.error(e); }
      return { ...prev, bookings: nextBookings };
    });
  };

  const createSupportTicket = (ticket: { professionalId: string; professionalName: string; subject: string; message: string }) => {
    const newTicket: SupportTicket = {
      id: `tkt-${Date.now()}`,
      professionalId: ticket.professionalId,
      professionalName: ticket.professionalName,
      subject: ticket.subject,
      message: ticket.message,
      status: 'open',
      createdAt: new Date().toISOString()
    };
    emitStoreChange(prev => {
      const nextTickets = [newTicket, ...prev.tickets];
      try {
        localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(nextTickets));
      } catch (e) { console.error(e); }
      return { ...prev, tickets: nextTickets };
    });
  };

  const replySupportTicket = (ticketId: string, reply: string) => {
    emitStoreChange(prev => {
      const nextTickets = prev.tickets.map(t => {
        if (t.id === ticketId) {
          return {
            ...t,
            reply,
            status: 'answered' as const,
            answeredAt: new Date().toISOString()
          };
        }
        return t;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(nextTickets));
      } catch (e) { console.error(e); }
      return { ...prev, tickets: nextTickets };
    });
  };

  const loginAsProfessional = (identifier: string, pass: string): { success: boolean; message?: string; professional?: Professional } => {
    const trimmedId = identifier.trim().toLowerCase();
    const inputDigits = identifier.replace(/\D/g, '');

    const found = store.professionals.find(p => {
      const pEmail = (p.email || '').trim().toLowerCase();
      const pSlug = (p.slug || '').trim().toLowerCase();
      const pName = (p.name || '').trim().toLowerCase();
      const pPhoneDigits = (p.phone || '').replace(/\D/g, '');

      return (
        pEmail === trimmedId ||
        pSlug === trimmedId ||
        pName === trimmedId ||
        (inputDigits.length >= 8 && pPhoneDigits.includes(inputDigits))
      );
    });

    if (!found) {
      return { success: false, message: 'Profissional não encontrado. Verifique seu e-mail, WhatsApp ou link da agenda.' };
    }

    if (found.status === 'inactive') {
      return { success: false, message: 'Seu cadastro está inativo. Entre em contato com o suporte master.' };
    }

    const expectedPass = found.password || '123456';
    if (pass !== expectedPass && pass !== '123456') {
      return { success: false, message: 'Senha incorreta. A senha padrão de demonstração é 123456.' };
    }

    emitStoreChange(prev => ({
      ...prev,
      authenticatedProfId: found.id,
      selectedProfessionalId: found.id,
      currentRole: 'professional',
      impersonatedByMaster: false
    }));

    try {
      localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, found.id);
      localStorage.setItem(STORAGE_KEYS.SELECTED_PROF, found.id);
      localStorage.setItem(STORAGE_KEYS.ROLE, 'professional');
    } catch (e) { console.error(e); }

    return { success: true, professional: found };
  };

  const checkPrefixAvailability = (prefix: string, currentProfId?: string): { available: boolean; takenBy?: string } => {
    const clean = prefix.trim().toUpperCase();
    if (!clean) return { available: true };
    const found = store.professionals.find(p => p.id !== currentProfId && (p.bookingCodePrefix || '').toUpperCase() === clean);
    if (found) {
      return { available: false, takenBy: found.name };
    }
    return { available: true };
  };

  const loginAsMaster = (loginOrPass: string, pass?: string): { success: boolean; message?: string } => {
    let cleanLogin = 'admin';
    let cleanPass = loginOrPass ? loginOrPass.trim() : '';

    if (pass !== undefined) {
      cleanLogin = loginOrPass.trim().toLowerCase();
      cleanPass = pass.trim();

      const validLogins = ['admin', 'master', 'secao10@gmail.com'];
      if (!validLogins.includes(cleanLogin)) {
        return { success: false, message: 'Usuário ou e-mail de administrador incorreto.' };
      }
    }

    const validPasswords = ['master2026', 'master2025', 'admin123', 'Mudar@123'];
    if (!validPasswords.includes(cleanPass)) {
      return { success: false, message: 'Senha Master incorreta.' };
    }

    emitStoreChange(prev => ({
      ...prev,
      authenticatedProfId: 'master',
      currentRole: 'master',
      impersonatedByMaster: false
    }));

    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('bella_master_auth_verified', 'true');
      }
      localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, 'master');
      localStorage.setItem(STORAGE_KEYS.ROLE, 'master');
    } catch (e) { console.error(e); }

    return { success: true };
  };

  const logout = () => {
    emitStoreChange(prev => ({
      ...prev,
      authenticatedProfId: null,
      currentRole: 'client',
      impersonatedByMaster: false
    }));
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('bella_master_auth_verified');
      }
      localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
      localStorage.removeItem(STORAGE_KEYS.IMPERSONATING);
      localStorage.setItem(STORAGE_KEYS.ROLE, 'client');
    } catch (e) { console.error(e); }
  };

  const startImpersonation = (profId: string) => {
    emitStoreChange(prev => ({
      ...prev,
      authenticatedProfId: profId,
      selectedProfessionalId: profId,
      currentRole: 'professional',
      impersonatedByMaster: true
    }));
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, profId);
      localStorage.setItem(STORAGE_KEYS.SELECTED_PROF, profId);
      localStorage.setItem(STORAGE_KEYS.ROLE, 'professional');
      localStorage.setItem(STORAGE_KEYS.IMPERSONATING, 'true');
    } catch (e) { console.error(e); }
  };

  const stopImpersonation = () => {
    emitStoreChange(prev => ({
      ...prev,
      authenticatedProfId: 'master',
      currentRole: 'master',
      impersonatedByMaster: false
    }));
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, 'master');
      localStorage.setItem(STORAGE_KEYS.ROLE, 'master');
      localStorage.removeItem(STORAGE_KEYS.IMPERSONATING);
    } catch (e) { console.error(e); }
  };

  const setTenantStatus = (id: string, status: 'active' | 'inactive' | 'delinquent') => {
    emitStoreChange(prev => {
      const nextProfs = prev.professionals.map(p => p.id === id ? { ...p, status } : p);
      try {
        localStorage.setItem(STORAGE_KEYS.PROFESSIONALS, JSON.stringify(nextProfs));
      } catch (e) { console.error(e); }
      return { ...prev, professionals: nextProfs };
    });
  };

  const resetTenantPassword = (id: string, newPass?: string) => {
    const generated = newPass || `Bella@${Math.floor(1000 + Math.random() * 9000)}`;
    emitStoreChange(prev => {
      const nextProfs = prev.professionals.map(p => p.id === id ? { ...p, password: generated } : p);
      try {
        localStorage.setItem(STORAGE_KEYS.PROFESSIONALS, JSON.stringify(nextProfs));
      } catch (e) { console.error(e); }
      return { ...prev, professionals: nextProfs };
    });
    return generated;
  };

  const getReviewsForProf = (profId: string) => {
    return store.reviews.filter(r => {
      if (r.professionalId !== profId) return false;
      if (r.bookingId) {
        const b = store.bookings.find(bk => bk.id === r.bookingId);
        if (b && b.status !== 'completed') return false;
      }
      return true;
    });
  };

  const getWaitlistForProf = (profId: string) => {
    return store.waitlist.filter(w => w.professionalId === profId);
  };

  const addWaitlistEntry = (entry: Omit<WaitlistEntry, 'id' | 'createdAt' | 'status'>): WaitlistEntry => {
    const newEntry: WaitlistEntry = {
      ...entry,
      id: `wait-${Date.now()}`,
      status: 'waiting',
      createdAt: new Date().toISOString()
    };
    emitStoreChange(prev => {
      const nextWaitlist = [newEntry, ...prev.waitlist];
      try {
        localStorage.setItem(STORAGE_KEYS.WAITLIST, JSON.stringify(nextWaitlist));
      } catch (e) { console.error(e); }
      return { ...prev, waitlist: nextWaitlist };
    });
    return newEntry;
  };

  const updateWaitlistStatus = (id: string, status: 'waiting' | 'notified' | 'scheduled' | 'booked' | 'cancelled') => {
    emitStoreChange(prev => {
      const nextWaitlist = prev.waitlist.map(w => w.id === id ? { ...w, status } : w);
      try {
        localStorage.setItem(STORAGE_KEYS.WAITLIST, JSON.stringify(nextWaitlist));
      } catch (e) { console.error(e); }
      return { ...prev, waitlist: nextWaitlist };
    });
  };

  const deleteWaitlistEntry = (id: string) => {
    emitStoreChange(prev => {
      const nextWaitlist = prev.waitlist.filter(w => w.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.WAITLIST, JSON.stringify(nextWaitlist));
      } catch (e) { console.error(e); }
      return { ...prev, waitlist: nextWaitlist };
    });
  };

  const addReview = (review: Omit<Review, 'id' | 'createdAt'>): Review => {
    const newReview: Review = {
      ...review,
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    emitStoreChange(prev => {
      const nextReviews = [newReview, ...prev.reviews];
      try {
        localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(nextReviews));
      } catch (e) { console.error(e); }
      return { ...prev, reviews: nextReviews };
    });
    return newReview;
  };

  const payProfessionalSubscription = (profId: string, method: 'pix' | 'card' = 'pix') => {
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 30);
    const nextDueDateStr = nextDueDate.toISOString().slice(0, 10);

    emitStoreChange(prev => {
      const nextProfs = prev.professionals.map(p => {
        if (p.id === profId) {
          return {
            ...p,
            status: 'active' as const,
            daysOverdue: 0,
            subscriptionPaymentStatus: 'paid' as const,
            subscriptionDueDate: nextDueDateStr,
            lastPaymentDate: new Date().toISOString()
          };
        }
        return p;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.PROFESSIONALS, JSON.stringify(nextProfs));
      } catch (e) { console.error(e); }
      return { ...prev, professionals: nextProfs };
    });
  };

  const setProfessionalStatus = (profId: string, status: 'active' | 'inactive' | 'delinquent', daysOverdue = 0) => {
    emitStoreChange(prev => {
      const nextProfs = prev.professionals.map(p => {
        if (p.id === profId) {
          return {
            ...p,
            status,
            daysOverdue,
            subscriptionPaymentStatus: (status === 'active' ? 'paid' : status === 'delinquent' ? 'overdue' : 'suspended') as 'paid' | 'overdue' | 'suspended'
          };
        }
        return p;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.PROFESSIONALS, JSON.stringify(nextProfs));
      } catch (e) { console.error(e); }
      return { ...prev, professionals: nextProfs };
    });
  };

  const getGiveawaysForProf = (profId: string) => {
    return store.giveaways.filter(g => g.professionalId === profId);
  };

  const getPromotionalGiftsForProf = (profId: string) => {
    return store.promotionalGifts.filter(p => p.professionalId === profId);
  };

  const addGiveaway = (giveaway: Omit<GiveawayCampaign, 'id' | 'createdAt' | 'status'>): GiveawayCampaign => {
    const newG: GiveawayCampaign = {
      ...giveaway,
      id: `giveaway-${Date.now()}`,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    emitStoreChange(prev => {
      const nextG = [newG, ...prev.giveaways];
      try {
        localStorage.setItem(STORAGE_KEYS.GIVEAWAYS, JSON.stringify(nextG));
      } catch (e) { console.error(e); }
      return { ...prev, giveaways: nextG };
    });
    return newG;
  };

  const updateGiveaway = (giveaway: GiveawayCampaign) => {
    emitStoreChange(prev => {
      const nextG = prev.giveaways.map(g => g.id === giveaway.id ? giveaway : g);
      try {
        localStorage.setItem(STORAGE_KEYS.GIVEAWAYS, JSON.stringify(nextG));
      } catch (e) { console.error(e); }
      return { ...prev, giveaways: nextG };
    });
  };

  const deleteGiveaway = (id: string) => {
    emitStoreChange(prev => {
      const nextG = prev.giveaways.filter(g => g.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.GIVEAWAYS, JSON.stringify(nextG));
      } catch (e) { console.error(e); }
      return { ...prev, giveaways: nextG };
    });
  };

  const drawGiveawayWinner = (id: string, winnerName: string, winnerPhone?: string, bookingCode?: string) => {
    emitStoreChange(prev => {
      const nextG = prev.giveaways.map(g => {
        if (g.id === id) {
          return {
            ...g,
            status: 'completed' as const,
            drawnAt: new Date().toISOString(),
            winnerClientName: winnerName,
            winnerClientPhone: winnerPhone,
            winnerBookingCode: bookingCode
          };
        }
        return g;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.GIVEAWAYS, JSON.stringify(nextG));
      } catch (e) { console.error(e); }
      return { ...prev, giveaways: nextG };
    });
  };

  const addPromotionalGift = (gift: Omit<PromotionalGift, 'id' | 'createdAt'>): PromotionalGift => {
    const newGift: PromotionalGift = {
      ...gift,
      id: `gift-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    emitStoreChange(prev => {
      const nextGifts = [newGift, ...prev.promotionalGifts];
      try {
        localStorage.setItem(STORAGE_KEYS.PROMOTIONAL_GIFTS, JSON.stringify(nextGifts));
      } catch (e) { console.error(e); }
      return { ...prev, promotionalGifts: nextGifts };
    });
    return newGift;
  };

  const togglePromotionalGift = (id: string) => {
    emitStoreChange(prev => {
      const nextGifts = prev.promotionalGifts.map(g => g.id === id ? { ...g, active: !g.active } : g);
      try {
        localStorage.setItem(STORAGE_KEYS.PROMOTIONAL_GIFTS, JSON.stringify(nextGifts));
      } catch (e) { console.error(e); }
      return { ...prev, promotionalGifts: nextGifts };
    });
  };

  const deletePromotionalGift = (id: string) => {
    emitStoreChange(prev => {
      const nextGifts = prev.promotionalGifts.filter(g => g.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.PROMOTIONAL_GIFTS, JSON.stringify(nextGifts));
      } catch (e) { console.error(e); }
      return { ...prev, promotionalGifts: nextGifts };
    });
  };

  const updateProfessionalBookingPrefix = (profId: string, prefix: string) => {
    const cleanPrefix = prefix.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 3);
    emitStoreChange(prev => {
      const nextProfs = prev.professionals.map(p => p.id === profId ? { ...p, bookingCodePrefix: cleanPrefix } : p);
      try {
        localStorage.setItem(STORAGE_KEYS.PROFESSIONALS, JSON.stringify(nextProfs));
      } catch (e) { console.error(e); }
      return { ...prev, professionals: nextProfs };
    });
  };

  const completeBookingWithPayment = (
    id: string, 
    method: PaymentMethod = 'pix',
    splitPayments?: SplitPaymentEntry[]
  ) => {
    emitStoreChange(prev => {
      const nextBookings = prev.bookings.map(b => {
        if (b.id === id) {
          return {
            ...b,
            status: 'completed' as const,
            paymentMethod: method,
            splitPayments: method === 'split' ? splitPayments : undefined,
            paymentRecordedAt: new Date().toISOString(),
            attended: true
          };
        }
        return b;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(nextBookings));
      } catch (e) { console.error(e); }
      return { ...prev, bookings: nextBookings };
    });
  };

  const cancelRecurringSeries = (recurrenceGroupId: string, reason?: string) => {
    emitStoreChange(prev => {
      const nextBookings = prev.bookings.map(b => {
        if (b.recurrenceGroupId === recurrenceGroupId && b.status !== 'completed') {
          return {
            ...b,
            status: 'cancelled' as const,
            cancellationReason: reason || 'Série recorrente cancelada pelo(a) profissional'
          };
        }
        return b;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(nextBookings));
      } catch (e) { console.error(e); }
      return { ...prev, bookings: nextBookings };
    });
  };

  const createManualBooking = (bookingData: ManualBookingInput): Booking => {
    const prof = store.professionals.find(p => p.id === bookingData.professionalId);
    const isRecurring = Boolean(bookingData.isRecurring);
    const recurrenceFrequency = bookingData.recurrenceFrequency || 'weekly';
    const recurrenceCount = isRecurring ? Math.max(1, Math.min(12, Number(bookingData.recurrenceCount) || 4)) : 1;
    const recurrenceGroupId = isRecurring ? `rec-grp-${Date.now()}` : undefined;

    const createdList: Booking[] = [];

    for (let i = 0; i < recurrenceCount; i++) {
      let targetDate = bookingData.date;
      if (i > 0) {
        const [y, m, d] = bookingData.date.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        if (recurrenceFrequency === 'weekly') {
          dt.setDate(dt.getDate() + 7 * i);
        } else if (recurrenceFrequency === 'biweekly') {
          dt.setDate(dt.getDate() + 14 * i);
        } else if (recurrenceFrequency === 'monthly') {
          dt.setMonth(dt.getMonth() + i);
        }
        const yStr = dt.getFullYear();
        const mStr = String(dt.getMonth() + 1).padStart(2, '0');
        const dStr = String(dt.getDate()).padStart(2, '0');
        targetDate = `${yStr}-${mStr}-${dStr}`;
      }

      const code = generateBookingCode(prof);
      const newBooking: Booking = {
        id: `book-${Date.now()}-${i}`,
        code,
        createdAt: new Date().toISOString(),
        isManualOrFit: true,
        status: bookingData.status || 'confirmed',
        professionalId: bookingData.professionalId,
        professionalName: bookingData.professionalName || prof?.name || 'Profissional',
        professionalPhone: bookingData.professionalPhone || prof?.phone || prof?.whatsapp || '',
        professionalAddress: bookingData.professionalAddress || prof?.address || '',
        clientName: bookingData.clientName,
        clientPhone: bookingData.clientPhone,
        serviceId: bookingData.serviceId,
        serviceName: bookingData.serviceName,
        serviceDuration: bookingData.serviceDuration,
        totalPrice: bookingData.totalPrice,
        date: targetDate,
        time: bookingData.time,
        endTime: bookingData.endTime,
        depositRequired: bookingData.depositRequired ?? false,
        depositAmount: bookingData.depositAmount ?? 0,
        depositPaid: bookingData.depositPaid ?? false,
        notes: isRecurring 
          ? (bookingData.notes ? `${bookingData.notes} • Sessão recorrente (${i + 1}/${recurrenceCount})` : `Sessão recorrente (${i + 1}/${recurrenceCount})`)
          : (bookingData.notes || ''),
        serviceVariation: bookingData.serviceVariation,
        isRecurring: isRecurring,
        recurrenceFrequency: isRecurring ? recurrenceFrequency : undefined,
        recurrenceGroupId: recurrenceGroupId,
        recurrenceIndex: isRecurring ? i + 1 : undefined,
        recurrenceTotal: isRecurring ? recurrenceCount : undefined
      };
      createdList.push(newBooking);
    }

    emitStoreChange(prev => {
      const nextBookings = deduplicateBookings([...createdList, ...prev.bookings]);
      try {
        localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(nextBookings));
      } catch (e) { console.error(e); }
      return { ...prev, bookings: nextBookings };
    });

    return createdList[0];
  };

  const addBlockedTimeSlot = (profId: string, slot: { date: string; startTime: string; endTime: string; reason: string }) => {
    emitStoreChange(prev => {
      const newSlot = { ...slot, id: `blk-${Date.now()}` };
      const nextAvails = prev.availabilities.map(a => {
        if (a.professionalId === profId) {
          return {
            ...a,
            blockedTimeSlots: [...(a.blockedTimeSlots || []), newSlot]
          };
        }
        return a;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.AVAILABILITIES, JSON.stringify(nextAvails));
      } catch (e) { console.error(e); }
      return { ...prev, availabilities: nextAvails };
    });
  };

  const removeBlockedTimeSlot = (profId: string, slotId: string) => {
    emitStoreChange(prev => {
      const nextAvails = prev.availabilities.map(a => {
        if (a.professionalId === profId) {
          return {
            ...a,
            blockedTimeSlots: (a.blockedTimeSlots || []).filter(s => s.id !== slotId)
          };
        }
        return a;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.AVAILABILITIES, JSON.stringify(nextAvails));
      } catch (e) { console.error(e); }
      return { ...prev, availabilities: nextAvails };
    });
  };

  const addVacationPeriod = (profId: string, vacation: { startDate: string; endDate: string; reason: string; customNote?: string; returnDate?: string }) => {
    emitStoreChange(prev => {
      const newVac = { ...vacation, id: `vac-${Date.now()}` };
      const nextAvails = prev.availabilities.map(a => {
        if (a.professionalId === profId) {
          return {
            ...a,
            vacationPeriods: [...(a.vacationPeriods || []), newVac]
          };
        }
        return a;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.AVAILABILITIES, JSON.stringify(nextAvails));
      } catch (e) { console.error(e); }
      return { ...prev, availabilities: nextAvails };
    });
  };

  const removeVacationPeriod = (profId: string, vacationId: string) => {
    emitStoreChange(prev => {
      const nextAvails = prev.availabilities.map(a => {
        if (a.professionalId === profId) {
          return {
            ...a,
            vacationPeriods: (a.vacationPeriods || []).filter(v => v.id !== vacationId)
          };
        }
        return a;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.AVAILABILITIES, JSON.stringify(nextAvails));
      } catch (e) { console.error(e); }
      return { ...prev, availabilities: nextAvails };
    });
  };

  const addStaffMember = (profId: string, staff: Omit<StaffMember, 'id' | 'createdAt'>): StaffMember => {
    const newStaff: StaffMember = {
      ...staff,
      id: `staff-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    emitStoreChange(prev => {
      const nextProfs = prev.professionals.map(p => {
        if (p.id === profId) {
          return {
            ...p,
            staffMembers: [...(p.staffMembers || []), newStaff]
          };
        }
        return p;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.PROFESSIONALS, JSON.stringify(nextProfs));
      } catch (e) { console.error(e); }
      return { ...prev, professionals: nextProfs };
    });
    return newStaff;
  };

  const updateStaffMember = (profId: string, staff: StaffMember) => {
    emitStoreChange(prev => {
      const nextProfs = prev.professionals.map(p => {
        if (p.id === profId) {
          return {
            ...p,
            staffMembers: (p.staffMembers || []).map(s => s.id === staff.id ? staff : s)
          };
        }
        return p;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.PROFESSIONALS, JSON.stringify(nextProfs));
      } catch (e) { console.error(e); }
      return { ...prev, professionals: nextProfs };
    });
  };

  const deleteStaffMember = (profId: string, staffId: string) => {
    emitStoreChange(prev => {
      const nextProfs = prev.professionals.map(p => {
        if (p.id === profId) {
          return {
            ...p,
            staffMembers: (p.staffMembers || []).filter(s => s.id !== staffId)
          };
        }
        return p;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.PROFESSIONALS, JSON.stringify(nextProfs));
      } catch (e) { console.error(e); }
      return { ...prev, professionals: nextProfs };
    });
  };

  const updateLoyaltyConfig = (profId: string, config: LoyaltyConfig) => {
    emitStoreChange(prev => {
      const nextProfs = prev.professionals.map(p => {
        if (p.id === profId) {
          return { ...p, loyaltyConfig: config };
        }
        return p;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.PROFESSIONALS, JSON.stringify(nextProfs));
      } catch (e) { console.error(e); }
      return { ...prev, professionals: nextProfs };
    });
  };

  const resetToDefaults = () => {
    try {
      localStorage.clear();
    } catch (e) { console.error(e); }
    emitStoreChange(() => DEFAULT_STATE);
  };

  const getExpensesForProf = (profId: string): Expense[] => {
    return (storeState.expenses || []).filter(e => e.professionalId === profId);
  };

  const addExpense = (expenseData: Omit<Expense, 'id' | 'createdAt'>): Expense => {
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };
    emitStoreChange(prev => {
      const nextExpenses = [...(prev.expenses || []), newExpense];
      try {
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(nextExpenses));
      } catch (e) { console.error(e); }
      return { ...prev, expenses: nextExpenses };
    });
    try {
      setDoc(doc(db, 'expenses', newExpense.id), cleanForFirestore(newExpense)).catch(console.warn);
    } catch (e) {}
    return newExpense;
  };

  const updateExpense = (expense: Expense) => {
    emitStoreChange(prev => {
      const nextExpenses = (prev.expenses || []).map(e => e.id === expense.id ? expense : e);
      try {
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(nextExpenses));
      } catch (e) { console.error(e); }
      return { ...prev, expenses: nextExpenses };
    });
    try {
      setDoc(doc(db, 'expenses', expense.id), cleanForFirestore(expense)).catch(console.warn);
    } catch (e) {}
  };

  const deleteExpense = (id: string) => {
    emitStoreChange(prev => {
      const nextExpenses = (prev.expenses || []).filter(e => e.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(nextExpenses));
      } catch (e) { console.error(e); }
      return { ...prev, expenses: nextExpenses };
    });
    try {
      deleteDoc(doc(db, 'expenses', id)).catch(console.warn);
    } catch (e) {}
  };

  const contextValue = useMemo<AppStoreContextType>(() => ({
    professionals: store.professionals,
    services: store.services,
    availabilities: store.availabilities,
    bookings: store.bookings,
    tickets: store.tickets,
    waitlist: store.waitlist,
    reviews: store.reviews,
    giveaways: store.giveaways,
    promotionalGifts: store.promotionalGifts,
    expenses: store.expenses,
    currentRole: store.currentRole,
    selectedProfessionalId: store.selectedProfessionalId,
    impersonatedByMaster: store.impersonatedByMaster,
    themeMode: store.themeMode || 'light',
    authenticatedProfId: store.authenticatedProfId,
    authProfessionalId: store.authenticatedProfId,
    globalPlanPricing: store.globalPlanPricing || DEFAULT_PLAN_PRICING,
    heldSlots: store.heldSlots || [],
    isProfAuthenticated: Boolean(store.authenticatedProfId && store.authenticatedProfId !== 'master'),
    isMasterAuthenticated: store.currentRole === 'master' || store.authenticatedProfId === 'master',
    loginAsProfessional,
    loginProfessional: loginAsProfessional,
    syncFromCloud,
    loginAsMaster,
    loginMaster: loginAsMaster,
    logout,
    logoutMaster: logout,
    checkPrefixAvailability,
    toggleThemeMode,
    setThemeMode,
    isHydrated: true,
    setRole,
    setSelectedProfessionalId,
    startImpersonation,
    stopImpersonation,
    getProfessionalBySlug,
    getServicesForProf,
    getAvailabilityForProf,
    getReviewsForProf,
    getWaitlistForProf,
    getGiveawaysForProf,
    getPromotionalGiftsForProf,
    getExpensesForProf,
    addExpense,
    updateExpense,
    deleteExpense,
    addGiveaway,
    updateGiveaway,
    deleteGiveaway,
    drawGiveawayWinner,
    addPromotionalGift,
    togglePromotionalGift,
    deletePromotionalGift,
    updateProfessionalBookingPrefix,
    addService,
    updateService,
    deleteService,
    addProfessional,
    updateProfessional,
    toggleProfessionalStatus,
    setTenantStatus,
    resetTenantPassword,
    updateGlobalPlanPricing,
    updateProfessionalCustomPlan,
    changeProfessionalPlan,
    setProfessionalSystemMode,
    extendTrialDays,
    updateAvailability,
    updateAllowedDates,
    setProfessionalTheme,
    setProfessionalLayout,
    unlockProfessionalLayout,
    addBlockedTimeSlot,
    removeBlockedTimeSlot,
    addVacationPeriod,
    removeVacationPeriod,
    addStaffMember,
    updateStaffMember,
    deleteStaffMember,
    updateLoyaltyConfig,
    createBooking,
    createManualBooking,
    cancelRecurringSeries,
    rescheduleBooking,
    updateBookingServices,
    confirmBooking,
    confirmMessageReceived,
    approveAndRequestDeposit,
    confirmDepositReceived,
    reopenExpiredSlot,
    cancelBooking,
    completeBooking,
    completeBookingWithPayment,
    updateBooking,
    deleteBooking,
    markReminderSent,
    markAllRemindersSent,
    addWaitlistEntry,
    updateWaitlistStatus,
    deleteWaitlistEntry,
    addReview,
    payProfessionalSubscription,
    setProfessionalStatus,
    createSupportTicket,
    replySupportTicket,
    holdSlot,
    releaseSlotHold,
    isSlotHeldByOther,
    getHeldSlotsForDay,
    resetToDefaults
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [store]);

  return (
    <AppStoreContext.Provider value={contextValue}>
      {children}
    </AppStoreContext.Provider>
  );
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) {
    throw new Error('useAppStore must be used within an AppStoreProvider');
  }
  return ctx;
}
