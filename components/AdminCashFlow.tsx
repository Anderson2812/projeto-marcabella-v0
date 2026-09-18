'use client';

import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  CreditCard, 
  Wallet, 
  TrendingUp, 
  Calendar as CalendarIcon, 
  Filter, 
  CheckCircle2, 
  Hourglass, 
  Download, 
  ArrowUpRight,
  Check,
  X,
  User,
  Tag
} from 'lucide-react';
import { Booking, Professional, PaymentMethod } from '@/types';
import { formatDatePtBr } from '@/lib/whatsapp-utils';
import { useAppStore } from '@/lib/use-app-store';

interface Props {
  professional: Professional;
  bookings: Booking[];
}

export default function AdminCashFlow({ professional, bookings }: Props) {
  const { completeBookingWithPayment } = useAppStore();

  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'week' | 'month'>('month');
  const [methodFilter, setMethodFilter] = useState<'all' | PaymentMethod>('all');
  
  // Modal de Baixa de Pagamento
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<Booking | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('pix');
  const [paymentSavedFeedback, setPaymentSavedFeedback] = useState(false);

  // Datas de referência
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const currentMonthPrefix = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, []);

  const currentWeekStart = useMemo(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
  }, []);

  // Filtragem dos agendamentos
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (b.status === 'cancelled') return false;

      // Filtro de período
      if (filterPeriod === 'today' && b.date !== todayStr) return false;
      if (filterPeriod === 'week' && b.date < currentWeekStart) return false;
      if (filterPeriod === 'month' && !b.date.startsWith(currentMonthPrefix)) return false;

      // Filtro de método de pagamento
      if (methodFilter !== 'all') {
        const method = b.paymentMethod || (b.depositPaid ? 'pix' : undefined);
        if (method !== methodFilter) return false;
      }

      return true;
    });
  }, [bookings, filterPeriod, methodFilter, todayStr, currentWeekStart, currentMonthPrefix]);

  // Cálculos de Totais
  const totalRevenueToday = useMemo(() => {
    return bookings
      .filter(b => b.date === todayStr && (b.status === 'confirmed' || b.status === 'completed'))
      .reduce((sum, b) => sum + b.totalPrice, 0);
  }, [bookings, todayStr]);

  const totalRevenueWeek = useMemo(() => {
    return bookings
      .filter(b => b.date >= currentWeekStart && (b.status === 'confirmed' || b.status === 'completed'))
      .reduce((sum, b) => sum + b.totalPrice, 0);
  }, [bookings, currentWeekStart]);

  const totalRevenueMonth = useMemo(() => {
    return bookings
      .filter(b => b.date.startsWith(currentMonthPrefix) && (b.status === 'confirmed' || b.status === 'completed'))
      .reduce((sum, b) => sum + b.totalPrice, 0);
  }, [bookings, currentMonthPrefix]);

  // Totais por Método no Período Selecionado
  const methodStats = useMemo(() => {
    let pix = 0;
    let credit = 0;
    let debit = 0;
    let cash = 0;
    let pending = 0;

    filteredBookings.forEach(b => {
      const isPaid = b.status === 'completed' || b.depositPaid;
      const method = b.paymentMethod || (b.depositPaid ? 'pix' : 'pix');

      if (!isPaid && b.status !== 'completed') {
        pending += b.totalPrice;
      } else {
        if (method === 'split' && b.splitPayments && b.splitPayments.length > 0) {
          b.splitPayments.forEach(p => {
            if (p.method === 'pix') pix += p.amount;
            else if (p.method === 'credit_card') credit += p.amount;
            else if (p.method === 'debit_card') debit += p.amount;
            else if (p.method === 'cash') cash += p.amount;
          });
        } else if (method === 'pix') {
          pix += b.totalPrice;
        } else if (method === 'credit_card') {
          credit += b.totalPrice;
        } else if (method === 'debit_card') {
          debit += b.totalPrice;
        } else if (method === 'cash') {
          cash += b.totalPrice;
        }
      }
    });

    const totalRealized = pix + credit + debit + cash;
    return {
      pix,
      credit,
      debit,
      cash,
      pending,
      totalRealized
    };
  }, [filteredBookings]);

  // Salvar Baixa de Pagamento
  const handleConfirmPayment = () => {
    if (!selectedBookingForPayment) return;
    completeBookingWithPayment(selectedBookingForPayment.id, selectedPaymentMethod);
    setPaymentSavedFeedback(true);
    setTimeout(() => {
      setPaymentSavedFeedback(false);
      setSelectedBookingForPayment(null);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-[#E9E2D7] dark:border-zinc-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5A5A40] dark:text-zinc-300 bg-[#EEF1EB] px-3 py-1 rounded-full">
              Gestão Financeira
            </span>
            <span className="text-xs text-[#706B5F] dark:text-zinc-400">
              Controle de Caixa & Formas de Pagamento
            </span>
          </div>
          <h2 className="serif text-xl sm:text-2xl font-bold text-[#2D2D2A] dark:text-zinc-100 mt-1">
            Faturamento e Fluxo de Caixa
          </h2>
        </div>

        {/* Filtro de Período */}
        <div className="flex bg-[#F8F6F2] p-1 rounded-xl border border-[#E9E2D7] dark:border-zinc-700">
          {[
            { id: 'today', label: 'Hoje' },
            { id: 'week', label: 'Esta Semana' },
            { id: 'month', label: 'Este Mês' },
            { id: 'all', label: 'Todo o Histórico' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setFilterPeriod(p.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                filterPeriod === p.id
                  ? 'bg-white dark:bg-zinc-900 text-[#2D2D2A] dark:text-zinc-100 shadow-2xs'
                  : 'text-[#706B5F] dark:text-zinc-400 hover:text-[#2D2D2A] dark:hover:text-zinc-100 dark:text-zinc-100 dark:hover:text-zinc-100 dark:text-zinc-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-[#E9E2D7] dark:border-zinc-700 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#706B5F] dark:text-zinc-400">
            <span>Faturamento Hoje</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="serif text-2xl sm:text-3xl font-bold text-[#2D2D2A] dark:text-zinc-100">
            R$ {totalRevenueToday.toFixed(2)}
          </div>
          <p className="text-2xs text-[#706B5F] dark:text-zinc-400">
            Confirmados ou concluídos no dia de hoje
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-[#E9E2D7] dark:border-zinc-700 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#706B5F] dark:text-zinc-400">
            <span>Esta Semana</span>
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="serif text-2xl sm:text-3xl font-bold text-[#2D2D2A] dark:text-zinc-100">
            R$ {totalRevenueWeek.toFixed(2)}
          </div>
          <p className="text-2xs text-[#706B5F] dark:text-zinc-400">
            De segunda-feira até hoje
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-[#E9E2D7] dark:border-zinc-700 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#706B5F] dark:text-zinc-400">
            <span>Este Mês</span>
            <span className="w-8 h-8 rounded-xl bg-[#EEF1EB] text-[#5A5A40] dark:text-zinc-300 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4" />
            </span>
          </div>
          <div className="serif text-2xl sm:text-3xl font-bold text-[#5A5A40] dark:text-zinc-300">
            R$ {totalRevenueMonth.toFixed(2)}
          </div>
          <p className="text-2xs text-[#706B5F] dark:text-zinc-400">
            Total acumulado no mês atual
          </p>
        </div>
      </div>

      {/* Distribuição por Meio de Pagamento */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-[#E9E2D7] dark:border-zinc-700 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="serif text-lg sm:text-xl font-bold text-[#2D2D2A] dark:text-zinc-100">
              Recebimentos por Forma de Pagamento
            </h3>
            <p className="text-xs text-[#706B5F] dark:text-zinc-400">
              Total recebido no período filtrado: <strong>R$ {methodStats.totalRealized.toFixed(2)}</strong>
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {[
              { id: 'all', label: 'Todos os Métodos' },
              { id: 'pix', label: 'Pix' },
              { id: 'credit_card', label: 'Crédito' },
              { id: 'debit_card', label: 'Débito' },
              { id: 'cash', label: 'Dinheiro' }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setMethodFilter(m.id as any)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                  methodFilter === m.id
                    ? 'bg-[#5A5A40] dark:bg-zinc-700 text-white border-[#5A5A40] dark:border-zinc-600'
                    : 'bg-[#F8F6F2] text-[#706B5F] dark:text-zinc-400 border-[#E9E2D7] dark:border-zinc-700 hover:bg-[#EEF1EB] dark:hover:bg-zinc-800'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grade de Métodos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#F8F6F2] border border-[#E9E2D7] dark:border-zinc-700 space-y-1">
            <span className="text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 flex items-center gap-1.5">
              📱 Pix
            </span>
            <div className="serif text-xl font-bold text-[#2D2D2A] dark:text-zinc-100">
              R$ {methodStats.pix.toFixed(2)}
            </div>
            <span className="text-2xs text-[#706B5F] dark:text-zinc-400">
              {methodStats.totalRealized > 0 ? `${((methodStats.pix / methodStats.totalRealized) * 100).toFixed(0)}% do total` : '0%'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#F8F6F2] border border-[#E9E2D7] dark:border-zinc-700 space-y-1">
            <span className="text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 flex items-center gap-1.5">
              💳 Cartão de Crédito
            </span>
            <div className="serif text-xl font-bold text-[#2D2D2A] dark:text-zinc-100">
              R$ {methodStats.credit.toFixed(2)}
            </div>
            <span className="text-2xs text-[#706B5F] dark:text-zinc-400">
              {methodStats.totalRealized > 0 ? `${((methodStats.credit / methodStats.totalRealized) * 100).toFixed(0)}% do total` : '0%'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#F8F6F2] border border-[#E9E2D7] dark:border-zinc-700 space-y-1">
            <span className="text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 flex items-center gap-1.5">
              💳 Cartão de Débito
            </span>
            <div className="serif text-xl font-bold text-[#2D2D2A] dark:text-zinc-100">
              R$ {methodStats.debit.toFixed(2)}
            </div>
            <span className="text-2xs text-[#706B5F] dark:text-zinc-400">
              {methodStats.totalRealized > 0 ? `${((methodStats.debit / methodStats.totalRealized) * 100).toFixed(0)}% do total` : '0%'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#F8F6F2] border border-[#E9E2D7] dark:border-zinc-700 space-y-1">
            <span className="text-xs font-bold text-[#2D2D2A] dark:text-zinc-100 flex items-center gap-1.5">
              💵 Dinheiro
            </span>
            <div className="serif text-xl font-bold text-[#2D2D2A] dark:text-zinc-100">
              R$ {methodStats.cash.toFixed(2)}
            </div>
            <span className="text-2xs text-[#706B5F] dark:text-zinc-400">
              {methodStats.totalRealized > 0 ? `${((methodStats.cash / methodStats.totalRealized) * 100).toFixed(0)}% do total` : '0%'}
            </span>
          </div>
        </div>

        {/* Tabela de Lançamentos */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="serif font-bold text-base text-[#2D2D2A] dark:text-zinc-100 flex items-center gap-2">
              <span>Lançamentos de Atendimentos ({filteredBookings.length})</span>
            </h4>
            <span className="text-[11px] text-[#706B5F] dark:text-zinc-400">
              Detalhamento de sinais, valores restantes e quitações
            </span>
          </div>

          <div className="border border-[#E9E2D7] dark:border-zinc-700 rounded-3xl overflow-hidden divide-y divide-[#E9E2D7] dark:divide-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
            {filteredBookings.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#706B5F] dark:text-zinc-400">
                Nenhum lançamento encontrado para o filtro selecionado.
              </div>
            ) : (
              filteredBookings.map(b => {
                const isFullyPaid = b.status === 'completed';
                const hasDeposit = b.depositRequired && b.depositAmount > 0;
                const depositPaid = hasDeposit && b.depositPaid;
                const remainingAmount = Math.max(0, b.totalPrice - (depositPaid ? b.depositAmount : 0));
                const method = b.paymentMethod || (depositPaid ? 'pix' : undefined);

                return (
                  <div key={b.id} className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-[#FAF8F5] dark:hover:bg-zinc-800/60 transition-colors">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-sm font-bold text-[#2D2D2A] dark:text-zinc-100">{b.clientName}</strong>
                        <span className="text-xs font-mono text-[#A09A8E] dark:text-zinc-500 bg-stone-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">{b.code}</span>
                        <span className="text-xs text-[#706B5F] dark:text-zinc-400 font-medium">• {b.serviceName}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#706B5F] dark:text-zinc-400">
                        <span>📅 {formatDatePtBr(b.date)} às <strong>{b.time}</strong></span>
                        <span>WhatsApp: <strong>{b.clientPhone}</strong></span>
                      </div>

                      {/* Faixa Didática de Status Financeiro */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {/* Sinal */}
                        {hasDeposit ? (
                          depositPaid ? (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                              <span>✓ Sinal R$ {b.depositAmount.toFixed(2)} Pago (Pix)</span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                              <span>⚠️ Sinal R$ {b.depositAmount.toFixed(2)} Pendente</span>
                            </span>
                          )
                        ) : (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400">
                            Sem Sinal Prévio
                          </span>
                        )}

                        {/* Restante */}
                        {isFullyPaid ? (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                            ✓ 100% Quitado
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-amber-100/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300/80 dark:border-amber-700">
                            ⏳ Falta R$ {remainingAmount.toFixed(2)} no Balcão
                          </span>
                        )}

                        {/* Método Registrado */}
                        {method && (
                          <span className="text-[11px] font-medium text-[#706B5F] dark:text-zinc-400">
                            Forma: <strong>{method === 'pix' ? 'Pix' : method === 'credit_card' ? 'Cartão de Crédito' : method === 'debit_card' ? 'Cartão de Débito' : method === 'cash' ? 'Dinheiro' : method === 'split' ? 'Misto' : method}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 justify-between lg:justify-end shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#E9E2D7] dark:border-zinc-800">
                      <div className="text-left lg:text-right">
                        <span className="text-[10px] text-[#A09A8E] dark:text-zinc-500 uppercase tracking-wider block font-bold">
                          Valor Total
                        </span>
                        <div className="serif font-bold text-lg text-[#2D2D2A] dark:text-zinc-100">
                          R$ {b.totalPrice.toFixed(2)}
                        </div>
                      </div>

                      {/* Botão Registrar Pagamento ou Alterar */}
                      {!isFullyPaid ? (
                        <button
                          type="button"
                          onClick={() => setSelectedBookingForPayment(b)}
                          className="px-4 py-2.5 bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Receber no Balcão</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedBookingForPayment(b)}
                          className="px-3 py-1.5 bg-[#EEF1EB] dark:bg-zinc-800 hover:bg-[#dfe5d8] text-[#5A5A40] dark:text-zinc-300 rounded-xl text-xs font-semibold transition-all border border-[#dfe5d8] dark:border-zinc-700 shrink-0 cursor-pointer"
                          title="Alterar método de pagamento"
                        >
                          Editar Pagamento
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal Dar Baixa / Registrar Forma de Pagamento */}
      {selectedBookingForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full p-6 sm:p-8 border border-[#E9E2D7] dark:border-zinc-700 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#E9E2D7] dark:border-zinc-700 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#5A5A40] dark:text-zinc-300 block">
                  Lançamento Financeiro
                </span>
                <h3 className="serif text-xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                  {selectedBookingForPayment.clientName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedBookingForPayment(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:bg-zinc-800/80 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {paymentSavedFeedback ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-base text-[#2D2D2A] dark:text-zinc-100">Pagamento Registrado!</h4>
                <p className="text-xs text-[#706B5F] dark:text-zinc-400">O status foi atualizado para Concluído e os valores foram lançados no caixa.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-[#F8F6F2] dark:bg-zinc-800/60 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 space-y-2">
                  <div className="text-xs text-[#706B5F] dark:text-zinc-400">
                    {selectedBookingForPayment.serviceName} • {formatDatePtBr(selectedBookingForPayment.date)} às {selectedBookingForPayment.time}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#E9E2D7] dark:border-zinc-700 text-center">
                    <div>
                      <span className="text-[10px] text-[#706B5F] dark:text-zinc-400 block font-medium">Total:</span>
                      <strong className="text-xs text-[#2D2D2A] dark:text-zinc-100 font-bold">R$ {selectedBookingForPayment.totalPrice.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#706B5F] dark:text-zinc-400 block font-medium">Sinal Pago:</span>
                      <strong className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                        {selectedBookingForPayment.depositPaid ? `R$ ${selectedBookingForPayment.depositAmount.toFixed(2)}` : 'R$ 0,00'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#706B5F] dark:text-zinc-400 block font-medium">A Receber:</span>
                      <strong className="text-xs text-amber-700 dark:text-amber-400 font-bold">
                        R$ {Math.max(0, selectedBookingForPayment.totalPrice - (selectedBookingForPayment.depositPaid ? selectedBookingForPayment.depositAmount : 0)).toFixed(2)}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-100">
                    Forma de Pagamento no Balcão:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'pix', label: '📱 Pix no Local' },
                      { id: 'credit_card', label: '💳 Cartão de Crédito' },
                      { id: 'debit_card', label: '💳 Cartão de Débito' },
                      { id: 'cash', label: '💵 Dinheiro em Espécie' }
                    ].map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedPaymentMethod(m.id as any)}
                        className={`p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                          selectedPaymentMethod === m.id
                            ? 'bg-[#5A5A40] dark:bg-zinc-700 text-white border-[#5A5A40] dark:border-zinc-600 shadow-xs'
                            : 'bg-white dark:bg-zinc-900 text-[#2D2D2A] dark:text-zinc-100 border-stone-200 dark:border-zinc-700 hover:bg-stone-50 dark:bg-zinc-800'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E9E2D7] dark:border-zinc-700">
                  <button
                    type="button"
                    onClick={() => setSelectedBookingForPayment(null)}
                    className="px-4 py-2 text-stone-600 dark:text-zinc-400 hover:text-black dark:hover:text-white font-semibold text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmPayment}
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Confirmar Quitação & Concluir
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
