'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/painel?tab=login');
  }, [router]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-stone-600 dark:text-zinc-400">
      <div className="w-8 h-8 border-3 border-[#5A5A40] dark:border-amber-400 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-medium">Redirecionando para o login...</p>
    </div>
  );
}
