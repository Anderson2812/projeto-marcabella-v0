// Biblioteca de Imagens Curadas para Serviços de Beleza e Bem-Estar
// Utiliza URLs oficiais de images.unsplash.com permitidas pelo next.config.ts

export interface CuratedServiceImage {
  id: string;
  title: string;
  category: 'unhas' | 'cabelo' | 'barbearia' | 'sobrancelhas' | 'cilios' | 'estetica' | 'maquiagem' | 'massagem';
  url: string;
  keywords: string[];
}

export const CURATED_SERVICE_IMAGES: CuratedServiceImage[] = [
  // UNHAS / NAILS
  {
    id: 'nail-1',
    title: 'Alongamento em Gel Natural / Nude',
    category: 'unhas',
    url: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=800&q=80',
    keywords: ['alongamento', 'gel', 'unhas', 'fibra', 'manicure', 'nude', 'tips']
  },
  {
    id: 'nail-2',
    title: 'Esmaltação em Gel Vermelho Clássico',
    category: 'unhas',
    url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80',
    keywords: ['esmaltação', 'gel', 'vermelho', 'unhas', 'manicure', 'esmaltacao']
  },
  {
    id: 'nail-3',
    title: 'Unhas Decoradas com Francesinha Delicada',
    category: 'unhas',
    url: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=800&q=80',
    keywords: ['francesinha', 'nail art', 'decoradas', 'unhas', 'manicure', 'delicada']
  },
  {
    id: 'nail-4',
    title: 'Spa dos Pés e Pedicure Relaxante',
    category: 'unhas',
    url: 'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?auto=format&fit=crop&w=800&q=80',
    keywords: ['pedicure', 'pes', 'pés', 'spa', 'esfoliação', 'relaxante']
  },

  // CABELO / HAIR
  {
    id: 'hair-1',
    title: 'Corte Feminino & Escova Modelada',
    category: 'cabelo',
    url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
    keywords: ['corte', 'feminino', 'cabelo', 'escova', 'camadas', 'salão']
  },
  {
    id: 'hair-2',
    title: 'Loiro Iluminado & Mechas / Balayage',
    category: 'cabelo',
    url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    keywords: ['mechas', 'loiro', 'balayage', 'coloração', 'luzes', 'morena iluminada']
  },
  {
    id: 'hair-3',
    title: 'Tratamento Capilar / Cronograma & Brilho',
    category: 'cabelo',
    url: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80',
    keywords: ['hidratação', 'nutrição', 'reconstrução', 'botox', 'terapia capilar', 'brilho']
  },

  // BARBEARIA / BARBER
  {
    id: 'barber-1',
    title: 'Corte Masculino Fade / Degradê Moderno',
    category: 'barbearia',
    url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
    keywords: ['barbearia', 'corte masculino', 'fade', 'degradê', 'barba', 'barbeiro']
  },
  {
    id: 'barber-2',
    title: 'Barboterapia com Toalha Quente',
    category: 'barbearia',
    url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=800&q=80',
    keywords: ['barba', 'barboterapia', 'toalha quente', 'navalha', 'alinhamento']
  },

  // SOBRANCELHAS & CÍLIOS / BROWS & LASHES
  {
    id: 'brow-1',
    title: 'Design de Sobrancelhas com Henna / Tintura',
    category: 'sobrancelhas',
    url: 'https://images.unsplash.com/photo-1588516903720-8ceb67f9ef84?auto=format&fit=crop&w=800&q=80',
    keywords: ['sobrancelha', 'design', 'henna', 'micropigmentação', 'brow lamination']
  },
  {
    id: 'lash-1',
    title: 'Extensão de Cílios Volume Russo / Brasileiro',
    category: 'cilios',
    url: 'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?auto=format&fit=crop&w=800&q=80',
    keywords: ['cílios', 'cilios', 'extensão', 'alongamento de cílios', 'lash', 'volume russo']
  },

  // ESTÉTICA & PELE / SKINCARE & SPA
  {
    id: 'skin-1',
    title: 'Limpeza de Pele Profunda e Renovação',
    category: 'estetica',
    url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
    keywords: ['limpeza de pele', 'estética', 'facial', 'peeling', 'cravos', 'skincare']
  },
  {
    id: 'massage-1',
    title: 'Massagem Relaxante e Terapêutica',
    category: 'massagem',
    url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
    keywords: ['massagem', 'relaxante', 'drenagem', 'spa', 'terapêutica', 'corpo']
  },

  // MAQUIAGEM / MAKEUP
  {
    id: 'makeup-1',
    title: 'Maquiagem Social & Noivas',
    category: 'maquiagem',
    url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80',
    keywords: ['maquiagem', 'makeup', 'noiva', 'festa', 'make', 'glow']
  }
];

// Função inteligente para encontrar a melhor imagem para um serviço
export function findBestImageForService(serviceName: string, category?: string): string {
  const normalized = (serviceName + ' ' + (category || '')).toLowerCase();
  
  // Tenta encontrar por keywords correspondentes
  for (const item of CURATED_SERVICE_IMAGES) {
    if (item.keywords.some(kw => normalized.includes(kw))) {
      return item.url;
    }
  }

  // Fallbacks elegantes por categoria
  if (normalized.includes('cabelo') || normalized.includes('escova') || normalized.includes('corte')) {
    return CURATED_SERVICE_IMAGES[4].url;
  }
  if (normalized.includes('barba') || normalized.includes('barber')) {
    return CURATED_SERVICE_IMAGES[7].url;
  }
  if (normalized.includes('sobrancelha') || normalized.includes('cílio') || normalized.includes('cilio')) {
    return CURATED_SERVICE_IMAGES[9].url;
  }
  if (normalized.includes('massagem') || normalized.includes('drenagem') || normalized.includes('spa')) {
    return CURATED_SERVICE_IMAGES[12].url;
  }

  // Default: Alongamento em Gel Natural
  return CURATED_SERVICE_IMAGES[0].url;
}
