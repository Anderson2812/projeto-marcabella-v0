const fs = require('fs');
let code = fs.readFileSync('components/ProfessionalDashboard.tsx', 'utf8');

const replacement = "                : `Plano Flex Ativo: Mensalidade reduzida de R$ ${PLAN_CONFIGS.flex_fee.baseMonthlyPrice.toFixed(2).replace('.', ',')} + R$ ${PLAN_CONFIGS.flex_fee.feePerBooking.toFixed(2).replace('.', ',')} por agendamento.`";
const lines = code.split('\n');
lines[934] = replacement; // Array is 0-indexed, so 934 is line 935

fs.writeFileSync('components/ProfessionalDashboard.tsx', lines.join('\n'));
