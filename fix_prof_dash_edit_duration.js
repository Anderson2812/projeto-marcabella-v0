const fs = require('fs');
let code = fs.readFileSync('components/ProfessionalDashboard.tsx', 'utf8');

const regex = /<h3 className="serif text-xl font-bold text-\[\#2D2D2A\] dark:text-zinc-100 mb-1">Alterar Serviços da Cliente<\/h3>\s*<p className="text-xs text-\[\#706B5F\] dark:text-zinc-400 mb-4">\s*Ajuste os procedimentos que serão realizados neste atendimento\.\s*<\/p>/;
const replacement = `<h3 className="serif text-xl font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Alterar Serviços da Cliente</h3>
            <p className="text-xs text-[#706B5F] dark:text-zinc-400 mb-2">
              Ajuste os procedimentos. Verifique o tempo total para não chocar com o próximo cliente.
            </p>
            <div className="bg-[#EEF1EB] dark:bg-zinc-800 p-3 rounded-xl mb-4 flex items-center justify-between border border-[#E9E2D7] dark:border-zinc-700">
              <span className="text-sm font-bold text-[#5A5A40] dark:text-zinc-300">Total:</span>
              <div className="text-right">
                <span className="block font-bold text-[#2D2D2A] dark:text-zinc-100">R$ {selectedEditServices.reduce((acc, s) => acc + s.price, 0).toFixed(2)}</span>
                <span className="block text-xs font-bold text-amber-600 dark:text-amber-400">{selectedEditServices.reduce((acc, s) => acc + s.durationMinutes, 0)} minutos de duração</span>
              </div>
            </div>`;

code = code.replace(regex, replacement);

fs.writeFileSync('components/ProfessionalDashboard.tsx', code);
