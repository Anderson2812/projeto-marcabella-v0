'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/use-app-store';
import { Sparkles, Calendar, ShieldCheck, UserCheck, ExternalLink, Clock, LogOut, Sun, Moon, LogIn } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { 
    professionals, 
    currentRole, 
    setRole, 
    selectedProfessionalId, 
    impersonatedByMaster,
    stopImpersonation,
    themeMode,
    toggleThemeMode
  } = useAppStore();

  const currentProf = professionals.find(p => p.id === selectedProfessionalId) || professionals[0];
  const isPublicSchedulePage = pathname.startsWith('/');
  const clientAgendaHref = isPublicSchedulePage ? pathname : `/${currentProf?.slug || 'bella-beauty'}`;

  const handleExitImpersonation = () => {
    stopImpersonation();
    router.push('/master');
  };

  return (
    <>
      {/* Banner de Impersonate Ativo */}
      {impersonatedByMaster && (
        <div className="bg-amber-500 text-stone-900 dark:text-zinc-100 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-xs sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <span className="bg-black/20 text-white px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
              Suporte Técnico Master
            </span>
            <span>
              Você está conectado como <strong>{currentProf?.name}</strong> ({currentProf?.category}).
            </span>
          </div>
          <button
            onClick={handleExitImpersonation}
            className="flex items-center gap-1 bg-stone-900 hover:bg-black text-white px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair e Voltar ao Master
          </button>
        </div>
      )}

      <header className={`sticky ${impersonatedByMaster ? 'top-8' : 'top-0'} z-40 bg-[#FDFBF7]/95 dark:bg-[#121113]/95 backdrop-blur-md border-b border-[#EFE5DC] dark:border-zinc-800/80 shadow-xs transition-colors`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo / Nome da Plataforma */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden shadow-md group-hover:scale-105 transition-transform ring-1 ring-stone-200 dark:ring-zinc-700 bg-[#8C4E46] flex items-center justify-center">
                <Image src="/marcabella-logo.png" alt="Marcabella Logo" width={40} height={40} className="object-cover w-full h-full" priority />
              </div>
              <div>
                <span className="serif text-lg sm:text-xl font-bold text-[#2B2320] dark:text-zinc-100 tracking-tight block">
                  Marcabella
                </span>
                <span className="hidden sm:block text-[11px] text-[#7A6D65] dark:text-zinc-400 font-medium tracking-tight -mt-0.5">
                  Agendamentos para Estética & Beleza
                </span>
              </div>
            </Link>

            {/* Seletor de Perfil / Modos para Demonstração */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Botão Alternar Modo Claro / Escuro */}
              <button
                onClick={toggleThemeMode}
                className="p-2 rounded-xl border border-[#E8DCCD] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#6E635C] dark:text-zinc-200 hover:bg-[#FAF5EF] dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                title={themeMode === 'dark' ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
                aria-label="Alternar tema"
              >
                {themeMode === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-zinc-600" />
                )}
              </button>

              {/* Botão Entrar (substituindo Painel Administrativo) */}
              <Link
                id="header-entrar"
                href="/painel"
                onClick={() => setRole('professional')}
                className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                  pathname === '/painel'
                    ? 'bg-[#783F38] text-white ring-2 ring-[#8C4E46] dark:ring-rose-500'
                    : 'bg-[#8C4E46] hover:bg-[#783F38] dark:bg-rose-700 dark:hover:bg-rose-600 text-white'
                }`}
                title="Entrar no Painel"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Entrar</span>
              </Link>
            </div>

          </div>
        </div>
      </header>
    </>
  );
}
