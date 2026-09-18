const fs = require('fs');
let code = fs.readFileSync('components/AdminSaaSPricingManager.tsx', 'utf8');

const oldCardsBlock = `<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-white dark:bg-zinc-900 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 shadow-2xs">
            <span className="text-2xs font-bold text-[#706B5F] dark:text-zinc-400 uppercase block mb-1">
              🎁 Dias de Teste Grátis
            </span>
            <strong className="text-base sm:text-xl font-extrabold text-[#2D2D2A] dark:text-zinc-100 block font-mono">
              {savedSnapshot.trialDays} dias
            </strong>
            <span className="text-[11px] text-emerald-700 font-medium">Degustação sem custo</span>
          </div>

          <div className="p-3.5 bg-white dark:bg-zinc-900 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 shadow-2xs">
            <span className="text-2xs font-bold text-[#706B5F] dark:text-zinc-400 uppercase block mb-1">
              ⭐ Pro Fixo (Mensal)
            </span>
            <strong className="text-base sm:text-xl font-extrabold text-[#2D2D2A] dark:text-zinc-100 block font-mono">
              R$ {savedSnapshot.proFixedMonthly.toFixed(2)}
            </strong>
            <span className="text-[11px] text-[#706B5F] dark:text-zinc-400">Ilimitado sem taxas</span>
          </div>

          <div className="p-3.5 bg-white dark:bg-zinc-900 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 shadow-2xs">
            <span className="text-2xs font-bold text-[#706B5F] dark:text-zinc-400 uppercase block mb-1">
              ⚡ Plano Flex
            </span>
            <strong className="text-base sm:text-xl font-extrabold text-[#2D2D2A] dark:text-zinc-100 block font-mono">
              R$ {savedSnapshot.flexBaseMonthly.toFixed(2)}
            </strong>
            <span className="text-[11px] text-amber-800 font-medium">+ R$ {savedSnapshot.flexFeePerBooking.toFixed(2)}/reserva</span>
          </div>

          <div className="p-3.5 bg-white dark:bg-zinc-900 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 shadow-2xs">
            <span className="text-2xs font-bold text-[#706B5F] dark:text-zinc-400 uppercase block mb-1">
              🎨 Vitrines &amp; Extras
            </span>
            <strong className="text-base sm:text-xl font-extrabold text-[#2D2D2A] dark:text-zinc-100 block font-mono">
              R$ {savedSnapshot.singleLayoutPrice.toFixed(2)}
            </strong>
            <span className="text-[11px] text-purple-700 font-medium">Venda avulsa por tema</span>
          </div>
        </div>`;

const newCardsBlock = `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-900/20 rounded-3xl border border-emerald-200/60 dark:border-emerald-800/50 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Gift className="w-16 h-16 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="inline-block px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-[10px] font-black uppercase tracking-widest rounded-lg mb-3">
              Período de Teste
            </span>
            <strong className="text-3xl font-extrabold text-emerald-950 dark:text-emerald-50 block font-mono tracking-tighter">
              {savedSnapshot.trialDays} <span className="text-base font-bold text-emerald-700 dark:text-emerald-400 tracking-normal">dias</span>
            </strong>
            <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-2 font-medium">Degustação 100% gratuita para novos cadastros.</p>
          </div>

          <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-900/20 rounded-3xl border border-amber-200/60 dark:border-amber-800/50 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Crown className="w-16 h-16 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="inline-block px-2.5 py-1 bg-amber-200 dark:bg-amber-900/50 text-amber-900 dark:text-amber-300 text-[10px] font-black uppercase tracking-widest rounded-lg mb-3">
              Pro Fixo (Mensal)
            </span>
            <strong className="text-3xl font-extrabold text-amber-950 dark:text-amber-50 block font-mono tracking-tighter">
              <span className="text-base font-bold text-amber-700 dark:text-amber-400 tracking-normal mr-1">R$</span>
              {savedSnapshot.proFixedMonthly.toFixed(2)}
            </strong>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-2 font-medium">Acesso ilimitado, sem taxas por agendamento.</p>
          </div>

          <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-900/20 rounded-3xl border border-blue-200/60 dark:border-blue-800/50 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap className="w-16 h-16 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="inline-block px-2.5 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-[10px] font-black uppercase tracking-widest rounded-lg mb-3">
              Plano Flex (Híbrido)
            </span>
            <strong className="text-3xl font-extrabold text-blue-950 dark:text-blue-50 block font-mono tracking-tighter">
              <span className="text-base font-bold text-blue-700 dark:text-blue-400 tracking-normal mr-1">R$</span>
              {savedSnapshot.flexBaseMonthly.toFixed(2)}
            </strong>
            <p className="text-xs text-blue-800/80 dark:text-blue-300/80 mt-2 font-medium">
              + <strong className="text-blue-900 dark:text-blue-200">R$ {savedSnapshot.flexFeePerBooking.toFixed(2)}</strong> por cada reserva.
            </p>
          </div>

          <div className="p-5 bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950/40 dark:to-fuchsia-900/20 rounded-3xl border border-purple-200/60 dark:border-purple-800/50 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Palette className="w-16 h-16 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="inline-block px-2.5 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 text-[10px] font-black uppercase tracking-widest rounded-lg mb-3">
              Vitrines & Extras
            </span>
            <strong className="text-3xl font-extrabold text-purple-950 dark:text-purple-50 block font-mono tracking-tighter">
              <span className="text-base font-bold text-purple-700 dark:text-purple-400 tracking-normal mr-1">R$</span>
              {savedSnapshot.singleLayoutPrice.toFixed(2)}
            </strong>
            <p className="text-xs text-purple-800/80 dark:text-purple-300/80 mt-2 font-medium">Preço de venda avulsa por cada tema premium.</p>
          </div>
        </div>`;

code = code.replace(oldCardsBlock, newCardsBlock);

// Import icons
code = code.replace(
  "import { \n  validatePixKey,\n  validateWhatsAppPhone,\n  isValidCPF,\n  isValidCNPJ,\n  formatCPF,\n  formatCNPJ\n} from '@/lib/validation-utils';",
  "import { \n  validatePixKey,\n  validateWhatsAppPhone,\n  isValidCPF,\n  isValidCNPJ,\n  formatCPF,\n  formatCNPJ\n} from '@/lib/validation-utils';\nimport { Gift, Crown, Zap, Palette } from 'lucide-react';"
);

fs.writeFileSync('components/AdminSaaSPricingManager.tsx', code);
