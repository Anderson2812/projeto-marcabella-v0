const fs = require('fs');
let code = fs.readFileSync('lib/plan-utils.ts', 'utf8');

code = code.replace(
  "  if (professional.trialExpiresAt) {\n    const parsedExp = new Date(professional.trialExpiresAt);\n    trialExpiresAtDate = isNaN(parsedExp.getTime())\n      ? new Date(createdDate.getTime() + totalDays * 24 * 60 * 60 * 1000)\n      : parsedExp;\n  } else {\n    trialExpiresAtDate = new Date(createdDate.getTime() + totalDays * 24 * 60 * 60 * 1000);\n  }",
  "  trialExpiresAtDate = new Date(createdDate.getTime() + totalDays * 24 * 60 * 60 * 1000);"
);

fs.writeFileSync('lib/plan-utils.ts', code);
