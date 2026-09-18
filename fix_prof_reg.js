const fs = require('fs');
let code = fs.readFileSync('components/ProfessionalRegisterForm.tsx', 'utf8');

code = code.replace(
  "  validatePixKey,",
  "  validatePixKey,\n  formatPixKey,"
);

code = code.replace(
  "onChange={(e) => { setPixKey(e.target.value); setPixError(null); }}",
  "onChange={(e) => { setPixKey(formatPixKey(e.target.value, pixKeyType)); setPixError(null); }}"
);

code = code.replace(
  "onChange={(e) => setPixKeyType(e.target.value as any)}",
  "onChange={(e) => { setPixKeyType(e.target.value as any); setPixKey(''); setPixError(null); }}"
);

fs.writeFileSync('components/ProfessionalRegisterForm.tsx', code);
