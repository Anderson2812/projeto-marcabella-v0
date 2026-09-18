const fs = require('fs');
let code = fs.readFileSync('lib/whatsapp-utils.ts', 'utf8');

const regex = /export const REMINDER_VARIATIONS_LIST: ReminderVariationConfig\[\] = \[\s*\{[\s\S]*?\},\s*\{\s*id: 'custom'[\s\S]*?\}\s*\];/;
const replacement = `export const REMINDER_VARIATIONS_LIST: ReminderVariationConfig[] = [
  {
    id: 'friendly',
    title: 'Acolhedor & Padrão',
    badge: 'Uso Geral',
    description: 'Tom caloroso e afetuoso, ideal para fortalecer a conexão com a cliente.',
    iconName: 'Heart'
  },
  {
    id: 'confirmation_sim',
    title: 'Confirmação com "SIM"',
    badge: 'Evita Faltas',
    description: 'Solicita resposta ativa da cliente com "SIM" até um horário limite para garantir a vaga.',
    iconName: 'CheckSquare'
  },
  {
    id: 'financial_balance',
    title: 'Orientações & Financeiro',
    badge: 'Detalhado',
    description: 'Reforça endereço, tolerância de atraso e discrimina o saldo restante a pagar no local.',
    iconName: 'DollarSign'
  }
];`;

code = code.replace(regex, replacement);

fs.writeFileSync('lib/whatsapp-utils.ts', code);
