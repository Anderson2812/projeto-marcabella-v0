const fs = require('fs');
let code = fs.readFileSync('components/AdminSaaSPricingManager.tsx', 'utf8');

const targetStr = `{/* Mensalidade Individual Cobrada */}`;
const replaceStr = `{edit.planType === 'trial' ? (
                      <div>
                        <label className="block text-3xs font-bold text-[#706B5F] dark:text-zinc-400 uppercase mb-1">
                          Dias Extras de Teste:
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="1"
                            value={edit.customTrialDaysExtended}
                            onChange={(e) => setProfEdits(prev => ({
                              ...prev,
                              [prof.id]: {
                                ...prev[prof.id],
                                customTrialDaysExtended: Number(e.target.value)
                              }
                            }))}
                            className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-[#E9E2D7] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[#2D2D2A] dark:text-zinc-100 outline-none focus:border-[#5A5A40] dark:border-zinc-600"
                          />
                        </div>
                      </div>
                      ) : (
                      <div>
                        <label className="block text-3xs font-bold text-[#706B5F] dark:text-zinc-400 uppercase mb-1">
                          Mensalidade Cobrada (R$):
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#706B5F] dark:text-zinc-400">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={edit.planMonthlyPrice}
                            onChange={(e) => setProfEdits(prev => ({
                              ...prev,
                              [prof.id]: {
                                ...prev[prof.id],
                                planMonthlyPrice: Number(e.target.value)
                              }
                            }))}
                            className="w-full pl-8 pr-2.5 py-1.5 text-xs font-bold rounded-lg border border-[#E9E2D7] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[#2D2D2A] dark:text-zinc-100 outline-none focus:border-[#5A5A40] dark:border-zinc-600"
                          />
                        </div>
                      </div>
                      )}`;

code = code.replace(
  `{/* Mensalidade Individual Cobrada */}
                      <div>
                        <label className="block text-3xs font-bold text-[#706B5F] dark:text-zinc-400 uppercase mb-1">
                          Mensalidade Cobrada (R$):
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#706B5F] dark:text-zinc-400">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={edit.planMonthlyPrice}
                            onChange={(e) => setProfEdits(prev => ({
                              ...prev,
                              [prof.id]: {
                                ...prev[prof.id],
                                planMonthlyPrice: Number(e.target.value)
                              }
                            }))}`,
  replaceStr
);

// We need to pass customTrialDaysExtended to `updateProfessionalCustomPlan` 
code = code.replace(
  "updateProfessionalCustomPlan(profId, {",
  "updateProfessionalCustomPlan(profId, {\n        customTrialDaysExtended: edit.customTrialDaysExtended,"
);

// Wait, is `customTrialDaysExtended` supported by `updateProfessionalCustomPlan`? Let's check `lib/use-app-store.tsx`
fs.writeFileSync('components/AdminSaaSPricingManager.tsx', code);
