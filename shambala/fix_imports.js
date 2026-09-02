const fs = require('fs');

const files = [
  './src/app/api/backup/route.ts',
  './src/app/api/export/route.ts',
  './src/app/food/add/FoodForm.tsx',
  './src/app/labour/add/LabourForm.tsx',
  './src/app/machinery/add/MachineryForm.tsx',
  './src/app/materials/add/MaterialsForm.tsx',
  './src/app/money/add/MoneyInForm.tsx',
  './src/app/money/transfer/page.tsx',
  './src/app/more/categories/page.tsx',
  './src/app/salary/add/SalaryForm.tsx',
  './src/app/transport/add/TransportForm.tsx',
  './src/components/DeletePartyButton.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Add APP_NAME import if missing
  if (content.includes('APP_NAME') && !content.includes("import { APP_NAME")) {
    content = "import { APP_NAME } from '@/lib/constants';\n" + content;
    changed = true;
  }

  // Add useToast import if missing
  if (content.includes('useToast') && !content.includes("import { useToast")) {
    content = "import { useToast } from '@/components/Toast';\n" + content;
    changed = true;
  }

  // Add CURRENCY import if missing
  if (content.includes('CURRENCY') && !content.includes("import { CURRENCY")) {
    content = "import { CURRENCY } from '@/lib/constants';\n" + content;
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Fixed imports:', file);
  }
});
