const fs = require('fs');
let code = fs.readFileSync('components/ProfessionalRegisterForm.tsx', 'utf8');

// Replace category state with selectedSpecialties
code = code.replace(
  "const [categoryMode, setCategoryMode] = useState<'select' | 'custom'>('select');\n  const [category, setCategory] = useState<string>('Manicure & Pedicure');\n  const [customCategory, setCustomCategory] = useState('');",
  "const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);\n  const [customSpecialty, setCustomSpecialty] = useState('');"
);

// Password
code = code.replace(
  "const [password, setPassword] = useState('');\n  const [showPassword, setShowPassword] = useState(false);",
  "// Password is fixed to 12345 initially\n  const password = '12345';"
);

// Doc change logic
code = code.replace(
  "const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {\n    const raw = e.target.value;\n    const formatted = documentType === 'cpf' ? formatCPF(raw) : formatCNPJ(raw);\n    setDocumentNumber(formatted);\n    if (docError) setDocError(null);\n  };\n\n  const handleDocTypeChange = (type: 'cpf' | 'cnpj') => {\n    setDocumentType(type);\n    setDocumentNumber('');\n    setDocError(null);\n  };",
  "const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {\n    const raw = e.target.value.replace(/\\D/g, '');\n    let formatted = raw;\n    if (raw.length <= 11) {\n      formatted = formatCPF(raw);\n      setDocumentType('cpf');\n    } else {\n      formatted = formatCNPJ(raw);\n      setDocumentType('cnpj');\n    }\n    setDocumentNumber(formatted);\n    if (docError) setDocError(null);\n  };"
);

// Validation
code = code.replace(
  "const finalCategory = (categoryMode === 'custom' ? customCategory : category).trim();\n    if (!finalCategory) {\n      setFormError('A especialidade / categoria profissional é obrigatória.');\n      return;\n    }",
  "const allSpecialties = [...selectedSpecialties];\n    if (customSpecialty.trim()) allSpecialties.push(customSpecialty.trim());\n    if (allSpecialties.length === 0) {\n      setFormError('Selecione ao menos uma especialidade ou digite a sua.');\n      return;\n    }\n    const finalCategory = allSpecialties[0];"
);

// Password validation
code = code.replace(
  "// 6. Validação de Senha\n    if (!password.trim() || password.length < 4) {\n      setFormError('A senha de acesso deve ter no mínimo 4 caracteres.');\n      return;\n    }",
  "// 6. Validação de Senha (auto-generated)"
);

// Save specialties
code = code.replace(
  "category: finalCategory as ProfessionalCategory,",
  "category: finalCategory as ProfessionalCategory,\n        specialties: allSpecialties,"
);

// Render specialties
code = code.replace(
  /{categoryMode === 'select' \? \([\s\S]*?\) : \([\s\S]*?\)}/g,
  `
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {BEAUTY_SPECIALTIES.map((spec) => (
              <label key={spec} className="flex items-start gap-2 cursor-pointer group p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors border border-transparent hover:border-stone-200 dark:hover:border-zinc-700">
                <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    checked={selectedSpecialties.includes(spec)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSpecialties(prev => [...prev, spec]);
                      } else {
                        setSelectedSpecialties(prev => prev.filter(s => s !== spec));
                      }
                      setFormError(null);
                    }}
                    className="peer appearance-none w-4 h-4 border-2 border-stone-300 dark:border-zinc-600 rounded-sm bg-white dark:bg-zinc-900 checked:bg-[#5A5A40] dark:checked:bg-amber-500 checked:border-transparent transition-colors cursor-pointer"
                  />
                  <CheckCheck className="w-3 h-3 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                <span className="text-xs sm:text-sm text-stone-700 dark:text-zinc-300 group-hover:text-stone-900 dark:group-hover:text-zinc-100 transition-colors select-none">
                  {spec}
                </span>
              </label>
            ))}
          </div>
          <input
            type="text"
            value={customSpecialty}
            onChange={(e) => { setCustomSpecialty(e.target.value); setFormError(null); }}
            placeholder="Outra especialidade? Digite aqui..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-zinc-700 bg-[#F8F6F2] dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 text-sm focus:bg-white dark:bg-zinc-900 outline-none"
          />
        </div>`
);

// Remove button for Custom category
code = code.replace(
  /<button[\s\S]*?onClick=\{\(\) => setCategoryMode[\s\S]*?<\/button>/,
  ""
);

// Doc input rendering
code = code.replace(
  /<div className="flex items-center gap-1">[\s\S]*?<\/div>\s*<\/div>\s*<div className="relative">/m,
  "</div>\n          <div className=\"relative\">"
);

// Password field rendering
code = code.replace(
  /\{\/\* 4\. E-mail e Senha \*\/\}([\s\S]*?)<\/div>\s*<\/div>\s*\{\/\* 5\. Chave Pix/m,
  `{/* 4. E-mail */}
      <div>
        <label className="block text-xs font-bold text-[#2D2D2A] dark:text-zinc-200 mb-1">
          E-mail para Login: <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
            <Mail className="w-4 h-4" />
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setFormError(null); }}
            placeholder="exemplo@espaco.com.br"
            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-zinc-700 bg-[#F8F6F2] dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 text-sm focus:bg-white dark:bg-zinc-900 outline-none"
            required
          />
        </div>
      </div>
      
      {/* 5. Chave Pix`
);

// Pix text change
code = code.replace(
  "Chave Pix para Recebimento de Sinal",
  "Chave Pix de Recebimentos"
);

fs.writeFileSync('components/ProfessionalRegisterForm.tsx', code);
