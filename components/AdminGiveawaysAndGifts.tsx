'use client';

import React, { useState } from 'react';
import { 
  Gift, 
  Sparkles, 
  Trophy, 
  Calendar, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Users, 
  Share2, 
  Copy, 
  Check, 
  Dice5, 
  Award,
  Tag,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { useAppStore } from '@/lib/use-app-store';
import { Professional, GiveawayCampaign, PromotionalGift, Booking } from '@/types';

interface AdminGiveawaysAndGiftsProps {
  professional: Professional;
  profBookings: Booking[];
}

export default function AdminGiveawaysAndGifts({
  professional,
  profBookings
}: AdminGiveawaysAndGiftsProps) {
  const {
    getGiveawaysForProf,
    getPromotionalGiftsForProf,
    addGiveaway,
    updateGiveaway,
    deleteGiveaway,
    drawGiveawayWinner,
    addPromotionalGift,
    togglePromotionalGift,
    deletePromotionalGift
  } = useAppStore();

  const giveaways = getGiveawaysForProf(professional.id);
  const gifts = getPromotionalGiftsForProf(professional.id);

  const [activeSubTab, setActiveSubTab] = useState<'giveaways' | 'gifts'>('giveaways');

  // Modal Sorteio
  const [isGiveawayModalOpen, setIsGiveawayModalOpen] = useState(false);
  const [giveawayForm, setGiveawayForm] = useState(() => ({
    title: '',
    description: '',
    prize: '',
    rules: 'Clientes com agendamento confirmado no período participam automaticamente.',
    drawDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    minSpendAmount: 0
  }));

  // Modal Brinde
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [giftForm, setGiftForm] = useState({
    title: '',
    description: '',
    eligibilityType: 'first_time' as 'first_time' | 'min_spend' | 'service_type' | 'all_clients',
    minSpend: 80,
    serviceKeyword: ''
  });

  // Sorteio em andamento
  const [drawingId, setDrawingId] = useState<string | null>(null);
  const [copiedWinnerMsgId, setCopiedWinnerMsgId] = useState<string | null>(null);

  // Eligible clients for draw
  const eligibleBookings = profBookings.filter(
    b => b.status === 'confirmed' || b.status === 'completed'
  );

  const handleCreateGiveaway = (e: React.FormEvent) => {
    e.preventDefault();
    if (!giveawayForm.title || !giveawayForm.prize) {
      alert('Preencha o título e o prêmio do sorteio.');
      return;
    }

    addGiveaway({
      professionalId: professional.id,
      title: giveawayForm.title,
      description: giveawayForm.description,
      prize: giveawayForm.prize,
      rules: giveawayForm.rules,
      drawDate: giveawayForm.drawDate,
      minSpendAmount: Number(giveawayForm.minSpendAmount) || undefined
    });

    setIsGiveawayModalOpen(false);
    setGiveawayForm({
      title: '',
      description: '',
      prize: '',
      rules: 'Clientes com agendamento confirmado no período participam automaticamente.',
      drawDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      minSpendAmount: 0
    });
  };

  const handleExecuteDraw = (giveaway: GiveawayCampaign) => {
    if (eligibleBookings.length === 0) {
      alert('Não há clientes com reservas confirmadas ou concluídas para sortear.');
      return;
    }

    setDrawingId(giveaway.id);

    // Simulação do giro
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * eligibleBookings.length);
      const winner = eligibleBookings[randomIndex];

      drawGiveawayWinner(
        giveaway.id,
        winner.clientName,
        winner.clientPhone,
        winner.code
      );
      setDrawingId(null);
    }, 1000);
  };

  const handleCreateGift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftForm.title) {
      alert('Preencha o nome do brinde ou mimo.');
      return;
    }

    addPromotionalGift({
      professionalId: professional.id,
      title: giftForm.title,
      description: giftForm.description,
      eligibilityType: giftForm.eligibilityType,
      minSpend: giftForm.eligibilityType === 'min_spend' ? Number(giftForm.minSpend) : undefined,
      serviceKeyword: giftForm.eligibilityType === 'service_type' ? giftForm.serviceKeyword : undefined,
      active: true
    });

    setIsGiftModalOpen(false);
    setGiftForm({
      title: '',
      description: '',
      eligibilityType: 'first_time',
      minSpend: 80,
      serviceKeyword: ''
    });
  };

  const handleShareWinnerWhatsApp = (giveaway: GiveawayCampaign) => {
    if (!giveaway.winnerClientName) return;
    const text = encodeURIComponent(
      `🎉 *PARABÉNS, ${giveaway.winnerClientName.toUpperCase()}!*\n\n` +
      `Você foi a ganhadora do sorteio *"${giveaway.title}"* de ${professional.name}!\n` +
      `🎁 *Prêmio:* ${giveaway.prize}\n` +
      `🎟️ *Código do Agendamento:* ${giveaway.winnerBookingCode || 'Confirmado'}\n\n` +
      `Entre em contato conosco para agendar a retirada ou usufruto do seu prêmio! ✨`
    );
    const phone = giveaway.winnerClientPhone?.replace(/\D/g, '') || '';
    if (phone) {
      window.open(`https://wa.me/55${phone}?text=${text}`, '_blank');
    } else {
      navigator.clipboard.writeText(decodeURIComponent(text));
      setCopiedWinnerMsgId(giveaway.id);
      setTimeout(() => setCopiedWinnerMsgId(null), 2500);
    }
  };

  return (
    <div id="admin-giveaways-container" className="space-y-6">
      {/* Header & Sub-Tabs */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-7 border border-[#E9E2D7] dark:border-zinc-700 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold uppercase tracking-wider mb-2">
            <Gift className="w-3.5 h-3.5 text-amber-600" />
            Fidelização & Marketing
          </div>
          <h2 className="serif text-2xl sm:text-3xl font-bold text-[#2D2D2A] dark:text-zinc-100">
            Sorteios, Mimos & Brindes Promocionais
          </h2>
          <p className="text-sm text-[#706B5F] dark:text-zinc-400 mt-1 max-w-2xl">
            Crie sorteios exclusivos para clientes que agendarem pelo link e configure mimos especiais que aumentam o valor médio dos atendimentos e fidelizam sua clientela.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'giveaways' ? (
            <button
              onClick={() => setIsGiveawayModalOpen(true)}
              className="px-4 py-2.5 bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484833] text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Novo Sorteio
            </button>
          ) : (
            <button
              onClick={() => setIsGiftModalOpen(true)}
              className="px-4 py-2.5 bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484833] text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Novo Brinde / Mimo
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E9E2D7] dark:border-zinc-700 pb-2">
        <button
          onClick={() => setActiveSubTab('giveaways')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'giveaways'
              ? 'bg-[#5A5A40] dark:bg-zinc-700 text-white shadow-xs'
              : 'bg-white dark:bg-zinc-900 text-[#706B5F] dark:text-zinc-300 hover:text-[#2D2D2A] dark:hover:text-white border border-[#E9E2D7] dark:border-zinc-700'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          Sorteios & Campanhas ({giveaways.length})
        </button>
        <button
          onClick={() => setActiveSubTab('gifts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'gifts'
              ? 'bg-[#5A5A40] dark:bg-zinc-700 text-white shadow-xs'
              : 'bg-white dark:bg-zinc-900 text-[#706B5F] dark:text-zinc-300 hover:text-[#2D2D2A] dark:hover:text-white border border-[#E9E2D7] dark:border-zinc-700'
          }`}
        >
          <Gift className="w-3.5 h-3.5" />
          Mimos de Atendimento ({gifts.length})
        </button>
      </div>

      {/* TAB 1: SORTEIOS */}
      {activeSubTab === 'giveaways' && (
        <div className="space-y-6">
          {giveaways.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-10 text-center border border-dashed border-[#E9E2D7] dark:border-zinc-700 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-stone-800 dark:text-zinc-200 text-base">Nenhum sorteio criado ainda</h3>
              <p className="text-xs text-stone-500 dark:text-zinc-500 max-w-md mx-auto">
                Crie seu primeiro sorteio para incentivar clientes a agendarem pelo link oficial do WhatsApp.
              </p>
              <button
                onClick={() => setIsGiveawayModalOpen(true)}
                className="mt-2 px-4 py-2 bg-[#5A5A40] dark:bg-zinc-700 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-[#484833]"
              >
                Criar Primeiro Sorteio
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {giveaways.map((giveaway) => {
                const isCompleted = giveaway.status === 'completed';

                return (
                  <div
                    key={giveaway.id}
                    className={`rounded-3xl p-6 border transition-all ${
                      isCompleted 
                        ? 'bg-emerald-50/50 border-emerald-200' 
                        : 'bg-white dark:bg-zinc-900 border-[#E9E2D7] dark:border-zinc-700 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1.5 ${
                          isCompleted 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isCompleted ? '✓ Sorteio Realizado' : 'Campanha Ativa'}
                        </span>
                        <h3 className="serif text-xl font-bold text-stone-900 dark:text-zinc-100">
                          {giveaway.title}
                        </h3>
                      </div>

                      <button
                        onClick={() => deleteGiveaway(giveaway.id)}
                        className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Excluir Sorteio"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#F8F6F2] border border-[#E9E2D7] dark:border-zinc-700 mb-4 space-y-1.5">
                      <div className="text-xs font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <Gift className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Prêmio: <strong>{giveaway.prize}</strong></span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-zinc-400">{giveaway.description}</p>
                      {giveaway.rules && (
                        <p className="text-[11px] text-stone-500 dark:text-zinc-500 italic pt-1 border-t border-stone-200 dark:border-zinc-700">
                          Critério: {giveaway.rules}
                        </p>
                      )}
                    </div>

                    <div className="text-xs text-stone-500 dark:text-zinc-500 flex items-center justify-between mb-4">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        Data do Sorteio: <strong>{giveaway.drawDate}</strong>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-stone-400" />
                        {eligibleBookings.length} clientes aptos
                      </span>
                    </div>

                    {/* Vencedor ou Ação de Sortear */}
                    {isCompleted ? (
                      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-emerald-300 space-y-2">
                        <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                          <Trophy className="w-4 h-4 text-amber-500" />
                          <span>Ganhador(a) Oficial:</span>
                        </div>
                        <div className="text-base font-bold text-stone-900 dark:text-zinc-100">
                          {giveaway.winnerClientName}
                        </div>
                        <div className="text-xs text-stone-500 dark:text-zinc-500 flex items-center gap-2">
                          <span>WhatsApp: {giveaway.winnerClientPhone || 'Registrado'}</span>
                          {giveaway.winnerBookingCode && (
                            <span className="font-mono bg-stone-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded text-[11px]">
                              {giveaway.winnerBookingCode}
                            </span>
                          )}
                        </div>
                        <div className="pt-2 flex items-center gap-2">
                          <button
                            onClick={() => handleShareWinnerWhatsApp(giveaway)}
                            className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            {copiedWinnerMsgId === giveaway.id ? 'Mensagem Copiada!' : 'Avisar no WhatsApp'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-zinc-700">
                        <button
                          onClick={() => handleExecuteDraw(giveaway)}
                          disabled={drawingId === giveaway.id || eligibleBookings.length === 0}
                          className="w-full py-2.5 px-4 bg-stone-900 hover:bg-black disabled:bg-stone-300 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                        >
                          <Dice5 className={`w-4 h-4 text-amber-400 ${drawingId === giveaway.id ? 'animate-spin' : ''}`} />
                          <span>{drawingId === giveaway.id ? 'Sorteando...' : 'Realizar Sorteio Automático Agora'}</span>
                        </button>
                        <span className="block text-[10px] text-center text-stone-400">
                          O sistema sorteará aleatoriamente entre os agendamentos confirmados.
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MIMOS E BRINDES */}
      {activeSubTab === 'gifts' && (
        <div className="space-y-6">
          <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 space-y-1">
              <span className="font-bold block">Como os brindes funcionam para aumentar seu faturamento:</span>
              <p>
                Os clientes adoram mimos! Definir um brinde para atendimentos acima de R$ 80 ou para a 1ª visita faz com que os clientes adicionem serviços complementares (ex: hidratação, design de sobrancelhas ou barba) para atingir o valor.
              </p>
            </div>
          </div>

          {gifts.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-10 text-center border border-dashed border-[#E9E2D7] dark:border-zinc-700 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <Gift className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-stone-800 dark:text-zinc-200 text-base">Nenhum brinde configurado</h3>
              <p className="text-xs text-stone-500 dark:text-zinc-500 max-w-md mx-auto">
                Adicione mimos como &quot;Óleo Reparador Cortesia&quot; ou &quot;Massagem Relaxante de 10 min&quot;.
              </p>
              <button
                onClick={() => setIsGiftModalOpen(true)}
                className="mt-2 px-4 py-2 bg-[#5A5A40] dark:bg-zinc-700 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-[#484833]"
              >
                Cadastrar Primeiro Mimo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {gifts.map((gift) => (
                <div
                  key={gift.id}
                  className={`bg-white dark:bg-zinc-900 rounded-3xl p-5 border transition-all ${
                    gift.active ? 'border-[#E9E2D7] dark:border-zinc-700 hover:shadow-md' : 'border-stone-200 dark:border-zinc-700 opacity-60 bg-stone-50 dark:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                      <Tag className="w-3 h-3" />
                      {gift.eligibilityType === 'first_time' && 'Primeira Visita'}
                      {gift.eligibilityType === 'min_spend' && `Acima de R$ ${gift.minSpend}`}
                      {gift.eligibilityType === 'all_clients' && 'Todos os Clientes'}
                      {gift.eligibilityType === 'service_type' && 'Serviço Específico'}
                    </span>

                    <button
                      onClick={() => deletePromotionalGift(gift.id)}
                      className="text-stone-400 hover:text-rose-600 p-1 rounded transition-colors"
                      title="Excluir Mimo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="serif text-lg font-bold text-stone-900 dark:text-zinc-100 mb-1">
                    {gift.title}
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-zinc-400 mb-4 min-h-[36px]">
                    {gift.description || 'Mimo especial de atendimento no espaço.'}
                  </p>

                  <div className="pt-3 border-t border-stone-200 dark:border-zinc-700 flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-500 dark:text-zinc-500">
                      {gift.active ? 'Ativo na Agenda' : 'Desativado'}
                    </span>
                    <button
                      onClick={() => togglePromotionalGift(gift.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        gift.active
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-stone-200 text-stone-700 dark:text-zinc-300 hover:bg-stone-300'
                      }`}
                    >
                      {gift.active ? 'Desativar' : 'Ativar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Criar Sorteio */}
      {isGiveawayModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#E9E2D7] dark:border-zinc-700 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-zinc-700 mb-4">
              <h3 className="serif text-xl font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Novo Sorteio da Profissional
              </h3>
              <button
                onClick={() => setIsGiveawayModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 dark:text-zinc-300 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGiveaway} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-zinc-400 mb-1">
                  Título do Sorteio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Sorteio de Natal: Dia de Princesa / Barboterapia Completa"
                  value={giveawayForm.title}
                  onChange={(e) => setGiveawayForm({ ...giveawayForm, title: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-stone-200 dark:border-zinc-700 focus:outline-none focus:border-[#5A5A40] dark:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-zinc-400 mb-1">
                  Prêmio a ser Entregue *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 1 Corte + Hidratação Profunda + Kit Home Care"
                  value={giveawayForm.prize}
                  onChange={(e) => setGiveawayForm({ ...giveawayForm, prize: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-stone-200 dark:border-zinc-700 focus:outline-none focus:border-[#5A5A40] dark:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-zinc-400 mb-1">
                  Descrição e Detalhes
                </label>
                <textarea
                  rows={2}
                  placeholder="Explique os detalhes do prêmio e como será a entrega."
                  value={giveawayForm.description}
                  onChange={(e) => setGiveawayForm({ ...giveawayForm, description: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-stone-200 dark:border-zinc-700 focus:outline-none focus:border-[#5A5A40] dark:border-zinc-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-zinc-400 mb-1">
                    Data do Sorteio
                  </label>
                  <input
                    type="date"
                    value={giveawayForm.drawDate}
                    onChange={(e) => setGiveawayForm({ ...giveawayForm, drawDate: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 focus:outline-none focus:border-[#5A5A40] dark:border-zinc-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-zinc-400 mb-1">
                    Gasto Mínimo (Opcional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    placeholder="R$ 0,00 para todos"
                    value={giveawayForm.minSpendAmount || ''}
                    onChange={(e) => setGiveawayForm({ ...giveawayForm, minSpendAmount: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 focus:outline-none focus:border-[#5A5A40] dark:border-zinc-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-zinc-400 mb-1">
                  Regras / Critério
                </label>
                <input
                  type="text"
                  value={giveawayForm.rules}
                  onChange={(e) => setGiveawayForm({ ...giveawayForm, rules: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 focus:outline-none focus:border-[#5A5A40] dark:border-zinc-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => setIsGiveawayModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:bg-zinc-800/80 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484833] rounded-xl cursor-pointer"
                >
                  Publicar Sorteio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Criar Brinde */}
      {isGiftModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#E9E2D7] dark:border-zinc-700 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-zinc-700 mb-4">
              <h3 className="serif text-xl font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-600" />
                Novo Mimo de Atendimento
              </h3>
              <button
                onClick={() => setIsGiftModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 dark:text-zinc-300 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGift} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-zinc-400 mb-1">
                  Nome do Mimo / Brinde *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Óleo Reparador 10ml, Design Express ou Café Especial"
                  value={giftForm.title}
                  onChange={(e) => setGiftForm({ ...giftForm, title: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-stone-200 dark:border-zinc-700 focus:outline-none focus:border-[#5A5A40] dark:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-zinc-400 mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  placeholder="Ex: Cortesia exclusiva entregue no final do seu atendimento."
                  value={giftForm.description}
                  onChange={(e) => setGiftForm({ ...giftForm, description: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-stone-200 dark:border-zinc-700 focus:outline-none focus:border-[#5A5A40] dark:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-zinc-400 mb-1">
                  Quem tem direito ao brinde?
                </label>
                <select
                  value={giftForm.eligibilityType}
                  onChange={(e) => setGiftForm({ ...giftForm, eligibilityType: e.target.value as any })}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 focus:outline-none focus:border-[#5A5A40] dark:border-zinc-600"
                >
                  <option value="first_time">Apenas Clientes de 1ª Vez (Boas-vindas)</option>
                  <option value="min_spend">Clientes com Compras Acima de um Valor</option>
                  <option value="all_clients">Todos os Clientes Agendados</option>
                  <option value="service_type">Clientes de Serviços Específicos</option>
                </select>
              </div>

              {giftForm.eligibilityType === 'min_spend' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-zinc-400 mb-1">
                    Valor Mínimo do Agendamento (R$)
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="5"
                    value={giftForm.minSpend}
                    onChange={(e) => setGiftForm({ ...giftForm, minSpend: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 focus:outline-none focus:border-[#5A5A40] dark:border-zinc-600"
                  />
                </div>
              )}

              {giftForm.eligibilityType === 'service_type' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-zinc-400 mb-1">
                    Palavra-chave do Serviço (Ex: Cabelo, Barba, Mechas)
                  </label>
                  <input
                    type="text"
                    value={giftForm.serviceKeyword}
                    onChange={(e) => setGiftForm({ ...giftForm, serviceKeyword: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 focus:outline-none focus:border-[#5A5A40] dark:border-zinc-600"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => setIsGiftModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:bg-zinc-800/80 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484833] rounded-xl cursor-pointer"
                >
                  Salvar Mimo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
