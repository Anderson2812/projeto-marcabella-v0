'use client';

import React, { useMemo, useState } from 'react';
import { useAppStore } from '@/lib/use-app-store';
import { Professional, StaffMember } from '@/types';
import { Calendar, DollarSign, Download, Users } from 'lucide-react';

interface AdminCommissionsProps {
  professional: Professional;
}

export default function AdminCommissions({ professional }: AdminCommissionsProps) {
  const { bookings } = useAppStore();
  
  // Date range filters (default to current month)
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const staffMembers: StaffMember[] = professional.staffMembers || [];

  const commissionReport = useMemo(() => {
    // Filter bookings for the selected month and completed status
    const profBookings = bookings.filter(b => 
      b.professionalId === professional.id && 
      b.date.startsWith(selectedMonth) &&
      b.status === 'completed'
    );

    // Initialize report structure
    const report = new Map<string, {
      staffId: string;
      staffName: string;
      totalServices: number;
      totalRevenue: number;
      totalCommission: number;
      commissionPercent: number;
    }>();

    // Setup map for all staff to ensure they show up even with 0
    staffMembers.forEach(staff => {
      report.set(staff.id, {
        staffId: staff.id,
        staffName: staff.name,
        totalServices: 0,
        totalRevenue: 0,
        totalCommission: 0,
        commissionPercent: staff.commissionPercentage || 0
      });
    });

    // Main professional (owner) might also do services
    report.set('owner', {
      staffId: 'owner',
      staffName: professional.name + ' (Você)',
      totalServices: 0,
      totalRevenue: 0,
      totalCommission: 0,
      commissionPercent: 100 // Owner keeps 100% of their own services
    });

    // Calculate
    profBookings.forEach(b => {
      const staffId = b.staffMemberId || 'owner';
      const staffData = report.get(staffId);
      
      if (staffData) {
        staffData.totalServices += 1;
        staffData.totalRevenue += b.totalPrice;
        
        // Use custom commission amount if present on booking, else calculate from percentage
        if (typeof b.commissionAmount === 'number') {
          staffData.totalCommission += b.commissionAmount;
        } else {
          // calculate dynamically
          const pct = b.commissionPercentage ?? staffData.commissionPercent;
          staffData.totalCommission += (b.totalPrice * pct) / 100;
        }
      }
    });

    return Array.from(report.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [bookings, professional.id, selectedMonth, staffMembers]);

  const totalOwed = commissionReport.filter(r => r.staffId !== 'owner').reduce((acc, r) => acc + r.totalCommission, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="serif text-2xl font-bold text-[#2D2D2A] dark:text-zinc-100 tracking-tight">
            Relatório de Comissões
          </h2>
          <p className="text-[#706B5F] dark:text-zinc-400 text-sm mt-1">
            Controle os repasses devidos a cada membro da equipe.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-zinc-900 border border-[#E9E2D7] dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:border-[#5A5A40] dark:focus:border-zinc-500 shadow-xs"
          />
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl flex items-start gap-3">
        <DollarSign className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-sm text-amber-900 dark:text-amber-500">Repasse Total Estimado</h4>
          <p className="text-amber-800 dark:text-amber-600 text-xs mt-1">
            Para o mês selecionado, o valor total de repasse para a equipe (excluindo você) é de <strong className="font-bold">R$ {totalOwed.toFixed(2)}</strong>.
          </p>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white dark:bg-zinc-900 border border-[#E9E2D7] dark:border-zinc-700 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#F8F6F2] dark:bg-zinc-800 text-[#706B5F] dark:text-zinc-400 text-xs font-bold uppercase tracking-wider border-b border-[#E9E2D7] dark:border-zinc-700">
              <tr>
                <th className="px-6 py-4">Profissional</th>
                <th className="px-6 py-4">Regra Padrão</th>
                <th className="px-6 py-4">Serviços Feitos</th>
                <th className="px-6 py-4">Faturamento Bruto</th>
                <th className="px-6 py-4 text-right">Comissão a Pagar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9E2D7] dark:divide-zinc-800">
              {commissionReport.map((row, i) => (
                <tr key={i} className="hover:bg-stone-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4 text-stone-500" />
                      </div>
                      <span className="font-bold text-[#2D2D2A] dark:text-zinc-100">
                        {row.staffName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[#706B5F] dark:text-zinc-300">
                    {row.staffId === 'owner' ? '-' : `${row.commissionPercent}%`}
                  </td>
                  <td className="px-6 py-4 text-[#706B5F] dark:text-zinc-300">
                    {row.totalServices}
                  </td>
                  <td className="px-6 py-4 font-bold text-[#2D2D2A] dark:text-zinc-100">
                    R$ {row.totalRevenue.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-emerald-700 dark:text-emerald-400">
                    {row.staffId === 'owner' ? (
                      <span className="text-[#706B5F] dark:text-zinc-500 text-xs font-medium">100% Retido (R$ {row.totalRevenue.toFixed(2)})</span>
                    ) : (
                      `R$ ${row.totalCommission.toFixed(2)}`
                    )}
                  </td>
                </tr>
              ))}
              {commissionReport.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#706B5F] dark:text-zinc-400">
                    Nenhum agendamento concluído neste mês.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
