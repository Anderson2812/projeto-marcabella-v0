'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/use-app-store';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  AlertCircle, 
  KeyRound,
  User,
  LogOut,
  ChevronRight
} from 'lucide-react';
import type { Professional } from '@/types';

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const router = useRouter();
  const { 
    isProfAuthenticated, 
    isMasterAuthenticated,
    authenticatedProfId,
    currentRole,
    loginAsProfessional, 
    loginAsMaster, 
    logout, 
    professionals,
    selectedProfessionalId
  } = useAppStore();

  // Login State Unificado (Entra tanto profissional quanto admin com login 'admin')
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirectingToMaster, setIsRedirectingToMaster] = useState(false);

  // Mesma conta de demonstração do card da página inicial
  const demoProf = professionals.find(p => p.id === 'prof-1') || professionals[0];

  // Efeito de redirecionamento imediato caso seja detectada sessão Master
  useEffect(() => {
    if (isMasterAuthenticated || currentRole === 'master' || authenticatedProfId === 'master') {
      setIsRedirectingToMaster(true);
      router.replace('/master');
    }
  }, [isMasterAuthenticated, currentRole, authenticatedProfId, router]);

  // Se o Master estiver autenticado ou redirecionando, NUNCA renderiza o painel da profissional
  if (isRedirectingToMaster || isMasterAuthenticated || currentRole === 'master' || authenticatedProfId === 'master') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4 text-stone-700 dark:text-zinc-300">
        <div className="w-10 h-10 border-4 border-[#5A5A40] dark:border-amber-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold tracking-tight">Acessando Painel Master SaaS...</p>
      </div>
    );
  }

  // Se o profissional já estiver autenticado (e não for master), exibe o painel com banner/botão de logout
  if (isProfAuthenticated) {
    const currentProf = professionals.find(p => p.id === selectedProfessionalId);

    return (
      <div className="relative">
        {/* Barra superior de status de sessão administrativa */}
        <div className="bg-[#5A5A40] dark:bg-zinc-700 text-white px-4 py-2 text-xs flex items-center justify-between border-b border-black/20 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold">Painel Administrativo Conectado</span>
            <span className="text-stone-300 hidden sm:inline">
              | Logado como: <strong>{currentProf?.name || 'Profissional'}</strong>
            </span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/20 hover:bg-black/40 text-stone-100 hover:text-white transition-colors cursor-pointer text-xs font-bold"
            title="Encerrar sessão no Painel Administrativo"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair / Trocar Acesso
          </button>
        </div>

        {children}
      </div>
    );
  }

  // Handle Login Submit (Suporta profissional e admin diretamente pelos mesmos campos)
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanId) {
      setLoginError('Informe seu usuário, e-mail ou WhatsApp.');
      return;
    }
    if (!cleanPass) {
      setLoginError('Informe sua senha de acesso.');
      return;
    }

    setIsLoading(true);

    // 1. Se o login digitado for o usuário ou e-mail master ('admin', 'master', 'secao10@gmail.com')
    if (cleanId === 'admin' || cleanId === 'master' || cleanId === 'secao10@gmail.com') {
      const masterRes = loginAsMaster(cleanId, cleanPass);
      setIsLoading(false);
      if (masterRes.success) {
        setIsRedirectingToMaster(true);
        router.replace('/master');
        return;
      } else {
        setLoginError(masterRes.message || 'Credenciais de administrador master incorretas.');
        return;
      }
    }

    // 2. Modo Profissional (autenticação com credenciais da profissional)
    setTimeout(() => {
      const res = loginAsProfessional(identifier.trim(), cleanPass);
      setIsLoading(false);
      if (res.success) {
        return;
      }

      setLoginError(res.message || 'Credenciais inválidas. Verifique seu usuário e senha.');
    }, 300);
  };

  // Handle Quick Demo Login para teste de profissionais
  const handleDemoFill = (demoProf: Professional) => {
    setIdentifier(demoProf.email || demoProf.slug);
    setPassword(demoProf.password || '123456');
    setLoginError(null);
  };

  return (
    <div className="min-h-screen bg-[#F8F6F2] dark:bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Logo & Headline */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-11 h-11 rounded-2xl bg-[#8C4E46] overflow-hidden shadow-md group-hover:scale-105 transition-transform flex items-center justify-center ring-1 ring-stone-200 dark:ring-zinc-700">
              <Image src="/marcabella-logo.png" alt="Marcabella Logo" width={44} height={44} className="object-cover w-full h-full" priority />
            </div>
            <span className="serif text-2xl sm:text-3xl font-bold text-[#2D2D2A] dark:text-zinc-100 tracking-tight">
              Marcabella
            </span>
          </Link>
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#EEF1EB] dark:bg-zinc-800 text-[#5A5A40] dark:text-amber-300 text-xs font-bold uppercase tracking-wider border border-[#E9E2D7] dark:border-zinc-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              Painel de Gestão
            </span>
          </div>
          <h2 className="serif text-xl sm:text-2xl font-bold text-[#2D2D2A] dark:text-zinc-100 pt-1">
            Acesso ao Painel
          </h2>
          <p className="text-xs sm:text-sm text-[#706B5F] dark:text-zinc-400 max-w-sm mx-auto">
            Informe seu usuário, e-mail ou WhatsApp e sua senha de acesso.
          </p>
        </div>

        {/* Card Principal de Login */}
        <div className="mt-6 bg-white dark:bg-zinc-900 py-8 px-5 sm:px-8 shadow-xl rounded-3xl border border-[#E9E2D7] dark:border-zinc-800 transition-colors">
          <div className="space-y-4">

            {loginError && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Formulário Único de Login */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-200 mb-1.5">
                  Usuário, E-mail ou WhatsApp:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="login-identifier-input"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Seu e-mail, usuário ou WhatsApp"
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-stone-300 dark:border-zinc-700 bg-[#F8F6F2] dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 text-sm focus:bg-white dark:focus:bg-zinc-900 focus:border-[#5A5A40] dark:focus:border-zinc-600 focus:ring-1 focus:ring-[#5A5A40] outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-200">
                    Senha de Acesso:
                  </label>
                  <span className="text-[11px] text-[#706B5F] dark:text-zinc-400">
                    Padrão de teste: <strong>123456</strong>
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-stone-300 dark:border-zinc-700 bg-[#F8F6F2] dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 text-sm focus:bg-white dark:focus:bg-zinc-900 focus:border-[#5A5A40] dark:focus:border-zinc-600 focus:ring-1 focus:ring-[#5A5A40] outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 dark:text-zinc-400 dark:hover:text-stone-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="submit-login-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#8C4E46] hover:bg-[#783F38] dark:bg-rose-700 dark:hover:bg-rose-600 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isLoading ? (
                  <span>Verificando credenciais...</span>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Entrar no Painel</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Única Conta de Demonstração (A mesma do Card da Home) */}
              {demoProf && (
                <div className="pt-4 border-t border-stone-200 dark:border-zinc-800">
                  <span className="text-[11px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider block mb-2">
                    Conta de Demonstração (Acesso Rápido):
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDemoFill(demoProf)}
                    className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-zinc-800 hover:bg-stone-100 dark:hover:bg-zinc-750 border border-stone-200 dark:border-zinc-700 transition-colors cursor-pointer flex items-center justify-between group text-left"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-xs text-stone-800 dark:text-zinc-100 truncate group-hover:text-[#8C4E46] dark:group-hover:text-rose-300">
                        {demoProf.name}
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-zinc-400 truncate">
                        {demoProf.category} • Clique para preencher login
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-[#8C4E46]/10 dark:bg-rose-950/60 text-[#8C4E46] dark:text-rose-300 shrink-0 border border-[#8C4E46]/20">
                      Preencher
                    </span>
                  </button>
                </div>
              )}

              {/* Solicitação Profissional de Liberação */}
              <div className="pt-3">
                <a
                  href="https://wa.me/5562992723737?text=Ol%C3%A1!%20Gostaria%20de%20solicitar%20a%20libera%C3%A7%C3%A3o%20da%20minha%20agenda%20profissional%20no%20BellaHora."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full p-3 rounded-2xl bg-[#FAF5EE] hover:bg-[#F3ECE1] dark:bg-rose-950/30 dark:hover:bg-rose-950/50 border border-[#E8DEC8] dark:border-rose-900/40 text-[#8C4E46] dark:text-rose-300 transition-all flex items-center justify-center gap-2 group text-center shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold leading-tight">
                    Ainda não tem acesso? Solicite a liberação da sua agenda aqui &rarr;
                  </span>
                </a>
              </div>
            </form>

          </div>
        </div>

        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-xs font-bold text-[#706B5F] dark:text-zinc-400 hover:text-[#2D2D2A] dark:hover:text-zinc-100 dark:text-zinc-100 dark:hover:text-zinc-100 dark:text-zinc-100 dark:hover:text-white transition-colors"
          >
            &larr; Voltar para a Página Inicial
          </Link>
        </div>

      </div>
    </div>
  );
}
