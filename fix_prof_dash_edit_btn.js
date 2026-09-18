const fs = require('fs');
let code = fs.readFileSync('components/ProfessionalDashboard.tsx', 'utf8');

const regex = /<button\s+onClick=\{\(\) => handleConfirmBooking\(b\)\}[\s\S]*?<\/button>/;
const editButton = `<button
                          onClick={() => handleOpenEditServicesModal(b)}
                          className="px-3.5 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                          Trocar Serviços
                        </button>`;

code = code.replace(
  regex,
  (match) => `${editButton}\n                        ${match}`
);

fs.writeFileSync('components/ProfessionalDashboard.tsx', code);
