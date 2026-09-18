'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Professional, Booking } from '@/types';
import { useAppStore } from '@/lib/use-app-store';
import { useLockBodyScroll } from '@/lib/use-lock-body-scroll';
import { formatDatePtBr, formatPhoneMask } from '@/lib/whatsapp-utils';
import { openWhatsAppSafely } from '@/lib/validation-utils';
import {
  Search,
  Phone,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  X,
  Sparkles,
  ChevronRight,
  MessageCircle,
  CalendarX,
  ExternalLink
} from 'lucide-react';

interface ClientBookingLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  professional: Professional;
  onBookNew?: () => void;
}

export default function ClientBookingLookupModal({
  isOpen,
  onClose,
  professional,
  onBookNew
}: ClientBookingLookupModalProps) {
  const { bookings } = useAppStore();
  const [phoneInput, setPhoneInput] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useLockBodyScroll(isOpen);

  if (!isOpen) return null;

  const normalizeDigits = (num: string) => {
    let d = num.replace(/\D/g, '');
    if (d.startsWith('55') && (d.length === 12 || d.length === 13)) {
      d = d.slice(2);
    }
    return d;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = formatPhoneMask(e.target.value);
    setPhoneInput(masked);
    setErrorMessage('');
    if (hasSearched) {
      setHasSearched(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const numeric = phoneInput.replace(/\D/g, '');
    if (numeric.length < 10) {
      setErrorMessage('Por favor, digite seu número completo com DDD (ex.: (11) 98765-4321).');
      return;
    }

    setHasSearched(true);
  };

  const handleClear = () => {
    setPhoneInput('');
    setHasSearched(false);
    setErrorMessage('');
  };

  const matchedBookings = useMemo(() => {
    if (!hasSearched) return [];
    const queryDigits = normalizeDigits(phoneInput);
    if (queryDigits.length < 10) return [];

    return bookings
      .filter((b) => b.professionalId === professional.id)
      .filter((b) => normalizeDigits(b.clientPhone) === queryDigits)
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  }, [hasSearched, phoneInput, bookings, professional.id]);

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Confirmado
          </span>
        );
      case 'awaiting_deposit':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5" />
            Aguardando Sinal Pix
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
            <Clock className="w-3.5 h-3.5" />
            Aguardando Aprovação
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Concluído
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            <XCircle className="w-3.5 h-3.5" />
            Cancelado
          </span>
        );
      default:
        return null;
    }
  };

  const handleOpenWhatsAppAboutBooking = (booking: Booking) => {
    const text = `Olá, ${professional.name}! Gostaria de tirar uma dúvida sobre meu agendamento de *${booking.serviceName}* no dia *${formatDatePtBr(booking.date)} às ${booking.time}* (Código: #${booking.code.replace(/^#/, '')}).`;
    openWhatsAppSafely(professional.phone, text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2rem] border border-stone-200 dark:border-zinc-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Cabeçalho do Modal */}
        <div className="p-6 border-b border-[#EFE5DC] dark:border-zinc-800 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#8C4E46] dark:bg-rose-400" />
              <span className="text-2xs uppercase tracking-widest text-[#8C4E46] dark:text-rose-400 font-extrabold">
                {professional.name}
              </span>
            </div>
            <h2 className="serif text-xl sm:text-2xl font-bold text-[#2B2320] dark:text-zinc-100">
              Minhas Reservas
            </h2>
            <p className="text-xs text-[#7A6D65] dark:text-zinc-400 mt-0.5">
              Consulte seus horários agendados informando apenas o seu WhatsApp.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="w-8 h-8 rounded-full bg-[#FAF5EF] dark:bg-zinc-800 hover:bg-[#F2E5D8] dark:hover:bg-zinc-700 text-[#7A6D65] dark:text-zinc-400 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulário de Busca por Telefone */}
        <div className="p-6 border-b border-[#EFE5DC] dark:border-zinc-800 bg-[#FAF8F5]/60 dark:bg-zinc-950/40">
          <form onSubmit={handleSearch} className="space-y-3">
            <label className="block text-xs font-bold text-[#6E635C] dark:text-zinc-300">
              Seu Telefone / WhatsApp
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A89C94] dark:text-zinc-500">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={handlePhoneChange}
                  placeholder="(11) 98765-4321"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#E8DCCD] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#2B2320] dark:text-zinc-100 text-sm font-medium placeholder:text-[#C4B7AC] dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#8C4E46] dark:focus:ring-rose-500 transition-all"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#8C4E46] hover:bg-[#783F38] dark:bg-rose-700 dark:hover:bg-rose-600 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Buscar</span>
              </button>
            </div>

            {errorMessage && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errorMessage}
              </p>
            )}
          </form>
        </div>

        {/* Lista de Resultados / Estados */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {!hasSearched ? (
            <div className="py-8 text-center text-stone-400 dark:text-zinc-500 space-y-2">
              <Search className="w-8 h-8 mx-auto stroke-1 text-stone-300 dark:text-zinc-600" />
              <p className="text-xs font-medium">
                Digite seu número com DDD acima para listar seus horários com {professional.name}.
              </p>
            </div>
          ) : matchedBookings.length === 0 ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <CalendarX className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-stone-900 dark:text-zinc-100">
                  Nenhum agendamento encontrado
                </h3>
                <p className="text-xs text-stone-500 dark:text-zinc-400 max-w-xs mx-auto">
                  Não localizamos reservas para o telefone <strong>{phoneInput}</strong> nesta agenda.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-4 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 text-xs font-bold text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Tentar outro número
                </button>
                {onBookNew && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onBookNew();
                    }}
                    className="px-4 py-2 rounded-xl bg-[#8C4E46] hover:bg-[#783F38] dark:bg-rose-700 dark:hover:bg-rose-600 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Agendar Horário Agora
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#7A6D65] dark:text-zinc-400">
                <span>
                  {matchedBookings.length} {matchedBookings.length === 1 ? 'reserva encontrada' : 'reservas encontradas'}
                </span>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-[#8C4E46] dark:text-rose-400 hover:underline cursor-pointer font-medium"
                >
                  Limpar busca
                </button>
              </div>

              {matchedBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-zinc-800/60 border border-[#EFE5DC] dark:border-zinc-700/80 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-2xs font-mono font-bold text-[#8C4E46] dark:text-rose-400 block mb-0.5">
                        #{b.code.replace(/^#/, '')}
                      </span>
                      <h4 className="font-bold text-sm text-[#2B2320] dark:text-zinc-100">
                        {b.serviceName}
                      </h4>
                    </div>
                    {getStatusBadge(b.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-[#7A6D65] dark:text-zinc-400 pt-1 border-t border-[#EFE5DC] dark:border-zinc-700/60">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#8C4E46] dark:text-rose-400 shrink-0" />
                      <span className="truncate">{formatDatePtBr(b.date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#8C4E46] dark:text-rose-400 shrink-0" />
                      <span>{b.time}{b.endTime ? ` às ${b.endTime}` : ''}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="font-bold text-[#2B2320] dark:text-zinc-100">
                      Total: R$ {b.totalPrice.toFixed(2)}
                    </span>
                    {b.depositPaid ? (
                      <span className="text-2xs font-bold text-emerald-600 dark:text-emerald-400">
                        ✓ Sinal de R$ {b.depositAmount.toFixed(2)} pago
                      </span>
                    ) : b.depositAmount > 0 && b.status === 'awaiting_deposit' ? (
                      <span className="text-2xs font-bold text-amber-600 dark:text-amber-400">
                        Aguardando sinal Pix R$ {b.depositAmount.toFixed(2)}
                      </span>
                    ) : null}
                  </div>

                  {/* Ações da Reserva */}
                  <div className="pt-2 flex items-center gap-2 border-t border-[#EFE5DC] dark:border-zinc-700/60">
                    <Link
                      href={`/agendamento/${b.code.replace(/^#/, '')}`}
                      className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-zinc-700 border border-[#E8DCCD] dark:border-zinc-600 text-[#2B2320] dark:text-zinc-200 hover:bg-[#FAF5EF] dark:hover:bg-zinc-600 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Ver Comprovante</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleOpenWhatsAppAboutBooking(b)}
                      className="py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Conversar sobre este agendamento"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
