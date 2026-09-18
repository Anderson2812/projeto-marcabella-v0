const fs = require('fs');
let code = fs.readFileSync('components/ProfessionalDashboard.tsx', 'utf8');

const modalUI = `
      {/* ========================================================================= */}
      {/* MODAL DE EDIÇÃO DE SERVIÇOS DO AGENDAMENTO */}
      {/* ========================================================================= */}
      {isEditServicesModalOpen && editServicesBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={() => setIsEditServicesModalOpen(false)} />
          <div className="relative bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="serif text-xl font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Alterar Serviços da Cliente</h3>
            <p className="text-xs text-[#706B5F] dark:text-zinc-400 mb-4">
              Ajuste os procedimentos que serão realizados neste atendimento.
            </p>
            
            <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-2 mb-6">
              {profServices.map(srv => {
                const isSelected = selectedEditServices.some(s => s.id === srv.id);
                return (
                  <div 
                    key={srv.id}
                    onClick={() => toggleEditServiceSelection(srv)}
                    className={\`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer \${
                      isSelected ? 'border-[#5A5A40] dark:border-zinc-500 bg-[#EEF1EB] dark:bg-zinc-800' : 'border-[#E9E2D7] dark:border-zinc-700 hover:border-[#A09A8E]'
                    }\`}
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-[#2D2D2A] dark:text-zinc-100">{srv.name}</span>
                      <span className="text-xs text-[#706B5F] dark:text-zinc-400">{srv.durationMinutes} min</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-sm text-[#5A5A40] dark:text-zinc-300">R$ {srv.price.toFixed(2)}</span>
                      {isSelected && <Check className="w-4 h-4 text-[#5A5A40] dark:text-zinc-300" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsEditServicesModalOpen(false)}
                className="flex-1 py-3 text-[#2D2D2A] dark:text-zinc-300 font-bold bg-[#E9E2D7] dark:bg-zinc-800 rounded-xl hover:bg-[#D4CFC6] dark:hover:bg-zinc-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEditServices}
                disabled={selectedEditServices.length === 0}
                className="flex-1 py-3 text-white font-bold bg-[#5A5A40] dark:bg-zinc-700 rounded-xl hover:bg-[#484832] dark:hover:bg-zinc-600 transition-colors disabled:opacity-50"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace(
  "{isReopenModalOpen && reopenModalBooking && (",
  modalUI + "\n      {isReopenModalOpen && reopenModalBooking && ("
);

fs.writeFileSync('components/ProfessionalDashboard.tsx', code);
