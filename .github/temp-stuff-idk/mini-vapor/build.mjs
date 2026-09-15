import fs from 'fs';

const files = ['src/reactivity.js', 'src/runtime.js', 'src/parser.js', 'src/codegen.js', 'src/compiler.js'];

let out = '';
for (const f of files) {
  let code = fs.readFileSync(f, 'utf8');
  // import-Zeilen entfernen
  code = code.replace(/^import .*$/gm, '');
  // "export function X" -> "function X" (Deklaration bleibt lokal im IIFE-Scope)
  code = code.replace(/^export function /gm, 'function ');
  // "export { a, b, c };" am Dateiende entfernen (compiler.js hat sowas)
  code = code.replace(/^export \{[^}]*\};?\s*$/gm, '');
  // Namespace-Import "runtime.xyz" -> "xyz" (compiler.js nutzt import * as runtime)
  code = code.replace(/\bruntime\./g, '');
  out += `\n// ==== ${f} ====\n` + code + '\n';
}

const bundle = `(function (global) {
"use strict";
${out}
global.MiniVapor = {
  compileTemplate,
  defineComponent,
  ref,
  reactive,
  computed,
  effect,
  proxyRefs,
  childScope,
};
})(typeof window !== 'undefined' ? window : globalThis);
`;

fs.writeFileSync('dist/mini-vapor.js', bundle);
console.log('Bundle geschrieben:', bundle.length, 'Zeichen');
