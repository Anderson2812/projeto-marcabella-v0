'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProfessionalRegisterForm from '@/components/ProfessionalRegisterForm';
import { ArrowLeft, Sparkles, ShieldCheck } from 'lucide-react';

export default function CadastroPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-zinc-950 py-10 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-xl mx-auto space-y-6">
        
        {/* Botão Voltar */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5A5A40] dark:text-amber-300 hover:text-[#2D2D2A] dark:hover:text-zinc-100 dark:text-zinc-100 dark:hover:text-zinc-100 dark:text-zinc-100 dark:hover:text-white bg-white dark:bg-zinc-900 px-3.5 py-2 rounded-xl border border-[#E9E2D7] dark:border-zinc-800 shadow-2xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar para a Página Inicial
          </Link>

          <Link
            href="/painel"
            className="text-xs font-bold text-stone-600 dark:text-zinc-400 hover:text-[#5A5A40] dark:text-zinc-300 dark:hover:text-amber-300"
          >
            Já tem conta? Entrar &rarr;
          </Link>
        </div>

        {/* Card Principal de Cadastro */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-[#E9E2D7] dark:border-zinc-800 shadow-xl space-y-6 transition-colors">
          
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF1EB] dark:bg-zinc-800 text-[#5A5A40] dark:text-amber-300 text-xs font-bold uppercase tracking-wider border border-[#E9E2D7] dark:border-zinc-700">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Cadastro de Espaço & Profissional
            </div>
            <h1 className="serif text-2xl sm:text-3xl font-bold text-[#2D2D2A] dark:text-zinc-100">
              Cadastre seu Espaço
            </h1>
            <p className="text-[#706B5F] dark:text-zinc-400 text-xs sm:text-sm max-w-md mx-auto">
              Preencha os dados abaixo para ativar sua agenda profissional online com link exclusivo para bio e WhatsApp.
            </p>
          </div>

          <ProfessionalRegisterForm 
            onSuccess={() => router.push('/painel')}
            onSwitchToLogin={() => router.push('/painel')}
          />

        </div>

        {/* Rodapé de Segurança */}
        <div className="text-center text-xs text-stone-400 dark:text-zinc-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Seus dados e chaves Pix são protegidos e confidenciais.</span>
        </div>

      </div>
    </div>
  );
}
