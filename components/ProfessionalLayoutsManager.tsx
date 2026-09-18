'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Layers, 
  Check, 
  Lock, 
  Sparkles, 
  Scissors, 
  Crown, 
  Moon, 
  ExternalLink, 
  MessageSquare, 
  CheckCircle2,
  X,
  CreditCard,
  Send,
  Eye,
  Smartphone,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Star
} from 'lucide-react';
import { Professional, PageLayoutTemplate } from '@/types';
import { useAppStore } from '@/lib/use-app-store';
import { getSaaSPricing } from '@/lib/plan-utils';

interface Props {
  professional: Professional;
}

interface LayoutOption {
  id: PageLayoutTemplate;
  name: string;
  badge: string;
  categoryTag: string;
  recommendedFor: string;
  description: string;
  previewBg: string;
  previewAccent: string;
  headerStyle: string;
  buttonClass: string;
  badgeClass: string;
  themeAtmosphere: string;
  icon: React.ElementType;
}

const LAYOUT_OPTIONS: LayoutOption[] = [
  {
    id: 'classic_elegant',
    name: 'Rosé Glow & Linho Nude',
    badge: 'Padrão Incluso',
    categoryTag: 'Salões & Estética',
    recommendedFor: 'Salões de beleza, cabeleireiras, maquiadoras, lash designers e manicures',
    description: 'Design minimalista e aconchegante com tons suaves de linho cru, toques de rosé nude e alto contraste para legibilidade perfeita no celular das clientes.',
    previewBg: 'from-[#FAF8F5] via-[#F4EDE4] to-[#FAF8F5]',
    previewAccent: '#8C4E46',
    headerStyle: 'bg-white border-[#E9E2D7] text-stone-900',
    buttonClass: 'bg-[#8C4E46] text-white hover:bg-[#783F38]',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    themeAtmosphere: 'Luminoso, acolhedor e altamente sofisticado',
    icon: Sparkles
  },
  {
    id: 'barber_club',
    name: 'Barber Club Vintage & Dark Cognac',
    badge: 'Barbearias & Masculino',
    categoryTag: 'Barbearias & Homens',
    recommendedFor: 'Barbearias tradicionais, cortes masculinos, barba na toalha quente e cuidados para homens',
    description: 'Identidade imponente com fundo ardósia escuro nobre, detalhes em couro conhaque e brasão vintage clássico que transmite tradição e respeito.',
    previewBg: 'from-[#0F172A] via-[#1E293B] to-[#0F172A]',
    previewAccent: '#D4A373',
    headerStyle: 'bg-[#0F172A] border-slate-800 text-slate-100',
    buttonClass: 'bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-700 hover:to-amber-800',
    badgeClass: 'bg-amber-950/60 text-amber-300 border-amber-800/60',
    themeAtmosphere: 'Escuro nobre, masculino e marcante',
    icon: Scissors
  },
  {
    id: 'boutique_glamour',
    name: 'Haute Beauté & Champagne Gold',
    badge: 'Alta Costura & Spa',
    categoryTag: 'Clínicas & Luxo',
    recommendedFor: 'Clínicas de estética avançada, harmonização facial, dermatologia e spas de alto padrão',
    description: 'Estética de revista editorial com molduras suaves, detalhes perolados e toques em ouro champanhe para posicionar seus procedimentos no mais alto valor percebido.',
    previewBg: 'from-[#FDFBF7] via-[#F7EFE3] to-[#FDFBF7]',
    previewAccent: '#C59B27',
    headerStyle: 'bg-gradient-to-br from-white to-[#FDF9F3] border-[#E9E2D7] text-stone-900',
    buttonClass: 'bg-gradient-to-r from-[#C59B27] to-[#A8821B] text-white hover:opacity-95',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    themeAtmosphere: 'Editorial de luxo, clean e iluminado',
    icon: Crown
  },
  {
    id: 'dark_minimal',
    name: 'Dark Onyx Studio & Neon Minimal',
    badge: 'Contemporâneo & Pro',
    categoryTag: 'Estúdios & Tatuagem',
    recommendedFor: 'Nail artists contemporâneas, tatuadores, micropigmentadores e estúdios modernos',
    description: 'Fundo preto ônix profundo de alto contraste com cartões nítidos, botões de alta presença visual e atmosfera noturna limpa e profissional.',
    previewBg: 'from-[#121214] via-[#1A1A1E] to-[#121214]',
    previewAccent: '#60A5FA',
    headerStyle: 'bg-[#18181B] border-zinc-800 text-zinc-100',
    buttonClass: 'bg-zinc-100 text-zinc-950 hover:bg-white',
    badgeClass: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    themeAtmosphere: 'Futurista, dark e com alto contraste visual',
    icon: Moon
  }
];

export default function ProfessionalLayoutsManager({ professional }: Props) {
  const { setProfessionalLayout, unlockProfessionalLayout, createSupportTicket } = useAppStore();
  const pricing = getSaaSPricing();

  const [activeFeedback, setActiveFeedback] = useState<string | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [purchasingLayout, setPurchasingLayout] = useState<LayoutOption | null>(null);
  const [previewModalLayout, setPreviewModalLayout] = useState<LayoutOption | null>(null);

  // Form para solicitar layout personalizado
  const [customBrandName, setCustomBrandName] = useState(professional.name);
  const [customColors, setCustomColors] = useState('Ex: Dourado e Preto / Azul Marinho');
  const [customReferences, setCustomReferences] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [requestSentFeedback, setRequestSentFeedback] = useState(false);

  const unlockedList = professional.unlockedLayouts || ['classic_elegant'];
  const currentLayoutId = professional.pageLayoutTemplate || 'classic_elegant';

  const handleActivate = (layoutId: PageLayoutTemplate, layoutName: string) => {
    setProfessionalLayout(professional.id, layoutId);
    setActiveFeedback(`✓ Layout "${layoutName}" ativado com sucesso para sua página de agendamento!`);
    if (previewModalLayout) setPreviewModalLayout(null);
    setTimeout(() => setActiveFeedback(null), 4000);
  };

  const handleConfirmPurchase = () => {
    if (!purchasingLayout) return;
    unlockProfessionalLayout(professional.id, purchasingLayout.id);
    setActiveFeedback(`🎉 Parabéns! Layout "${purchasingLayout.name}" desbloqueado e ativado para sua página!`);
    setPurchasingLayout(null);
    if (previewModalLayout) setPreviewModalLayout(null);
    setTimeout(() => setActiveFeedback(null), 5000);
  };

  const handleSubmitCustomRequest = (e: React.FormEvent) => {
    e.preventDefault();
    createSupportTicket({
      professionalId: professional.id,
      professionalName: professional.name,
      subject: `Solicitação de Layout sob Medida - ${customBrandName}`,
      message: `Solicitação de layout sob medida (R$ ${pricing.customLayoutRequestPrice.toFixed(2)}). Marca: "${customBrandName}". Cores desejadas: "${customColors}". Referências/Links: "${customReferences}". Detalhes adicionais: "${customNotes}".`
    });

    setRequestSentFeedback(true);
    setTimeout(() => {
      setRequestSentFeedback(false);
      setIsRequestModalOpen(false);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Feedback de Ativação / Compra */}
      {activeFeedback && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{activeFeedback}</span>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-[#E9E2D7] dark:border-zinc-700 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E9E2D7] dark:border-zinc-700 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-[#EEF1EB] dark:bg-zinc-800 rounded-xl text-[#5A5A40] dark:text-zinc-300">
                <Layers className="w-5 h-5" />
              </span>
              <h2 className="serif text-xl sm:text-2xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                Layouts Visuais da Vitrine
              </h2>
            </div>
            <p className="text-[#706B5F] dark:text-zinc-400 text-xs sm:text-sm mt-1">
              Escolha a estética perfeita para o seu público. Você pode <strong>visualizar a prévia completa</strong> antes de ativar ou comprar.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/${professional.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-[#FAF8F5] dark:bg-zinc-800 hover:bg-[#EEF1EB] dark:hover:bg-zinc-700 text-[#2D2D2A] dark:text-zinc-100 border border-[#E9E2D7] dark:border-zinc-700 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Ver Minha Página no Ar</span>
            </a>
          </div>
        </div>

        {/* Grade de Modelos de Layouts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {LAYOUT_OPTIONS.map(opt => {
            const isCurrent = currentLayoutId === opt.id;
            const isUnlocked = unlockedList.includes(opt.id);
            const Icon = opt.icon;

            return (
              <div
                key={opt.id}
                onClick={() => {
                  if (isUnlocked && !isCurrent) {
                    handleActivate(opt.id, opt.name);
                  } else if (!isUnlocked) {
                    setPurchasingLayout(opt);
                  }
                }}
                className={`rounded-3xl p-6 border-2 transition-all flex flex-col justify-between gap-5 relative overflow-hidden group cursor-pointer ${
                  isCurrent 
                    ? 'border-[#8C4E46] dark:border-rose-500 bg-[#FAF8F5] dark:bg-zinc-800/80 shadow-md ring-2 ring-[#8C4E46]/20' 
                    : 'border-[#E9E2D7] dark:border-zinc-700/80 bg-white dark:bg-zinc-900 hover:border-[#8C4E46] dark:hover:border-rose-400/80 hover:shadow-md'
                }`}
              >
                {/* Visual Preview Header Card */}
                <div className="space-y-4">
                  <div className={`w-full h-36 rounded-2xl bg-gradient-to-br ${opt.previewBg} p-4 flex flex-col justify-between border border-black/10 dark:border-white/10 shadow-xs relative overflow-hidden transition-transform duration-300 group-hover:scale-[1.01]`}>
                    
                    {/* Linhas decorativas sutis */}
                    <div className="absolute inset-0 bg-radial from-white/10 to-transparent pointer-events-none opacity-40" />

                    <div className="flex items-center justify-between relative z-10">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-xs border shadow-2xs ${opt.badgeClass}`}>
                        {opt.categoryTag}
                      </span>
                      <span className="p-1.5 rounded-full bg-black/20 dark:bg-white/10 backdrop-blur-xs text-white">
                        <Icon className="w-4 h-4" />
                      </span>
                    </div>

                    {/* Simulação em miniatura de tela */}
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-xs font-bold font-serif text-white/95 drop-shadow-xs flex items-center gap-1.5">
                          <span>{professional.name}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        </div>
                        <div className="text-[10px] text-white/70 font-medium">
                          {opt.themeAtmosphere}
                        </div>
                      </div>

                      {/* Botão de Visualização Rápida no Banner */}
                      <button
                        type="button"
                        onClick={() => setPreviewModalLayout(opt)}
                        className="py-1.5 px-3 rounded-xl bg-white/90 dark:bg-zinc-900/90 text-stone-900 dark:text-zinc-100 text-[11px] font-bold shadow-xs hover:bg-white transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-xs hover:scale-105"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Prévia</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h3 className="serif font-bold text-lg text-[#2D2D2A] dark:text-zinc-100 flex items-center gap-2">
                        {opt.name}
                      </h3>
                      {isCurrent ? (
                        <span className="text-2xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0">
                          Ativo Agora
                        </span>
                      ) : isUnlocked ? (
                        <span className="text-2xs font-bold px-2.5 py-1 rounded-full bg-[#EEF1EB] text-[#5A5A40] dark:bg-zinc-800 dark:text-zinc-300 shrink-0">
                          Desbloqueado
                        </span>
                      ) : (
                        <span className="text-2xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1 shrink-0">
                          <Lock className="w-3 h-3" /> Avulso: R$ {pricing.singleLayoutPrice.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#706B5F] dark:text-zinc-400 leading-relaxed">
                      {opt.description}
                    </p>

                    <div className="pt-1 text-2xs text-[#A09A8E] dark:text-zinc-500">
                      <strong>Recomendado para:</strong> {opt.recommendedFor}
                    </div>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="pt-3 border-t border-[#E9E2D7] dark:border-zinc-800 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewModalLayout(opt)}
                    className="w-1/2 py-2.5 px-3 rounded-xl text-xs font-bold border border-stone-200 dark:border-zinc-700 bg-stone-50 hover:bg-stone-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Visualizar Prévia</span>
                  </button>

                  <div className="w-1/2">
                    {isCurrent ? (
                      <button
                        disabled
                        className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-1.5 cursor-default"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Em Exibição</span>
                      </button>
                    ) : isUnlocked ? (
                      <button
                        type="button"
                        onClick={() => handleActivate(opt.id, opt.name)}
                        className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Ativar Layout</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPurchasingLayout(opt)}
                        className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Comprar (R$ {pricing.singleLayoutPrice.toFixed(0)})</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Banner de Solicitação de Layout Personalizado Exclusivo */}
        <div className="bg-gradient-to-r from-[#FAF8F5] via-[#F5EFE6] to-[#FAF8F5] dark:from-zinc-900 dark:via-zinc-800/80 dark:to-zinc-900 p-6 sm:p-7 rounded-3xl border border-[#E9E2D7] dark:border-zinc-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-2xs">
          <div className="space-y-1.5 max-w-2xl">
            <span className="text-2xs font-bold uppercase tracking-wider text-[#5A5A40] dark:text-zinc-300 bg-white dark:bg-zinc-800 px-2.5 py-0.5 rounded-full shadow-2xs inline-block">
              ✨ Exclusividade sob Medida
            </span>
            <h3 className="serif font-bold text-lg sm:text-xl text-[#2D2D2A] dark:text-zinc-100">
              Quer um Layout 100% Personalizado com a sua Marca e Cores?
            </h3>
            <p className="text-xs text-[#706B5F] dark:text-zinc-400 leading-relaxed">
              Nossa equipe de design cria uma vitrine digital sob medida para você, com seu logotipo, paleta de cores institucional e tipografia exclusiva pelo valor único de <strong>R$ {pricing.customLayoutRequestPrice.toFixed(2)}</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsRequestModalOpen(true)}
            className="px-5 py-3 bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Solicitar Layout sob Medida
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: PRÉVIA AO VIVO DO LAYOUT ANTES DE COMPRAR / ATIVAR */}
      {/* ========================================================================= */}
      {previewModalLayout && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-xl w-full border border-stone-200 dark:border-zinc-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-4">
            
            {/* Cabeçalho do Modal de Prévia */}
            <div className="px-6 py-4 border-b border-stone-200 dark:border-zinc-800 flex items-center justify-between bg-stone-50 dark:bg-zinc-800/80">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                  <Smartphone className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="serif font-bold text-sm sm:text-base text-stone-900 dark:text-zinc-100 flex items-center gap-2">
                    <span>Prévia: {previewModalLayout.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-200 dark:bg-zinc-700 text-stone-700 dark:text-zinc-300">
                      {previewModalLayout.categoryTag}
                    </span>
                  </h3>
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                    Como sua cliente enxergará a página no celular
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewModalLayout(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 rounded-lg cursor-pointer transition-colors"
                title="Fechar prévia"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mockup Interativo em Formato Smartphone */}
            <div className="p-4 sm:p-6 bg-stone-100 dark:bg-zinc-950 flex justify-center">
              <div className={`w-full max-w-sm rounded-[2.5rem] border-4 border-stone-800 shadow-xl overflow-hidden relative ${
                previewModalLayout.id === 'barber_club' 
                  ? 'bg-[#0F172A] text-slate-100'
                  : previewModalLayout.id === 'dark_minimal'
                    ? 'bg-[#121214] text-zinc-100'
                    : previewModalLayout.id === 'boutique_glamour'
                      ? 'bg-[#FAF8F5] text-stone-900'
                      : 'bg-[#FAF8F5] text-stone-900'
              }`}>
                {/* Barra do Smartphone (Speaker & Camera) */}
                <div className="h-5 bg-stone-900 flex items-center justify-center">
                  <div className="w-16 h-2 bg-stone-700 rounded-full" />
                </div>

                {/* Conteúdo da Página da Cliente no Mockup */}
                <div className="p-4 space-y-4 text-center">
                  
                  {/* Avatar + Nome da Profissional */}
                  <div className="flex flex-col items-center space-y-2 pt-2">
                    <div className={`w-20 h-20 rounded-full overflow-hidden border-2 shadow-md relative ${
                      previewModalLayout.id === 'barber_club'
                        ? 'border-amber-500/60 ring-2 ring-amber-500/20'
                        : previewModalLayout.id === 'boutique_glamour'
                          ? 'border-[#C59B27] ring-2 ring-amber-200/50'
                          : 'border-white ring-2 ring-stone-200'
                    }`}>
                      <Image
                        src={professional.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300'}
                        alt={professional.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div>
                      <h4 className="serif font-bold text-base tracking-tight flex items-center justify-center gap-1.5">
                        <span>{professional.name}</span>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      </h4>
                      <p className="text-2xs font-medium opacity-80">
                        {professional.category}
                      </p>
                    </div>

                    <div className="inline-flex items-center gap-2 text-[10px] opacity-75">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Seg a Sáb
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        09h às 19h
                      </span>
                    </div>
                  </div>

                  {/* Card "Reserve com Praticidade" Estilizado */}
                  <div className={`p-4 rounded-2xl border text-left space-y-2 shadow-xs ${
                    previewModalLayout.id === 'barber_club'
                      ? 'bg-slate-900/80 border-slate-800'
                      : previewModalLayout.id === 'dark_minimal'
                        ? 'bg-zinc-900 border-zinc-800'
                        : 'bg-white border-stone-200/80'
                  }`}>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest block opacity-70">
                      Reserve com Praticidade
                    </span>
                    <p className="text-xs font-bold leading-tight">
                      Escolha seu horário e confirme em 1 minuto
                    </p>

                    <button
                      type="button"
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs ${previewModalLayout.buttonClass}`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Agendar Horário Online</span>
                    </button>
                  </div>

                  {/* Miniatura do Catálogo de Serviços */}
                  <div className="text-left space-y-1.5 pt-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-70 block">
                      Procedimentos em Destaque
                    </span>

                    <div className="space-y-1.5">
                      <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                        previewModalLayout.id === 'barber_club'
                          ? 'bg-slate-900/60 border-slate-800'
                          : previewModalLayout.id === 'dark_minimal'
                            ? 'bg-zinc-900/60 border-zinc-800'
                            : 'bg-white border-stone-200/70'
                      }`}>
                        <div>
                          <div className="font-bold">Atendimento VIP Principal</div>
                          <div className="text-[10px] opacity-70">Duração: 45 minutos</div>
                        </div>
                        <span className="font-extrabold text-xs">
                          R$ 80,00
                        </span>
                      </div>

                      <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                        previewModalLayout.id === 'barber_club'
                          ? 'bg-slate-900/60 border-slate-800'
                          : previewModalLayout.id === 'dark_minimal'
                            ? 'bg-zinc-900/60 border-zinc-800'
                            : 'bg-white border-stone-200/70'
                      }`}>
                        <div>
                          <div className="font-bold">Combo & Finalização</div>
                          <div className="text-[10px] opacity-70">Duração: 60 minutos</div>
                        </div>
                        <span className="font-extrabold text-xs">
                          R$ 130,00
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rodapé sutil do celular */}
                  <div className="pt-2 text-[10px] opacity-50 pb-2">
                    Design renderizado pelo motor BellaHora
                  </div>
                </div>

                {/* Home Indicator */}
                <div className="h-4 bg-stone-900 flex items-center justify-center">
                  <div className="w-24 h-1 bg-stone-600 rounded-full" />
                </div>
              </div>
            </div>

            {/* Ações no Rodapé do Modal */}
            <div className="p-4 sm:p-5 bg-white dark:bg-zinc-900 border-t border-stone-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-stone-600 dark:text-zinc-400 text-center sm:text-left">
                {currentLayoutId === previewModalLayout.id ? (
                  <span className="font-bold text-emerald-600 flex items-center gap-1 justify-center sm:justify-start">
                    <Check className="w-4 h-4" /> Este tema já é o layout ativo da sua página!
                  </span>
                ) : unlockedList.includes(previewModalLayout.id) ? (
                  <span className="font-semibold text-stone-700 dark:text-zinc-300">
                    Você já possui este layout desbloqueado na sua conta.
                  </span>
                ) : (
                  <span>
                    Tema avulso por apenas <strong>R$ {pricing.singleLayoutPrice.toFixed(2)}</strong> (pagamento único).
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setPreviewModalLayout(null)}
                  className="w-1/2 sm:w-auto px-4 py-2 text-xs font-semibold text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white cursor-pointer"
                >
                  Fechar
                </button>

                {currentLayoutId === previewModalLayout.id ? (
                  <button
                    disabled
                    className="w-1/2 sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800 cursor-default"
                  >
                    Tema Ativo
                  </button>
                ) : unlockedList.includes(previewModalLayout.id) ? (
                  <button
                    type="button"
                    onClick={() => handleActivate(previewModalLayout.id, previewModalLayout.name)}
                    className="w-1/2 sm:w-auto px-5 py-2.5 rounded-xl bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    Ativar Este Layout
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const target = previewModalLayout;
                      setPreviewModalLayout(null);
                      setPurchasingLayout(target);
                    }}
                    className="w-1/2 sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Comprar por R$ {pricing.singleLayoutPrice.toFixed(2)}</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: COMPRAR LAYOUT AVULSO */}
      {/* ========================================================================= */}
      {purchasingLayout && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#E9E2D7] dark:border-zinc-700 shadow-xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#E9E2D7] dark:border-zinc-700 pb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-50 text-amber-800 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </span>
                <h3 className="serif font-bold text-lg text-[#2D2D2A] dark:text-zinc-100">
                  Comprar Layout Avulso
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPurchasingLayout(null)}
                className="p-1.5 text-[#706B5F] dark:text-zinc-400 hover:text-[#2D2D2A] dark:hover:text-zinc-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#706B5F] dark:text-zinc-400">
              <p>
                Você está prestes a desbloquear o tema <strong>{purchasingLayout.name}</strong> para sua conta com acesso perpétuo.
              </p>
              
              <div className="bg-[#FAF8F5] dark:bg-zinc-800/50 p-4 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span>Layout selecionado:</span>
                  <strong className="text-[#2D2D2A] dark:text-zinc-100">{purchasingLayout.name}</strong>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span>Categoria:</span>
                  <span className="text-[#2D2D2A] dark:text-zinc-100">{purchasingLayout.categoryTag}</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2 border-t border-[#E9E2D7] dark:border-zinc-700">
                  <span className="font-bold text-[#2D2D2A] dark:text-zinc-100">Valor Único:</span>
                  <strong className="text-emerald-700 text-base font-bold">
                    R$ {pricing.singleLayoutPrice.toFixed(2)}
                  </strong>
                </div>
              </div>

              <p className="text-2xs text-[#A09A8E] dark:text-zinc-500">
                * O valor será debitado ou cobrado na sua próxima fatura SaaS mensal sem mensalidades adicionais recorrentes pelo tema.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPurchasingLayout(null)}
                className="px-4 py-2 text-xs font-semibold text-[#706B5F] dark:text-zinc-400 hover:text-[#2D2D2A] dark:hover:text-zinc-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmPurchase}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Confirmar Desbloqueio Imediato
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: SOLICITAR LAYOUT EXCLUSIVO COM A ADMINISTRAÇÃO */}
      {/* ========================================================================= */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#E9E2D7] dark:border-zinc-700 shadow-xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#E9E2D7] dark:border-zinc-700 pb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-[#EEF1EB] text-[#5A5A40] dark:text-zinc-300 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </span>
                <h3 className="serif font-bold text-lg text-[#2D2D2A] dark:text-zinc-100">
                  Solicitar Layout sob Medida
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(false)}
                className="p-1.5 text-[#706B5F] dark:text-zinc-400 hover:text-[#2D2D2A] dark:hover:text-zinc-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {requestSentFeedback ? (
              <div className="p-6 bg-emerald-50 text-emerald-900 rounded-2xl text-center space-y-2 border border-emerald-200">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-base">Solicitação Enviada com Sucesso!</h4>
                <p className="text-xs text-emerald-800">
                  O chamado foi registrado na central do Admin. Nossa equipe de design entrará em contato pelo seu WhatsApp cadastrado ({professional.phone}).
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitCustomRequest} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">
                    Nome Oficial do Estabelecimento / Marca:
                  </label>
                  <input
                    type="text"
                    value={customBrandName}
                    onChange={(e) => setCustomBrandName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] dark:bg-zinc-800/50 border border-[#E9E2D7] dark:border-zinc-700 rounded-xl text-[#2D2D2A] dark:text-zinc-100 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">
                    Cores Desejadas ou Paleta da Sua Marca:
                  </label>
                  <input
                    type="text"
                    value={customColors}
                    onChange={(e) => setCustomColors(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] dark:bg-zinc-800/50 border border-[#E9E2D7] dark:border-zinc-700 rounded-xl text-[#2D2D2A] dark:text-zinc-100 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">
                    Instagram ou Links de Referência Visual:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: @minhabarbearia ou link do site/Pinterest"
                    value={customReferences}
                    onChange={(e) => setCustomReferences(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] dark:bg-zinc-800/50 border border-[#E9E2D7] dark:border-zinc-700 rounded-xl text-[#2D2D2A] dark:text-zinc-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">
                    Detalhes e Instruções para o Designer:
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Descreva o estilo que você sonha (vintage, toalha quente, estética clean luxo, arrojado, etc.)..."
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] dark:bg-zinc-800/50 border border-[#E9E2D7] dark:border-zinc-700 rounded-xl text-[#2D2D2A] dark:text-zinc-100 outline-none"
                  />
                </div>

                <div className="bg-[#FAF8F5] dark:bg-zinc-800/50 p-3.5 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 flex items-center justify-between text-xs">
                  <span>Investimento sob Medida:</span>
                  <strong className="text-[#5A5A40] dark:text-zinc-300 text-sm">
                    R$ {pricing.customLayoutRequestPrice.toFixed(2)}
                  </strong>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRequestModalOpen(false)}
                    className="px-4 py-2 font-semibold text-[#706B5F] dark:text-zinc-400 hover:text-[#2D2D2A] dark:hover:text-zinc-100 cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Enviar Pedido de Layout
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
