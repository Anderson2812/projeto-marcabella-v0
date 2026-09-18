import { ThemeColor } from '@/types';

export interface ThemeConfig {
  id: ThemeColor;
  name: string;
  subtitle: string;
  primary: string; // Hex primário
  hover: string;
  bgLight: string;
  cardBg: string;
  borderColor: string;
  textPrimary: string;
  textMuted: string;
  badgeBg: string;
  badgeText: string;
  cssBtnClass: string;
  previewColors: string[];
}

export const THEME_CONFIGS: Record<ThemeColor, ThemeConfig> = {
  olive: {
    id: 'olive',
    name: 'Oliva & Nude (Clássico)',
    subtitle: 'Tons terrosos, elegantes e acolhedores',
    primary: '#5A5A40',
    hover: '#484832',
    bgLight: '#FAF8F5',
    cardBg: '#FFFFFF',
    borderColor: '#E9E2D7',
    textPrimary: '#2D2D2A',
    textMuted: '#706B5F',
    badgeBg: '#EEF1EB',
    badgeText: '#5A5A40',
    cssBtnClass: 'bg-[#5A5A40] hover:bg-[#484832] text-white',
    previewColors: ['#5A5A40', '#EEF1EB', '#FAF8F5', '#2D2D2A']
  },
  rose: {
    id: 'rose',
    name: 'Rose Gold & Blush',
    subtitle: 'Feminino, delicado e de alto padrão para Nails & Lash',
    primary: '#9D5C63',
    hover: '#83474E',
    bgLight: '#FCF8F8',
    cardBg: '#FFFFFF',
    borderColor: '#F3E4E6',
    textPrimary: '#3A282A',
    textMuted: '#84676B',
    badgeBg: '#F8E9EB',
    badgeText: '#9D5C63',
    cssBtnClass: 'bg-[#9D5C63] hover:bg-[#83474E] text-white',
    previewColors: ['#9D5C63', '#F8E9EB', '#FCF8F8', '#3A282A']
  },
  lavender: {
    id: 'lavender',
    name: 'Lavanda & Quartzo',
    subtitle: 'Calmo, sofisticado e relaxante para Estética & Spas',
    primary: '#6D597A',
    hover: '#574563',
    bgLight: '#F9F7FA',
    cardBg: '#FFFFFF',
    borderColor: '#E7DFEC',
    textPrimary: '#2D2433',
    textMuted: '#73657C',
    badgeBg: '#EFEBF2',
    badgeText: '#6D597A',
    cssBtnClass: 'bg-[#6D597A] hover:bg-[#574563] text-white',
    previewColors: ['#6D597A', '#EFEBF2', '#F9F7FA', '#2D2433']
  },
  champagne: {
    id: 'champagne',
    name: 'Champagne & Ouro Nobre',
    subtitle: 'Luxo, sofisticação e brilho suave',
    primary: '#8C6D33',
    hover: '#735726',
    bgLight: '#FAF8F3',
    cardBg: '#FFFFFF',
    borderColor: '#EFE7D8',
    textPrimary: '#2E271D',
    textMuted: '#7A6E5C',
    badgeBg: '#F5EEDF',
    badgeText: '#8C6D33',
    cssBtnClass: 'bg-[#8C6D33] hover:bg-[#735726] text-white',
    previewColors: ['#8C6D33', '#F5EEDF', '#FAF8F3', '#2E271D']
  },
  terracotta: {
    id: 'terracotta',
    name: 'Terracota & Argila',
    subtitle: 'Marcante, orgânico e moderno para Sobrancelhas & Bronze',
    primary: '#A0522D',
    hover: '#864221',
    bgLight: '#FAF5F2',
    cardBg: '#FFFFFF',
    borderColor: '#EFE3DC',
    textPrimary: '#34231C',
    textMuted: '#80665B',
    badgeBg: '#F7EBE5',
    badgeText: '#A0522D',
    cssBtnClass: 'bg-[#A0522D] hover:bg-[#864221] text-white',
    previewColors: ['#A0522D', '#F7EBE5', '#FAF5F2', '#34231C']
  },
  dark_minimal: {
    id: 'dark_minimal',
    name: 'Ônix Minimalista (Moderno)',
    subtitle: 'Contemporâneo, urbano e de alto contraste',
    primary: '#222222',
    hover: '#0A0A0A',
    bgLight: '#F5F5F5',
    cardBg: '#FFFFFF',
    borderColor: '#E2E2E2',
    textPrimary: '#141414',
    textMuted: '#666666',
    badgeBg: '#EAEAEA',
    badgeText: '#222222',
    cssBtnClass: 'bg-[#222222] hover:bg-[#0A0A0A] text-white',
    previewColors: ['#222222', '#EAEAEA', '#F5F5F5', '#141414']
  },
  barber_navy: {
    id: 'barber_navy',
    name: 'Navy Blue & Couro (Barbearia)',
    subtitle: 'Clássico masculino, vintage e confiável para barbearias tradicionais',
    primary: '#1E293B',
    hover: '#0F172A',
    bgLight: '#F1F5F9',
    cardBg: '#FFFFFF',
    borderColor: '#CBD5E1',
    textPrimary: '#0F172A',
    textMuted: '#475569',
    badgeBg: '#E2E8F0',
    badgeText: '#1E293B',
    cssBtnClass: 'bg-[#1E293B] hover:bg-[#0F172A] text-white',
    previewColors: ['#1E293B', '#D97706', '#E2E8F0', '#0F172A']
  },
  barber_noir: {
    id: 'barber_noir',
    name: 'Black & Gold (Barber Club Premium)',
    subtitle: 'Preto marcante com dourado âmbar estilo cavalheiro moderno',
    primary: '#B45309',
    hover: '#92400E',
    bgLight: '#FAF8F5',
    cardBg: '#FFFFFF',
    borderColor: '#E5D5BA',
    textPrimary: '#1C1917',
    textMuted: '#78716C',
    badgeBg: '#FEF3C7',
    badgeText: '#92400E',
    cssBtnClass: 'bg-[#B45309] hover:bg-[#92400E] text-white',
    previewColors: ['#1C1917', '#B45309', '#FEF3C7', '#FAF8F5']
  },
  slate_graphite: {
    id: 'slate_graphite',
    name: 'Grafite Industrial & Aço',
    subtitle: 'Robusto, contemporâneo para estética masculina e estúdios',
    primary: '#334155',
    hover: '#1E293B',
    bgLight: '#F8FAFC',
    cardBg: '#FFFFFF',
    borderColor: '#E2E8F0',
    textPrimary: '#0F172A',
    textMuted: '#64748B',
    badgeBg: '#F1F5F9',
    badgeText: '#334155',
    cssBtnClass: 'bg-[#334155] hover:bg-[#1E293B] text-white',
    previewColors: ['#334155', '#64748B', '#F1F5F9', '#0F172A']
  },
  forest_wood: {
    id: 'forest_wood',
    name: 'Verde Floresta & Madeira Nobre',
    subtitle: 'Estilo rústico artesanal para barbearias e tatuadores',
    primary: '#1B4332',
    hover: '#143326',
    bgLight: '#F4F7F5',
    cardBg: '#FFFFFF',
    borderColor: '#D8E2DC',
    textPrimary: '#081C15',
    textMuted: '#406343',
    badgeBg: '#E9F0EC',
    badgeText: '#1B4332',
    cssBtnClass: 'bg-[#1B4332] hover:bg-[#143326] text-white',
    previewColors: ['#1B4332', '#854D0E', '#E9F0EC', '#081C15']
  }
};

export const DARK_THEME_OVERLAYS: Record<ThemeColor, Partial<ThemeConfig>> = {
  olive: {
    primary: '#c5d4b8',
    hover: '#b0c2a1',
    cardBg: '#18181b',
    badgeBg: '#27272a',
    badgeText: '#e4ecd9',
    borderColor: '#3f3f46',
    textPrimary: '#f4f4f5',
    textMuted: '#a1a1aa'
  },
  rose: {
    primary: '#f4a7b0',
    hover: '#ec939d',
    cardBg: '#18181b',
    badgeBg: '#2a1a1d',
    badgeText: '#fed7dc',
    borderColor: '#3f3f46',
    textPrimary: '#f4f4f5',
    textMuted: '#a1a1aa'
  },
  lavender: {
    primary: '#d4bce6',
    hover: '#c3a6da',
    cardBg: '#18181b',
    badgeBg: '#241a2c',
    badgeText: '#ebdcf7',
    borderColor: '#3f3f46',
    textPrimary: '#f4f4f5',
    textMuted: '#a1a1aa'
  },
  champagne: {
    primary: '#f3d082',
    hover: '#e5bf6c',
    cardBg: '#18181b',
    badgeBg: '#292012',
    badgeText: '#fdeecd',
    borderColor: '#3f3f46',
    textPrimary: '#f4f4f5',
    textMuted: '#a1a1aa'
  },
  terracotta: {
    primary: '#f5a484',
    hover: '#e6906e',
    cardBg: '#18181b',
    badgeBg: '#2b1a13',
    badgeText: '#fcd6c7',
    borderColor: '#3f3f46',
    textPrimary: '#f4f4f5',
    textMuted: '#a1a1aa'
  },
  dark_minimal: {
    primary: '#f4f4f5',
    hover: '#e4e4e7',
    cardBg: '#18181b',
    badgeBg: '#27272a',
    badgeText: '#f4f4f5',
    borderColor: '#3f3f46',
    textPrimary: '#f4f4f5',
    textMuted: '#a1a1aa'
  },
  barber_navy: {
    primary: '#93c5fd',
    hover: '#60a5fa',
    cardBg: '#18181b',
    badgeBg: '#172554',
    badgeText: '#bfdbfe',
    borderColor: '#3f3f46',
    textPrimary: '#f4f4f5',
    textMuted: '#a1a1aa'
  },
  barber_noir: {
    primary: '#fbbf24',
    hover: '#f59e0b',
    cardBg: '#18181b',
    badgeBg: '#27272a',
    badgeText: '#fef08a',
    borderColor: '#3f3f46',
    textPrimary: '#f4f4f5',
    textMuted: '#a1a1aa'
  },
  slate_graphite: {
    primary: '#cbd5e1',
    hover: '#94a3b8',
    cardBg: '#18181b',
    badgeBg: '#1e293b',
    badgeText: '#f1f5f9',
    borderColor: '#3f3f46',
    textPrimary: '#f4f4f5',
    textMuted: '#a1a1aa'
  },
  forest_wood: {
    primary: '#86efac',
    hover: '#4ade80',
    cardBg: '#18181b',
    badgeBg: '#143326',
    badgeText: '#bbf7d0',
    borderColor: '#3f3f46',
    textPrimary: '#f4f4f5',
    textMuted: '#a1a1aa'
  }
};

export function getTheme(color?: ThemeColor, isDark?: boolean): ThemeConfig {
  const base = THEME_CONFIGS[color || 'olive'] || THEME_CONFIGS.olive;
  if (isDark) {
    const overlay = DARK_THEME_OVERLAYS[color || 'olive'] || DARK_THEME_OVERLAYS.olive;
    return {
      ...base,
      ...overlay
    };
  }
  return base;
}

export function getThemeStyles(color?: ThemeColor, isDark?: boolean) {
  const theme = getTheme(color, isDark);
  return {
    theme,
    primaryBg: { backgroundColor: theme.primary },
    primaryText: { color: theme.primary },
    primaryBorder: { borderColor: theme.primary },
    badgeStyle: { backgroundColor: theme.badgeBg, color: theme.badgeText },
    cssVars: {
      '--theme-primary': theme.primary,
      '--theme-hover': theme.hover,
      '--theme-badge-bg': theme.badgeBg,
      '--theme-badge-text': theme.badgeText,
      '--theme-border': theme.borderColor,
      '--theme-bg-light': theme.bgLight,
    } as React.CSSProperties
  };
}
