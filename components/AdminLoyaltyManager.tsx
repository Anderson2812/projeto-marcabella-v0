'use client';

import React, { useState, useMemo } from 'react';
import { 
  Award, 
  Sparkles, 
  Gift, 
  CheckCircle2, 
  Percent, 
  DollarSign, 
  Star, 
  Users, 
  ShieldCheck,
  Check
} from 'lucide-react';
import { Professional, Booking, LoyaltyConfig } from '@/types';
import { useAppStore } from '@/lib/use-app-store';

interface Props {
  professional: Professional;
  bookings: Booking[];
}

export default function AdminLoyaltyManager({ professional, bookings }: Props) {
  const { updateLoyaltyConfig } = useAppStore();

  const currentLoyalty = professional.loyaltyConfig || {
    active: true,
    bookingsRequired: 10,
    rewardType: 'discount_percent',
    rewardValue: 20,
    rewardDescription: '20% de desconto no 10º atendimento'
  };

  const [active, setActive] = useState(currentLoyalty.active);
  const [bookingsRequired, setBookingsRequired] = useState(currentLoyalty.bookingsRequired || 10);
  const [rewardType, setRewardType] = useState(currentLoyalty.rewardType || 'discount_percent');
  const [rewardValue, setRewardValue] = useState(currentLoyalty.rewardValue || 20);
  const [rewardDescription, setRewardDescription] = useState(currentLoyalty.rewardDescription || '');
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Análise de Clientes Fiéis a partir do histórico de agendamentos
  const clientStats = useMemo(() => {
    const map = new Map<string, { name: string; phone: string; totalBookings: number; totalSpent: number; lastDate: string }>();

    bookings.forEach(b => {
      if (b.status === 'cancelled') return;
      const key = b.clientPhone || b.clientName;
      const prev = map.get(key) || {
        name: b.clientName,
        phone: b.clientPhone,
        totalBookings: 0,
        totalSpent: 0,
        lastDate: b.date
      };

      prev.totalBookings += 1;
      prev.totalSpent += b.totalPrice;
      if (b.date > prev.lastDate) {
        prev.lastDate = b.date;
      }

      map.set(key, prev);
    });

    return Array.from(map.values()).sort((a, b) => b.totalBookings - a.totalBookings);
  }, [bookings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const config: LoyaltyConfig = {
      active,
      bookingsRequired: Number(bookingsRequired),
      rewardType: rewardType as any,
      rewardValue: Number(rewardValue),
      rewardDescription: rewardDescription.trim() || `${rewardValue}% de desconto ao completar ${bookingsRequired} atendimentos`
    };

    updateLoyaltyConfig(professional.id, config);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-[#E9E2D7] dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5A5A40] dark:text-amber-300 bg-[#EEF1EB] dark:bg-zinc-800 px-3 py-1 rounded-full">
              Exclusivo para Clientes
            </span>
            <span className="text-xs text-[#706B5F] dark:text-zinc-400">
              O cartão fidelidade serve apenas para os clientes acumularem selos
            </span>
          </div>
          <h2 className="serif text-xl sm:text-2xl font-bold text-[#2D2D2A] dark:text-zinc-100 mt-1">
            Cartão Fidelidade dos Clientes & Recompensas
          </h2>
          <p className="text-xs text-[#706B5F] dark:text-zinc-400 mt-1">
            Cada cliente acompanha seu próprio cartão e selos diretamente pelo link da reserva.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
            active 
              ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' 
              : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400'
          }`}>
            {active ? '✓ Programa Ativo para Clientes' : 'Programa Desativado'}
          </span>
        </div>
      </div>

      {savedFeedback && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Configuração do cartão fidelidade dos clientes salva com sucesso!</span>
        </div>
      )}

      {/* Grid: 1. Configuração da Regra & 2. Cartão Fidelidade Virtual Exclusivo dos Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Formulário de Configuração */}
        <form onSubmit={handleSave} className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-[#E9E2D7] dark:border-zinc-800 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-[#E9E2D7] dark:border-zinc-800 pb-3">
            <h3 className="serif text-lg font-bold text-[#2D2D2A] dark:text-zinc-100 flex items-center gap-2">
              <Gift className="w-5 h-5 text-[#5A5A40] dark:text-amber-400" />
              Regras do Cartão do Cliente
            </h3>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#2D2D2A] dark:text-zinc-200">
              <span>Ativar para clientes:</span>
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="w-5 h-5 accent-[#5A5A40] rounded cursor-pointer"
              />
            </label>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-[#2D2D2A] dark:text-zinc-200 mb-1">
                Quantidade de atendimentos para o cliente ganhar o prêmio:
              </label>
              <select
                value={bookingsRequired}
                onChange={(e) => setBookingsRequired(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-sm bg-white dark:bg-zinc-800 font-bold text-[#2D2D2A] dark:text-zinc-100"
              >
                <option value={5}>A cada 5 atendimentos do cliente</option>
                <option value={8}>A cada 8 atendimentos do cliente</option>
                <option value={10}>A cada 10 atendimentos do cliente (Padrão mais usado)</option>
                <option value={12}>A cada 12 atendimentos do cliente</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#2D2D2A] dark:text-zinc-200 mb-1">Recompensa do Cliente:</label>
                <select
                  value={rewardType}
                  onChange={(e) => setRewardType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-xs bg-white dark:bg-zinc-800 text-[#2D2D2A] dark:text-zinc-100"
                >
                  <option value="discount_percent">Desconto em %</option>
                  <option value="fixed_discount">Desconto Fixo (R$)</option>
                  <option value="free_service">Serviço Cortesia</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#2D2D2A] dark:text-zinc-200 mb-1">
                  {rewardType === 'discount_percent' ? 'Valor (%):' : rewardType === 'fixed_discount' ? 'Valor (R$):' : 'Nome Cortesia:'}
                </label>
                {rewardType === 'free_service' ? (
                  <input
                    type="text"
                    value={rewardDescription}
                    onChange={(e) => setRewardDescription(e.target.value)}
                    placeholder="Ex: Spa dos Pés Grátis"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-xs bg-white dark:bg-zinc-800 text-[#2D2D2A] dark:text-zinc-100"
                  />
                ) : (
                  <input
                    type="number"
                    min="1"
                    value={rewardValue}
                    onChange={(e) => setRewardValue(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-sm font-bold bg-white dark:bg-zinc-800 text-[#2D2D2A] dark:text-zinc-100"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#2D2D2A] dark:text-zinc-200 mb-1">
                Frase descritiva para o cliente:
              </label>
              <input
                type="text"
                value={rewardDescription}
                onChange={(e) => setRewardDescription(e.target.value)}
                placeholder="Ex: Ganhe 20% OFF no seu 10º agendamento"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E2D7] dark:border-zinc-700 text-xs bg-white dark:bg-zinc-800 text-[#2D2D2A] dark:text-zinc-100"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#E9E2D7] dark:border-zinc-800 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 dark:bg-amber-600 dark:hover:bg-amber-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs cursor-pointer"
            >
              Salvar Regras de Fidelidade
            </button>
          </div>
        </form>

        {/* Cartão Virtual Demonstrativo (Visão da Cliente) */}
        <div className="bg-gradient-to-br from-[#5A5A40] to-[#383826] dark:from-zinc-900 dark:to-zinc-950 rounded-3xl p-6 sm:p-8 text-white shadow-md border border-white/10 dark:border-zinc-800 flex flex-col justify-between space-y-6">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-widest text-[#D4A373] bg-black/30 px-3 py-1 rounded-full">
                Exclusivo para a Cliente
              </span>
              <Award className="w-6 h-6 text-[#D4A373]" />
            </div>
            <div className="pt-2">
              <span className="text-2xs uppercase tracking-wider text-amber-200 block">
                Visualização do Cartão do Cliente
              </span>
              <h3 className="serif text-xl font-bold">Cartão Fidelidade da Cliente</h3>
              <p className="text-xs text-[#E9E2D7] mt-0.5">
                Atendimentos realizados com: <strong>{professional.name}</strong>
              </p>
            </div>
            <p className="text-xs text-[#D4A373] font-medium pt-1">
              Prêmio: {rewardDescription || `${rewardValue}% de desconto no ${bookingsRequired}º atendimento`}
            </p>
          </div>

          {/* Selos da Cartela Demonstrativa da Cliente */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-2xs text-white/70">
              <span>Selos acumulados pela cliente</span>
              <span>Meta: {bookingsRequired} atendimentos</span>
            </div>
            <div className="grid grid-cols-5 gap-2.5">
              {[...Array(bookingsRequired)].map((_, i) => (
                <div
                  key={i}
                  className={`h-12 rounded-xl flex flex-col items-center justify-center border transition-all ${
                    i < 4
                      ? 'bg-white dark:bg-zinc-900 text-[#5A5A40] dark:text-zinc-300 border-white shadow-sm font-bold'
                      : i === bookingsRequired - 1
                      ? 'bg-[#D4A373] text-white border-[#D4A373] font-extrabold animate-pulse'
                      : 'bg-white dark:bg-zinc-900/10 text-white/60 border-white/20'
                  }`}
                >
                  {i < 4 ? (
                    <Check className="w-5 h-5 stroke-[3]" />
                  ) : i === bookingsRequired - 1 ? (
                    <Gift className="w-5 h-5" />
                  ) : (
                    <span className="text-xs font-bold">{i + 1}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="text-2xs text-[#E9E2D7]/80 flex items-center justify-between border-t border-white/20 pt-3">
            <span>Cada cliente visualiza este cartão no link da sua própria reserva</span>
            <span className="font-mono">USO DO CLIENTE</span>
          </div>
        </div>

      </div>

      {/* Tabela: Ranking das Clientes Mais Fiéis */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-[#E9E2D7] dark:border-zinc-800 shadow-xs space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="serif text-lg font-bold text-[#2D2D2A] dark:text-zinc-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#5A5A40] dark:text-amber-400" />
              Clientes e Selos Acumulados ({clientStats.length})
            </h3>
            <p className="text-xs text-[#706B5F] dark:text-zinc-400">
              Acompanhe a pontuação no cartão fidelidade de cada cliente
            </p>
          </div>
        </div>

        <div className="border border-[#E9E2D7] dark:border-zinc-800 rounded-2xl overflow-hidden divide-y divide-[#E9E2D7] dark:divide-zinc-800">
          {clientStats.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#706B5F] dark:text-zinc-400">
              Nenhum histórico de cliente registrado ainda.
            </div>
          ) : (
            clientStats.slice(0, 10).map((c, idx) => {
              const currentProgress = c.totalBookings % bookingsRequired;
              const hasCompletedCard = c.totalBookings >= bookingsRequired;

              return (
                <div key={c.phone || c.name} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF8F5] dark:hover:bg-zinc-800 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 dark:hover:bg-zinc-800/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      idx === 0 ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                      idx === 1 ? 'bg-stone-200 text-stone-800 dark:text-zinc-200' :
                      idx === 2 ? 'bg-amber-50 text-amber-800' : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300'
                    }`}>
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm text-[#2D2D2A] dark:text-zinc-100">{c.name}</strong>
                        {hasCompletedCard && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                            Cartão Concluído!
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[#706B5F] dark:text-zinc-400">
                        WhatsApp: {c.phone} • Total investido: <strong>R$ {c.totalSpent.toFixed(2)}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-right">
                      <div className="font-bold text-[#2D2D2A] dark:text-zinc-100">
                        {c.totalBookings} atendimento(s)
                      </div>
                      <div className="text-[11px] text-[#706B5F] dark:text-zinc-400">
                        Cartão do cliente: <strong>{currentProgress}/{bookingsRequired} selos</strong>
                      </div>
                    </div>

                    <div className="w-24 bg-stone-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden border border-stone-200 dark:border-zinc-700">
                      <div
                        className="bg-[#5A5A40] dark:bg-amber-500 h-full rounded-full"
                        style={{ width: `${(currentProgress / bookingsRequired) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
