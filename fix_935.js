const fs = require('fs');
let code = fs.readFileSync('components/ProfessionalDashboard.tsx', 'utf8');

const regex = /: `Plano Flex Ativo: Mensalidade reduzida de R\$ \$\{PLAN_CONFIGS.flex_fee.baseMonthlyPrice.toFixed\(2\).replace\('\.', ','\)\} \+ R\$ \$\{PLAN_CONFIGS.flex_fee.feePerBooking.toFixed\(2\).replace\('\.', ','\)\} por agendamento.`/;
code = code.replace(regex, ": `Plano Flex Ativo: Mensalidade reduzida de R$ ${PLAN_CONFIGS.flex_fee.baseMonthlyPrice.toFixed(2).replace('.', ',')} + R$ ${PLAN_CONFIGS.flex_fee.feePerBooking.toFixed(2).replace('.', ',')} por agendamento.`");

fs.writeFileSync('components/ProfessionalDashboard.tsx', code);
