// Utilitários de validação rigorosa para Chaves Pix e Telefones WhatsApp

/**
 * Valida CPF pelos dígitos verificadores
 */
export function isValidCPF(cpfRaw: string): boolean {
  const cpf = cpfRaw.replace(/\D/g, '');
  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false; // Impede 111.111.111-11, etc.

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i), 10) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(9), 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i), 10) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  return rev === parseInt(cpf.charAt(10), 10);
}

/**
 * Valida CNPJ pelos dígitos verificadores
 */
export function isValidCNPJ(cnpjRaw: string): boolean {
  const cnpj = cnpjRaw.replace(/\D/g, '');
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;

  const weightsFirst = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weightsSecond = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpj.charAt(i), 10) * weightsFirst[i];
  }
  let rest = sum % 11;
  const d1 = rest < 2 ? 0 : 11 - rest;
  if (parseInt(cnpj.charAt(12), 10) !== d1) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpj.charAt(i), 10) * weightsSecond[i];
  }
  rest = sum % 11;
  const d2 = rest < 2 ? 0 : 11 - rest;
  return parseInt(cnpj.charAt(13), 10) === d2;
}

/**
 * Valida Chave Pix de acordo com o tipo selecionado
 */
export function validatePixKey(
  key: string,
  type: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria'
): { isValid: boolean; message: string } {
  const trimmed = key.trim();
  if (!trimmed) {
    return { isValid: false, message: 'A chave Pix não pode estar vazia.' };
  }

  switch (type) {
    case 'cpf': {
      const numbers = trimmed.replace(/\D/g, '');
      if (numbers.length !== 11) {
        return { isValid: false, message: 'O CPF precisa ter exatamente 11 dígitos numéricos.' };
      }
      if (!isValidCPF(numbers)) {
        return { isValid: false, message: 'CPF inválido de acordo com o algoritmo oficial.' };
      }
      return { isValid: true, message: 'Chave Pix CPF válida.' };
    }

    case 'cnpj': {
      const numbers = trimmed.replace(/\D/g, '');
      if (numbers.length !== 14) {
        return { isValid: false, message: 'O CNPJ precisa ter exatamente 14 dígitos numéricos.' };
      }
      if (!isValidCNPJ(numbers)) {
        return { isValid: false, message: 'CNPJ inválido de acordo com o algoritmo oficial.' };
      }
      return { isValid: true, message: 'Chave Pix CNPJ válida.' };
    }

    case 'email': {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) {
        return { isValid: false, message: 'Formato de e-mail inválido (ex: seu.nome@dominio.com).' };
      }
      return { isValid: true, message: 'Chave Pix E-mail válida.' };
    }

    case 'telefone': {
      const numbers = trimmed.replace(/\D/g, '');
      if (numbers.length < 10 || numbers.length > 11) {
        return { isValid: false, message: 'O telefone deve conter DDD + número (10 ou 11 dígitos).' };
      }
      const ddd = parseInt(numbers.substring(0, 2), 10);
      if (ddd < 11 || ddd > 99) {
        return { isValid: false, message: 'DDD inválido. Digite um DDD brasileiro válido (ex: 11, 21, 31, 41...).' };
      }
      return { isValid: true, message: 'Chave Pix Telefone válida.' };
    }

    case 'aleatoria': {
      // UUIDv4 ou padrão do BACEN com 32 caracteres hexadecimais (com ou sem hífens)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const hex32Regex = /^[0-9a-f]{32}$/i;
      if (!uuidRegex.test(trimmed) && !hex32Regex.test(trimmed)) {
        return { isValid: false, message: 'A chave aleatória deve ter o formato padrão do Banco Central (ex: 123e4567-e89b-12d3-a456-426614174000).' };
      }
      return { isValid: true, message: 'Chave aleatória válida.' };
    }

    default:
      return { isValid: true, message: '' };
  }
}

/**
 * Formata CPF: 000.000.000-00
 */
export function formatCPF(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/**
 * Formata CNPJ: 00.000.000/0001-00
 */
export function formatCNPJ(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

/**
 * Formata Telefone Celular brasileiro: (XX) 9XXXX-XXXX ou (XX) XXXX-XXXX
 */
export function formatPhoneMask(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/**
 * Constrói URL do WhatsApp sanitizada para números brasileiros
 * Garante DDI 55 correto e impede duplicação (5555...)
 */
export function buildWhatsAppUrl(phoneRaw: string, message: string): string {
  let clean = (phoneRaw || '').replace(/\D/g, '');
  if (clean.startsWith('0')) {
    clean = clean.substring(1);
  }
  if (!clean.startsWith('55') && (clean.length === 10 || clean.length === 11)) {
    clean = '55' + clean;
  }
  const textEncoded = encodeURIComponent(message);
  return `https://api.whatsapp.com/send?phone=${clean}&text=${textEncoded}`;
}

/**
 * Abre o WhatsApp de forma segura em nova aba ou aplicativo
 */
export function openWhatsAppSafely(phoneRaw: string, message: string): void {
  const url = buildWhatsAppUrl(phoneRaw, message);
  if (typeof window !== 'undefined') {
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      window.location.href = url;
    }
  }
}

/**
 * Valida número de WhatsApp brasileiro com DDD
 */
export function validateWhatsAppPhone(phone: string): { isValid: boolean; message: string; cleanDigits: string } {
  const digits = phone.replace(/\D/g, '');
  if (!digits) {
    return { isValid: false, message: 'O número do WhatsApp é obrigatório.', cleanDigits: '' };
  }
  if (digits.length < 10 || digits.length > 11) {
    return { isValid: false, message: 'O WhatsApp deve conter DDD + número (ex: 11 98765-4321).', cleanDigits: digits };
  }
  const ddd = parseInt(digits.substring(0, 2), 10);
  if (ddd < 11 || ddd > 99) {
    return { isValid: false, message: 'DDD brasileiro inválido (11 a 99).', cleanDigits: digits };
  }
  if (digits.length === 11 && digits.charAt(2) !== '9') {
    return { isValid: false, message: 'Celulares com 11 dígitos devem começar com 9 após o DDD.', cleanDigits: digits };
  }
  return { isValid: true, message: 'WhatsApp válido.', cleanDigits: digits };
}

/**
 * Lista das especialidades de beleza mais comuns para seleção múltipla
 */
export const BEAUTY_SPECIALTIES = [
  'Manicure & Pedicure',
  'Alongamento em Gel / Fibra de Vidro',
  'Nail Designer',
  'Design de Sobrancelhas',
  'Lash Designer / Extensão de Cílios',
  'Micropigmentação',
  'Cabeleireira & Colorista',
  'Corte & Escova',
  'Tratamentos Capilares / Cronograma',
  'Estética Facial (Limpeza de Pele)',
  'Estética Corporal (Drenagem & Massagem)',
  'Depilação com Cera / Laser',
  'Maquiadora Profissional',
  'Penteados & Noivas',
  'Podologia & Cuidados dos Pés',
  'Spa & Terapias Relaxantes'
] as const;

/**
 * Formata o código de agendamento em tempo real:
 * - Primeiros 3 caracteres: estritamente letras maiúsculas (ex: CAM, BEL, EST)
 * - Insere o hífen (-) automaticamente
 * - Caracteres seguintes: estritamente números (ex: 2041, 1029)
 * - Suporta entrada com ou sem '#' e limpa caracteres inválidos
 */
export function formatBookingCodeInput(val: string): string {
  if (!val) return '';
  
  // Limpa cerquilha e converte para maiúsculo
  const clean = val.toUpperCase().replace(/^#/, '');

  let letters = '';
  let numbers = '';

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (letters.length < 3) {
      if (/[A-Z]/.test(ch)) {
        letters += ch;
      }
    } else {
      if (/[0-9]/.test(ch)) {
        if (numbers.length < 6) {
          numbers += ch;
        }
      }
    }
  }

  if (letters.length === 3) {
    if (numbers.length > 0) {
      return `${letters}-${numbers}`;
    }
    // Auto-insere o hífen ao completar as 3 letras
    return `${letters}-`;
  }

  return letters;
}

export function formatPixKey(value: string, type: string): string {
  if (!value) return '';
  switch(type) {
    case 'cpf':
      return formatCPF(value);
    case 'cnpj':
      return formatCNPJ(value);
    case 'telefone':
      return formatPhoneMask(value);
    default:
      return value;
  }
}
