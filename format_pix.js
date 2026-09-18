const fs = require('fs');
let code = fs.readFileSync('lib/validation-utils.ts', 'utf8');

code += `
export function formatPixKey(value: string, type: string): string {
  if (!value) return '';
  switch(type) {
    case 'cpf':
      return formatCPF(value);
    case 'cnpj':
      return formatCNPJ(value);
    case 'telefone':
      return formatPhoneMask(value);
    default:
      return value;
  }
}
`;

fs.writeFileSync('lib/validation-utils.ts', code);
