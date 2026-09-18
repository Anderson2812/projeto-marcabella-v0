const fs = require('fs');
let code = fs.readFileSync('components/RemindersManager.tsx', 'utf8');

const regex = /const emojiIcon =[\s\S]*?varItem\.id === 'financial_balance' \? '💰' : '✏️';/;
code = code.replace(regex, "const emojiIcon = varItem.id === 'standard' ? '💬' : '✏️';");

code = code.replace(
  "5 variações disponíveis",
  "2 variações disponíveis"
);

fs.writeFileSync('components/RemindersManager.tsx', code);
