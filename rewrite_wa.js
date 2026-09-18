const fs = require('fs');

const content = `import { Booking, Professional, ReminderVariationType } from '@/types';
import { formatDatePtBr } from './date-utils'; // Assuming this exists or is needed

export interface ReminderVariationConfig {
  id: ReminderVariationType;
  title: string;
  badge: string;
  description: string;
  iconName: string;
}

export const REMINDER_VARIATIONS_LIST: ReminderVariationConfig[] = [
  {
    id: 'standard',
    title: 'Padrão Profissional',
    badge: 'Recomendado',
    description: 'Um lembrete educado, com orientações de tolerância de atraso e solicitação de confirmação.',
    iconName: 'CheckSquare'
  },
  {
    id: 'custom',
    title: 'Mensagem Personalizada',
    badge: 'Livre',
    description: 'Escreva a sua própria mensagem para enviar para a cliente.',
    iconName: 'Edit3'
  }
];

export function cleanPhone(phone: string): string {
  if (!phone) return '';
  let digits = phone.replace(/\\D/g, '');
  if (digits.startsWith('0') && (digits.length === 11 || digits.length === 12)) {
    digits = digits.slice(1);
  }
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }
  if (digits.length === 10 || digits.length === 11) {
    return \`55\${digits}\`;
  }
  return digits;
}

export function getWhatsAppUrl(phone: string, text: string): string {
  const cleaned = cleanPhone(phone);
  return \`https://wa.me/\${cleaned}?text=\${encodeURIComponent(text)}\`;
}

export function formatPhoneMask(value: string): string {
  let digits = value.replace(/\\D/g, '');
  if (digits.startsWith('55')) digits = digits.slice(2);
  
  if (digits.length === 0) return '';
  if (digits.length <= 2) return \`(\${digits}\`;
  if (digits.length <= 6) return \`(\${digits.slice(0, 2)}) \${digits.slice(2)}\`;
  if (digits.length <= 10) return \`(\${digits.slice(0, 2)}) \${digits.slice(2, 6)}-\${digits.slice(6)}\`;
  return \`(\${digits.slice(0, 2)}) \${digits.slice(2, 7)}-\${digits.slice(7, 11)}\`;
}

export function generateReminderMessageText(
  booking: Booking,
  professional: Professional,
  variation: ReminderVariationType | string = 'standard',
  customMessage: string = ''
): string {
  if (variation === 'custom' && customMessage.trim()) {
    return customMessage
      .replace(/\\{cliente\\}/g, booking.clientName)
      .replace(/\\{servico\\}/g, booking.serviceName)
      .replace(/\\{data\\}/g, formatDatePtBr(booking.date))
      .replace(/\\{hora\\}/g, booking.time)
      .replace(/\\{profissional\\}/g, professional.name)
      .replace(/\\{codigo\\}/g, booking.code);
  }

  const timeText = booking.endTime ? \`\${booking.time} às \${booking.endTime}\` : booking.time;
  const remainingAmount = Math.max(0, booking.totalPrice - booking.depositAmount);

  let text = \`Olá *\${booking.clientName}*, tudo bem? Passando para lembrar do seu horário comigo!\\n\\n\`;
  text += \`💅 *Procedimento(s):* \${booking.serviceName}\\n\`;
  text += \`🗓️ *Data:* \${formatDatePtBr(booking.date)}\\n\`;
  text += \`⏰ *Horário:* \${timeText}\\n\`;
  
  if (booking.depositPaid && remainingAmount > 0) {
    text += \`💰 *Saldo a pagar no local:* R$ \${remainingAmount.toFixed(2)}\\n\`;
  }
  
  text += \`📍 *Endereço:* \${professional.address}\\n\\n\`;
  text += \`*Por favor, responda "SIM" para confirmar sua presença.*\\n\\n\`;
  text += \`⚠️ Lembramos que temos uma tolerância de atraso de 10 minutos. Qualquer imprevisto, nos avise com antecedência.\\n\\nTe aguardamos!\`;

  return text;
}

export function generateReminderWhatsAppUrl(
  booking: Booking, 
  professional: Professional,
  variation: ReminderVariationType = 'standard',
  customText?: string
): string {
  const text = generateReminderMessageText(booking, professional, variation, customText);
  const phone = cleanPhone(booking.clientPhone);
  return \`https://wa.me/\${phone}?text=\${encodeURIComponent(text)}\`;
}

export function generateBookingConfirmedWhatsAppUrl(booking: Booking, professional: Professional): string {
  const text =
    \` Olá *\${booking.clientName}*, seu agendamento foi *CONFIRMADO* com sucesso!\\n\\n\` +
    \` *Serviço(s):* \${booking.serviceName}\\n\` +
    \` *Data e Horário:* \${formatDatePtBr(booking.date)} às *\${booking.time}*\${booking.endTime ? \` até às \${booking.endTime}\` : ''}\\n\` +
    \` *Profissional:* \${professional.name}\\n\` +
    \` *Endereço:* \${professional.address}\\n\` +
    \` *Valor Total:* R$ \${booking.totalPrice.toFixed(2)}\\n\` +
    (booking.depositRequired ? \` *Sinal Pix:* R$ \${booking.depositAmount.toFixed(2)} (Confirmado)\\n\` : '') +
    \` *Código do Agendamento:* \${booking.code}\\n\\n\` +
    \`Aguardamos você com muito carinho! Qualquer imprevisto, favor nos avisar com antecedência. \`;

  const phone = cleanPhone(booking.clientPhone);
  return \`https://wa.me/\${phone}?text=\${encodeURIComponent(text)}\`;
}

export function formatDeadline(isoDateStr?: string): string {
  if (!isoDateStr) return 'em até 2 horas';
  try {
    const d = new Date(isoDateStr);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return \`hoje (\${day}/\${month}) até às \${hours}:\${minutes}\`;
  } catch {
    return 'em breve';
  }
}

export function generateDepositRequestWhatsAppUrl(
  booking: Booking, 
  professional: Professional, 
  deadlineHours: number = 2,
  deadlineFormatted?: string
): string {
  const timeText = booking.endTime ? \`\${booking.time} às \${booking.endTime}\` : booking.time;
  const deadlineText = deadlineFormatted || \`em até \${deadlineHours} horas\`;

  const text =
    \`🎉 Olá *\${booking.clientName}*, ótima notícia! Seu agendamento foi *PRÉ-APROVADO* por *\${professional.name}*!\\n\\n\` +
    \`🗓️ *Data:* \${formatDatePtBr(booking.date)}\\n\` +
    \`⏰ *Horário:* \${timeText}\\n\` +
    \`💅 *Serviço(s):* \${booking.serviceName}\\n\` +
    \`💰 *Valor Total:* R$ \${booking.totalPrice.toFixed(2)}\\n\\n\` +
    \`⚠️ *PASSO PARA CONFIRMAR SUA VAGA:*\\n\` +
    \`Para garantir definitivamente a sua cadeira, faça o pagamento do sinal de reserva de *R$ \${booking.depositAmount.toFixed(2)}* via Pix até *\${deadlineText}*.\\n\\n\` +
    \`🔑 *Chave Pix (\${professional.pixKeyType}):* \${professional.pixKey}\\n\` +
    \`🏷️ *Favorecida:* \${professional.name}\\n\` +
    (booking.pixCode ? \`📋 *Código Pix Copia e Cola:*\\n\${booking.pixCode}\\n\\n\` : '\\n') +
    \`⏰ *Atenção ao Prazo:* Caso o comprovante não seja enviado até o horário limite, o sistema reabrirá automaticamente a vaga para outra cliente da fila de espera.\\n\\n\` +
    \`Assim que fizer a transferência, me envie o comprovante por aqui. Aguardo você! 🥰\`;

  const phone = cleanPhone(booking.clientPhone);
  return \`https://wa.me/\${phone}?text=\${encodeURIComponent(text)}\`;
}

export function generateDepositReminderWhatsAppUrl(booking: Booking, professional: Professional): string {
  const deadlineText = booking.depositDeadlineAt ? formatDeadline(booking.depositDeadlineAt) : 'em instantes';

  const text =
    \`⏰ Olá *\${booking.clientName}*, lembrete do seu agendamento com *\${professional.name}*!\\n\\n\` +
    \`O prazo para pagamento do sinal de *R$ \${booking.depositAmount.toFixed(2)}* referente ao horário do dia *\${formatDatePtBr(booking.date)} às \${booking.time}* encerra *\${deadlineText}*.\\n\\n\` +
    \`🔑 *Chave Pix (\${professional.pixKeyType}):* \${professional.pixKey}\\n\\n\` +
    \`Caso já tenha feito o Pix, por favor me envie o comprovante para eu confirmar sua vaga antes que o horário seja liberado para outra pessoa! 😉\`;

  const phone = cleanPhone(booking.clientPhone);
  return \`https://wa.me/\${phone}?text=\${encodeURIComponent(text)}\`;
}

export function generateDepositConfirmedWhatsAppUrl(booking: Booking, professional: Professional): string {
  const remaining = Math.max(0, booking.totalPrice - booking.depositAmount);
  const timeText = booking.endTime ? \`\${booking.time} às \${booking.endTime}\` : booking.time;

  const text =
    \`✅ Olá *\${booking.clientName}*, sinal recebido com sucesso!\\n\\n\` +
    \`Seu agendamento está *100% CONFIRMADO* e sua vaga está garantida! 🎉\\n\\n\` +
    \`🗓️ *Data:* \${formatDatePtBr(booking.date)} às *\${timeText}*\\n\` +
    \`💅 *Procedimento(s):* \${booking.serviceName}\\n\` +
    \`📍 *Endereço:* \${professional.address}\\n\` +
    \`💵 *Sinal Pago via Pix:* R$ \${booking.depositAmount.toFixed(2)}\\n\` +
    \`💳 *Saldo Restante no Local:* R$ \${remaining.toFixed(2)}\\n\` +
    \`🏷️ *Código:* \${booking.code}\\n\\n\` +
    \`Te esperamos com muito carinho! Qualquer imprevisto com antecedência mínima de \${professional.cancellationHours || 24}h, é só me chamar.\`;

  const phone = cleanPhone(booking.clientPhone);
  return \`https://wa.me/\${phone}?text=\${encodeURIComponent(text)}\`;
}

export function generateSlotReopenedWhatsAppUrl(booking: Booking, professional: Professional, baseUrl?: string): string {
  const linkText = baseUrl ? \`\\n\\n🔗 Você pode consultar novas datas disponíveis aqui:\\n\${baseUrl}/agenda/\${professional.slug}\` : '';

  const text =
    \`⚠️ Olá *\${booking.clientName}*, informamos que o prazo para pagamento do sinal da sua pré-reserva *\${booking.code}* expirou.\\n\\n\` +
    \`Como o sinal não foi confirmado até o horário limite, o horário do dia *\${formatDatePtBr(booking.date)} às \${booking.time}* foi reaberto na agenda para outras clientes da fila.\${linkText}\\n\\n\` +
    \`Caso ainda tenha interesse em agendar em outro dia ou horário, fique à vontade para fazer uma nova solicitação. Um abraço!\`;

  const phone = cleanPhone(booking.clientPhone);
  return \`https://wa.me/\${phone}?text=\${encodeURIComponent(text)}\`;
}

export function generateClientPreBookingWhatsAppUrl(booking: Booking, professional: Professional): string {
  const text =
    \`Olá *\${professional.name}*! 👋 Acabei de solicitar um agendamento na sua agenda BellaHora:\\n\\n\` +
    \`💅 *Serviços:* \${booking.serviceName}\\n\` +
    \`🗓️ *Data:* \${formatDatePtBr(booking.date)} às \${booking.time}\\n\` +
    \`🏷️ *Código:* \${booking.code}\\n\\n\` +
    \`Fico no aguardo da sua aprovação e da chave Pix para o pagamento do sinal de reserva! 😊\`;

  const phone = cleanPhone(professional.phone);
  return \`https://wa.me/\${phone}?text=\${encodeURIComponent(text)}\`;
}

export function generateCancellationWhatsAppUrl(booking: Booking, professional: Professional, reason?: string): string {
  const text =
    \` Olá *\${booking.clientName}*, informamos que o agendamento *\${booking.code}* foi cancelado.\\n\\n\` +
    \` *Serviço:* \${booking.serviceName}\\n\` +
    \` *Data prevista:* \${formatDatePtBr(booking.date)} às \${booking.time}\\n\` +
    (reason ? \` *Motivo:* \${reason}\\n\\n\` : '\\n') +
    \`Para remarcar um novo dia ou tirar dúvidas, entre em contato direto conosco.\`;

  const phone = cleanPhone(booking.clientPhone);
  return \`https://wa.me/\${phone}?text=\${encodeURIComponent(text)}\`;
}

export function generateEncaixeSuggestionWhatsAppUrl(
  booking: Booking, 
  professional: Professional, 
  suggestedTime?: string
): string {
  const text =
    \`Olá *\${booking.clientName}*! Tudo bem? Aqui é a *\${professional.name}*.\\n\\n\` +
    \`Recebi sua solicitação de encaixe para o procedimento *\${booking.serviceName}* no dia *\${formatDatePtBr(booking.date)} às \${booking.time}*.\\n\\n\` +
    (suggestedTime 
      ? \`Consigo te atender com muito carinho nesse mesmo dia, no horário das *\${suggestedTime}*. Esse horário fica bom para você?\` 
      : \`Gostaria de ver com você uma melhor alternativa de horário para te encaixar com calma e qualidade no atendimento. Como está sua disponibilidade?\`) +
    \`\\n\\nFico no seu aguardo para confirmarmos sua vaga! 😊\`;

  const phone = cleanPhone(booking.clientPhone);
  return \`https://wa.me/\${phone}?text=\${encodeURIComponent(text)}\`;
}

export function generateEncaixeApprovedWhatsAppUrl(
  booking: Booking, 
  professional: Professional
): string {
  const timeText = booking.endTime ? \`\${booking.time} às \${booking.endTime}\` : booking.time;
  const text =
    \`✨ Olá *\${booking.clientName}*! Ótima notícia: seu *ENCAIXE FOI APROVADO* por *\${professional.name}*!\\n\\n\` +
    \`🗓️ *Data:* \${formatDatePtBr(booking.date)} às *\${timeText}*\\n\` +
    \`💅 *Procedimento(s):* \${booking.serviceName}\\n\` +
    \`📍 *Endereço:* \${professional.address}\\n\` +
    \`🏷️ *Código:* \${booking.code}\\n\\n\` +
    (booking.depositRequired 
      ? \`Para garantir o encaixe, enviamos os dados do sinal Pix de R$ \${booking.depositAmount.toFixed(2)}. Assim que fizer o Pix, me avise aqui para confirmar!\` 
      : \`Seu horário já está reservado na agenda! Te espero com muito carinho.\`);

  const phone = cleanPhone(booking.clientPhone);
  return \`https://wa.me/\${phone}?text=\${encodeURIComponent(text)}\`;
}
`;

fs.writeFileSync('lib/whatsapp-utils.ts', content);
