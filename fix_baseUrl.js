const fs = require('fs');
let code = fs.readFileSync('lib/whatsapp-utils.ts', 'utf8');

code = code.replace(
  "  baseUrl: string\n): string {",
  "  baseUrl?: string\n): string {"
);

fs.writeFileSync('lib/whatsapp-utils.ts', code);
