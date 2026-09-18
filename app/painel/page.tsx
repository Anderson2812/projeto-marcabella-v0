'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import AdminAuthGuard from '@/components/AdminAuthGuard';

const ProfessionalDashboard = dynamic(() => import('@/components/ProfessionalDashboard'), {
  loading: () => (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-stone-500 dark:text-zinc-400 p-8">
      <div className="w-8 h-8 border-3 border-[#5A5A40] dark:border-amber-400 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-medium">Carregando painel...</p>
    </div>
  )
});

export default function PainelPage() {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-800/70 dark:bg-zinc-950 text-stone-900 dark:text-zinc-100 pb-20 transition-colors">
      <Suspense fallback={<div className="p-8 text-center text-stone-500">Carregando...</div>}>
        <AdminAuthGuard>
          <ProfessionalDashboard />
        </AdminAuthGuard>
      </Suspense>
    </div>
  );
}
