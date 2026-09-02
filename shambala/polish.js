const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Replace Shambala in API exports
  if (file.includes('api/export') || file.includes('api/backup')) {
    if (content.includes('shambala-')) {
      content = content.replace(/shambala-/g, '${APP_NAME.toLowerCase()}-');
      if (!content.includes('APP_NAME')) {
        content = "import { APP_NAME } from '@/lib/constants';\n" + content;
      }
      changed = true;
    }
  }

  // Replace alert( with toast.error(
  if (content.includes('alert(') && !file.includes('Toast.tsx')) {
    content = content.replace(/alert\(/g, 'toast.error(');
    
    // Add useToast hook
    if (!content.includes('const toast = useToast()')) {
      // Find the component function declaration to insert the hook
      const functionMatch = content.match(/export (?:default )?(?:async )?function [a-zA-Z0-9_]+\([^)]*\)\s*{/);
      if (functionMatch) {
        content = content.replace(functionMatch[0], functionMatch[0] + '\n  const toast = useToast();');
      }
    }

    // Add import
    if (!content.includes('useToast')) {
      const importReactIdx = content.indexOf("import");
      if (importReactIdx !== -1) {
        content = content.replace(/import/, "import { useToast } from '@/components/Toast';\nimport");
      } else {
        content = "import { useToast } from '@/components/Toast';\n" + content;
      }
    }
    changed = true;
  }

  // Replace hardcoded ₹ in forms
  if (content.includes('₹') && !file.includes('constants.ts') && !file.includes('utils.ts') && file.includes('Form.tsx')) {
    content = content.replace(/₹/g, '{CURRENCY}');
    // Need to handle placeholder="₹0.00" string literals which become placeholder={`${CURRENCY}0.00`}
    content = content.replace(/placeholder="\{CURRENCY\}(.*?)"/g, 'placeholder={`\\${CURRENCY}$1`}');
    
    // Add import
    if (!content.includes('CURRENCY')) {
      const importReactIdx = content.indexOf("import");
      if (importReactIdx !== -1) {
        content = content.replace(/import/, "import { CURRENCY } from '@/lib/constants';\nimport");
      } else {
        content = "import { CURRENCY } from '@/lib/constants';\n" + content;
      }
    }
    changed = true;
  }

  // Replace hardcoded ₹ in /money/add and /money/transfer
  if (content.includes('₹') && !file.includes('constants.ts') && !file.includes('utils.ts') && file.includes('app/money/')) {
    content = content.replace(/₹/g, '{CURRENCY}');
    content = content.replace(/placeholder="\{CURRENCY\}(.*?)"/g, 'placeholder={`\\${CURRENCY}$1`}');
    if (!content.includes('CURRENCY')) {
      content = "import { CURRENCY } from '@/lib/constants';\n" + content;
    }
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Updated:', file);
  }
});
