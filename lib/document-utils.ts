/**
 * Utilitários para Validação e Formatação de CPF, CNPJ e CEP
 */

export function cleanDigits(value: string): string {
  return (value || '').replace(/\D/g, '');
}

/**
 * Validação rigorosa de CPF brasileiro (com cálculo de dígitos verificadores)
 */
export function validateCPF(cpf: string): boolean {
  const clean = cleanDigits(cpf);
  if (clean.length !== 11) return false;

  // Rejeita sequências de dígitos iguais conhecidas (ex: 000.000.000-00, 111.111.111-11)
  if (/^(\d)\1{10}$/.test(clean)) return false;

  // Primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i), 10) * (10 - i);
  }
  let firstCheck = 11 - (sum % 11);
  if (firstCheck >= 10) firstCheck = 0;
  if (firstCheck !== parseInt(clean.charAt(9), 10)) return false;

  // Segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i), 10) * (11 - i);
  }
  let secondCheck = 11 - (sum % 11);
  if (secondCheck >= 10) secondCheck = 0;
  if (secondCheck !== parseInt(clean.charAt(10), 10)) return false;

  return true;
}

/**
 * Validação rigorosa de CNPJ brasileiro (com cálculo de dígitos verificadores)
 */
export function validateCNPJ(cnpj: string): boolean {
  const clean = cleanDigits(cnpj);
  if (clean.length !== 14) return false;

  // Rejeita sequências repetidas (ex: 00.000.000/0000-00, etc)
  if (/^(\d)\1{13}$/.test(clean)) return false;

  // Primeiro dígito verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(clean.charAt(i), 10) * weights1[i];
  }
  let rest = sum % 11;
  const firstCheck = rest < 2 ? 0 : 11 - rest;
  if (firstCheck !== parseInt(clean.charAt(12), 10)) return false;

  // Segundo dígito verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(clean.charAt(i), 10) * weights2[i];
  }
  rest = sum % 11;
  const secondCheck = rest < 2 ? 0 : 11 - rest;
  if (secondCheck !== parseInt(clean.charAt(13), 10)) return false;

  return true;
}

/**
 * Valida se é CPF ou CNPJ válido
 */
export function validateCPFOrCNPJ(value: string): { 
  isValid: boolean; 
  type: 'cpf' | 'cnpj' | 'invalid'; 
  formatted: string;
  error?: string 
} {
  const clean = cleanDigits(value);
  
  if (!clean) {
    return {
      isValid: false,
      type: 'invalid',
      formatted: '',
      error: 'CPF ou CNPJ é obrigatório.'
    };
  }

  if (clean.length === 11) {
    const isValid = validateCPF(clean);
    return {
      isValid,
      type: isValid ? 'cpf' : 'invalid',
      formatted: formatCPFOrCNPJ(clean),
      error: isValid ? undefined : 'CPF inválido. Verifique os dígitos digitados.'
    };
  }

  if (clean.length === 14) {
    const isValid = validateCNPJ(clean);
    return {
      isValid,
      type: isValid ? 'cnpj' : 'invalid',
      formatted: formatCPFOrCNPJ(clean),
      error: isValid ? undefined : 'CNPJ inválido. Verifique os dígitos digitados.'
    };
  }

  return {
    isValid: false,
    type: 'invalid',
    formatted: formatCPFOrCNPJ(clean),
    error: clean.length < 11 
      ? `Faltam dígitos (${clean.length}/11 para CPF).` 
      : `Dígitos incompletos (${clean.length}/14 para CNPJ).`
  };
}

/**
 * Aplica máscara progressiva de CPF ou CNPJ
 */
export function formatCPFOrCNPJ(value: string): string {
  const clean = cleanDigits(value).slice(0, 14);

  if (clean.length <= 11) {
    // CPF: 000.000.000-00
    return clean
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
  } else {
    // CNPJ: 00.000.000/0000-00
    return clean
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
      .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5');
  }
}

/**
 * Formata CEP: 00000-000
 */
export function formatCEP(value: string): string {
  const clean = cleanDigits(value).slice(0, 8);
  return clean.replace(/^(\d{5})(\d)/, '$1-$2');
}

/**
 * Busca dados de endereço via API pública do ViaCEP
 */
export async function fetchAddressByCep(cep: string): Promise<{
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  error?: string;
} | null> {
  const clean = cleanDigits(cep);
  if (clean.length !== 8) return null;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.erro) {
      return { street: '', neighborhood: '', city: '', state: '', error: 'CEP não encontrado.' };
    }
    return {
      street: data.logradouro || '',
      neighborhood: data.bairro || '',
      city: data.localidade || '',
      state: data.uf || ''
    };
  } catch (err) {
    console.warn('Erro ao consultar ViaCEP:', err);
    return null;
  }
}
