'use client';

import React, { useMemo, useState } from 'react';
import { useAppStore } from '@/lib/use-app-store';
import { Professional, Expense } from '@/types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Wallet, CreditCard, Plus, Check } from 'lucide-react';
import { formatDatePtBr } from '@/lib/calendar-utils';

interface AdminFinancialDashboardProps {
  professional: Professional;
}

export default function AdminFinancialDashboard({ professional }: AdminFinancialDashboardProps) {
  const { bookings, expenses, addExpense, deleteExpense } = useAppStore();
  
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    category: 'material' as any,
    date: new Date().toISOString().slice(0, 10),
    status: 'paid' as any
  });

  const { profBookings, profExpenses } = useMemo(() => {
    return {
      profBookings: bookings.filter(b => b.professionalId === professional.id && b.status === 'completed'),
      profExpenses: expenses.filter(e => e.professionalId === professional.id)
    };
  }, [bookings, expenses, professional.id]);

  // Derived metrics for the selected month
  const metrics = useMemo(() => {
    const monthBookings = profBookings.filter(b => b.date.startsWith(selectedMonth));
    const monthExpenses = profExpenses.filter(e => e.date.startsWith(selectedMonth));

    const totalRevenue = monthBookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    
    // Average ticket
    const averageTicket = monthBookings.length > 0 ? totalRevenue / monthBookings.length : 0;

    // Last month for comparison
    const dateObj = new Date(`${selectedMonth}-01T00:00:00`);
    dateObj.setMonth(dateObj.getMonth() - 1);
    const prevMonthStr = dateObj.toISOString().slice(0, 7);
    
    const prevBookings = profBookings.filter(b => b.date.startsWith(prevMonthStr));
    const prevExpenses = profExpenses.filter(e => e.date.startsWith(prevMonthStr));
    const prevRevenue = prevBookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const prevNetProfit = prevRevenue - prevExpenses.reduce((sum, e) => sum + e.amount, 0);

    const revenueGrowth = prevRevenue === 0 ? 100 : ((totalRevenue - prevRevenue) / prevRevenue) * 100;
    const profitGrowth = prevNetProfit === 0 ? 100 : ((netProfit - prevNetProfit) / Math.abs(prevNetProfit)) * 100;

    return { totalRevenue, totalExpenses, netProfit, averageTicket, revenueGrowth, profitGrowth, monthBookings, monthExpenses };
  }, [profBookings, profExpenses, selectedMonth]);

  // Data for daily chart
  const dailyChartData = useMemo(() => {
    // Get number of days in selected month
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    
    const data = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const dayStr = `${selectedMonth}-${i.toString().padStart(2, '0')}`;
      const dayBookings = metrics.monthBookings.filter(b => b.date === dayStr);
      const dayExpenses = metrics.monthExpenses.filter(e => e.date === dayStr);
      
      data.push({
        day: i.toString(),
        fullDate: dayStr,
        Receitas: dayBookings.reduce((sum, b) => sum + b.totalPrice, 0),
        Despesas: dayExpenses.reduce((sum, e) => sum + e.amount, 0)
      });
    }
    return data;
  }, [selectedMonth, metrics]);

  const handleSaveExpense = () => {
    if (!expenseForm.description || !expenseForm.amount || !expenseForm.date) return;
    
    addExpense({
      professionalId: professional.id,
      description: expenseForm.description,
      amount: parseFloat(expenseForm.amount),
      category: expenseForm.category,
      date: expenseForm.date,
      status: expenseForm.status
    });
    
    setShowExpenseModal(false);
    setExpenseForm({
      description: '',
      amount: '',
      category: 'material',
      date: new Date().toISOString().slice(0, 10),
      status: 'paid'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="serif text-2xl font-bold text-[#2D2D2A] dark:text-zinc-100 tracking-tight">
            Gestão Financeira
          </h2>
          <p className="text-[#706B5F] dark:text-zinc-400 text-sm mt-1">
            Acompanhe suas receitas, despesas e margem de lucro.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-zinc-900 border border-[#E9E2D7] dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:border-[#5A5A40] dark:focus:border-zinc-500 shadow-xs"
          />
          <button
            onClick={() => setShowExpenseModal(true)}
            className="px-4 py-2 bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white rounded-xl text-sm font-bold shadow-xs transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nova Despesa</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 shadow-xs">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-[#706B5F] dark:text-zinc-400 mb-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold uppercase tracking-wider">Faturamento</span>
            </div>
            {metrics.revenueGrowth !== 100 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${metrics.revenueGrowth >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {metrics.revenueGrowth > 0 ? '+' : ''}{metrics.revenueGrowth.toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-2xl font-black text-[#2D2D2A] dark:text-zinc-100">
            R$ {metrics.totalRevenue.toFixed(2)}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 shadow-xs">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-[#706B5F] dark:text-zinc-400 mb-2">
              <CreditCard className="w-4 h-4 text-red-600" />
              <span className="text-xs font-bold uppercase tracking-wider">Despesas</span>
            </div>
          </div>
          <p className="text-2xl font-black text-[#2D2D2A] dark:text-zinc-100">
            R$ {metrics.totalExpenses.toFixed(2)}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 shadow-xs ring-1 ring-inset ring-[#E9E2D7] dark:ring-zinc-700 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-bl-full -mr-4 -mt-4"></div>
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-2 text-[#706B5F] dark:text-zinc-400 mb-2">
              <Wallet className="w-4 h-4 text-[#5A5A40] dark:text-zinc-300" />
              <span className="text-xs font-bold uppercase tracking-wider">Lucro Líquido</span>
            </div>
          </div>
          <p className="text-2xl font-black text-[#2D2D2A] dark:text-zinc-100 relative z-10">
            R$ {metrics.netProfit.toFixed(2)}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 shadow-xs">
          <div className="flex items-center gap-2 text-[#706B5F] dark:text-zinc-400 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Ticket Médio</span>
          </div>
          <p className="text-2xl font-black text-[#2D2D2A] dark:text-zinc-100">
            R$ {metrics.averageTicket.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="bg-white dark:bg-zinc-900 border border-[#E9E2D7] dark:border-zinc-700 p-6 rounded-3xl shadow-xs">
        <div className="mb-6">
          <h3 className="serif text-lg font-bold text-[#2D2D2A] dark:text-zinc-100">Evolução do Mês</h3>
          <p className="text-xs text-[#706B5F] dark:text-zinc-400">Comparativo diário entre Receitas e Despesas</p>
        </div>
        
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9E2D7" className="dark:stroke-zinc-800" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#A09A8E' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#A09A8E' }} tickFormatter={(val) => `R$${val}`} />
              <Tooltip 
                cursor={{ fill: '#F8F6F2', className: 'dark:fill-zinc-800' }}
                contentStyle={{ borderRadius: '12px', border: '1px solid #E9E2D7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
              <Bar dataKey="Receitas" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="Despesas" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Expenses List */}
      <div className="bg-white dark:bg-zinc-900 border border-[#E9E2D7] dark:border-zinc-700 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-6 border-b border-[#E9E2D7] dark:border-zinc-700 flex justify-between items-center">
          <div>
            <h3 className="serif text-lg font-bold text-[#2D2D2A] dark:text-zinc-100">Despesas do Mês</h3>
            <p className="text-xs text-[#706B5F] dark:text-zinc-400">Histórico de custos e contas pagas</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#F8F6F2] dark:bg-zinc-800 text-[#706B5F] dark:text-zinc-400 text-xs font-bold uppercase tracking-wider border-b border-[#E9E2D7] dark:border-zinc-700">
              <tr>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Valor</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9E2D7] dark:divide-zinc-800">
              {metrics.monthExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#706B5F] dark:text-zinc-400">
                    Nenhuma despesa registrada neste mês.
                  </td>
                </tr>
              ) : (
                metrics.monthExpenses.sort((a, b) => b.date.localeCompare(a.date)).map((expense) => (
                  <tr key={expense.id} className="hover:bg-stone-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 text-[#706B5F] dark:text-zinc-300">
                      {formatDatePtBr(expense.date)}
                    </td>
                    <td className="px-6 py-4 font-bold text-[#2D2D2A] dark:text-zinc-100">
                      {expense.description}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-stone-100 dark:bg-zinc-800 text-[#706B5F] dark:text-zinc-300 rounded-lg text-xs font-medium uppercase tracking-wider">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-red-600 dark:text-red-400">
                      R$ {expense.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                        <Check className="w-3 h-3" /> Pago
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => deleteExpense(expense.id)}
                        className="text-stone-400 hover:text-red-600 text-xs font-bold transition-colors"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova Despesa */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full p-6 sm:p-8 border border-[#E9E2D7] dark:border-zinc-700 shadow-2xl space-y-5">
            <h3 className="serif text-xl font-bold text-[#2D2D2A] dark:text-zinc-100">
              Registrar Despesa
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#2D2D2A] dark:text-zinc-100">Descrição (ex: Conta de Luz)</label>
                <input
                  type="text"
                  value={expenseForm.description}
                  onChange={e => setExpenseForm({...expenseForm, description: e.target.value})}
                  className="w-full px-4 py-3 bg-[#F8F6F2] dark:bg-zinc-800 border border-[#E9E2D7] dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:border-[#5A5A40] dark:focus:border-zinc-500"
                  placeholder="Ex: Materiais, Luz, Água"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#2D2D2A] dark:text-zinc-100">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={expenseForm.amount}
                    onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})}
                    className="w-full px-4 py-3 bg-[#F8F6F2] dark:bg-zinc-800 border border-[#E9E2D7] dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:border-[#5A5A40] dark:focus:border-zinc-500"
                    placeholder="0.00"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#2D2D2A] dark:text-zinc-100">Data do Pagamento</label>
                  <input
                    type="date"
                    value={expenseForm.date}
                    onChange={e => setExpenseForm({...expenseForm, date: e.target.value})}
                    className="w-full px-4 py-3 bg-[#F8F6F2] dark:bg-zinc-800 border border-[#E9E2D7] dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:border-[#5A5A40] dark:focus:border-zinc-500"
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#2D2D2A] dark:text-zinc-100">Categoria</label>
                <select
                  value={expenseForm.category}
                  onChange={e => setExpenseForm({...expenseForm, category: e.target.value as any})}
                  className="w-full px-4 py-3 bg-[#F8F6F2] dark:bg-zinc-800 border border-[#E9E2D7] dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:border-[#5A5A40] dark:focus:border-zinc-500"
                >
                  <option value="material">Materiais / Insumos</option>
                  <option value="salary">Salário / Pró-labore</option>
                  <option value="commission">Comissões Pagas</option>
                  <option value="rent">Aluguel do Espaço</option>
                  <option value="utilities">Contas (Luz, Água, Internet)</option>
                  <option value="marketing">Marketing / Anúncios</option>
                  <option value="taxes">Impostos / Taxas</option>
                  <option value="other">Outros</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E9E2D7] dark:border-zinc-700">
              <button
                onClick={() => setShowExpenseModal(false)}
                className="px-4 py-2 text-[#706B5F] dark:text-zinc-400 font-bold text-sm hover:text-black dark:hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveExpense}
                disabled={!expenseForm.description || !expenseForm.amount}
                className="px-6 py-2.5 bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition-all"
              >
                Salvar Despesa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
