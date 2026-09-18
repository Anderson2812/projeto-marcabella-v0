const fs = require('fs');
let code = fs.readFileSync('components/RemindersManager.tsx', 'utf8');

// Remove handleMarkSelectedAsSent
code = code.replace(
  /\/\/ Marcar selecionados como enviados sem abrir whatsapp[\s\S]*?showToast[^\n]*\n  \};\n/g,
  ""
);

// Remove the button "Marcar como Enviados"
code = code.replace(
  /<button\s+onClick=\{handleMarkSelectedAsSent\}[\s\S]*?Marcar como Enviados\s*<\/button>/,
  ""
);

// Remove the individual toggle for sent status
code = code.replace(
  /\{\/\* Botão secundário de marcar apenas \*\/\}([\s\S]*?<\/button>)/,
  "{/* Botão secundário removido a pedido do usuário */}"
);

// Remove the remaining code related to custom template if they exist
code = code.replace(
  /\{selectedVariation === 'custom' && \([\s\S]*?<\/div>\s*\)\}/,
  "{/* Opção de texto customizado removida */}"
);

fs.writeFileSync('components/RemindersManager.tsx', code);
