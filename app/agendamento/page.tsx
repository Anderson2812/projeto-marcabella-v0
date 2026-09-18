'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/use-app-store';
import { formatDatePtBr, formatPhoneMask } from '@/lib/whatsapp-utils';
import {
  Search,
  Calendar,
  Clock,
  ArrowLeft,
  ChevronRight,
  Phone,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export default function SearchBookingsPage() {
  const { bookings } = useAppStore();
  
  const [phoneQuery, setPhoneQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchedPhone, setSearchedPhone] = useState('');
  const [phoneSearchResults, setPhoneSearchResults] = useState<typeof bookings | null>(null);

  // Tratamento do WhatsApp com máscara
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = formatPhoneMask(e.target.value);
    setPhoneQuery(masked);
    setErrorMessage('');
    if (phoneSearchResults !== null) {
      setPhoneSearchResults(null);
      setSearchedPhone('');
    }
  };

  // Busca estrita por telefone da cliente
  const handleSearchByPhone = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setPhoneSearchResults(null);

    const numericPhone = phoneQuery.replace(/\D/g, '');

    if (numericPhone.length < 10) {
      setErrorMessage('Por favor, informe seu número completo com DDD (ex.: (11) 98765-4321).');
      return;
    }

    const normalizeDigits = (num: string) => {
      let d = num.replace(/\D/g, '');
      if (d.startsWith('55') && (d.length === 12 || d.length === 13)) {
        d = d.slice(2);
      }
      return d;
    };

    const targetDigits = normalizeDigits(numericPhone);

    const matched = bookings
      .filter((b) => normalizeDigits(b.clientPhone) === targetDigits)
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

    setSearchedPhone(phoneQuery);
    setPhoneSearchResults(matched);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
            <CheckCircle2 className="w-3 h-3" />
            Confirmado
          </span>
        );
      case 'awaiting_deposit':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
            <Clock className="w-3 h-3" />
            Aguardando Sinal
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300">
            <Clock className="w-3 h-3" />
            Em Análise
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
            <XCircle className="w-3 h-3" />
            Cancelado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#FAF8F5] dark:bg-[#121113] py-12 px-4 sm:px-6 lg:px-8 text-[#2B2320] dark:text-zinc-100 transition-colors">
      <div className="max-w-lg mx-auto space-y-6">
        
        {/* Botão Voltar Clean */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7A6D65] dark:text-zinc-400 hover:text-[#8C4E46] dark:hover:text-rose-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao início</span>
        </Link>

        {/* Card Principal Clean */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-[#EFE5DC] dark:border-zinc-800/80 shadow-xs space-y-6 transition-colors">
          
          <div className="text-center space-y-1.5">
            <h1 className="serif text-2xl sm:text-3xl font-bold text-[#2B2320] dark:text-zinc-100">
              Ver Agendamentos
            </h1>
            <p className="text-[#7A6D65] dark:text-zinc-400 text-xs sm:text-sm">
              Digite o número do seu celular para consultar seus horários agendados.
            </p>
          </div>

          {/* Campo Único: Apenas o número da cliente */}
          <form onSubmit={handleSearchByPhone} className="space-y-3.5">
            <div>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#A89C94] dark:text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phoneQuery}
                  onChange={handlePhoneChange}
                  placeholder="(11) 98765-4321"
                  maxLength={15}
                  autoFocus
                  className="w-full pl-11 pr-4 py-3.5 bg-[#FAF8F5] dark:bg-zinc-800/70 border border-[#E8DCCD] dark:border-zinc-700/80 rounded-2xl text-base font-medium text-[#2B2320] dark:text-zinc-100 placeholder-[#C4B7AC] dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#8C4E46] dark:focus:ring-rose-500 transition-all"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs font-medium text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl font-bold text-sm bg-[#8C4E46] hover:bg-[#783F38] dark:bg-rose-700 dark:hover:bg-rose-600 text-white shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <Search className="w-4 h-4" />
              <span>Consultar Agendamentos</span>
            </button>
          </form>

          {/* Resultados Clean */}
          {phoneSearchResults !== null && (
            <div className="space-y-3 pt-4 border-t border-[#EFE5DC] dark:border-zinc-800">
              <div className="flex items-center justify-between text-xs font-semibold text-[#7A6D65] dark:text-zinc-400 px-0.5">
                <span>Horários encontrados para {searchedPhone}</span>
                <span className="text-[11px] bg-[#FAF5EF] dark:bg-zinc-800 text-[#8C4E46] dark:text-rose-300 px-2 py-0.5 rounded-full font-bold">
                  {phoneSearchResults.length}
                </span>
              </div>

              {phoneSearchResults.length === 0 ? (
                <div className="p-6 text-center bg-[#FAF8F5] dark:bg-zinc-800/50 rounded-2xl border border-dashed border-[#E8DCCD] dark:border-zinc-700/80 space-y-1">
                  <p className="text-xs text-[#7A6D65] dark:text-zinc-300 font-semibold">
                    Nenhum agendamento encontrado para este número.
                  </p>
                  <p className="text-[11px] text-[#A89C94] dark:text-zinc-400">
                    Verifique se o DDD e número digitados conferem com os informados no momento da reserva.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {phoneSearchResults.map((b) => (
                    <Link
                      key={b.id}
                      href={`/agendamento/${b.code.replace('#', '')}`}
                      className="block p-4 rounded-2xl border border-[#EFE5DC] dark:border-zinc-800 bg-[#FAF8F5] dark:bg-zinc-800/60 hover:border-[#8C4E46] dark:hover:border-rose-500/60 hover:bg-white dark:hover:bg-zinc-800 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#8C4E46] dark:text-rose-400 font-mono">
                              {b.code}
                            </span>
                            {getStatusBadge(b.status)}
                          </div>
                          <h4 className="font-bold text-sm text-[#2B2320] dark:text-zinc-100 truncate">
                            {b.serviceName}
                          </h4>
                          <p className="text-xs text-[#7A6D65] dark:text-zinc-400">
                            Com {b.professionalName} • {formatDatePtBr(b.date)} às {b.time}
                          </p>
                        </div>

                        <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-[#8C4E46] dark:group-hover:text-rose-400 shrink-0 mt-2 transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
