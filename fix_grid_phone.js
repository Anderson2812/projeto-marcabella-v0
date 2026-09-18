const fs = require('fs');
let code = fs.readFileSync('components/AdminGridCalendar.tsx', 'utf8');

const regex = /onChange=\{\(e\) => \{\s+const val = e\.target\.value\.replace\(\/\\\\D\/g, ''\);\s+let mask = val;[\s\S]*?setManualClientPhone\(mask\);\s+\}\}/;
code = code.replace(regex, "onChange={(e) => setManualClientPhone(formatPhoneMask(e.target.value))}");

fs.writeFileSync('components/AdminGridCalendar.tsx', code);
