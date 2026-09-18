const fs = require('fs');
let code = fs.readFileSync('components/AdminSaaSPricingManager.tsx', 'utf8');

code = code.replace(
  "planBillingCycle: prof.planBillingCycle || 'monthly'",
  "planBillingCycle: prof.planBillingCycle || 'monthly',\n                customTrialDaysExtended: prof.customTrialDaysExtended || 0"
);

code = code.replace(
  "                  <div className=\"flex flex-col lg:flex-row lg:items-center justify-between gap-4\">",
  `                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">`
);

fs.writeFileSync('components/AdminSaaSPricingManager.tsx', code);
