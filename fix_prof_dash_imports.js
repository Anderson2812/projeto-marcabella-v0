const fs = require('fs');
let code = fs.readFileSync('components/ProfessionalDashboard.tsx', 'utf8');

code = code.replace(
  "cancelBooking,",
  "cancelBooking,\n    updateBookingServices,"
);

code = code.replace(
  "showToast('Serviços atualizados com sucesso!');",
  "alert('Serviços atualizados com sucesso!');"
);

fs.writeFileSync('components/ProfessionalDashboard.tsx', code);
