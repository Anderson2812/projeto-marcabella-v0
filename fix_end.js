const fs = require('fs');
let code = fs.readFileSync('lib/whatsapp-utils.ts', 'utf8');

code = code.replace(/\\`\\$\\{day\\}\\/\\$\\{month\\}\\/\\$\\{year\\}\\`/g, "`${day}/${month}/${year}`");
code = code.replace(/\\`Olá! Agende seu horário comigo pelo BellaHora:\\\\n\\\\n\\$\\{baseUrl\\}\\/agenda\\/\\$\\{professional\.slug\\}\\`/g, "`Olá! Agende seu horário comigo pelo BellaHora:\\n\\n${baseUrl}/agenda/${professional.slug}`");
code = code.replace(/\\`https:\\/\\/wa\\.me\\/\\?text=\\$\\{encodeURIComponent\\(text\\)\\}\\`/g, "`https://wa.me/?text=${encodeURIComponent(text)}`");
code = code.replace(/\\`https:\\/\\/wa\\.me\\/\\?text=\\$\\{encodeURIComponent\\('Novo agendamento!'\\)\\}\\`/g, "`https://wa.me/?text=${encodeURIComponent('Novo agendamento!')}`");

fs.writeFileSync('lib/whatsapp-utils.ts', code);
