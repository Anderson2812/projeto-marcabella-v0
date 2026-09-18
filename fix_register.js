const fs = require('fs');
let code = fs.readFileSync('components/ProfessionalRegisterForm.tsx', 'utf8');

// Fix specialties
code = code.replace(
  "        specialties: allSpecialties,\n        specialties: [finalCategory],",
  "        specialties: allSpecialties,"
);

// Remove the toggle buttons for CPF/CNPJ
code = code.replace(
  /<div className="inline-flex rounded-lg[\s\S]*?<\/div>/m,
  ""
);

// Remove unused Lock, Eye, EyeOff imports if they are unused
code = code.replace(/Lock,\s*Eye,\s*EyeOff,\s*/, '');

fs.writeFileSync('components/ProfessionalRegisterForm.tsx', code);
