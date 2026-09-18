const fs = require('fs');
let code = fs.readFileSync('lib/whatsapp-utils.ts', 'utf8');

code = code.replace(/='friendly'/g, "='standard'");
code = code.replace(/= 'friendly'/g, "= 'standard'");
code = code.replace(/=== 'friendly'/g, "=== 'standard'");

code = code.replace(/=== 'confirmation_sim'/g, "=== 'standard'");
code = code.replace(/=== 'prep_guidelines'/g, "=== 'standard'");
code = code.replace(/=== 'financial_balance'/g, "=== 'standard'");

fs.writeFileSync('lib/whatsapp-utils.ts', code);
