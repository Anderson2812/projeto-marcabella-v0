const fs = require('fs');

// 1. Modify types/index.ts
let typesCode = fs.readFileSync('types/index.ts', 'utf8');
typesCode = typesCode.replace(
  /export type ReminderVariationType =[\s\S]*?\| 'financial_balance' \/\/ Saldo a Pagar \(com abatimento de sinal Pix\)/,
  "export type ReminderVariationType = 'standard' | 'custom'"
);
fs.writeFileSync('types/index.ts', typesCode);

// 2. Modify lib/whatsapp-utils.ts
let utilsCode = fs.readFileSync('lib/whatsapp-utils.ts', 'utf8');
const oldList = /export const REMINDER_VARIATIONS_LIST: ReminderVariationConfig\[\] = \[[\s\S]*?\];/;
const newList = `export const REMINDER_VARIATIONS_LIST: ReminderVariationConfig[] = [
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
];`;
utilsCode = utilsCode.replace(oldList, newList);

const oldGenerate = /export function generateReminderMessageText\([\s\S]*?return text;\n\}/;
const newGenerate = `export function generateReminderMessageText(
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

  let text = \`Olá *\${booking.clientName}*, tudo bem? Passando para lembrar do seu horário de amanhã com *\${professional.name}*!\\n\\n\`;
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
}`;
utilsCode = utilsCode.replace(oldGenerate, newGenerate);

fs.writeFileSync('lib/whatsapp-utils.ts', utilsCode);
