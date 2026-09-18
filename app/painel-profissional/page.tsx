'use client';

import { Suspense, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/lib/use-app-store';
import { Sparkles, ArrowLeft, MessageCircle, X } from 'lucide-react';

const ProfessionalDashboard = dynamic(() => import('@/components/ProfessionalDashboard'), {
  loading: () => (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-stone-500 dark:text-zinc-400 p-8">
      <div className="w-8 h-8 border-3 border-[#8C4E46] dark:border-rose-400 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-medium">Carregando painel de exemplo...</p>
    </div>
  )
});

function PainelProfissionalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { professionals, setSelectedProfessionalId } = useAppStore();
  const [showDemoBanner, setShowDemoBanner] = useState(true);

  const profParam = searchParams?.get('prof') || searchParams?.get('id') || '';
  useEffect(() => {
    if (!profParam) return;
    const match = professionals.find(
      p => p.slug === profParam.toLowerCase() || p.id === profParam
    );
    if (match) {
      setSelectedProfessionalId(match.id);
    }
  }, [profParam]);

  return (
    <div>
      {showDemoBanner && (
        <div className="bg-gradient-to-r from-[#FAF5EF] via-[#FDFBF7] to-[#FAF5EF] dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 border-b border-[#E8DCCD] dark:border-zinc-800 py-2.5 px-4 sm:px-6 shadow-2xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-[#544740] dark:text-zinc-300">
            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
              <span className="px-2.5 py-0.5 rounded-full bg-[#8C4E46]/15 dark:bg-rose-950/60 text-[#8C4E46] dark:text-rose-300 font-extrabold text-[10px] uppercase tracking-wider border border-[#8C4E46]/20">
                Painel de Demonstração / Exemplo
              </span>
              <span>
                Você está visualizando um <strong>painel de exemplo</strong> com agendamentos e métricas simuladas para testar as ferramentas.
              </span>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#8C4E46] hover:bg-[#783F38] text-white text-xs font-bold transition-all shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Criar Minha Agenda Real</span>
              </Link>
              <button
                onClick={() => setShowDemoBanner(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 transition-colors"
                title="Fechar aviso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      <ProfessionalDashboard />
    </div>
  );
}

export default function PainelProfissionalPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-zinc-950 text-stone-900 dark:text-zinc-100 transition-colors pb-16">
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-8 text-stone-500 dark:text-zinc-400 font-medium">Carregando painel de exemplo...</div>}>
        <PainelProfissionalContent />
      </Suspense>
    </div>
  );
}
