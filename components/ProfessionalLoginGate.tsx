'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/use-app-store';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Crown, 
  Search, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Scissors,
  User
} from 'lucide-react';

interface ProfessionalLoginGateProps {
  children: React.ReactNode;
}

export function ProfessionalLoginGate({ children }: ProfessionalLoginGateProps) {
  const { 
    authProfessionalId, 
    selectedProfessionalId, 
    impersonatedByMaster, 
    professionals, 
    loginProfessional, 
    isHydrated 
  } = useAppStore();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Se estiver em modo de personificação pelo Master, permite acesso irrestrito
  const isAuthorized = Boolean(
    (authProfessionalId && professionals.some(p => p.id === authProfessionalId)) ||
    (impersonatedByMaster && selectedProfessionalId)
  );

  if (!isHydrated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3 text-stone-500 dark:text-zinc-500">
          <div className="w-8 h-8 border-2 border-stone-300 dark:border-zinc-600 border-t-stone-800 rounded-full animate-spin" />
          <p className="text-sm font-medium">Carregando painel seguro...</p>
        </div>
      </div>
    );
  }

  if (isAuthorized) {
    return <>{children}</>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim()) {
      setErrorMessage('Informe seu e-mail, telefone ou nome de usuário.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Informe sua senha de acesso.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const result = loginProfessional(identifier, password);
      setIsLoading(false);
      if (!result.success) {
        setErrorMessage(result.message || 'Credenciais inválidas.');
      }
    }, 250);
  };

  const handleQuickDemoLogin = (email: string, pass: string = '123456') => {
    setIdentifier(email);
    setPassword(pass);
    setErrorMessage(null);
    setIsLoading(true);
    setTimeout(() => {
      loginProfessional(email, pass);
      setIsLoading(false);
    }, 200);
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-40 dark:opacity-20 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-stone-200 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-amber-100 dark:bg-stone-800 blur-3xl" />
      </div>

      <div className="relative max-w-xl w-full mx-auto space-y-8">
        {/* Navigation back */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:text-zinc-100 dark:hover:text-stone-100 transition-colors py-1.5 px-3 rounded-lg hover:bg-stone-200/50 dark:hover:bg-stone-800/50"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar para o Início
          </Link>

          <Link
            href="/master"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors py-1.5 px-3 rounded-lg"
          >
            <Crown className="w-3.5 h-3.5" />
            Painel Master SaaS
          </Link>
        </div>

        {/* Card Principal de Login */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-xl shadow-stone-200/60 dark:shadow-none border border-stone-200 dark:border-stone-800 p-8 sm:p-10 relative overflow-hidden">
          {/* Header */}
          <div className="text-center space-y-3 mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold tracking-wide uppercase">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Área Restrita da Profissional
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
              Acesse seu Painel de Atendimento
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
              Entre com suas credenciais para gerenciar sua agenda, confirmar pagamentos de sinal via Pix e configurar seus serviços.
            </p>
          </div>

          {/* Alerta de Erro */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-rose-800 dark:text-rose-300 text-xs sm:text-sm animate-shake">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="leading-snug">{errorMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                E-mail, WhatsApp ou Usuário
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="ex: camila@studionails.com.br ou (11) 98123-4567"
                  className="w-full pl-10 pr-4 py-3 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-400 focus:border-transparent transition-all"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                  Senha de Acesso
                </label>
                <span className="text-[11px] text-stone-500 dark:text-stone-400">
                  Padrão teste: <code className="font-mono bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded text-stone-700 dark:text-stone-300">123456</code>
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha secreta"
                  className="w-full pl-10 pr-11 py-3 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-400 focus:border-transparent transition-all"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 dark:text-zinc-400 dark:hover:text-stone-200"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-stone-600 dark:text-stone-400 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-stone-300 dark:border-zinc-600 text-stone-900 dark:text-zinc-100 focus:ring-stone-900 w-4 h-4"
                />
                Lembrar meu acesso neste dispositivo
              </label>

              <span className="text-stone-500 dark:text-zinc-500 text-[11px]">
                Código do prefixo é único por profissional
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-6 rounded-xl bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:bg-zinc-800/80 dark:hover:bg-white dark:bg-zinc-900 dark:text-stone-900 dark:text-zinc-100 font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Verificando credenciais...
                </>
              ) : (
                <>
                  Entrar no Painel do Profissional
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divisor */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200 dark:border-stone-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-stone-900 px-3 text-stone-400 font-bold tracking-wider">
                Acesso Rápido de Demonstração
              </span>
            </div>
          </div>

          {/* Cards de Demonstração Rápidos */}
          <div className="space-y-2.5">
            <p className="text-xs text-stone-500 dark:text-stone-400 text-center mb-2">
              Clique em uma das contas cadastradas para preencher e entrar instantaneamente:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {professionals.slice(0, 4).map((prof) => (
                <button
                  key={prof.id}
                  type="button"
                  onClick={() => handleQuickDemoLogin(prof.email, prof.password || '123456')}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 bg-stone-50 dark:bg-zinc-800/70 dark:bg-stone-800/40 hover:bg-stone-100 dark:bg-zinc-800/80 dark:hover:bg-stone-800 text-left transition-all group"
                >
                  <div className="relative w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border border-stone-300 dark:border-stone-700 bg-stone-200">
                    {prof.avatarUrl ? (
                      <Image
                        src={prof.avatarUrl}
                        alt={prof.name}
                        fill
                        sizes="36px"
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-stone-600 dark:text-zinc-400">
                        {prof.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate group-hover:text-amber-800 dark:group-hover:text-amber-400">
                        {prof.name}
                      </p>
                      <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
                        #{prof.bookingCodePrefix || 'BE'}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-zinc-500 truncate">
                      {prof.category}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info & Links rápidos */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-stone-500 dark:text-stone-400">
          <Link
            href="/agendamento"
            className="hover:text-stone-900 dark:text-zinc-100 dark:hover:text-stone-200 underline underline-offset-4 flex items-center gap-1"
          >
            <Search className="w-3 h-3" />
            Buscar Agendamento por Código (#)
          </Link>
          <span>•</span>
          <Link
            href="/master"
            className="hover:text-amber-700 dark:hover:text-amber-400 underline underline-offset-4 flex items-center gap-1 font-semibold"
          >
            <Crown className="w-3 h-3" />
            Painel Master SaaS (Admin)
          </Link>
        </div>
      </div>
    </div>
  );
}
