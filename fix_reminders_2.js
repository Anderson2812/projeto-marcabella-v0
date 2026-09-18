const fs = require('fs');
let code = fs.readFileSync('components/RemindersManager.tsx', 'utf8');

const regex = /<button\s+onClick=\{\(\) => onMarkReminderSent\([^)]+\)\}[\s\S]*?\{booking\.reminderSent \? 'Desmarcar' : 'Marcar'\}\s*<\/button>/g;
code = code.replace(regex, "");

fs.writeFileSync('components/RemindersManager.tsx', code);
