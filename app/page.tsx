'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAppStore } from '@/lib/use-app-store';
import { 
  Sparkles, 
  ArrowRight,
  CheckCircle2,
  Clock,
  MessageCircle,
  CalendarDays,
  Smartphone,
  Wallet,
  ShieldCheck,
  Star,
  ChevronRight,
  HeartHandshake,
  TrendingUp,
  Scissors,
  Check,
  Percent,
  Calendar,
  Zap,
  ArrowUpRight,
  Phone,
  User,
  Users,
  X,
  Send
} from 'lucide-react';
import { formatPhoneMask, cleanPhone } from '@/lib/whatsapp-utils';

interface BeautyNiche {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
}

const beautyNiches: BeautyNiche[] = [
  {
    id: 'nail',
    name: 'Nail Designer & Manicure',
    category: 'Alongamento em Gel & Fibra',
    imageUrl: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'lash',
    name: 'Lash Designer',
    category: 'Extensão de Cílios & Lifting',
    imageUrl: 'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'hair',
    name: 'Cabeleireira & Colorista',
    category: 'Mechas, Cortes & Terapia Capilar',
    imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'estetica',
    name: 'Estética Facial & Corporal',
    category: 'Limpeza de Pele & Protocolos',
    imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'micro',
    name: 'Sobrancelhas & Micro',
    category: 'Design, Microblading & Labial',
    imageUrl: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'massagem',
    name: 'Massoterapia & Spa',
    category: 'Drenagem & Massagem Relaxante',
    imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=500&auto=format&fit=crop&q=80',
  },
];

export default function HomePage() {
  const { globalPlanPricing, professionals, getServicesForProf, getReviewsForProf } = useAppStore();
  const trialDays = globalPlanPricing?.trialDays || 15;

  // Estado da janela modal de solicitação de cadastro / WhatsApp
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactSpecialty, setContactSpecialty] = useState('Nail Designer');
  const [customSpecialty, setCustomSpecialty] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactError, setContactError] = useState('');

  // Modelo de exemplo dinâmico (Salão com equipe Bella Beauty Studio)
  const rawDemoProf = professionals.find(p => p.id === 'prof-1') || professionals[0];
  const demoProf = rawDemoProf ? {
    ...rawDemoProf,
    name: 'Bella Beauty Studio',
    avatarUrl: '/bella.jpg',
    category: 'Salão de Beleza',
    slug: 'bella-beauty'
  } : rawDemoProf;
  const demoServices = demoProf ? getServicesForProf(demoProf.id) : [];
  const demoReviews = demoProf ? getReviewsForProf(demoProf.id) : [];
  const averageRating = demoReviews.length > 0 
    ? (demoReviews.reduce((acc, r) => acc + r.rating, 0) / demoReviews.length).toFixed(1)
    : null;

  const handleOpenContact = (specialty?: string) => {
    if (specialty) {
      setContactSpecialty(specialty);
    }
    setCustomSpecialty('');
    setContactError('');
    setContactSubmitted(false);
    setIsContactModalOpen(true);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = formatPhoneMask(e.target.value);
    setContactPhone(masked);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim()) {
      setContactError('Por favor, informe seu nome ou o nome do seu espaço.');
      return;
    }
    const cleaned = cleanPhone(contactPhone);
    if (cleaned.length < 10) {
      setContactError('Por favor, informe um número de WhatsApp válido com DDD.');
      return;
    }

    if (contactSpecialty === 'Outro' && !customSpecialty.trim()) {
      setContactError('Por favor, digite sua especialidade ou área de atuação.');
      return;
    }

    setContactError('');
    setContactSubmitted(true);

    const effectiveSpecialty = contactSpecialty === 'Outro' 
      ? (customSpecialty.trim() || 'Outro') 
      : contactSpecialty;

    // Mensagem formatada enviada diretamente para o WhatsApp de suporte: 62992723737
    const textMsg = `Olá! Meu nome é ${contactName.trim()} (${contactPhone.trim()}). Atuo como ${effectiveSpecialty} e gostaria de solicitar a ativação da minha agenda profissional com ${trialDays} dias grátis no Marcabella.`;
    const targetPhone = '5562992723737';
    const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(textMsg)}`;
    
    setTimeout(() => {
      window.open(whatsappUrl, '_blank');
    }, 600);
  };
  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0c0c0e] text-[#2C2420] dark:text-zinc-100 transition-colors selection:bg-[#8A4F48] selection:text-white">
      
      {/* ========================================================================= */}
      {/* HERO SECTION COMPACTO, ELEGANTE E COM FOCO EM BELEZA & ESTÉTICA */}
      {/* ========================================================================= */}
      <section className="relative pt-6 pb-8 sm:pt-10 sm:pb-12 border-b border-[#EFE5DC] dark:border-zinc-800/80 overflow-hidden bg-gradient-to-b from-[#FAF5EF] to-[#FDFBF7] dark:from-[#121113] dark:to-[#0c0c0e]">
        {/* Glow decorativo suave de fundo em tons champagne/blush */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-[#F3E2D5]/50 via-[#EAD5D0]/30 to-transparent dark:from-rose-950/20 dark:via-amber-950/15 dark:to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            
            {/* Coluna de Texto e Ações (Hero Copy) */}
            <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
              
              {/* Badge de Nível Profissional */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5EAE1] dark:bg-rose-950/40 text-[#8C4E46] dark:text-rose-300 text-xs font-semibold tracking-wide border border-[#E8D8CC] dark:border-rose-900/50">
                <Sparkles className="w-3.5 h-3.5 text-[#8C4E46] dark:text-rose-300" />
                <span>Exclusivo para Profissionais da Estética & Beleza</span>
              </div>

              {/* Título Principal Tipográfico e Assertivo */}
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-medium tracking-tight text-[#2B2320] dark:text-zinc-50 leading-[1.15]">
                  Sua agenda lotada.<br />
                  <span className="italic font-serif text-[#8C4E46] dark:text-rose-300">
                    Sem faltas, sem estresse no WhatsApp.
                  </span>
                </h1>
                <p className="text-sm sm:text-base text-[#6E635C] dark:text-zinc-300 max-w-xl mx-auto lg:mx-0 font-light leading-relaxed">
                  A plataforma sob medida para <strong>Nail Designers, Lash Artists, Clínicas de Estética e Cabeleireiras</strong>. Agendamento online 24h com link exclusivo para o seu Instagram e WhatsApp.
                </p>
              </div>

              {/* CARD DE DESTAQUE: PROFISSIONALIZE O SEU NEGÓCIO HOJE (TRAZIDO PARA O TOPO) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 border border-[#E8DCCD] dark:border-zinc-800 shadow-sm space-y-3 text-left">
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8C4E46] dark:text-rose-400 uppercase tracking-wider">
                    <TrendingUp className="w-4 h-4 text-[#8C4E46] dark:text-rose-400" />
                    <span>Profissionalize seu negócio hoje</span>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#F5EAE1] dark:bg-rose-950/60 text-[#8C4E46] dark:text-rose-300 border border-[#E8D8CC] dark:border-rose-900/40">
                    {trialDays} Dias Grátis
                  </span>
                </div>
                
                <p className="text-xs sm:text-[13px] text-[#544740] dark:text-zinc-300 leading-relaxed">
                  <strong>Teste {trialDays} dias grátis sem nenhum pagamento inicial.</strong> Cadastre seus procedimentos e sua chave Pix em <strong>3 minutos</strong> e receba o link pronto para colocar na sua bio e compartilhar com suas clientes.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-[#F0E4D8] dark:border-zinc-800/80 text-[11px] text-[#4A3D36] dark:text-zinc-300 font-medium">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Sem pagamento inicial</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Sinal Pix anti-falta</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Lembretes no WhatsApp</span>
                  </div>
                </div>
              </div>

              {/* CTA ÚNICO E UNIFICADO: Criar Agenda e Atendimento no WhatsApp */}
              <div className="pt-1 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <button
                  id="hero-solicitar-agenda-whatsapp-btn"
                  onClick={() => handleOpenContact()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-[#8C4E46] hover:bg-[#783F38] dark:bg-rose-700 dark:hover:bg-rose-600 text-white font-bold text-sm sm:text-base shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-white shrink-0">
                    <MessageCircle className="w-4.5 h-4.5 text-[#25D366] fill-[#25D366]" />
                  </div>
                  <span>Criar Minha Agenda • Solicitar no WhatsApp</span>
                  <ArrowRight className="w-4 h-4 text-white/80 transition-transform group-hover:translate-x-1 shrink-0" />
                </button>
              </div>

              {/* Garantias rápidas em texto sutil */}
              <div className="pt-2 border-t border-[#EFE5DC] dark:border-zinc-800/80 flex items-center justify-center lg:justify-start gap-4 text-xs text-[#7A6D65] dark:text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                  Sem fidelidade
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                  Link próprio para Instagram
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                  Ativação em minutos
                </span>
              </div>

            </div>

            {/* Coluna Direita: Card Interativo e Moderno com Prévia da Agenda */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-[#E8DCCD] dark:border-zinc-800 shadow-xl shadow-stone-200/50 dark:shadow-black/40 relative overflow-hidden transition-all">
                {/* Glow decorativo sutil no card */}
                <div className="absolute -top-16 -right-16 w-36 h-36 bg-gradient-to-bl from-rose-200/40 via-amber-100/20 to-transparent dark:from-rose-900/20 dark:via-transparent rounded-full blur-2xl pointer-events-none" />

                {/* Badge Flutuante no Topo */}
                <div className="flex items-center justify-between gap-2 pb-3.5 mb-3.5 border-b border-[#F2E8DF] dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                      Agenda Online Ativa
                    </span>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400">
                    Visão da Cliente
                  </span>
                </div>

                {/* Header do Perfil do Estabelecimento */}
                <div className="flex items-center gap-3">
                  <div className="relative w-13 h-13 rounded-2xl overflow-hidden border-2 border-[#8C4E46]/20 dark:border-rose-400/30 shadow-xs shrink-0">
                    <Image
                      src={demoProf.avatarUrl || "/bella.jpg"}
                      alt={demoProf.name}
                      fill
                      sizes="52px"
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <h3 className="text-sm sm:text-base font-bold text-[#2B2320] dark:text-zinc-100 truncate">
                        {demoProf.name}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold shrink-0">
                        Disponível
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#7A6D65] dark:text-zinc-400 mt-0.5">
                      {averageRating ? (
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {averageRating}
                          <span className="text-[10px] text-stone-500 font-normal">({demoReviews.length})</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-stone-500 dark:text-zinc-400">
                          Perfil verificado
                        </span>
                      )}
                      <span>•</span>
                      <span className="truncate">{demoProf.address.split(',')[0]}</span>
                    </div>
                  </div>
                </div>

                {/* Destaque da Equipe com Camila Silva */}
                <div className="mt-3 px-3 py-1.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 flex items-center justify-between text-[11px] text-amber-950 dark:text-amber-200">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Users className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="truncate">Equipe: <strong>Camila Silva</strong> e especialistas</span>
                  </div>
                  <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold shrink-0">3 profissionais</span>
                </div>

                {/* Lista de Procedimentos com Design Modernizado */}
                <div className="my-4 p-3.5 rounded-2xl bg-[#FAF5EF]/90 dark:bg-zinc-950/80 border border-[#EFE3D8] dark:border-zinc-800/90 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wider font-extrabold text-[#8C4E46] dark:text-rose-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Procedimentos ({demoServices.length})
                    </span>
                    <span className="text-[10px] text-stone-500 dark:text-zinc-400 font-medium">Catálogo de Serviços</span>
                  </div>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {demoServices.slice(0, 4).map((service) => (
                      <div
                        key={service.id}
                        className="group flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-[#EAE0D5] dark:border-zinc-800 text-xs shadow-2xs"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-[#2B2320] dark:text-zinc-100 truncate text-[11px]">
                              {service.name}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-[#7A6D65] dark:text-zinc-400 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5 text-stone-400" />
                              {service.durationMinutes} min
                            </span>
                            {service.requiresDeposit && (
                              <span className="px-1.5 py-0.2 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-900/60 text-amber-700 dark:text-amber-300 font-semibold text-[9px]">
                                Sinal R$ {service.depositValue.toFixed(2).replace('.', ',')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-extrabold text-[#2B2320] dark:text-zinc-100 text-xs tracking-tight">
                            R$ {service.price.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-[#EFE3D8] dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-[#6E635C] dark:text-zinc-400">
                    <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                      <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                      Lembretes automáticos no WhatsApp
                    </span>
                  </div>
                </div>

                {/* Ações Modernizadas */}
                <div className="space-y-2">
                  <Link
                    href={`/${demoProf.slug}`}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#8C4E46] hover:bg-[#783F38] text-white text-xs font-bold transition-all shadow-sm hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  >
                    <span>Ver Demonstração da Agenda</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    href={`/painel-profissional?prof=${demoProf.slug}`}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-[#FAF5EF] hover:bg-[#F2E5D8] dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[#8C4E46] dark:text-rose-300 transition-all text-xs font-bold border border-[#EFE3D8] dark:border-zinc-700 cursor-pointer"
                    title={`Acessar Painel de Gestão (Exemplo de ${demoProf.name})`}
                  >
                    <span>Acessar Painel de Gestão (Exemplo Interativo)</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>

                  <div className="pt-0.5 text-center">
                    <span className="text-[10px] text-stone-500 dark:text-zinc-400 font-medium">
                      💡 Painel com dados de exemplo para você testar como funciona na prática
                    </span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SEÇÃO: EXEMPLOS DE NICHOS ATENDIDOS (COMPACTO: APENAS FOTOS E NOMES) */}
      {/* ========================================================================= */}
      <section className="py-6 sm:py-8 bg-white dark:bg-[#101012] border-b border-[#EFE5DC] dark:border-zinc-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-xl mx-auto mb-4 sm:mb-5">
            <h2 className="text-base sm:text-lg font-serif font-bold text-[#2B2320] dark:text-zinc-100">
              Soluções desenhadas para o seu nicho
            </h2>
            <p className="text-xs text-[#7A6D65] dark:text-zinc-400 font-light mt-0.5">
              Especialidades atendidas no Marcabella com regras sob medida
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {beautyNiches.map((niche) => (
              <div 
                key={niche.id}
                className="group rounded-2xl bg-[#FAF5EF]/70 dark:bg-zinc-900/80 border border-[#EAE0D5] dark:border-zinc-800 overflow-hidden hover:border-[#8C4E46]/50 hover:shadow-xs transition-all duration-200 flex flex-col"
              >
                {/* Foto compacta */}
                <div className="relative h-28 w-full overflow-hidden bg-stone-100 dark:bg-zinc-800">
                  <Image
                    src={niche.imageUrl}
                    alt={niche.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Nome de exemplo */}
                <div className="p-2 text-center flex-1 flex flex-col justify-center">
                  <h3 className="text-xs font-bold text-[#2B2320] dark:text-zinc-100 leading-snug group-hover:text-[#8C4E46] dark:group-hover:text-rose-300 transition-colors">
                    {niche.name}
                  </h3>
                  <span className="text-[10px] text-[#8C8077] dark:text-zinc-400 line-clamp-1 mt-0.5">
                    {niche.category}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* OS 4 PILARES DA PROFISSIONAL DE BELEZA (COMPACTO & SEM ESPAÇO VAZIO) */}
      {/* ========================================================================= */}
      <section className="py-8 sm:py-12 bg-white dark:bg-[#101012] border-b border-[#EFE5DC] dark:border-zinc-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8 space-y-1">
            <h2 className="text-xl sm:text-2xl font-serif font-medium text-[#2B2320] dark:text-zinc-100">
              Tudo o que você precisa para trabalhar com tranquilidade
            </h2>
            <p className="text-xs sm:text-sm text-[#7A6D65] dark:text-zinc-400">
              Menos tempo respondendo mensagens repetitivas, mais tempo com suas clientes na maca ou na cadeira.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Pilar 1: Garantia de Comparecimento & Reserva Segura */}
            <div className="p-5 rounded-2xl bg-[#FAF5EF] dark:bg-zinc-900/60 border border-[#EFE3D8] dark:border-zinc-800 flex flex-col justify-between hover:border-[#8C4E46]/30 transition-all shadow-xs">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 shadow-2xs flex items-center justify-center text-[#8C4E46] dark:text-rose-400 border border-[#EFE3D8]/60 dark:border-zinc-700">
                  <Wallet className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1.5 min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-[#2B2320] dark:text-zinc-100 truncate">
                      Garantia de Horário
                    </h3>
                    <span className="inline-flex items-center justify-center text-center leading-none whitespace-nowrap shrink-0 text-[10px] font-bold text-[#8C4E46] dark:text-rose-300 bg-[#F4E6DC] dark:bg-rose-950/50 px-2 py-1 rounded-full">
                      Opcional
                    </span>
                  </div>
                  <p className="text-xs text-[#6E635C] dark:text-zinc-400 font-light leading-relaxed">
                    Defina livremente se o procedimento exige um sinal prévio (ex: R$ 20 ou 20%) ou se a cliente agenda diretamente sem taxa. A cliente garante a vaga e você protege seu faturamento.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-2.5 border-t border-[#EFE3D8] dark:border-zinc-800 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                ✓ Ativação opcional por serviço
              </div>
            </div>

            {/* Pilar 2: Link Profissional para Instagram & WhatsApp */}
            <div className="p-5 rounded-2xl bg-[#FAF5EF] dark:bg-zinc-900/60 border border-[#EFE3D8] dark:border-zinc-800 flex flex-col justify-between hover:border-[#8C4E46]/30 transition-all shadow-xs">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 shadow-2xs flex items-center justify-center text-[#8C4E46] dark:text-rose-400 border border-[#EFE3D8]/60 dark:border-zinc-700">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1.5 min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-[#2B2320] dark:text-zinc-100 truncate">
                      Seu Link Exclusivo
                    </h3>
                    <span className="inline-flex items-center justify-center text-center leading-none whitespace-nowrap shrink-0 text-[10px] font-bold text-[#8C4E46] dark:text-rose-300 bg-[#F4E6DC] dark:bg-rose-950/50 px-2 py-1 rounded-full">
                      Bio & Whats
                    </span>
                  </div>
                  <p className="text-xs text-[#6E635C] dark:text-zinc-400 font-light leading-relaxed">
                    Um endereço próprio com suas fotos, preços atualizados, duração de cada serviço e regras do seu espaço para divulgar no Instagram e WhatsApp.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-2.5 border-t border-[#EFE3D8] dark:border-zinc-800 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                ✓ Visual premium personalizado
              </div>
            </div>

            {/* Pilar 3: Mensagens & Lembretes no WhatsApp */}
            <div className="p-5 rounded-2xl bg-[#FAF5EF] dark:bg-zinc-900/60 border border-[#EFE3D8] dark:border-zinc-800 flex flex-col justify-between hover:border-[#8C4E46]/30 transition-all shadow-xs">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 shadow-2xs flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-[#EFE3D8]/60 dark:border-zinc-700">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1.5 min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-[#2B2320] dark:text-zinc-100 truncate">
                      Lembretes WhatsApp
                    </h3>
                    <span className="inline-flex items-center justify-center text-center leading-none whitespace-nowrap shrink-0 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/50 px-2 py-1 rounded-full">
                      1 Clique
                    </span>
                  </div>
                  <p className="text-xs text-[#6E635C] dark:text-zinc-400 font-light leading-relaxed">
                    Envie comprovante digital, lembretes de confirmação 24h antes e avisos de manutenção/retorno em um clique direto para o WhatsApp da cliente.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-2.5 border-t border-[#EFE3D8] dark:border-zinc-800 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                ✓ Fidelização e mais retornos
              </div>
            </div>

            {/* Pilar 4: Gestão de Intervalos & Fila de Encaixe */}
            <div className="p-5 rounded-2xl bg-[#FAF5EF] dark:bg-zinc-900/60 border border-[#EFE3D8] dark:border-zinc-800 flex flex-col justify-between hover:border-[#8C4E46]/30 transition-all shadow-xs">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 shadow-2xs flex items-center justify-center text-[#8C4E46] dark:text-rose-400 border border-[#EFE3D8]/60 dark:border-zinc-700">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1.5 min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-[#2B2320] dark:text-zinc-100 truncate">
                      Intervalo & Fila
                    </h3>
                    <span className="inline-flex items-center justify-center text-center leading-none whitespace-nowrap shrink-0 text-[10px] font-bold text-[#8C4E46] dark:text-rose-300 bg-[#F4E6DC] dark:bg-rose-950/50 px-2 py-1 rounded-full">
                      Sem Buracos
                    </span>
                  </div>
                  <p className="text-xs text-[#6E635C] dark:text-zinc-400 font-light leading-relaxed">
                    Tempo automático para esterilização e descanso entre atendimentos. Em caso de cancelamento, clientes na fila de espera são chamadas na hora.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-2.5 border-t border-[#EFE3D8] dark:border-zinc-800 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                ✓ Grade otimizada sem janelas
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FOOTER COMPACTO E ELEGANTE */}
      {/* ========================================================================= */}
      <footer className="py-6 sm:py-8 bg-[#FAF5EF] dark:bg-[#0c0c0e] text-center border-t border-[#EFE5DC] dark:border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#8C4E46] text-white flex items-center justify-center text-xs font-bold">
              M
            </div>
            <span className="serif text-sm font-bold text-[#2B2320] dark:text-zinc-100">
              Marcabella
            </span>
            <span className="text-xs text-[#8C8077] dark:text-zinc-500">
              • Estética, Beleza & Barbearia
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-[#7A6D65] dark:text-zinc-400">
            <Link
              href="/painel?tab=login"
              className="hover:text-[#8C4E46] dark:hover:text-rose-400 transition-colors font-semibold"
            >
              Área da Profissional (Entrar)
            </Link>
            <span>•</span>
            <Link
              href={`/${demoProf.slug}`}
              className="hover:text-[#8C4E46] dark:hover:text-rose-400 transition-colors"
            >
              Ver Demonstração de Agenda
            </Link>
          </div>

        </div>
        <p className="text-[11px] text-[#A3968C] dark:text-zinc-600 mt-4">
          © {new Date().getFullYear()} Marcabella. Desenvolvido para simplificar a vida dos profissionais da beleza.
        </p>
      </footer>

      {/* ========================================================================= */}
      {/* MODAL / JANELA MODERNA PARA ENTRAR EM CONTATO */}
      {/* ========================================================================= */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-[#E8DCCD] dark:border-zinc-800 shadow-2xl p-6 sm:p-7 overflow-hidden text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decoração superior */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#8C4E46] via-rose-400 to-[#8C4E46]" />

            {/* Botão Fechar */}
            <button
              onClick={() => setIsContactModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            {contactSubmitted ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-[#2B2320] dark:text-zinc-100">
                    Solicitação Encaminhada!
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-zinc-400 max-w-xs mx-auto">
                    Obrigado, <strong>{contactName}</strong>! Estamos abrindo o WhatsApp com os seus dados ({contactSpecialty}) para liberar sua agenda com {trialDays} dias de teste grátis.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => setIsContactModalOpen(false)}
                    className="w-full py-2.5 px-4 rounded-xl bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-800 dark:text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Fechar Janela
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#8C4E46] dark:text-rose-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{trialDays} Dias de Teste Grátis</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#2B2320] dark:text-zinc-100">
                    Criar Minha Agenda Profissional
                  </h3>
                  <p className="text-xs text-[#7A6D65] dark:text-zinc-400">
                    Preencha seu nome e WhatsApp para solicitar o cadastro. Liberamos sua agenda personalizada e seu link exclusivo no WhatsApp.
                  </p>
                </div>

                {contactError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
                    {contactError}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#4A3D36] dark:text-zinc-300 mb-1">
                      Seu Nome ou Nome do Espaço *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Ex: Camila Silva Nails"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-[#E0D4C8] dark:border-zinc-700 text-xs text-[#2B2320] dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8C4E46]/30 dark:focus:ring-rose-500/40"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#4A3D36] dark:text-zinc-300 mb-1">
                      Número de WhatsApp com DDD *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="tel"
                        required
                        value={contactPhone}
                        onChange={handlePhoneChange}
                        placeholder="(62) 99272-3737"
                        maxLength={15}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-[#E0D4C8] dark:border-zinc-700 text-xs text-[#2B2320] dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8C4E46]/30 dark:focus:ring-rose-500/40"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#4A3D36] dark:text-zinc-300 mb-1.5">
                      Sua Atuação Principal
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Nail Designer',
                        'Lash Designer',
                        'Cabeleireira',
                        'Estética Facial',
                        'Micropigmentação',
                        'Massoterapia',
                        'Outro'
                      ].map((spec) => {
                        const isSelected = contactSpecialty === spec;
                        return (
                          <button
                            key={spec}
                            type="button"
                            onClick={() => {
                              setContactSpecialty(spec);
                              if (spec !== 'Outro') setCustomSpecialty('');
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#8C4E46] text-white shadow-xs'
                                : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700'
                            }`}
                          >
                            {spec}
                          </button>
                        );
                      })}
                    </div>

                    {/* Caixa de texto aberta imediatamente ao escolher "Outro" */}
                    {contactSpecialty === 'Outro' && (
                      <div className="mt-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                        <label className="block text-[11px] font-bold text-[#8C4E46] dark:text-rose-300 mb-1">
                          Qual é a sua área ou especialidade? <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          autoFocus
                          value={customSpecialty}
                          onChange={(e) => setCustomSpecialty(e.target.value)}
                          placeholder="Ex: Depilação a Laser, Bronzeamento, Podologia, Designer de Sobrancelhas..."
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border-2 border-[#8C4E46]/40 dark:border-rose-500/50 text-xs text-[#2B2320] dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none focus:border-[#8C4E46] focus:ring-2 focus:ring-[#8C4E46]/20"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-gradient-to-r from-[#FAF5EF] via-[#FDFBF7] to-emerald-50/40 dark:from-zinc-800/90 dark:to-zinc-800/60 border border-[#EAE0D5] dark:border-zinc-700/80 text-[11px] sm:text-xs text-[#544740] dark:text-zinc-300 flex items-start sm:items-center gap-2.5 shadow-2xs">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="leading-snug">
                    <strong className="text-[#2B2320] dark:text-zinc-100 font-bold block sm:inline">
                      Não necessita de nenhum pagamento nesse momento.
                    </strong>{' '}
                    <span className="text-[#7A6D65] dark:text-zinc-400">
                      Teste grátis sem compromisso. Sem necessidade de cartão de crédito ou Pix para começar a usar.
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsContactModalOpen(false)}
                    className="w-1/3 py-2.5 px-3 rounded-xl border border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#8C4E46] hover:bg-[#783F38] dark:bg-rose-700 dark:hover:bg-rose-600 text-white text-xs font-bold shadow-sm transition-transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#25D366] fill-[#25D366]" />
                    <span>Solicitar Cadastro no WhatsApp</span>
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
