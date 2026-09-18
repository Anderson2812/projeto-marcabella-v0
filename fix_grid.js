const fs = require('fs');
let code = fs.readFileSync('components/AdminGridCalendar.tsx', 'utf8');

// 1. Remove the condition that hides the button if there are bookings
code = code.replace(
  "{bks.length === 0 && !isLunch && blks.length === 0 && (\n                      <button",
  "{!isLunch && blks.length === 0 && (\n                      <button"
);

code = code.replace(
  "{dayBks.length === 0 && !isLunch && blks.length === 0 && (\n                          <button",
  "{!isLunch && blks.length === 0 && (\n                          <button"
);

// 2. Add formatPhoneMask to the imports if not present
if (!code.includes('formatPhoneMask')) {
  code = code.replace(
    "} from '@/lib/whatsapp-utils';",
    "  formatPhoneMask\n} from '@/lib/whatsapp-utils';"
  );
}

fs.writeFileSync('components/AdminGridCalendar.tsx', code);
