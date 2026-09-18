'use client';

import React, { useState } from 'react';
import { 
  Umbrella, 
  Clock, 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  Coffee,
  X
} from 'lucide-react';
import { Professional, AvailabilityConfig } from '@/types';
import { formatDatePtBr } from '@/lib/whatsapp-utils';
import { useAppStore } from '@/lib/use-app-store';

interface Props {
  professional: Professional;
  availability: AvailabilityConfig;
}

export default function AdminVacationManager({ professional, availability }: Props) {
  const { 
    addBlockedTimeSlot, 
    removeBlockedTimeSlot, 
    addVacationPeriod, 
    removeVacationPeriod 
  } = useAppStore();

  const blockedSlots = availability.blockedTimeSlots || [];
  const vacationPeriods = availability.vacationPeriods || [];

  // Estado Bloqueio de Horário Rápido
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockDate, setBlockDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [blockStartTime, setBlockStartTime] = useState('14:00');
  const [blockEndTime, setBlockEndTime] = useState('16:00');
  const [blockReason, setBlockReason] = useState('Compromisso Pessoal');

  // Estado Férias / Recesso
  const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
  const [vacationStartDate, setVacationStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [vacationEndDate, setVacationEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [vacationReason, setVacationReason] = useState('Férias Coletivas');
  const [vacationCustomNote, setVacationCustomNote] = useState('Estaremos em recesso para descanso e recarregando as energias para atendê-la ainda melhor!');
  const [vacationReturnDate, setVacationReturnDate] = useState('');

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleSaveBlock = (e: React.FormEvent) => {
    e.preventDefault();
    addBlockedTimeSlot(professional.id, {
      date: blockDate,
      startTime: blockStartTime,
      endTime: blockEndTime,
      reason: blockReason
    });
    setIsBlockModalOpen(false);
    setFeedbackMsg('✓ Horário bloqueado com sucesso na agenda online!');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleSaveVacation = (e: React.FormEvent) => {
    e.preventDefault();
    if (vacationEndDate < vacationStartDate) {
      alert('A data de término das férias deve ser posterior à data de início.');
      return;
    }

    // Calcula automaticamente o dia seguinte ao término como dia de retorno se não informado
    let effectiveReturnDate = vacationReturnDate;
    if (!effectiveReturnDate && vacationEndDate) {
      const endD = new Date(vacationEndDate + 'T12:00:00');
      endD.setDate(endD.getDate() + 1);
      effectiveReturnDate = endD.toISOString().split('T')[0];
    }

    addVacationPeriod(professional.id, {
      startDate: vacationStartDate,
      endDate: vacationEndDate,
      reason: vacationReason,
      customNote: vacationCustomNote.trim(),
      returnDate: effectiveReturnDate
    });
    setIsVacationModalOpen(false);
    setFeedbackMsg('✓ Período de férias cadastrado! Suas clientes verão o aviso com opções inteligentes na agenda online.');
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-[#E9E2D7] dark:border-zinc-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5A5A40] dark:text-zinc-300 bg-[#EEF1EB] px-3 py-1 rounded-full">
              Disponibilidade & Pausas
            </span>
            <span className="text-xs text-[#706B5F] dark:text-zinc-400">
              Bloqueie horários específicos ou agende seu período de férias
            </span>
          </div>
          <h2 className="serif text-xl sm:text-2xl font-bold text-[#2D2D2A] dark:text-zinc-100 mt-1">
            Bloqueios Pontuais e Férias
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBlockModalOpen(true)}
            className="px-4 py-2.5 bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Clock className="w-4 h-4" />
            Bloquear Horário
          </button>
          <button
            onClick={() => setIsVacationModalOpen(true)}
            className="px-4 py-2.5 bg-[#D4A373] hover:bg-[#c29363] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Umbrella className="w-4 h-4" />
            Cadastrar Férias
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Grid: 1. Férias Ativas & 2. Bloqueios de Horários */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card: Férias e Recesso */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-[#E9E2D7] dark:border-zinc-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E9E2D7] dark:border-zinc-700 pb-3">
            <h3 className="serif text-lg font-bold text-[#2D2D2A] dark:text-zinc-100 flex items-center gap-2">
              <Umbrella className="w-5 h-5 text-[#D4A373]" />
              Férias e Recessos Cadastrados
            </h3>
            <span className="text-xs font-bold text-[#706B5F] dark:text-zinc-400">
              {vacationPeriods.length} período(s)
            </span>
          </div>

          {vacationPeriods.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-500 dark:text-zinc-500 space-y-2">
              <p>Nenhum período de férias ativo.</p>
              <p className="text-[11px] text-stone-400">
                Ao cadastrar férias, a agenda online bloqueia todos os dias selecionados para que as clientes não consigam agendar.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {vacationPeriods.map(v => (
                <div key={v.id} className="p-4 bg-[#FDFBF7] dark:bg-zinc-800/70 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <strong className="text-sm text-[#2D2D2A] dark:text-zinc-100 block">{v.reason}</strong>
                    <span className="text-xs text-[#5A5A40] dark:text-zinc-300 font-semibold block">
                      📅 De {formatDatePtBr(v.startDate)} até {formatDatePtBr(v.endDate)}
                    </span>
                    {v.returnDate && (
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold block">
                        ✨ Retorno aos atendimentos: {formatDatePtBr(v.returnDate)}
                      </span>
                    )}
                    {v.customNote && (
                      <p className="text-[11px] text-stone-600 dark:text-zinc-400 italic bg-amber-50/60 dark:bg-amber-950/30 p-2 rounded-xl border border-amber-200/50 dark:border-amber-900/40">
                        &ldquo;{v.customNote}&rdquo;
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeVacationPeriod(professional.id, v.id)}
                    className="p-2 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
                    title="Remover Férias"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card: Bloqueios de Horários Pontuais */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-[#E9E2D7] dark:border-zinc-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E9E2D7] dark:border-zinc-700 pb-3">
            <h3 className="serif text-lg font-bold text-[#2D2D2A] dark:text-zinc-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#5A5A40] dark:text-zinc-300" />
              Bloqueios de Horários no Dia
            </h3>
            <span className="text-xs font-bold text-[#706B5F] dark:text-zinc-400">
              {blockedSlots.length} bloqueio(s)
            </span>
          </div>

          {blockedSlots.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-500 dark:text-zinc-500 space-y-2">
              <p>Nenhum bloqueio pontual no momento.</p>
              <p className="text-[11px] text-stone-400">
                Use para fechar horários específicos em que você precisará sair (médico, imprevistos, almoço longo).
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {blockedSlots.map(b => (
                <div key={b.id} className="p-4 bg-[#F8F6F2] rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 flex items-center justify-between gap-3">
                  <div>
                    <strong className="text-sm text-[#2D2D2A] dark:text-zinc-100 block">{b.reason}</strong>
                    <span className="text-xs text-[#706B5F] dark:text-zinc-400">
                      {formatDatePtBr(b.date)} das <strong>{b.startTime} às {b.endTime}</strong>
                    </span>
                  </div>
                  <button
                    onClick={() => removeBlockedTimeSlot(professional.id, b.id)}
                    className="p-2 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Remover Bloqueio"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Modal Novo Bloqueio de Horário */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full p-6 sm:p-8 border border-[#E9E2D7] dark:border-zinc-700 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#E9E2D7] dark:border-zinc-700 pb-3">
              <h3 className="serif text-xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                Bloquear Horário Pontual
              </h3>
              <button
                onClick={() => setIsBlockModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:bg-zinc-800/80 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBlock} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Data:</label>
                <input
                  type="date"
                  required
                  value={blockDate}
                  onChange={(e) => setBlockDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-zinc-600 text-sm bg-white dark:bg-zinc-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Horário Início:</label>
                  <input
                    type="time"
                    required
                    value={blockStartTime}
                    onChange={(e) => setBlockStartTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-zinc-600 text-sm bg-white dark:bg-zinc-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Horário Fim:</label>
                  <input
                    type="time"
                    required
                    value={blockEndTime}
                    onChange={(e) => setBlockEndTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-zinc-600 text-sm bg-white dark:bg-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Motivo do Bloqueio:</label>
                <input
                  type="text"
                  required
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Ex: Consulta médica, Manutenção, etc."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-zinc-600 text-sm bg-white dark:bg-zinc-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E9E2D7] dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => setIsBlockModalOpen(false)}
                  className="px-4 py-2 text-stone-600 dark:text-zinc-400 hover:text-black dark:hover:text-white font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Salvar Bloqueio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Férias */}
      {isVacationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full p-6 sm:p-8 border border-[#E9E2D7] dark:border-zinc-700 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#E9E2D7] dark:border-zinc-700 pb-3">
              <h3 className="serif text-xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                Cadastrar Período de Férias
              </h3>
              <button
                onClick={() => setIsVacationModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:bg-zinc-800/80 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVacation} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Data Início:</label>
                  <input
                    type="date"
                    required
                    value={vacationStartDate}
                    onChange={(e) => setVacationStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-zinc-600 text-sm bg-white dark:bg-zinc-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Data Término:</label>
                  <input
                    type="date"
                    required
                    value={vacationEndDate}
                    onChange={(e) => setVacationEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-zinc-600 text-sm bg-white dark:bg-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Motivo / Título:</label>
                <input
                  type="text"
                  required
                  value={vacationReason}
                  onChange={(e) => setVacationReason(e.target.value)}
                  placeholder="Ex: Férias de descanso, Recesso de verão"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-zinc-600 text-sm bg-white dark:bg-zinc-900"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">
                  Data de Retorno aos Atendimentos (Opcional):
                </label>
                <input
                  type="date"
                  value={vacationReturnDate}
                  onChange={(e) => setVacationReturnDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-zinc-600 text-sm bg-white dark:bg-zinc-900"
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  Se não preenchido, o sistema calculará automaticamente o 1º dia útil após o fim das férias.
                </p>
              </div>

              <div>
                <label className="block font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">
                  Mensagem Amigável para as Clientes:
                </label>
                <textarea
                  rows={2}
                  value={vacationCustomNote}
                  onChange={(e) => setVacationCustomNote(e.target.value)}
                  placeholder="Ex: Estaremos em recesso recarregando as energias para atendê-la ainda melhor!"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-zinc-600 text-sm bg-white dark:bg-zinc-900"
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  Esta mensagem será exibida com destaque na sua página de agendamento.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E9E2D7] dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => setIsVacationModalOpen(false)}
                  className="px-4 py-2 text-stone-600 dark:text-zinc-400 hover:text-black dark:hover:text-white font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#D4A373] hover:bg-[#c29363] text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Salvar Férias
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
