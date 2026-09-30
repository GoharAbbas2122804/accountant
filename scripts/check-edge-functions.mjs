import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = 'supabase/functions';
const failures = [];
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name);
    const stat = fs.statSync(file);
    if (stat.isDirectory()) walk(file);
    else if (name.endsWith('.ts')) {
      const source = fs.readFileSync(file, 'utf8');
      const result = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }, reportDiagnostics: true });
      if (result.diagnostics?.length) failures.push(file);
    }
  }
}
walk(root);
if (failures.length) { console.error(`Edge syntax failed: ${failures.join(', ')}`); process.exit(1); }
console.log('Edge syntax: PASS');
