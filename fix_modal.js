const fs = require('fs');
let code = fs.readFileSync('components/AdminGridCalendar.tsx', 'utf8');

// We need to add state for manualStartTime
code = code.replace(
  "const [manualClientPhone, setManualClientPhone] = useState('');",
  "const [manualClientPhone, setManualClientPhone] = useState('');\n  const [manualStartTime, setManualStartTime] = useState('');"
);

// We need to initialize manualStartTime when the modal opens
// We can use an effect or just update the onClick
code = code.replace(
  /onClick=\{\(\) => setSelectedSlotForBooking\(\{ date: (currentDate|day\.dateStr), time: hour \}\)\}/g,
  "onClick={() => { setSelectedSlotForBooking({ date: $1, time: hour }); setManualStartTime(hour); }}"
);

// Change the form inside the modal
const formRegex = /<form onSubmit=\{handleSaveManualBooking\} className="space-y-4 text-xs">[\s\S]*?<\/form>/;

const newForm = `
            <form onSubmit={(e) => {
              e.preventDefault();
              if (hasOverlap && !window.confirm('Atenção: Já existe um agendamento (ou bloqueio) neste horário! Tem certeza que deseja realizar o encaixe?')) {
                return;
              }
              handleSaveManualBooking(e);
            }} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Horário de Início:</label>
                  <input
                    type="time"
                    required
                    value={manualStartTime}
                    onChange={(e) => setManualStartTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-zinc-600 text-sm focus:ring-1 outline-none bg-white dark:bg-zinc-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Fim Previsto:</label>
                  <input
                    type="time"
                    disabled
                    value={(() => {
                      if (!manualStartTime || !manualServiceId) return '';
                      const serv = profServices.find(s => s.id === manualServiceId);
                      if (!serv) return '';
                      const [h, m] = manualStartTime.split(':').map(Number);
                      const totalMins = h * 60 + m + serv.durationMinutes;
                      const endH = String(Math.floor(totalMins / 60)).padStart(2, '0');
                      const endM = String(totalMins % 60).padStart(2, '0');
                      return \`\${endH}:\${endM}\`;
                    })()}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 text-sm bg-stone-100 dark:bg-zinc-800 text-stone-500 font-mono"
                  />
                </div>
              </div>

              {(() => {
                if (!manualStartTime || !manualServiceId || !selectedSlotForBooking) return null;
                const serv = profServices.find(s => s.id === manualServiceId);
                if (!serv) return null;
                const [h, m] = manualStartTime.split(':').map(Number);
                const startMins = h * 60 + m;
                const endMins = startMins + serv.durationMinutes;
                
                // Check overlaps
                const overlaps = bookings.some(b => {
                  if (b.status === 'cancelled') return false;
                  if (b.date !== selectedSlotForBooking.date) return false;
                  const [bh, bm] = b.time.split(':').map(Number);
                  const bStartMins = bh * 60 + bm;
                  const bEndMins = bStartMins + (b.serviceDuration || 60);
                  
                  return (startMins < bEndMins && endMins > bStartMins);
                });
                
                const blockOverlaps = blockedSlots.some(bl => {
                  if (bl.date !== selectedSlotForBooking.date) return false;
                  const [bh, bm] = bl.startTime.split(':').map(Number);
                  const bStartMins = bh * 60 + bm;
                  const [eh, em] = bl.endTime.split(':').map(Number);
                  const bEndMins = eh * 60 + em;
                  return (startMins < bEndMins && endMins > bStartMins);
                });

                if (overlaps || blockOverlaps) {
                  return (
                    <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl">
                      <p className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                        <span className="text-sm">⚠️</span>
                        ALERTA DE CHOQUE DE HORÁRIO!
                      </p>
                      <p className="text-xs text-rose-600 dark:text-rose-300 mt-1">
                        Já existe um agendamento ou bloqueio neste período. O sistema permitirá o encaixe, mas a agenda ficará sobreposta.
                      </p>
                    </div>
                  );
                }
                return null;
              })()}

              <div>
                <label className="block font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Nome da Cliente:</label>
                <input
                  type="text"
                  required
                  value={manualClientName}
                  onChange={(e) => setManualClientName(e.target.value)}
                  placeholder="Ex: Camila Rocha"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-zinc-600 text-sm focus:ring-1 outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">WhatsApp da Cliente:</label>
                <input
                  type="tel"
                  value={manualClientPhone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\\D/g, '');
                    let mask = val;
                    if (val.length <= 11 && typeof window !== 'undefined') {
                       // simple mask applied directly since formatPhoneMask might be imported differently
                       if (val.length > 2 && val.length <= 6) mask = \`(\${val.slice(0,2)}) \${val.slice(2)}\`;
                       else if (val.length > 6 && val.length <= 10) mask = \`(\${val.slice(0,2)}) \${val.slice(2,6)}-\${val.slice(6)}\`;
                       else if (val.length > 10) mask = \`(\${val.slice(0,2)}) \${val.slice(2,7)}-\${val.slice(7,11)}\`;
                    }
                    setManualClientPhone(mask);
                  }}
                  placeholder="(11) 98765-4321"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-zinc-600 text-sm focus:ring-1 outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Serviço a realizar:</label>
                <select
                  required
                  value={manualServiceId}
                  onChange={(e) => setManualServiceId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-zinc-600 text-sm bg-white dark:bg-zinc-900 focus:ring-1 outline-none"
                >
                  <option value="">Selecione o serviço...</option>
                  {profServices.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} - R$ {s.price.toFixed(2)} ({s.durationMinutes} min)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-[#2D2D2A] dark:text-zinc-100 mb-1">Observações internas:</label>
                <input
                  type="text"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="Ex: Encaixe rápido solicitado pelo WhatsApp"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-zinc-600 text-xs focus:ring-1 outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E9E2D7] dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => setSelectedSlotForBooking(null)}
                  className="px-4 py-2 text-stone-600 dark:text-zinc-400 hover:text-black dark:hover:text-white font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Confirmar Encaixe
                </button>
              </div>
            </form>`;

code = code.replace(formRegex, newForm);

// Also need to fix handleSaveManualBooking to use manualStartTime and calculate endTime
const saveRegex = /const handleSaveManualBooking = \(e: React\.FormEvent\) => \{[\s\S]*?setManualNotes\(''\);\n  \};/;
const newSave = `const handleSaveManualBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotForBooking || !manualClientName.trim() || !manualServiceId || !manualStartTime) return;

    const serv = profServices.find(s => s.id === manualServiceId);
    if (!serv) return;

    // Calculate end time
    const [h, m] = manualStartTime.split(':').map(Number);
    const totalMins = h * 60 + m + serv.durationMinutes;
    const endH = String(Math.floor(totalMins / 60)).padStart(2, '0');
    const endM = String(totalMins % 60).padStart(2, '0');
    const endTime = \`\${endH}:\${endM}\`;

    createManualBooking({
      professionalId: professional.id,
      clientName: manualClientName.trim(),
      clientPhone: manualClientPhone.trim() || '(Não informado)',
      serviceId: serv.id,
      serviceName: serv.name,
      serviceDuration: serv.durationMinutes,
      totalPrice: serv.price,
      date: selectedSlotForBooking.date,
      time: manualStartTime,
      endTime: endTime,
      status: 'confirmed',
      depositRequired: false,
      depositPaid: false,
      depositAmount: 0,
      notes: manualNotes.trim()
    });

    setSelectedSlotForBooking(null);
    setManualClientName('');
    setManualClientPhone('');
    setManualServiceId('');
    setManualStartTime('');
    setManualNotes('');
  };`;

code = code.replace(saveRegex, newSave);

// And we must add hasOverlap calculation inside handleSaveManualBooking or before it
// But in onSubmit we inline it. We just need to make sure hasOverlap is defined in the component body
code = code.replace(
  "// Criação do Agendamento Manual",
  `  const hasOverlap = (() => {
    if (!manualStartTime || !manualServiceId || !selectedSlotForBooking) return false;
    const serv = profServices.find(s => s.id === manualServiceId);
    if (!serv) return false;
    const [h, m] = manualStartTime.split(':').map(Number);
    const startMins = h * 60 + m;
    const endMins = startMins + serv.durationMinutes;
    
    const overlaps = bookings.some(b => {
      if (b.status === 'cancelled') return false;
      if (b.date !== selectedSlotForBooking.date) return false;
      const [bh, bm] = b.time.split(':').map(Number);
      const bStartMins = bh * 60 + bm;
      const bEndMins = bStartMins + (b.serviceDuration || 60);
      return (startMins < bEndMins && endMins > bStartMins);
    });
    const blockOverlaps = blockedSlots.some(bl => {
      if (bl.date !== selectedSlotForBooking.date) return false;
      const [bh, bm] = bl.startTime.split(':').map(Number);
      const bStartMins = bh * 60 + bm;
      const [eh, em] = bl.endTime.split(':').map(Number);
      const bEndMins = eh * 60 + em;
      return (startMins < bEndMins && endMins > bStartMins);
    });
    return overlaps || blockOverlaps;
  })();\n\n  // Criação do Agendamento Manual`
);

fs.writeFileSync('components/AdminGridCalendar.tsx', code);
