const fs = require('fs');
let code = fs.readFileSync('components/ProfessionalDashboard.tsx', 'utf8');

// The pricing comes from PLAN_CONFIGS dynamically updated.
// We need to retrieve it.
// The file imports PLAN_CONFIGS. We can use PLAN_CONFIGS.pro_fixed.baseMonthlyPrice and PLAN_CONFIGS.flex_fee.baseMonthlyPrice
code = code.replace(
  /79,90/g,
  "{PLAN_CONFIGS.pro_fixed.baseMonthlyPrice.toFixed(2).replace('.', ',')}"
);
code = code.replace(
  /29,90/g,
  "{PLAN_CONFIGS.flex_fee.baseMonthlyPrice.toFixed(2).replace('.', ',')}"
);
code = code.replace(
  /1,50/g,
  "{PLAN_CONFIGS.flex_fee.feePerBooking.toFixed(2).replace('.', ',')}"
);

// We need to fix hardcoded occurrences inside strings
code = code.replace(
  /Mensalidade reduzida de R\$ \{PLAN_CONFIGS.flex_fee.baseMonthlyPrice.toFixed\(2\).replace\('\.', ','\)\} \+ R\$ \{PLAN_CONFIGS.flex_fee.feePerBooking.toFixed\(2\).replace\('\.', ','\)\} por agendamento\./g,
  "Mensalidade reduzida de R$ ${PLAN_CONFIGS.flex_fee.baseMonthlyPrice.toFixed(2).replace('.', ',')} + R$ ${PLAN_CONFIGS.flex_fee.feePerBooking.toFixed(2).replace('.', ',')} por agendamento."
);

fs.writeFileSync('components/ProfessionalDashboard.tsx', code);
