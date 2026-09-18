const fs = require('fs');
let code = fs.readFileSync('components/RemindersManager.tsx', 'utf8');

code = code.replace(
  "const [selectedVariation, setSelectedVariation] = useState<ReminderVariationType>('friendly');",
  "const [selectedVariation, setSelectedVariation] = useState<ReminderVariationType>('standard');"
);

fs.writeFileSync('components/RemindersManager.tsx', code);
