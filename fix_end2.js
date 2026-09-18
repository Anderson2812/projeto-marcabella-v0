const fs = require('fs');
let code = fs.readFileSync('lib/whatsapp-utils.ts', 'utf8');

code = code.replace("\\`\\${day}/\\${month}/\\${year}\\`", "`${day}/${month}/${year}`");
code = code.replace("\\`Olá! Agende seu horário comigo pelo BellaHora:\\\\n\\\\n\\${baseUrl}/agenda/\\${professional.slug}\\`", "`Olá! Agende seu horário comigo pelo BellaHora:\\n\\n${baseUrl}/agenda/${professional.slug}`");
code = code.replace("\\`https://wa.me/?text=\\${encodeURIComponent(text)}\\`", "`https://wa.me/?text=${encodeURIComponent(text)}`");
code = code.replace("\\`https://wa.me/?text=\\${encodeURIComponent('Novo agendamento!')}\\`", "`https://wa.me/?text=${encodeURIComponent('Novo agendamento!')}`");

fs.writeFileSync('lib/whatsapp-utils.ts', code);
