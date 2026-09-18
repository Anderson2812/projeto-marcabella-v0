'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/use-app-store';
import { 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  User, 
  Mail, 
  Phone, 
  ShieldCheck,
  MessageCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { 
  validateWhatsAppPhone, 
  formatPhoneMask, 
  BEAUTY_SPECIALTIES 
} from '@/lib/validation-utils';

interface ProfessionalRegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
  title?: string;
  subtitle?: string;
}

export default function ProfessionalRegisterForm({
  onSwitchToLogin,
}: ProfessionalRegisterFormProps) {
  const { globalPlanPricing } = useAppStore();
  const trialDays = globalPlanPricing?.trialDays || 15;

  // Estados dos campos de solicitação
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(BEAUTY_SPECIALTIES[0] || 'Manicure & Nail Designer');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');

  // Estados de feedback
  const [formError, setFormError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);

  // Manipulação de máscaras
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneMask(e.target.value);
    setPhone(formatted);
    if (phoneError) setPhoneError(null);
  };

  const handleRequestAccess = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setPhoneError(null);

    if (!name.trim() || name.trim().length < 3) {
      setFormError('Informe seu nome ou nome do seu espaço de atendimento.');
      return;
    }

    const phoneValidation = validateWhatsAppPhone(phone);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.message);
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setFormError('Informe um e-mail de contato válido.');
      return;
    }

    // Sucesso - solicitação registrada
    setIsSent(true);

    // Preparar mensagem automática para o WhatsApp do administrador do BellaHora
    const adminPhone = '5511999999999'; // Número do suporte/admin
    const msg = encodeURIComponent(
      `Olá! Gostaria de ativar meu espaço no BellaHora.\n\n` +
      `*Nome/Espaço:* ${name.trim()}\n` +
      `*Especialidade:* ${category}\n` +
      `*WhatsApp:* ${phone.trim()}\n` +
      `*E-mail:* ${email.trim()}\n` +
      `*Cidade/UF:* ${city.trim() || 'Não informado'}\n\n` +
      `Quero aproveitar os 15 dias de degustação 100% gratuita!`
    );

    // Abre o WhatsApp para enviar a solicitação diretamente ao dono do sistema
    const waUrl = `https://wa.me/${adminPhone}?text=${msg}`;
    try {
      window.open(waUrl, '_blank');
    } catch {
      // Fallback normal
    }
  };

  if (isSent) {
    return (
      <div className="text-center py-6 px-4 space-y-4 animate-in fade-in">
        <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="serif text-xl font-bold text-stone-900 dark:text-zinc-100">
            Solicitação Enviada com Sucesso!
          </h3>
          <p className="text-xs text-stone-600 dark:text-zinc-400 max-w-sm mx-auto">
            Seu pedido de abertura de espaço foi recebido pela nossa administração. Vamos cadastrar seu espaço e liberar seu acesso para aproveitar os <strong>15 dias 100% gratuitos</strong>.
          </p>
        </div>

        <div className="p-4 bg-[#F8F6F2] dark:bg-zinc-800 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700 text-left text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-stone-800 dark:text-zinc-200">
            <Clock className="w-4 h-4 text-[#5A5A40] dark:text-amber-400" />
            <span>Prazo de Ativação Rápido:</span>
          </div>
          <p className="text-stone-600 dark:text-zinc-400">
            Você receberá seus dados de login diretamente no seu WhatsApp ({phone}) e e-mail.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              setIsSent(false);
              if (onSwitchToLogin) onSwitchToLogin();
            }}
            className="w-full py-3 px-4 rounded-xl bg-[#5A5A40] hover:bg-[#484832] text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            Ir para a Tela de Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleRequestAccess} className="space-y-4 text-left">
      {/* Aviso de Cadastro Exclusivo por Administrador */}
      <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
        <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Acesso Gerenciado e Exclusivo:</span>
          <span>Por questões de qualidade e suporte personalizado, o cadastro é liberado diretamente pela administração. Preencha seus dados abaixo para ativar seus <strong>{trialDays} dias de teste sem mensalidade</strong>.</span>
        </div>
      </div>

      {formError && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}

      {/* 1. Nome Profissional / Espaço */}
      <div>
        <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-200 mb-1">
          Seu Nome ou Nome do Espaço: <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
            <User className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setFormError(null); }}
            placeholder="Ex.: Studio Camila Nails & Beauty"
            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-zinc-700 bg-[#F8F6F2] dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 text-sm focus:bg-white dark:bg-zinc-900 outline-none"
            required
          />
        </div>
      </div>

      {/* 2. Categoria / Especialidade */}
      <div>
        <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-200 mb-1">
          Especialidade Principal: <span className="text-rose-500">*</span>
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-stone-300 dark:border-zinc-700 bg-[#F8F6F2] dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 text-xs sm:text-sm outline-none cursor-pointer"
        >
          {BEAUTY_SPECIALTIES.map((spec) => (
            <option key={spec} value={spec}>
              {spec}
            </option>
          ))}
        </select>
      </div>

      {/* 3. WhatsApp & E-mail */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-200 mb-1">
            Seu WhatsApp com DDD: <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
              <Phone className="w-4 h-4" />
            </div>
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="(11) 98765-4321"
              maxLength={15}
              className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border ${
                phoneError ? 'border-rose-400 bg-rose-50/50' : 'border-stone-300 dark:border-zinc-700 bg-[#F8F6F2] dark:bg-zinc-800'
              } text-stone-900 dark:text-zinc-100 text-sm focus:bg-white dark:bg-zinc-900 outline-none`}
              required
            />
          </div>
          {phoneError && (
            <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {phoneError}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-200 mb-1">
            E-mail para Acesso: <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFormError(null); }}
              placeholder="exemplo@espaco.com.br"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-zinc-700 bg-[#F8F6F2] dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 text-sm focus:bg-white dark:bg-zinc-900 outline-none"
              required
            />
          </div>
        </div>
      </div>

      {/* 4. Cidade / Estado */}
      <div>
        <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-200 mb-1">
          Cidade / UF:
        </label>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Ex.: São Paulo - SP"
          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-zinc-700 bg-[#F8F6F2] dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 text-sm focus:bg-white dark:bg-zinc-900 outline-none"
        />
      </div>

      {/* Botão de Solicitação */}
      <button
        type="submit"
        className="w-full py-3.5 px-6 rounded-2xl bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-3"
      >
        <Sparkles className="w-4 h-4 text-amber-300" />
        <span>Solicitar Abertura da Minha Agenda</span>
        <ArrowRight className="w-4 h-4" />
      </button>

      {/* Alternar para Login */}
      {onSwitchToLogin && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-xs font-bold text-stone-600 dark:text-zinc-400 hover:text-[#5A5A40] hover:underline cursor-pointer"
          >
            Já tem uma conta cadastrada? Entrar no Painel &rarr;
          </button>
        </div>
      )}
    </form>
  );
}
