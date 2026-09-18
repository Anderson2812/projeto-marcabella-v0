const fs = require('fs');
let code = fs.readFileSync('app/painel/page.tsx', 'utf8');

code = code.replace(
  "import AdminAuthGuard from '@/components/AdminAuthGuard';",
  "import AdminAuthGuard from '@/components/AdminAuthGuard';\nimport { Suspense } from 'react';"
);

code = code.replace(
  /<AdminAuthGuard>[\s\S]*?<\/AdminAuthGuard>/,
  "<Suspense fallback={<div className=\"p-8 text-center\">Carregando...</div>}>\n        <AdminAuthGuard>\n          <ProfessionalDashboard />\n        </AdminAuthGuard>\n      </Suspense>"
);

fs.writeFileSync('app/painel/page.tsx', code);
