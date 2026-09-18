const fs = require('fs');
let code = fs.readFileSync('lib/whatsapp-utils.ts', 'utf8');

const regex = /export function generateReminderMessageText\([\s\S]*?return text;\n\}/;
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

  let text = \`Olá *\${booking.clientName}*, tudo bem? Passando para lembrar do seu horário comigo!\n\n\`;
  text += \`💅 *Procedimento(s):* \${booking.serviceName}\n\`;
  text += \`🗓️ *Data:* \${formatDatePtBr(booking.date)}\n\`;
  text += \`⏰ *Horário:* \${timeText}\n\`;
  
  if (booking.depositPaid && remainingAmount > 0) {
    text += \`💰 *Saldo a pagar no local:* R$ \${remainingAmount.toFixed(2)}\n\`;
  }
  
  text += \`📍 *Endereço:* \${professional.address}\n\n\`;
  text += \`*Por favor, responda "SIM" para confirmar sua presença.*\n\n\`;
  text += \`⚠️ Lembramos que temos uma tolerância de atraso de 10 minutos. Qualquer imprevisto, nos avise com antecedência.\n\nTe aguardamos!\`;

  return text;
}`;
code = code.replace(regex, newGenerate);
fs.writeFileSync('lib/whatsapp-utils.ts', code);
