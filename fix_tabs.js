const fs = require('fs');
let code = fs.readFileSync('components/ProfessionalDashboard.tsx', 'utf8');

const regexAgenda = /\{\s*id:\s*'waitlist'[\s\S]*?\},\s*\{\s*id:\s*'vacations'[\s\S]*?\},\s*/;
code = code.replace(regexAgenda, "");

const regexSettings = /\{\s*id:\s*'layouts'[\s\S]*?\{\s*id:\s*'support'[\s\S]*?\},\s*/;
code = code.replace(regexSettings, "");

fs.writeFileSync('components/ProfessionalDashboard.tsx', code);
