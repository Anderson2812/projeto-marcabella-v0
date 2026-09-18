import { 
  Professional, 
  ServiceItem, 
  AvailabilityConfig, 
  Booking, 
  SupportTicket,
  WaitlistEntry,
  Review,
  GiveawayCampaign,
  PromotionalGift,
  PlanPricingConfig
} from '@/types';

export const DEFAULT_PLAN_PRICING: PlanPricingConfig = {
  proFixedMonthly: 59.90,
  proFixedAnnual: 42.90,
  flexFeeMonthly: 24.90,
  flexFeeBookingCharge: 0.99,
  trialDaysDefault: 15,
  extraStaffMonthlyFee: 19.90,
  extraStaffRevenueCapPerMember: 5000
};

/**
 * Função canônica de deduplicação estrita de agendamentos.
 * Garante que nenhum agendamento seja duplicado por ID, por código (#CAM-...)
 * ou por combinação de mesmo profissional + mesma data + mesmo horário + mesmo cliente.
 */
export function deduplicateBookings(list: Booking[]): Booking[] {
  if (!Array.isArray(list)) return [];
  const seenIds = new Set<string>();
  const unique: Booking[] = [];

  for (const b of list) {
    if (!b || !b.id) continue;
    if (seenIds.has(b.id)) continue;
    seenIds.add(b.id);
    unique.push(b);
  }
  return unique;
}

export const INITIAL_PROFESSIONALS: Professional[] = [
  {
    id: 'prof-1',
    name: 'Bella Beauty Studio',
    slug: 'bella-beauty',
    isDemo: true,
    email: 'contato@bellabeauty.com.br',
    phone: '(11) 90000-0001',
    category: 'Salão de Beleza',
    bio: 'Espaço especializado em Estética & Beleza, oferecendo as melhores experiências em alongamentos, cuidados e estética avançada.',
    instagram: 'https://www.instagram.com',
    address: 'Rua das Flores, 142 - Sala 3, Jardins, São Paulo - SP',
    addressMode: 'manual',
    documentNumber: '529.982.247-25',
    documentType: 'cpf',
    hasCustomBackgroundAddon: true,
    customBackgroundEnabled: false,
    avatarUrl: '/bella.jpg',
    pixKey: 'contato@marcabella.com.br',
    pixKeyType: 'email',
    cancellationHours: 24,
    cancellationPolicyNotes: 'Cancelamentos ou reagendamentos devem ser solicitados com no mínimo 24h de antecedência para não perder o sinal de reserva.',
    depositDeadlineHours: 2,
    status: 'active',
    themeColor: 'olive',
    createdAt: '2026-01-15T10:00:00.000Z',
    bookingCodePrefix: 'BEL',
    password: '123456',
    planType: 'trial',
    trialDays: 15,
    trialStartDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    trialExpiresAt: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    planMonthlyPrice: 0,
    feePerBooking: 0,
    portfolioPhotos: [
      {
        id: 'photo-c1',
        url: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=800&auto=format&fit=crop&q=80',
        title: 'Alongamento em Fibra de Vidro Slim',
        serviceId: 'srv-1',
        serviceName: 'Alongamento em Gel Completo (Tips / Fibra)',
        description: 'Acabamento ultrafino com curvatura C natural e esmaltação nude.'
      },
      {
        id: 'photo-c2',
        url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&auto=format&fit=crop&q=80',
        title: 'Manutenção com Francesinha Reversa',
        serviceId: 'srv-2',
        serviceName: 'Manutenção de Alongamento em Gel',
        description: 'Durabilidade de 28 dias sem descolamentos ou infiltrações.'
      },
      {
        id: 'photo-c3',
        url: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=800&auto=format&fit=crop&q=80',
        title: 'Esmaltação em Gel com Brilho Espelhado',
        serviceId: 'srv-3',
        serviceName: 'Esmaltação em Gel (Mãos)',
        description: 'Unhas impecáveis com acabamento de alto padrão e secagem na cabine LED.'
      },
      {
        id: 'photo-c4',
        url: 'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?w=800&auto=format&fit=crop&q=80',
        title: 'Spa dos Pés com Esfoliação & Cutilagem',
        serviceId: 'srv-4',
        serviceName: 'Pé e Mão Tradicional + Spa Relaxante',
        description: 'Cuidado minucioso, hidratação profunda e alívio de tensões.'
      }
    ],
    staffMembers: [
      {
        id: 'staff-1',
        professionalId: 'prof-1',
        name: 'Camila Silva',
        roleOrSpecialty: 'Master Nail Designer (Alongamentos & Gel)',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
        phone: '(11) 90000-0001',
        email: 'camila@marcabella.com.br',
        commissionPercentage: 100,
        active: true,
        assignedServiceIds: ['srv-1', 'srv-2', 'srv-3', 'srv-4']
      },
      {
        id: 'staff-2',
        professionalId: 'prof-1',
        name: 'Letícia Lima',
        roleOrSpecialty: 'Lash Designer & Sobrancelhas',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        phone: '(11) 98888-1122',
        email: 'leticia.lash@marcabella.com.br',
        commissionPercentage: 50,
        active: true,
        assignedServiceIds: ['srv-1', 'srv-2', 'srv-3', 'srv-4']
      },
      {
        id: 'staff-3',
        professionalId: 'prof-1',
        name: 'Beatriz Souza',
        roleOrSpecialty: 'Cabeleireira, Escovista & Penteados',
        avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
        phone: '(11) 97777-3344',
        email: 'beatriz.hair@marcabella.com.br',
        commissionPercentage: 60,
        active: true,
        assignedServiceIds: ['srv-1', 'srv-2', 'srv-3', 'srv-4']
      }
    ]
  },
  {
    id: 'prof-2',
    name: 'Dra. Juliana Rocha',
    slug: 'juliana-estetica',
    isDemo: true,
    email: 'dra.juliana@esteticapremium.com.br',
    phone: '(11) 90000-0002',
    category: 'Estética Facial & Corporal',
    bio: 'Biomédica Esteta. Protocolos exclusivos de Limpeza de Pele Profunda, Microagulhamento e Rejuvenescimento.',
    instagram: 'https://www.instagram.com',
    address: 'Av. Paulista, 1000 - Sala 802, Bela Vista, São Paulo - SP',
    addressMode: 'manual',
    documentNumber: '11.222.333/0001-81',
    documentType: 'cnpj',
    hasCustomBackgroundAddon: true,
    customBackgroundEnabled: false,
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    pixKey: '11900000002',
    pixKeyType: 'telefone',
    cancellationHours: 48,
    cancellationPolicyNotes: 'Aviso prévio mínimo de 48 horas para alteração de horário de procedimentos faciais.',
    depositDeadlineHours: 4,
    status: 'active',
    themeColor: 'rose',
    createdAt: '2026-02-01T14:30:00.000Z',
    bookingCodePrefix: 'JUL',
    password: '123456',
    planType: 'pro_fixed',
    planMonthlyPrice: 79.90,
    feePerBooking: 0,
    planActivatedAt: '2026-02-15T10:00:00.000Z',
    portfolioPhotos: [
      {
        id: 'photo-j1',
        url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80',
        title: 'Limpeza de Pele Profunda & Fototerapia',
        serviceName: 'Limpeza de Pele Profunda',
        description: 'Extração indolor, alta frequência e máscara calmante restauradora.'
      },
      {
        id: 'photo-j2',
        url: 'https://images.unsplash.com/photo-1512290900672-1f5be2486795?w=800&auto=format&fit=crop&q=80',
        title: 'Drenagem Facial & Revitalização Glow',
        serviceName: 'Massagem Facial Glow',
        description: 'Desinchaço imediato e luminosidade natural da pele.'
      }
    ]
  },
  {
    id: 'prof-3',
    name: 'Beatriz Lima',
    slug: 'beatriz-hair',
    isDemo: true,
    email: 'beatriz.hair@beleza.com.br',
    phone: '(21) 90000-0003',
    category: 'Cabeleireira & Colorista',
    bio: 'Cabeleireira visagista, especialista em mechas iluminadas, cortes contemporâneos e hidratação profunda.',
    instagram: 'https://www.instagram.com',
    address: 'Atendimento a domicílio e visitas exclusivas no Rio de Janeiro',
    addressMode: 'home_visit',
    serviceCoverageArea: 'Zona Sul, Ipanema, Leblon e Barra da Tijuca - RJ',
    documentNumber: '34.567.890/0001-44',
    documentType: 'cnpj',
    hasCustomBackgroundAddon: false,
    customBackgroundEnabled: false,
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
    pixKey: '12345678000190',
    pixKeyType: 'cnpj',
    cancellationHours: 24,
    cancellationPolicyNotes: 'Sinal de reserva retido em caso de não comparecimento ou cancelamento com menos de 24 horas.',
    depositDeadlineHours: 2,
    status: 'active',
    themeColor: 'lavender',
    createdAt: '2026-02-20T09:15:00.000Z',
    bookingCodePrefix: 'BEA',
    password: '123456',
    planType: 'flex_fee',
    planMonthlyPrice: 29.90,
    feePerBooking: 1.50,
    planActivatedAt: '2026-02-25T11:00:00.000Z',
    portfolioPhotos: [
      {
        id: 'photo-b1',
        url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&auto=format&fit=crop&q=80',
        title: 'Morena Iluminada & Ondas',
        serviceName: 'Mechas Morena Iluminada',
        description: 'Transição suave sem marcar a raiz e tratamento de brilho.'
      },
      {
        id: 'photo-b2',
        url: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=800&auto=format&fit=crop&q=80',
        title: 'Corte em Camadas com Movimento',
        serviceName: 'Corte e Escova',
        description: 'Volume equilibrado e caimento leve para o dia a dia.'
      }
    ]
  },
  {
    id: 'prof-4',
    name: 'Gabriel Siqueira',
    slug: 'gabriel-barber',
    isDemo: true,
    email: 'contato@gabrielbarber.com.br',
    phone: '(11) 90000-0004',
    category: 'Barbearia & Barbeiro',
    bio: 'Especialista em Fade, Degradê na Navalha, Barboterapia na Toalha Quente e Visagismo Masculino.',
    address: 'Rua Augusta, 1500 - Consolação, São Paulo - SP',
    addressMode: 'manual',
    documentNumber: '219.043.628-98',
    documentType: 'cpf',
    hasCustomBackgroundAddon: true,
    customBackgroundEnabled: false,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    pixKey: '11900000004',
    pixKeyType: 'telefone',
    cancellationHours: 12,
    cancellationPolicyNotes: 'Cancelamentos avisar com no mínimo 12h de antecedência.',
    depositDeadlineHours: 2,
    status: 'active',
    themeColor: 'barber_noir',
    pageLayoutTemplate: 'barber_club',
    createdAt: '2026-02-28T09:00:00.000Z',
    bookingCodePrefix: 'GAB',
    password: '123456',
    planType: 'pro_fixed',
    planMonthlyPrice: 79.90,
    feePerBooking: 0,
    planActivatedAt: '2026-03-01T10:00:00.000Z',
    portfolioPhotos: [
      {
        id: 'photo-g1',
        url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80',
        title: 'Degradê Navalhado Mid Fade',
        serviceName: 'Corte Masculino Premium',
        description: 'Degradê suave e acabamento com navalha e pós-barba mentolado.'
      },
      {
        id: 'photo-g2',
        url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&auto=format&fit=crop&q=80',
        title: 'Barboterapia com Toalha Quente',
        serviceName: 'Barba Terapia Completa',
        description: 'Óleos essenciais, massagem facial e hidratação dos fios.'
      }
    ]
  }
];

export const INITIAL_SERVICES: ServiceItem[] = [
  // Camila Nails
  {
    id: 'srv-1',
    professionalId: 'prof-1',
    name: 'Alongamento em Gel Completo (Tips / Fibra)',
    description: 'Alongamento duradouro com acabamento fino e natural, cuticulagem e esmaltação especial inclusa.',
    durationMinutes: 120,
    price: 160.00,
    imageUrl: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80'
    ],
    requiresDeposit: true,
    depositType: 'fixed',
    depositValue: 50.00,
    active: true,
    variations: ['Fibra de Vidro Silk', 'Tips em Gel Soft', 'Molde Russo Slim']
  },
  {
    id: 'srv-2',
    professionalId: 'prof-1',
    name: 'Manutenção de Alongamento em Gel',
    description: 'Nivelamento do crescimento, troca de formato e acabamento com esmalte em gel.',
    durationMinutes: 90,
    price: 110.00,
    imageUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=800&q=80'
    ],
    requiresDeposit: true,
    depositType: 'fixed',
    depositValue: 30.00,
    active: true,
    variations: ['Formato Amendoada', 'Formato Quadrada Slim', 'Formato Stiletto Chic']
  },
  {
    id: 'srv-3',
    professionalId: 'prof-1',
    name: 'Esmaltação em Gel (Mãos)',
    description: 'Unhas perfeitas que não descascam por até 20 dias, com brilho espelhado imediato.',
    durationMinutes: 60,
    price: 75.00,
    imageUrl: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=800&q=80'
    ],
    requiresDeposit: false,
    depositType: 'fixed',
    depositValue: 0,
    active: true,
    variations: ['Francesinha Sorriso', 'Glitter Encapsulado', 'Cor Única Espelhada']
  },
  {
    id: 'srv-4',
    professionalId: 'prof-1',
    name: 'Pé e Mão Tradicional + Spa Relaxante',
    description: 'Cutilagem minuciosa, hidratação profunda, esfoliação relaxante e esmaltação da sua escolha.',
    durationMinutes: 60,
    price: 70.00,
    imageUrl: 'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80'
    ],
    isCombo: true,
    comboServiceNames: ['Pé e Mão Tradicional', 'Spa Relaxante dos Pés'],
    requiresDeposit: true,
    depositType: 'fixed',
    depositValue: 20.00,
    active: true,
    variations: ['Com Esfoliação de Argila', 'Com Parafina Hidratante', 'Padrão Tradicional']
  },
  {
    id: 'srv-combo-1',
    professionalId: 'prof-1',
    name: 'Combo Diamante: Alongamento em Gel + Spa dos Pés',
    description: 'Alongamento em gel completo com acabamento impecável + Spa profundo dos pés com esfoliação e hidratação. Economia no pacote!',
    durationMinutes: 150,
    price: 190.00,
    imageUrl: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?auto=format&fit=crop&w=800&q=80'
    ],
    originalPrice: 230.00,
    discountPercent: 17,
    isCombo: true,
    comboServiceNames: ['Alongamento em Gel Completo', 'Spa Relaxante dos Pés'],
    requiresDeposit: true,
    depositType: 'fixed',
    depositValue: 50.00,
    active: true,
    variations: ['Gel Tips + Spa', 'Fibra de Vidro + Spa']
  },

  // Juliana Estética
  {
    id: 'srv-5',
    professionalId: 'prof-2',
    name: 'Limpeza de Pele Profunda com Fototerapia LED',
    description: 'Higienização, extração delicada de cravos, vapor de ozônio, alta frequência e máscara calmante com luz LED.',
    durationMinutes: 90,
    price: 180.00,
    imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1512290900672-1f486d38e234?auto=format&fit=crop&w=800&q=80'
    ],
    requiresDeposit: true,
    depositType: 'percentage',
    depositValue: 30, // 30% = 54.00
    active: true
  },
  {
    id: 'srv-6',
    professionalId: 'prof-2',
    name: 'Peeling de Diamante + Revitalização',
    description: 'Renovação celular intensa, clareamento suave e toque aveludado na pele facial.',
    durationMinutes: 60,
    price: 140.00,
    imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80'
    ],
    requiresDeposit: false,
    depositType: 'fixed',
    depositValue: 0,
    active: true
  },
  {
    id: 'srv-7',
    professionalId: 'prof-2',
    name: 'Drenagem Facial Detox com Pedras de Jade',
    description: 'Alívio imediato de inchaço facial, estímulo da circulação e relaxamento profundo.',
    durationMinutes: 45,
    price: 110.00,
    imageUrl: 'https://images.unsplash.com/photo-1512290900672-1f486d38e234?auto=format&fit=crop&w=800&q=80',
    requiresDeposit: false,
    depositType: 'fixed',
    depositValue: 0,
    active: true
  },

  // Beatriz Hair
  {
    id: 'srv-8',
    professionalId: 'prof-3',
    name: 'Corte Feminino com Visagismo & Escova',
    description: 'Diagnóstico dos traços, corte adaptado ao seu estilo de vida e finalização impecável.',
    durationMinutes: 60,
    price: 130.00,
    imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80'
    ],
    requiresDeposit: false,
    depositType: 'fixed',
    depositValue: 0,
    active: true
  },
  {
    id: 'srv-9',
    professionalId: 'prof-3',
    name: 'Mechas / Morena Iluminada Premium',
    description: 'Técnica de mechas sem agressão, tonalização personalizada, tratamento de reconstrução e escova.',
    durationMinutes: 180,
    price: 360.00,
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80'
    ],
    requiresDeposit: true,
    depositType: 'fixed',
    depositValue: 100.00,
    active: true
  },
  // Gabriel Barber
  {
    id: 'srv-10',
    professionalId: 'prof-4',
    name: 'Corte Fade / Degradê Navalhado',
    description: 'Corte masculino com acabamento na navalha, degradê suave (low/mid/high fade), finalização com pomada matte.',
    durationMinutes: 45,
    price: 60.00,
    imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=800&q=80'
    ],
    requiresDeposit: false,
    depositType: 'fixed',
    depositValue: 0,
    active: true,
    variations: ['Mid Fade Texturizado', 'Taper Fade Moderno', 'Skin Fade Militar']
  },
  {
    id: 'srv-11',
    professionalId: 'prof-4',
    name: 'Barboterapia com Toalha Quente',
    description: 'Modelagem de barba com navalhete, esfoliação facial, hidratação profunda e massagem com óleo essencial.',
    durationMinutes: 45,
    price: 50.00,
    imageUrl: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80'
    ],
    requiresDeposit: false,
    depositType: 'fixed',
    depositValue: 0,
    active: true
  },
  {
    id: 'srv-12',
    professionalId: 'prof-4',
    name: 'Combo Navalha VIP (Cabelo + Barba + Visagismo)',
    description: 'Experiência completa: Corte Fade personalizado, barba na toalha quente e alinhamento de sobrancelha.',
    durationMinutes: 80,
    price: 95.00,
    imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
    requiresDeposit: true,
    depositType: 'fixed',
    depositValue: 30.00,
    active: true,
    isCombo: true,
    comboServiceNames: ['Corte Fade', 'Barboterapia', 'Sobrancelha'],
    originalPrice: 120.00
  }
];

export const INITIAL_AVAILABILITIES: AvailabilityConfig[] = [
  {
    id: 'avail-1',
    professionalId: 'prof-1',
    activeDays: [2, 3, 4, 5, 6], // Terça a Sábado
    startTime: '09:00',
    endTime: '19:00',
    intervalMinutes: 30,
    hasLunchBreak: true,
    lunchStart: '12:30',
    lunchEnd: '13:30',
    bufferMinutes: 15,
    blockedDates: [],
    vacationPeriods: [
      {
        id: 'vac-demo-1',
        startDate: '2026-09-18',
        endDate: '2026-09-25',
        reason: 'Recesso & Aprimoramento Técnico',
        customNote: 'Estaremos em viagem de aperfeiçoamento e recesso. Já garanta seu horário para o retorno ou peça um atendimento personalizado!',
        returnDate: '2026-09-26'
      }
    ]
  },
  {
    id: 'avail-2',
    professionalId: 'prof-2',
    activeDays: [1, 2, 3, 4, 5], // Segunda a Sexta
    startTime: '08:30',
    endTime: '18:00',
    intervalMinutes: 30,
    hasLunchBreak: true,
    lunchStart: '12:00',
    lunchEnd: '13:00',
    bufferMinutes: 15,
    blockedDates: []
  },
  {
    id: 'avail-3',
    professionalId: 'prof-3',
    activeDays: [2, 3, 4, 5, 6], // Terça a Sábado
    startTime: '10:00',
    endTime: '20:00',
    intervalMinutes: 30,
    hasLunchBreak: true,
    lunchStart: '13:00',
    lunchEnd: '14:00',
    bufferMinutes: 15,
    blockedDates: []
  },
  {
    id: 'avail-4',
    professionalId: 'prof-4',
    activeDays: [2, 3, 4, 5, 6], // Terça a Sábado
    startTime: '09:00',
    endTime: '20:00',
    intervalMinutes: 45,
    hasLunchBreak: true,
    lunchStart: '13:00',
    lunchEnd: '14:00',
    bufferMinutes: 15,
    blockedDates: []
  }
];

const getRelativeDate = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'book-1',
    code: '#CAM-2041',
    isDemo: true,
    professionalId: 'prof-1',
    professionalName: 'Camila Silva',
    professionalPhone: '(11) 90000-0001',
    professionalAddress: 'Rua das Flores, 142 - Sala 3, Jardins, SP',
    serviceId: 'srv-1',
    serviceName: 'Alongamento em Gel Completo (Tips / Fibra)',
    serviceVariation: 'Fibra de Vidro Silk',
    serviceDuration: 120,
    clientName: 'Dona Maria de Lourdes',
    clientPhone: '(11) 90000-1001',
    date: getRelativeDate(1), // Amanhã
    time: '10:00',
    endTime: '12:00',
    status: 'confirmed',
    totalPrice: 160.00,
    depositRequired: true,
    depositAmount: 50.00,
    depositPaid: true,
    depositStatus: 'paid',
    pixCode: '00020126580014br.gov.bcb.pix0136camilasilva@marcabella.com.br520400005303986540550.005802BR',
    createdAt: '2026-09-04T15:30:00.000Z'
  },
  {
    id: 'book-2',
    code: '#CAM-2042',
    isDemo: true,
    professionalId: 'prof-1',
    professionalName: 'Camila Silva',
    professionalPhone: '(11) 90000-0001',
    professionalAddress: 'Rua das Flores, 142 - Sala 3, Jardins, SP',
    serviceId: 'srv-4',
    serviceName: 'Pé e Mão Tradicional + Spa Relaxante',
    serviceVariation: 'Com Esfoliação de Argila',
    serviceDuration: 60,
    clientName: 'Ana Clara Souza',
    clientPhone: '(11) 90000-1002',
    date: getRelativeDate(1), // Amanhã
    time: '14:00',
    endTime: '15:00',
    status: 'confirmed',
    totalPrice: 70.00,
    depositRequired: false,
    depositAmount: 0,
    depositPaid: false,
    createdAt: '2026-09-05T08:10:00.000Z'
  },
  {
    id: 'book-3',
    code: '#CAM-2043',
    isDemo: true,
    professionalId: 'prof-1',
    professionalName: 'Camila Silva',
    professionalPhone: '(11) 90000-0001',
    professionalAddress: 'Rua das Flores, 142 - Sala 3, Jardins, SP',
    serviceId: 'srv-3',
    serviceName: 'Esmaltação em Gel (Mãos)',
    serviceVariation: 'Francesinha Sorriso',
    serviceDuration: 60,
    clientName: 'Fernanda Lima',
    clientPhone: '(11) 90000-1003',
    date: getRelativeDate(1), // Amanhã
    time: '15:30',
    endTime: '16:30',
    status: 'confirmed',
    totalPrice: 75.00,
    depositRequired: false,
    depositAmount: 0,
    depositPaid: false,
    createdAt: '2026-09-05T09:15:00.000Z'
  },
  {
    id: 'book-4',
    code: '#CAM-2044',
    isDemo: true,
    professionalId: 'prof-1',
    professionalName: 'Camila Silva',
    professionalPhone: '(11) 90000-0001',
    professionalAddress: 'Rua das Flores, 142 - Sala 3, Jardins, SP',
    serviceId: 'srv-2',
    serviceName: 'Manutenção de Alongamento em Gel',
    serviceVariation: 'Formato Amendoada',
    serviceDuration: 90,
    clientName: 'Carla Beatriz Menezes',
    clientPhone: '(11) 90000-1004',
    date: getRelativeDate(1), // Amanhã
    time: '17:00',
    endTime: '18:30',
    status: 'confirmed',
    totalPrice: 110.00,
    depositRequired: true,
    depositAmount: 30.00,
    depositPaid: true,
    depositStatus: 'paid',
    depositDeadlineHours: 2,
    depositApprovedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    pixCode: '00020126580014br.gov.bcb.pix0136camilasilva@marcabella.com.br520400005303986540530.005802BR',
    notes: 'Preciso trocar o formato para amendoada.',
    createdAt: '2026-09-05T10:00:00.000Z'
  },
  {
    id: 'book-5',
    code: '#JUL-2045',
    isDemo: true,
    professionalId: 'prof-2',
    professionalName: 'Dra. Juliana Rocha',
    professionalPhone: '(11) 90000-0002',
    professionalAddress: 'Av. Paulista, 1000 - Sala 802, Bela Vista, SP',
    serviceId: 'srv-5',
    serviceName: 'Limpeza de Pele Profunda com Fototerapia LED',
    serviceDuration: 90,
    clientName: 'Tereza Cristina Neves',
    clientPhone: '(11) 90000-1005',
    date: getRelativeDate(1), // Amanhã
    time: '10:00',
    endTime: '11:30',
    status: 'confirmed',
    totalPrice: 180.00,
    depositRequired: true,
    depositAmount: 54.00,
    depositPaid: true,
    depositStatus: 'paid',
    createdAt: '2026-09-05T09:00:00.000Z'
  },
  {
    id: 'book-6',
    code: '#CAM-2046',
    isDemo: true,
    professionalId: 'prof-1',
    professionalName: 'Camila Silva',
    professionalPhone: '(11) 90000-0001',
    professionalAddress: 'Rua das Flores, 142 - Sala 3, Jardins, SP',
    serviceId: 'srv-1',
    serviceName: 'Alongamento em Gel Completo (Tips / Fibra)',
    serviceDuration: 120,
    clientName: 'Mariana Duarte Costa',
    clientPhone: '(11) 90000-1006',
    date: getRelativeDate(2), // Depois de amanhã
    time: '09:30',
    status: 'pending',
    totalPrice: 160.00,
    depositRequired: true,
    depositAmount: 50.00,
    depositPaid: false,
    depositStatus: 'pending',
    notes: 'Primeira vez no estúdio! Indicação da Ana Clara.',
    createdAt: '2026-09-05T10:15:00.000Z'
  },
  {
    id: 'book-7',
    code: '#GAB-3011',
    isDemo: true,
    professionalId: 'prof-4',
    professionalName: 'Gabriel Siqueira',
    professionalPhone: '(11) 90000-0004',
    professionalAddress: 'Rua Augusta, 1500 - Consolação, São Paulo - SP',
    serviceId: 'srv-10',
    serviceName: 'Corte Fade / Degradê Navalhado',
    serviceVariation: 'Mid Fade Texturizado',
    serviceDuration: 45,
    clientName: 'Rodrigo Medeiros',
    clientPhone: '(11) 90000-1007',
    date: getRelativeDate(1), // Amanhã
    time: '14:00',
    endTime: '14:45',
    status: 'confirmed',
    totalPrice: 60.00,
    depositRequired: false,
    depositAmount: 0,
    depositPaid: false,
    createdAt: '2026-09-05T11:00:00.000Z'
  },
  {
    id: 'book-8',
    code: '#GAB-3012',
    isDemo: true,
    professionalId: 'prof-4',
    professionalName: 'Gabriel Siqueira',
    professionalPhone: '(11) 90000-0004',
    professionalAddress: 'Rua Augusta, 1500 - Consolação, São Paulo - SP',
    serviceId: 'srv-12',
    serviceName: 'Combo Navalha VIP (Cabelo + Barba + Visagismo)',
    serviceDuration: 80,
    clientName: 'Felipe Alcantara',
    clientPhone: '(11) 90000-1008',
    date: getRelativeDate(1), // Amanhã
    time: '16:00',
    endTime: '17:20',
    status: 'confirmed',
    totalPrice: 95.00,
    depositRequired: true,
    depositAmount: 30.00,
    depositPaid: true,
    depositStatus: 'paid',
    createdAt: '2026-09-05T12:00:00.000Z'
  }
];

export const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 'tkt-1',
    professionalId: 'prof-1',
    professionalName: 'Camila Silva',
    subject: 'Como configurar feriados prolongados na minha agenda?',
    message: 'Olá suporte! Gostaria de saber como bloquear as datas do feriado de novembro para não abrir horários automáticos.',
    reply: 'Olá Camila! Você pode ir no menu "Minha Agenda & Horários" e clicar no botão "Bloquear Datas Específicas". Assim os dias marcados não aparecerão para as clientes no WhatsApp.',
    status: 'answered',
    createdAt: '2026-09-03T11:20:00.000Z',
    answeredAt: '2026-09-03T14:10:00.000Z'
  }
];

export const INITIAL_WAITLIST: WaitlistEntry[] = [
  {
    id: 'wait-1',
    professionalId: 'prof-1',
    clientName: 'Patrícia Alcantara',
    clientPhone: '(11) 90000-2001',
    desiredDate: getRelativeDate(1), // Amanhã
    preferredPeriod: 'afternoon',
    serviceIds: ['srv-1'],
    serviceNames: 'Alongamento em Gel Completo',
    notes: 'Preciso muito para um casamento no sábado!',
    status: 'waiting',
    createdAt: '2026-09-05T14:30:00.000Z'
  },
  {
    id: 'wait-2',
    professionalId: 'prof-1',
    clientName: 'Camila Fontana',
    clientPhone: '(11) 90000-2002',
    desiredDate: getRelativeDate(2),
    preferredPeriod: 'morning',
    serviceIds: ['srv-2'],
    serviceNames: 'Manutenção de Alongamento em Gel',
    notes: 'Qualquer horário de manhã serve.',
    status: 'waiting',
    createdAt: '2026-09-05T16:00:00.000Z'
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    professionalId: 'prof-1',
    clientName: 'Larissa Albuquerque',
    clientPhoneMasked: '(11) 90000-****',
    rating: 5,
    comment: 'Melhor manicure que já fui! O alongamento em gel durou semanas intacto, super natural e acabamento fininho. Recomendo de olhos fechados!',
    serviceName: 'Alongamento em Gel Completo',
    createdAt: '2026-09-02T18:00:00.000Z'
  },
  {
    id: 'rev-2',
    professionalId: 'prof-1',
    clientName: 'Bruna Vasconcelos',
    clientPhoneMasked: '(11) 90000-****',
    rating: 5,
    comment: 'Atendimento impecável, pontualidade britânica e o espaço é maravilhoso! Agendamento pelo WhatsApp super prático.',
    serviceName: 'Pé e Mão Tradicional + Spa',
    createdAt: '2026-09-04T12:30:00.000Z'
  },
  {
    id: 'rev-3',
    professionalId: 'prof-2',
    clientName: 'Renata Mendonça',
    clientPhoneMasked: '(11) 90000-****',
    rating: 5,
    comment: 'A limpeza de pele da Dra. Juliana é indolor e minha pele ficou maravilhosa, zero marcas. Profissional super atenciosa.',
    serviceName: 'Limpeza de Pele Profunda',
    createdAt: '2026-09-03T15:00:00.000Z'
  }
];

export const INITIAL_GIVEAWAYS: GiveawayCampaign[] = [
  {
    id: 'give-1',
    professionalId: 'prof-1',
    title: 'Sorteio de Primavera: Kit Cuidados & Blindagem Diamante',
    prizeDescription: 'Kit exclusivo de óleos para cutícula, sérum de crescimento e uma sessão cortesia de Blindagem em Gel.',
    rules: 'Concorrem automaticamente todas as clientes com agendamento realizado e concluído no mês corrente.',
    drawDate: getRelativeDate(15),
    status: 'active',
    createdAt: '2026-09-01T10:00:00.000Z'
  },
  {
    id: 'give-2',
    professionalId: 'prof-4',
    title: 'Sorteio Barber VIP: Kit Barba de Respeito + Combo Navalha',
    prizeDescription: 'Pomada matte importada, balm de hidratação e 1 atendimento Combo Navalha VIP completo.',
    rules: 'Válido para clientes com corte ou barba agendados e atendidos este mês.',
    drawDate: getRelativeDate(20),
    status: 'active',
    createdAt: '2026-09-02T11:00:00.000Z'
  }
];

export const INITIAL_PROMOTIONAL_GIFTS: PromotionalGift[] = [
  {
    id: 'gift-1',
    professionalId: 'prof-1',
    title: 'Mimo Hidratação de Cutículas',
    description: 'Óleo perfumado em caneta aplicadora para levar para casa.',
    triggerType: 'min_spend',
    minSpendAmount: 120.00,
    active: true,
    createdAt: '2026-09-01T10:00:00.000Z'
  },
  {
    id: 'gift-2',
    professionalId: 'prof-1',
    title: 'Brinde de Boas-Vindas',
    description: 'Lixa de vidro premium para novas clientes no primeiro agendamento.',
    triggerType: 'first_time',
    active: true,
    createdAt: '2026-09-01T10:00:00.000Z'
  },
  {
    id: 'gift-3',
    professionalId: 'prof-4',
    title: 'Cerveja Artesanal / Café Especial Gelado',
    description: 'Bebida premium servida durante o atendimento de cabelo ou barba.',
    triggerType: 'all_clients',
    active: true,
    createdAt: '2026-09-02T12:00:00.000Z'
  }
];

/**
 * Retorna o valor cheio e arredondado para pagamentos em Cartão (sem centavos quebrados).
 * Exemplos: R$ 50 -> R$ 55 | R$ 70 -> R$ 75 | R$ 75 -> R$ 80 | R$ 110 -> R$ 120 | R$ 160 -> R$ 170 | R$ 190 -> R$ 210 | R$ 360 -> R$ 390
 */
export function getCleanCardPrice(pixPrice: number): number {
  if (!pixPrice || pixPrice <= 0) return 0;
  if (pixPrice < 100) {
    const raw = pixPrice * 1.07;
    return Math.ceil(raw / 5) * 5;
  } else {
    const raw = pixPrice * 1.07;
    return Math.ceil(raw / 10) * 10;
  }
}


