const fs = require('fs');
let code = fs.readFileSync('lib/use-app-store.tsx', 'utf8');

code = code.replace(
  "updateProfessionalCustomPlan: (profId: string, customPricing: {\n    planType?: SubscriptionPlanType;",
  "updateProfessionalCustomPlan: (profId: string, customPricing: {\n    planType?: SubscriptionPlanType;\n    customTrialDaysExtended?: number;"
);

code = code.replace(
  "customBackgroundEnabled: customPricing.customBackgroundEnabled",
  "customBackgroundEnabled: customPricing.customBackgroundEnabled,\n            customTrialDaysExtended: customPricing.customTrialDaysExtended !== undefined ? customPricing.customTrialDaysExtended : p.customTrialDaysExtended"
);

fs.writeFileSync('lib/use-app-store.tsx', code);
