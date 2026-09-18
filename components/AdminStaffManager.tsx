'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  Percent, 
  DollarSign, 
  ShieldCheck, 
  Sparkles, 
  Phone, 
  Mail, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  UserCheck, 
  X,
  CreditCard,
  Building2
} from 'lucide-react';
import { Professional, StaffMember, ServiceItem, Booking } from '@/types';
import { useAppStore } from '@/lib/use-app-store';
import ImageUploadField from './ImageUploadField';

interface Props {
  professional: Professional;
  services: ServiceItem[];
  bookings: Booking[];
}

export default function AdminStaffManager({ professional, services, bookings }: Props) {
  const { 
    addStaffMember, 
    updateStaffMember, 
    deleteStaffMember, 
    globalPlanPricing 
  } = useAppStore();

  const staffList = professional.staffMembers || [];

  // Modal de Adicionar / Editar Membro
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [roleOrSpecialty, setRoleOrSpecialty] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [commissionPercentage, setCommissionPercentage] = useState<number>(60);
  const [pixKey, setPixKey] = useState('');
  const [active, setActive] = useState(true);
  const [assignedServiceIds, setAssignedServiceIds] = useState<string[]>([]);
  const [useCustomSchedule, setUseCustomSchedule] = useState(false);
  const [customSchedule, setCustomSchedule] = useState<{
    activeDays: number[];
    startTime: string;
    endTime: string;
    intervalMinutes: number;
    hasLunchBreak: boolean;
    lunchStart: string;
    lunchEnd: string;
  }>({
    activeDays: [1, 2, 3, 4, 5, 6],
    startTime: '09:00',
    endTime: '18:00',
    intervalMinutes: 30,
    hasLunchBreak: true,
    lunchStart: '12:00',
    lunchEnd: '13:00'
  });
  
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [filterStaffId, setFilterStaffId] = useState<string>('all');

  // Precificação Multi-Profissional
  const extraStaffFee = globalPlanPricing?.extraStaffMonthlyFee ?? 19.90;
  const extraCapPerMember = globalPlanPricing?.extraStaffRevenueCapPerMember ?? 5000;
  const baseMonthlyPrice = professional.planMonthlyPrice || globalPlanPricing?.proFixedMonthly || 59.90;

  const totalStaffCount = Math.max(1, staffList.length);
  const extraStaffCount = Math.max(0, staffList.length - 1);
  const additionalMonthlyCost = extraStaffCount * extraStaffFee;
  const totalMonthlyPlanCost = baseMonthlyPrice + additionalMonthlyCost;
  const totalRevenueCap = 15000 + (extraStaffCount * extraCapPerMember);

  const openAddModal = () => {
    setEditingStaffId(null);
    setName('');
    setRoleOrSpecialty('');
    setAvatarUrl('');
    setPhone('');
    setEmail('');
    setCommissionPercentage(60);
    setPixKey('');
    setActive(true);
    setAssignedServiceIds(services.map(s => s.id));
    setUseCustomSchedule(false);
    setCustomSchedule({
      activeDays: [1, 2, 3, 4, 5, 6],
      startTime: '09:00',
      endTime: '18:00',
      intervalMinutes: 30,
      hasLunchBreak: true,
      lunchStart: '12:00',
      lunchEnd: '13:00'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (staff: StaffMember) => {
    setEditingStaffId(staff.id);
    setName(staff.name);
    setRoleOrSpecialty(staff.roleOrSpecialty);
    setAvatarUrl(staff.avatarUrl || '');
    setPhone(staff.phone || '');
    setEmail(staff.email || '');
    setCommissionPercentage(staff.commissionPercentage ?? 60);
    setPixKey(staff.pixKey || '');
    setActive(staff.active);
    setAssignedServiceIds(staff.assignedServiceIds || services.map(s => s.id));
    setUseCustomSchedule(staff.useCustomSchedule || false);
    if (staff.customSchedule) setCustomSchedule(staff.customSchedule);
    setIsModalOpen(true);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !roleOrSpecialty.trim()) {
      setFeedbackMsg('Por favor, preencha o nome e a especialidade do profissional.');
      return;
    }

    if (editingStaffId) {
      const existing = staffList.find(s => s.id === editingStaffId);
      if (existing) {
        updateStaffMember(professional.id, {
          ...existing,
          name: name.trim(),
          roleOrSpecialty: roleOrSpecialty.trim(),
          avatarUrl: avatarUrl.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          commissionPercentage: Number(commissionPercentage) || 0,
          pixKey: pixKey.trim() || undefined,
          active,
          assignedServiceIds,
          useCustomSchedule,
          customSchedule
        });
        setFeedbackMsg(`Dados de ${name} atualizados com sucesso!`);
      }
    } else {
      addStaffMember(professional.id, {
        professionalId: professional.id,
        name: name.trim(),
        roleOrSpecialty: roleOrSpecialty.trim(),
        avatarUrl: avatarUrl.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        commissionPercentage: Number(commissionPercentage) || 0,
        pixKey: pixKey.trim() || undefined,
        active,
        assignedServiceIds,
        useCustomSchedule,
        customSchedule
      });
      setFeedbackMsg(`Profissional ${name} adicionada à equipe com sucesso!`);
    }

    setIsModalOpen(false);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleDeleteStaff = (staff: StaffMember) => {
    if (confirm(`Deseja realmente remover ${staff.name} da equipe do salão?`)) {
      deleteStaffMember(professional.id, staff.id);
      setFeedbackMsg(`Profissional ${staff.name} removida da equipe.`);
      setTimeout(() => setFeedbackMsg(null), 3500);
    }
  };

  const toggleServiceAssignment = (serviceId: string) => {
    setAssignedServiceIds(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  // Cálculos de Comissões e Faturamento por Profissional
  const staffMetrics = useMemo(() => {
    return staffList.map(staff => {
      const staffBookings = bookings.filter(b => 
        (b.staffMemberId === staff.id || (!b.staffMemberId && staff.name === professional.name)) && 
        b.status === 'completed'
      );
      const totalRevenue = staffBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      const commissionRate = (staff.commissionPercentage ?? 60) / 100;
      const commissionAmount = totalRevenue * commissionRate;
      const salonAmount = totalRevenue - commissionAmount;

      return {
        ...staff,
        totalCompletedBookings: staffBookings.length,
        totalRevenue,
        commissionAmount,
        salonAmount
      };
    });
  }, [staffList, bookings, professional.name]);

  return (
    <div className="space-y-6">
      
      {/* CABEÇALHO COM TÍTULO E BOTÃO ADICIONAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-stone-200 dark:border-zinc-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-zinc-100">
                Gestão de Equipe & Múltiplas Profissionais
              </h3>
              <p className="text-xs text-stone-500 dark:text-zinc-400">
                Cadastre cabeleireiras, manicures, esteticistas e lash designers do mesmo salão com divisão transparente de comissões.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#8C4E46] text-white text-xs font-bold shadow-xs hover:bg-[#783F38] transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Profissional no Salão</span>
        </button>
      </div>

      {feedbackMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* CARD DE INFORMAÇÃO TRANSPARENTE DE PLANO E TETO DO SALÃO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Bloco 1: Profissionais Ativas */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider block">
            Equipe Cadastrada
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-stone-900 dark:text-zinc-100">
              {totalStaffCount}
            </span>
            <span className="text-xs font-semibold text-stone-500 dark:text-zinc-400">
              {totalStaffCount === 1 ? 'profissional ativa' : 'profissionais no salão'}
            </span>
          </div>
          <p className="text-[10px] text-stone-400 pt-1">
            {extraStaffCount === 0 
              ? 'Plano Individual Solo' 
              : `1 Titular + ${extraStaffCount} profissional(is) parceira(s)`}
          </p>
        </div>

        {/* Bloco 2: Mensalidade Total Ajustada */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider block">
            Mensalidade do Salão
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#8C4E46] dark:text-rose-400">
              R$ {totalMonthlyPlanCost.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-xs text-stone-500 dark:text-zinc-400">
              /mês
            </span>
          </div>
          <p className="text-[10px] text-stone-400 pt-1">
            Base: R$ {baseMonthlyPrice.toFixed(2)} {extraStaffCount > 0 ? `+ R$ ${additionalMonthlyCost.toFixed(2)} (${extraStaffCount}x R$ ${extraStaffFee.toFixed(2)})` : '(Sem adicionais)'}
          </p>
        </div>

        {/* Bloco 3: Teto de Faturamento Ampliado */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider block">
            Teto de Agendamentos / Faturamento
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
              R$ {totalRevenueCap.toLocaleString('pt-BR')}
            </span>
            <span className="text-xs text-stone-500 dark:text-zinc-400">
              /mês
            </span>
          </div>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 pt-1">
            ✨ Teto expandido em +R$ {extraCapPerMember.toLocaleString('pt-BR')} por colaboradora
          </p>
        </div>

      </div>

      {/* LISTAGEM DOS MEMBROS DA EQUIPE */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200 dark:border-zinc-800 shadow-xs overflow-hidden">
        
        <div className="p-4 border-b border-stone-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#8C4E46]" />
            <h4 className="font-bold text-xs text-stone-800 dark:text-zinc-200 uppercase tracking-wider">
              Profissionais & Especialidades do Salão ({staffList.length})
            </h4>
          </div>
          <span className="text-[11px] text-stone-500 dark:text-zinc-400">
            As clientes podem escolher com quem desejam ser atendidas no link do salão
          </span>
        </div>

        {staffList.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-stone-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-800 dark:text-zinc-200">
                Nenhuma profissional parceira adicionada ainda
              </h4>
              <p className="text-xs text-stone-500 max-w-md mx-auto mt-1">
                Adicione as manicures, lash designers ou cabeleireiras que atendem no mesmo espaço para que cada uma tenha seus serviços e controle de comissão.
              </p>
            </div>
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#8C4E46] text-white text-xs font-bold hover:bg-[#783F38] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Primeira Colaboradora</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-zinc-800">
            {staffMetrics.map((staff) => {
              const assignedServices = services.filter(s => 
                !staff.assignedServiceIds || staff.assignedServiceIds.length === 0 || staff.assignedServiceIds.includes(s.id)
              );

              return (
                <div key={staff.id} className="p-4 sm:p-5 hover:bg-stone-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    
                    {/* Avatar e Identificação */}
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-stone-200 dark:border-zinc-700 bg-stone-100">
                        <Image
                          src={staff.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80'}
                          alt={staff.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-sm text-stone-900 dark:text-zinc-100 truncate">
                            {staff.name}
                          </h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            staff.active 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                              : 'bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}>
                            {staff.active ? 'Ativa no Link' : 'Pausada'}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-[#8C4E46] dark:text-rose-400 mt-0.5">
                          {staff.roleOrSpecialty}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-stone-500 dark:text-zinc-400 mt-1 flex-wrap">
                          {staff.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-stone-400" />
                              {staff.phone}
                            </span>
                          )}
                          {staff.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-stone-400" />
                              {staff.email}
                            </span>
                          )}
                          <span className="font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
                            Comissão: {staff.commissionPercentage}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Faturamento e Comissões Geradas */}
                    <div className="flex items-center gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-100 dark:border-zinc-800">
                      <div className="text-right">
                        <span className="text-[10px] text-stone-500 dark:text-zinc-400 block font-medium">
                          Repasse Profissional ({staff.commissionPercentage}%):
                        </span>
                        <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 block">
                          R$ {staff.commissionAmount.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-[9px] text-stone-400 block">
                          Retenção do Salão: R$ {staff.salonAmount.toFixed(2).replace('.', ',')}
                        </span>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditModal(staff)}
                          className="p-2 rounded-xl bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 hover:bg-stone-200 transition-colors cursor-pointer"
                          title="Editar dados da profissional"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStaff(staff)}
                          className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors cursor-pointer"
                          title="Remover profissional do salão"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Procedimentos que esta profissional realiza */}
                  <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-zinc-800/80 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-stone-400 uppercase">
                      Procedimentos ({assignedServices.length}):
                    </span>
                    {assignedServices.map(srv => (
                      <span 
                        key={srv.id}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300"
                      >
                        {srv.name}
                      </span>
                    ))}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* MODAL ADICIONAR / EDITAR PROFISSIONAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-lg w-full p-5 sm:p-6 border border-stone-200 dark:border-zinc-800 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#8C4E46]" />
                <h3 className="text-sm font-bold text-stone-900 dark:text-zinc-100">
                  {editingStaffId ? 'Editar Profissional da Equipe' : 'Nova Profissional no Salão'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-4">
              
              {/* Foto de Perfil */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1">
                  Foto de Perfil / Rosto
                </label>
                <ImageUploadField
                  value={avatarUrl}
                  onChange={(url) => setAvatarUrl(url)}
                  label="Foto da Colaboradora / Especialista"
                  description="Carregue uma foto nítida da profissional (JPG, PNG, WEBP) ou cole uma URL."
                />
              </div>

              {/* Nome e Especialidade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Letícia Lima"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 focus:ring-1 focus:ring-[#8C4E46]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1">
                    Especialidade / Cargo *
                  </label>
                  <input
                    type="text"
                    required
                    value={roleOrSpecialty}
                    onChange={(e) => setRoleOrSpecialty(e.target.value)}
                    placeholder="Ex: Lash Designer & Sobrancelhas"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 focus:ring-1 focus:ring-[#8C4E46]"
                  />
                </div>
              </div>

              {/* Contatos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1">
                    WhatsApp / Telefone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 98888-0000"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 focus:ring-1 focus:ring-[#8C4E46]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1">
                    E-mail (Opcional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="leticia@marcabella.com.br"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 focus:ring-1 focus:ring-[#8C4E46]"
                  />
                </div>
              </div>

              {/* Comissão e Chave Pix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1">
                    Comissão da Profissional (%) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      required
                      value={commissionPercentage}
                      onChange={(e) => setCommissionPercentage(Number(e.target.value))}
                      className="w-full pl-3 pr-8 py-2 text-xs rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 focus:ring-1 focus:ring-[#8C4E46]"
                    />
                    <Percent className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <span className="text-[10px] text-stone-400 mt-0.5 block">
                    Salão fica com {100 - (Number(commissionPercentage) || 0)}%
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1">
                    Chave Pix para Repasses (Opcional)
                  </label>
                  <input
                    type="text"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    placeholder="CPF, Telefone ou E-mail Pix"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 focus:ring-1 focus:ring-[#8C4E46]"
                  />
                </div>
              </div>

              {/* Serviços que atende */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300">
                  Procedimentos que esta profissional realiza:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-2 bg-stone-50 dark:bg-zinc-800/60 rounded-xl border border-stone-200 dark:border-zinc-700">
                  {services.map(srv => {
                    const isChecked = assignedServiceIds.includes(srv.id);
                    return (
                      <label key={srv.id} className="flex items-center gap-2 text-xs text-stone-800 dark:text-zinc-200 cursor-pointer p-1 rounded hover:bg-white dark:hover:bg-zinc-700/50">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleServiceAssignment(srv.id)}
                          className="rounded text-[#8C4E46] focus:ring-[#8C4E46]"
                        />
                        <span className="truncate">{srv.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Horários e Agenda da Profissional */}
              <div className="space-y-1.5 p-3 rounded-xl border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800/40">
                <label className="flex items-center gap-2 cursor-pointer select-none mb-3">
                  <input
                    type="checkbox"
                    checked={useCustomSchedule}
                    onChange={(e) => setUseCustomSchedule(e.target.checked)}
                    className="rounded text-[#8C4E46] focus:ring-[#8C4E46]"
                  />
                  <span className="text-xs font-bold text-stone-800 dark:text-zinc-200">
                    Definir horário próprio para esta profissional
                  </span>
                </label>
                {!useCustomSchedule && (
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400 pl-6">
                    A profissional seguirá os horários de funcionamento padrão do salão.
                  </p>
                )}
                {useCustomSchedule && (
                  <div className="pl-6 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[11px] text-stone-600 mb-1">Início</label>
                        <input 
                          type="time" 
                          value={customSchedule.startTime}
                          onChange={e => setCustomSchedule({...customSchedule, startTime: e.target.value})}
                          className="w-full p-2 rounded-lg border border-stone-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-stone-600 mb-1">Fim</label>
                        <input 
                          type="time" 
                          value={customSchedule.endTime}
                          onChange={e => setCustomSchedule({...customSchedule, endTime: e.target.value})}
                          className="w-full p-2 rounded-lg border border-stone-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={customSchedule.hasLunchBreak}
                        onChange={(e) => setCustomSchedule({...customSchedule, hasLunchBreak: e.target.checked})}
                        className="rounded text-[#8C4E46] focus:ring-[#8C4E46]"
                      />
                      <span className="text-[11px] text-stone-700 dark:text-zinc-300">Pausa para Almoço</span>
                    </label>
                    {customSchedule.hasLunchBreak && (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="block text-[11px] text-stone-600 mb-1">Início do Almoço</label>
                          <input 
                            type="time" 
                            value={customSchedule.lunchStart}
                            onChange={e => setCustomSchedule({...customSchedule, lunchStart: e.target.value})}
                            className="w-full p-2 rounded-lg border border-stone-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-stone-600 mb-1">Fim do Almoço</label>
                          <input 
                            type="time" 
                            value={customSchedule.lunchEnd}
                            onChange={e => setCustomSchedule({...customSchedule, lunchEnd: e.target.value})}
                            className="w-full p-2 rounded-lg border border-stone-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Status Ativo */}
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="rounded text-[#8C4E46] focus:ring-[#8C4E46]"
                  />
                  <span className="text-xs font-bold text-stone-800 dark:text-zinc-200">
                    Disponível para agendamentos no link público do salão
                  </span>
                </label>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#8C4E46] text-white text-xs font-bold shadow-xs hover:bg-[#783F38] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingStaffId ? 'Salvar Alterações' : 'Cadastrar na Equipe'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
