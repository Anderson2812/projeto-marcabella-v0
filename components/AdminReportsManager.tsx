'use client';

import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Search, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  MessageSquare, 
  DollarSign, 
  Users, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  Filter,
  Check,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { Booking, Professional, SupportTicket } from '@/types';
import { formatDatePtBr } from '@/lib/whatsapp-utils';

interface Props {
  professionals: Professional[];
  bookings: Booking[];
  tickets: SupportTicket[];
}

type ReportTypeFilter = 'all' | 'confirmations' | 'cancellations' | 'requests';
type ReportPeriodFilter = 'today' | '7days' | 'month' | 'all';

interface ReportRow {
  id: string;
  type: 'confirmation' | 'cancellation' | 'completion' | 'admin_request';
  dateStr: string;
  timeStr: string;
  code: string;
  professionalName: string;
  personName: string;
  personContact: string;
  subjectOrService: string;
  value: number;
  depositValue: number;
  statusBadge: {
    label: string;
    color: 'emerald' | 'rose' | 'amber' | 'blue';
  };
  details: string;
}

export default function AdminReportsManager({ professionals, bookings, tickets }: Props) {
  const [typeFilter, setTypeFilter] = useState<ReportTypeFilter>('all');
  const [periodFilter, setPeriodFilter] = useState<ReportPeriodFilter>('month');
  const [selectedProfId, setSelectedProfId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Unifica dados de agendamentos e solicitações para relatório analítico
  const allRows = useMemo<ReportRow[]>(() => {
    const rows: ReportRow[] = [];

    // 1. Processa Agendamentos (Confirmações, Cancelamentos, Conclusões)
    bookings.forEach(b => {
      const isConfirmed = b.status === 'confirmed';
      const isCompleted = b.status === 'completed';
      const isCancelled = b.status === 'cancelled';

      if (isConfirmed || isCompleted) {
        rows.push({
          id: `row-conf-${b.id}`,
          type: isCompleted ? 'completion' : 'confirmation',
          dateStr: b.date,
          timeStr: b.time,
          code: b.code,
          professionalName: b.professionalName || 'Profissional',
          personName: b.clientName,
          personContact: b.clientPhone,
          subjectOrService: b.serviceName,
          value: b.totalPrice,
          depositValue: b.depositPaid ? b.depositAmount : 0,
          statusBadge: isCompleted 
            ? { label: 'Concluído / Atendido', color: 'emerald' }
            : { label: 'Confirmado com Reserva', color: 'blue' },
          details: b.depositPaid 
            ? `Sinal de R$ ${b.depositAmount.toFixed(2)} pago via Pix. Restante: R$ ${(b.totalPrice - b.depositAmount).toFixed(2)}.`
            : 'Reserva aprovada sem sinal prévio.'
        });
      } else if (isCancelled) {
        rows.push({
          id: `row-canc-${b.id}`,
          type: 'cancellation',
          dateStr: b.date,
          timeStr: b.time,
          code: b.code,
          professionalName: b.professionalName || 'Profissional',
          personName: b.clientName,
          personContact: b.clientPhone,
          subjectOrService: b.serviceName,
          value: b.totalPrice,
          depositValue: b.depositAmount,
          statusBadge: { label: 'Cancelado', color: 'rose' },
          details: b.cancellationReason 
            ? `Motivo: "${b.cancellationReason}". ${b.depositPaid ? 'Sinal tratado conforme política de cancelamento.' : 'Sem sinal retido.'}`
            : 'Cancelamento solicitado pelo usuário ou sistema.'
        });
      }
    });

    // 2. Processa Solicitações / Tickets para o Admin
    tickets.forEach(t => {
      const prof = professionals.find(p => p.id === t.professionalId);
      const isPending = t.status === 'open';
      const [ticketDate, ticketTime] = t.createdAt.split('T');

      rows.push({
        id: `row-tkt-${t.id}`,
        type: 'admin_request',
        dateStr: ticketDate || new Date().toISOString().split('T')[0],
        timeStr: ticketTime ? ticketTime.slice(0, 5) : '12:00',
        code: `#TKT-${t.id.slice(-4).toUpperCase()}`,
        professionalName: prof?.name || t.professionalName || 'Profissional Solicitante',
        personName: prof?.name || t.professionalName || 'Profissional',
        personContact: prof?.phone || prof?.email || 'Via Painel',
        subjectOrService: `[Suporte Admin] ${t.subject}`,
        value: 0,
        depositValue: 0,
        statusBadge: isPending 
          ? { label: 'Solicitação Pendente Admin', color: 'amber' }
          : { label: 'Solicitação Respondida', color: 'emerald' },
        details: t.reply 
          ? `Solicitação: "${t.message}". Resposta do Admin: "${t.reply}".`
          : `Mensagem enviada para a administração: "${t.message}". Aguardando retorno.`
      });
    });

    // Ordena decrescente por data e hora
    return rows.sort((a, b) => {
      const keyA = `${a.dateStr} ${a.timeStr}`;
      const keyB = `${b.dateStr} ${b.timeStr}`;
      return keyB.localeCompare(keyA);
    });
  }, [bookings, tickets, professionals]);

  // Aplica filtros dinâmicos
  const filteredRows = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const currentYearMonth = todayStr.slice(0, 7);

    return allRows.filter(row => {
      // 1. Filtro por Tipo
      if (typeFilter === 'confirmations' && (row.type !== 'confirmation' && row.type !== 'completion')) return false;
      if (typeFilter === 'cancellations' && row.type !== 'cancellation') return false;
      if (typeFilter === 'requests' && row.type !== 'admin_request') return false;

      // 2. Filtro por Profissional
      if (selectedProfId !== 'all') {
        const prof = professionals.find(p => p.id === selectedProfId);
        if (prof && !row.professionalName.toLowerCase().includes(prof.name.toLowerCase())) return false;
      }

      // 3. Filtro por Período
      if (periodFilter === 'today' && row.dateStr !== todayStr) return false;
      if (periodFilter === '7days' && (row.dateStr < sevenDaysAgoStr || row.dateStr > todayStr)) return false;
      if (periodFilter === 'month' && !row.dateStr.startsWith(currentYearMonth)) return false;

      // 4. Busca textual
      if (searchTerm.trim()) {
        const s = searchTerm.toLowerCase();
        const matchesCode = row.code.toLowerCase().includes(s);
        const matchesPerson = row.personName.toLowerCase().includes(s);
        const matchesContact = row.personContact.toLowerCase().includes(s);
        const matchesProf = row.professionalName.toLowerCase().includes(s);
        const matchesSubject = row.subjectOrService.toLowerCase().includes(s);
        const matchesDetails = row.details.toLowerCase().includes(s);

        if (!matchesCode && !matchesPerson && !matchesContact && !matchesProf && !matchesSubject && !matchesDetails) {
          return false;
        }
      }

      return true;
    });
  }, [allRows, typeFilter, periodFilter, selectedProfId, searchTerm, professionals]);

  // Estatísticas calculadas sobre os registros filtrados
  const stats = useMemo(() => {
    let totalConfirmations = 0;
    let totalCancellations = 0;
    let totalAdminRequests = 0;
    let totalValueExecuted = 0;
    let totalDepositsSecured = 0;

    filteredRows.forEach(r => {
      if (r.type === 'confirmation' || r.type === 'completion') {
        totalConfirmations++;
        totalValueExecuted += r.value;
        totalDepositsSecured += r.depositValue;
      } else if (r.type === 'cancellation') {
        totalCancellations++;
      } else if (r.type === 'admin_request') {
        totalAdminRequests++;
      }
    });

    const totalActions = totalConfirmations + totalCancellations;
    const confirmationRate = totalActions > 0 ? Math.round((totalConfirmations / totalActions) * 100) : 100;
    const cancellationRate = totalActions > 0 ? Math.round((totalCancellations / totalActions) * 100) : 0;

    return {
      totalRows: filteredRows.length,
      totalConfirmations,
      totalCancellations,
      totalAdminRequests,
      totalValueExecuted,
      totalDepositsSecured,
      confirmationRate,
      cancellationRate
    };
  }, [filteredRows]);

  // Exportar relatório em CSV com download real
  const handleExportCSV = () => {
    const headers = [
      'Tipo de Registro',
      'Data',
      'Horario',
      'Codigo',
      'Profissional/Estabelecimento',
      'Cliente ou Solicitante',
      'Contato',
      'Servico ou Assunto',
      'Valor Total (R$)',
      'Sinal Pix (R$)',
      'Status',
      'Detalhes e Justificativa'
    ];

    const rows = filteredRows.map(r => [
      r.type === 'confirmation' ? 'Confirmacao' : r.type === 'completion' ? 'Conclusao' : r.type === 'cancellation' ? 'Cancelamento' : 'Solicitacao Admin',
      r.dateStr,
      r.timeStr,
      r.code,
      `"${r.professionalName.replace(/"/g, '""')}"`,
      `"${r.personName.replace(/"/g, '""')}"`,
      `"${r.personContact.replace(/"/g, '""')}"`,
      `"${r.subjectOrService.replace(/"/g, '""')}"`,
      r.value.toFixed(2),
      r.depositValue.toFixed(2),
      `"${r.statusBadge.label.replace(/"/g, '""')}"`,
      `"${r.details.replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_auditoria_bellahora_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setCopiedNotification('✓ Arquivo CSV do relatório gerado e baixado com sucesso!');
    setTimeout(() => setCopiedNotification(null), 3500);
  };

  // Imprimir Relatório Formatado
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Notificação Temporária */}
      {copiedNotification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* Header do Módulo de Relatórios & Auditoria */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-[#E9E2D7] dark:border-zinc-700 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E9E2D7] dark:border-zinc-700 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-[#EEF1EB] rounded-xl text-[#5A5A40] dark:text-zinc-300">
                <FileText className="w-5 h-5" />
              </span>
              <h2 className="serif text-xl sm:text-2xl font-bold text-[#2D2D2A] dark:text-zinc-100">
                Relatório Geral de Auditoria & Solicitações
              </h2>
            </div>
            <p className="text-[#706B5F] dark:text-zinc-400 text-xs sm:text-sm mt-1">
              Registro completo de todas as confirmações de horários, cancelamentos com motivos e solicitações direcionadas à administração.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              title="Baixar planilha compatível com Excel e Google Sheets"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-white dark:bg-zinc-900 hover:bg-[#EEF1EB] dark:hover:bg-zinc-800 text-[#2D2D2A] dark:text-zinc-100 border border-[#E9E2D7] dark:border-zinc-700 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
              title="Imprimir visualização formatada para auditoria"
            >
              <Printer className="w-4 h-4" />
              Imprimir Relatório
            </button>
          </div>
        </div>

        {/* Grade de Indicadores do Relatório */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
          <div className="bg-[#FAF8F5] dark:bg-zinc-800/50 p-4 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#A09A8E] dark:text-zinc-500 block">
              Total Auditado
            </span>
            <span className="serif text-2xl font-bold text-[#2D2D2A] dark:text-zinc-100">
              {stats.totalRows}
            </span>
            <span className="text-2xs text-[#706B5F] dark:text-zinc-400 block">
              Registros no filtro atual
            </span>
          </div>

          <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                Confirmações
              </span>
              <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {stats.confirmationRate}% taxa
              </span>
            </div>
            <span className="serif text-2xl font-bold text-emerald-900">
              {stats.totalConfirmations}
            </span>
            <span className="text-2xs text-emerald-700 block">
              R$ {stats.totalValueExecuted.toFixed(2)} em serviços
            </span>
          </div>

          <div className="bg-rose-50/60 p-4 rounded-2xl border border-rose-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 block">
                Cancelamentos
              </span>
              <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                {stats.cancellationRate}% taxa
              </span>
            </div>
            <span className="serif text-2xl font-bold text-rose-900">
              {stats.totalCancellations}
            </span>
            <span className="text-2xs text-rose-700 block">
              Com motivos documentados
            </span>
          </div>

          <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">
              Solicitações Admin
            </span>
            <span className="serif text-2xl font-bold text-amber-900">
              {stats.totalAdminRequests}
            </span>
            <span className="text-2xs text-amber-700 block">
              Tickets & pedidos enviados
            </span>
          </div>

          <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200 space-y-1 col-span-2 lg:col-span-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 block">
              Sinais Pix Auditados
            </span>
            <span className="serif text-2xl font-bold text-blue-900">
              R$ {stats.totalDepositsSecured.toFixed(2)}
            </span>
            <span className="text-2xs text-blue-700 block">
              Retidos contra no-show
            </span>
          </div>
        </div>

        {/* Filtros em Barra Superior */}
        <div className="bg-[#FAF8F5] dark:bg-zinc-800/50 p-4 sm:p-5 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            
            {/* Filtros de Tipo */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-[#706B5F] dark:text-zinc-400 mr-1">Tipo:</span>
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  typeFilter === 'all'
                    ? 'bg-[#5A5A40] dark:bg-zinc-700 text-white shadow-2xs'
                    : 'bg-white dark:bg-zinc-900 text-[#706B5F] dark:text-zinc-400 hover:bg-[#EEF1EB] dark:hover:bg-zinc-800 border border-[#E9E2D7] dark:border-zinc-700'
                }`}
              >
                Todos ({allRows.length})
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('confirmations')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  typeFilter === 'confirmations'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-white dark:bg-zinc-900 text-[#706B5F] dark:text-zinc-400 hover:bg-emerald-50 border border-[#E9E2D7] dark:border-zinc-700'
                }`}
              >
                Confirmações
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('cancellations')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  typeFilter === 'cancellations'
                    ? 'bg-rose-700 text-white shadow-2xs'
                    : 'bg-white dark:bg-zinc-900 text-[#706B5F] dark:text-zinc-400 hover:bg-rose-50 border border-[#E9E2D7] dark:border-zinc-700'
                }`}
              >
                Cancelamentos
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('requests')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  typeFilter === 'requests'
                    ? 'bg-amber-700 text-white shadow-2xs'
                    : 'bg-white dark:bg-zinc-900 text-[#706B5F] dark:text-zinc-400 hover:bg-amber-50 border border-[#E9E2D7] dark:border-zinc-700'
                }`}
              >
                Solicitações Admin ({tickets.length})
              </button>
            </div>

            {/* Filtros de Período */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-[#706B5F] dark:text-zinc-400 mr-1">Período:</span>
              <button
                type="button"
                onClick={() => setPeriodFilter('today')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  periodFilter === 'today' ? 'bg-[#5A5A40] dark:bg-zinc-700 text-white' : 'bg-white dark:bg-zinc-900 text-[#706B5F] dark:text-zinc-400 border border-[#E9E2D7] dark:border-zinc-700'
                }`}
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => setPeriodFilter('7days')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  periodFilter === '7days' ? 'bg-[#5A5A40] dark:bg-zinc-700 text-white' : 'bg-white dark:bg-zinc-900 text-[#706B5F] dark:text-zinc-400 border border-[#E9E2D7] dark:border-zinc-700'
                }`}
              >
                Últimos 7 dias
              </button>
              <button
                type="button"
                onClick={() => setPeriodFilter('month')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  periodFilter === 'month' ? 'bg-[#5A5A40] dark:bg-zinc-700 text-white' : 'bg-white dark:bg-zinc-900 text-[#706B5F] dark:text-zinc-400 border border-[#E9E2D7] dark:border-zinc-700'
                }`}
              >
                Mês Atual
              </button>
              <button
                type="button"
                onClick={() => setPeriodFilter('all')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  periodFilter === 'all' ? 'bg-[#5A5A40] dark:bg-zinc-700 text-white' : 'bg-white dark:bg-zinc-900 text-[#706B5F] dark:text-zinc-400 border border-[#E9E2D7] dark:border-zinc-700'
                }`}
              >
                Todo o Histórico
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-[#E9E2D7] dark:border-zinc-700">
            {/* Campo de Busca Livre */}
            <div className="sm:col-span-8 relative">
              <Search className="w-4 h-4 text-[#A09A8E] dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por código (#BE ou #TKT), cliente, profissional, telefone ou justificativa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-[#E9E2D7] dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-[#2D2D2A] dark:text-zinc-100 outline-none focus:ring-2 focus:ring-[#5A5A40] dark:ring-zinc-600"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#706B5F] dark:text-zinc-400 hover:text-[#2D2D2A] dark:hover:text-zinc-100 dark:text-zinc-100 dark:hover:text-zinc-100 dark:text-zinc-100 cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Filtro por Profissional */}
            <div className="sm:col-span-4">
              <select
                value={selectedProfId}
                onChange={(e) => setSelectedProfId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-[#E9E2D7] dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-[#2D2D2A] dark:text-zinc-100 outline-none cursor-pointer"
              >
                <option value="all">Todos os Estabelecimentos / Profissionais</option>
                {professionals.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabela de Auditoria Formatada */}
        <div className="border border-[#E9E2D7] dark:border-zinc-700 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF8F5] dark:bg-zinc-800/50 border-b border-[#E9E2D7] dark:border-zinc-700 text-[#5A5A40] dark:text-zinc-300 uppercase tracking-wider font-bold">
                  <th className="py-3.5 px-4">Data & Horário</th>
                  <th className="py-3.5 px-4">Tipo & Código</th>
                  <th className="py-3.5 px-4">Profissional</th>
                  <th className="py-3.5 px-4">Cliente / Solicitante</th>
                  <th className="py-3.5 px-4">Serviço / Assunto</th>
                  <th className="py-3.5 px-4">Valores (Total / Sinal)</th>
                  <th className="py-3.5 px-4">Status & Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E2D7] bg-white dark:bg-zinc-900">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#706B5F] dark:text-zinc-400">
                      <FileText className="w-10 h-10 text-[#A09A8E] dark:text-zinc-500 mx-auto mb-2 opacity-50" />
                      <p className="font-bold text-sm text-[#2D2D2A] dark:text-zinc-100">Nenhum registro encontrado</p>
                      <p className="text-xs text-[#706B5F] dark:text-zinc-400 mt-1">Tente ajustar os filtros de período ou termos de busca.</p>
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => {
                    const badgeClasses = {
                      emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                      rose: 'bg-rose-50 text-rose-800 border-rose-200',
                      amber: 'bg-amber-50 text-amber-800 border-amber-200',
                      blue: 'bg-blue-50 text-blue-800 border-blue-200'
                    }[row.statusBadge.color];

                    return (
                      <tr key={row.id} className="hover:bg-[#FAF8F5] dark:hover:bg-zinc-800 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 dark:bg-zinc-800/50/60 transition-colors">
                        {/* Data e Horário */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-[#2D2D2A] dark:text-zinc-100">
                            {formatDatePtBr(row.dateStr)}
                          </div>
                          <div className="text-2xs text-[#706B5F] dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-[#A09A8E] dark:text-zinc-500" />
                            {row.timeStr}
                          </div>
                        </td>

                        {/* Tipo e Código */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-mono font-bold text-xs text-[#2D2D2A] dark:text-zinc-100 block">
                            {row.code}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-[#706B5F] dark:text-zinc-400 block">
                            {row.type === 'confirmation' ? 'Confirmação' : row.type === 'completion' ? 'Atendido' : row.type === 'cancellation' ? 'Cancelamento' : 'Chamado Admin'}
                          </span>
                        </td>

                        {/* Profissional */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-bold text-[#2D2D2A] dark:text-zinc-100 block">
                            {row.professionalName}
                          </span>
                        </td>

                        {/* Cliente / Solicitante */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-semibold text-[#2D2D2A] dark:text-zinc-100">
                            {row.personName}
                          </div>
                          <div className="text-2xs text-[#706B5F] dark:text-zinc-400">
                            {row.personContact}
                          </div>
                        </td>

                        {/* Serviço / Assunto */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-medium text-[#2D2D2A] dark:text-zinc-100 truncate" title={row.subjectOrService}>
                            {row.subjectOrService}
                          </div>
                        </td>

                        {/* Valores */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {row.value > 0 ? (
                            <div>
                              <span className="font-bold text-[#2D2D2A] dark:text-zinc-100 block">
                                R$ {row.value.toFixed(2)}
                              </span>
                              {row.depositValue > 0 ? (
                                <span className="text-[10px] font-semibold text-emerald-700 block">
                                  Sinal Pix: R$ {row.depositValue.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-[10px] text-[#A09A8E] dark:text-zinc-500 block">
                                  Sem sinal
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[#A09A8E] dark:text-zinc-500 text-2xs italic">
                              Suporte / Admin
                            </span>
                          )}
                        </td>

                        {/* Status & Detalhes */}
                        <td className="py-3.5 px-4 min-w-[200px]">
                          <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border mb-1 ${badgeClasses}`}>
                            {row.statusBadge.label}
                          </span>
                          <p className="text-2xs text-[#706B5F] dark:text-zinc-400 leading-snug">
                            {row.details}
                          </p>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rodapé do Relatório */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#706B5F] dark:text-zinc-400 pt-3 border-t border-[#E9E2D7] dark:border-zinc-700 gap-2">
          <span>
            Exibindo <strong>{filteredRows.length}</strong> de <strong>{allRows.length}</strong> registros totais auditados.
          </span>
          <span className="text-2xs text-[#A09A8E] dark:text-zinc-500">
            BellaHora SaaS • Registro criptograficamente íntegro e sincronizado com o banco de dados
          </span>
        </div>
      </div>
    </div>
  );
}
