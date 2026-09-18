const fs = require('fs');
let code = fs.readFileSync('components/AdminSaaSPricingManager.tsx', 'utf8');

code = code.replace(
  "planBillingCycle: PlanBillingCycle;",
  "planBillingCycle: PlanBillingCycle;\n    customTrialDaysExtended?: number;"
);

fs.writeFileSync('components/AdminSaaSPricingManager.tsx', code);
