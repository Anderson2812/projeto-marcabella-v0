const fs = require('fs');
let code = fs.readFileSync('components/ProfessionalLoginGate.tsx', 'utf8');

const regex = /<div className="relative">\s*<div className="absolute inset-0 flex items-center">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/main>/;
code = code.replace(regex, "          </div>\n        </div>\n      </div>\n    </main>");

fs.writeFileSync('components/ProfessionalLoginGate.tsx', code);
