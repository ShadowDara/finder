// codegen.js
// ---------------------------------------------------------------------------
// Übersetzt den AST in einen JS-Funktionsrumpf, der beim Ausführen direkt
// echte DOM-Knoten anlegt und pro Bindung genau einen "effect" registriert.
// Es entsteht zu keinem Zeitpunkt eine Baum-Zwischenrepräsentation, die
// verglichen ("diff") werden müsste - das ist der Kernunterschied zu VDOM-
// basierten Renderern.
// ---------------------------------------------------------------------------

let uid = 0;
const nextId = (prefix) => `${prefix}${uid++}`;

export function generate(ast) {
  uid = 0;
  const lines = [];
  const rootVar = genNode(ast, 'ctx', lines, 'root');
  lines.push(`return ${rootVar};`);
  return lines.join('\n');
}

// Erzeugt Code für einen einzelnen AST-Knoten, hängt Statements an `lines`
// an und gibt den Namen der Variable zurück, die den erzeugten DOM-Knoten hält.
// Verlinkt Geschwister-Knoten (nextSibling), damit v-else-if/v-else ihren
// zugehörigen v-if-Block im Array wiederfinden können.
function linkSiblings(children) {
  for (let idx = 0; idx < children.length; idx++) {
    children[idx]._nextSibling = children[idx + 1] || null;
  }
}

function genNode(node, ctxVar, lines, parentVar) {
  if (node.type === 'fragment') {
    const frag = nextId('frag');
    lines.push(`const ${frag} = document.createDocumentFragment();`);
    linkSiblings(node.children);
    for (const child of node.children) {
      if (child._consumed) continue;
      genChildInto(child, ctxVar, lines, frag);
    }
    return frag;
  }
  if (node.type === 'element') {
    return genElement(node, ctxVar, lines);
  }
  if (node.type === 'text') {
    return genText(node, ctxVar, lines);
  }
  throw new Error('Unbekannter Knotentyp: ' + node.type);
}

// Rendert `child` und hängt ihn (ggf. reaktiv, bei v-if/v-for) in `containerVar` ein.
function genChildInto(child, ctxVar, lines, containerVar) {
  if (child.type === 'element') {
    const ifDir = child.directives.find((d) => d.type === 'if');
    const forDir = child.directives.find((d) => d.type === 'for');
    if (forDir) {
      genFor(child, forDir, ctxVar, lines, containerVar);
      return;
    }
    if (ifDir) {
      genIfChain(child, ctxVar, lines, containerVar);
      return;
    }
    const v = genElement(child, ctxVar, lines);
    lines.push(`h_append(${containerVar}, ${v});`);
    return;
  }
  if (child.type === 'text') {
    const v = genText(child, ctxVar, lines);
    lines.push(`h_append(${containerVar}, ${v});`);
    return;
  }
}

function genText(node, ctxVar, lines) {
  const varName = nextId('txt');
  const isDynamic = node.parts.some((p) => p.type === 'expr');
  lines.push(`const ${varName} = h_createText();`);
  if (!isDynamic) {
    const initial = node.parts.map((p) => p.value).join('');
    lines.push(`h_setText(${varName}, ${JSON.stringify(initial)});`);
    return varName;
  }
  const exprCode = node.parts
    .map((p) => (p.type === 'static' ? JSON.stringify(p.value) : `(${p.value})`))
    .join(' + ');
  lines.push(
    `h_effect(() => { with (${ctxVar}) { h_setText(${varName}, ${exprCode}); } });`
  );
  return varName;
}

function genElement(node, ctxVar, lines) {
  const varName = nextId('el');
  lines.push(`const ${varName} = h_createElement(${JSON.stringify(node.tag)});`);

  // statische Attribute
  for (const [name, value] of Object.entries(node.attrs)) {
    lines.push(`h_setAttr(${varName}, ${JSON.stringify(name)}, ${JSON.stringify(value)});`);
  }

  for (const dir of node.directives) {
    if (dir.type === 'bind') {
      lines.push(
        `h_effect(() => { with (${ctxVar}) { h_setAttr(${varName}, ${JSON.stringify(
          dir.name
        )}, (${dir.expr})); } });`
      );
    } else if (dir.type === 'on') {
      // Ein bloßer Methodenname ("@click=\"inc\"") wird - wie in Vue - als
      // Aufruf mit dem Event als Argument interpretiert; alles andere wird
      // als Statement ausgeführt (z.B. "@click=\"count++\"" oder "inc($event)").
      const isBareIdentifier = /^[a-zA-Z_$][\w$]*$/.test(dir.expr.trim());
      const invocation = isBareIdentifier ? `${dir.expr}($event)` : dir.expr;
      const KEY_MODIFIERS = { enter: 'Enter', esc: 'Escape', escape: 'Escape', tab: 'Tab', space: ' ' };
      const guardLines = [];
      for (const mod of dir.modifiers || []) {
        if (mod === 'stop') guardLines.push('$event.stopPropagation();');
        else if (mod === 'prevent') guardLines.push('$event.preventDefault();');
        else if (mod === 'self') guardLines.push('if ($event.target !== $event.currentTarget) return;');
        else if (KEY_MODIFIERS[mod]) guardLines.push(`if ($event.key !== ${JSON.stringify(KEY_MODIFIERS[mod])}) return;`);
      }
      const guardCode = guardLines.length ? guardLines.join(' ') + ' ' : '';
      lines.push(
        `h_on(${varName}, ${JSON.stringify(dir.event)}, function ($event) { ${guardCode}with (${ctxVar}) { (${invocation}); } });`
      );
    } else if (dir.type === 'model') {
      // einfaches v-model für <input>: liest/schreibt .value
      lines.push(
        `h_effect(() => { with (${ctxVar}) { ${varName}.value = (${dir.expr}); } });`
      );
      lines.push(
        `h_on(${varName}, 'input', function ($event) { with (${ctxVar}) { (${dir.expr} = $event.target.value); } });`
      );
    }
    // 'if' / 'elseif' / 'else' / 'for' / 'key' werden bereits von genChildInto behandelt
  }

  // Kinder direkt anhängen (Kinder mit eigenem v-if/v-for kümmern sich selbst darum)
  linkSiblings(node.children);
  for (const child of node.children) {
    if (child._consumed) continue;
    genChildInto(child, ctxVar, lines, varName);
  }

  return varName;
}

// v-if / v-else-if / v-else: sammelt die zusammenhängende Geschwister-Kette
// und übergibt sie als eine Liste von Branches an die Runtime (h_if), die
// jeweils NUR den aktiven Zweig erstellt/entfernt.
function genIfChain(startNode, ctxVar, lines, containerVar) {
  // Diese Funktion wird nur beim ersten Knoten der Kette aufgerufen; die
  // nachfolgenden else-if/else Geschwister werden hier "verbraucht", indem
  // sie in startNode._consumed markiert werden (siehe genFragmentChildren).
  const anchor = nextId('anchor');
  lines.push(`const ${anchor} = h_createAnchor();`);
  lines.push(`h_append(${containerVar}, ${anchor});`);

  const branches = [{ node: startNode, kind: 'if' }];
  let sibling = startNode._nextSibling;
  while (sibling && (sibling.type === 'element') &&
    sibling.directives.some((d) => d.type === 'elseif' || d.type === 'else')) {
    const kind = sibling.directives.some((d) => d.type === 'else') ? 'else' : 'elseif';
    branches.push({ node: sibling, kind });
    sibling._consumed = true;
    sibling = sibling._nextSibling;
  }

  const branchExprs = branches.map((b) => {
    const branchLines = [];
    // Klon ohne die if/elseif/else-Direktive, damit genElement sie nicht erneut verarbeitet
    const cloned = { ...b.node, directives: b.node.directives.filter((d) => !['if', 'elseif', 'else'].includes(d.type)) };
    const v = genElement(cloned, ctxVar, branchLines);
    const body = branchLines.map((l) => '        ' + l).join('\n');
    let test = 'null';
    if (b.kind === 'if') test = `() => { with (${ctxVar}) { return !!(${b.node.directives.find((d) => d.type === 'if').expr}); } }`;
    if (b.kind === 'elseif') test = `() => { with (${ctxVar}) { return !!(${b.node.directives.find((d) => d.type === 'elseif').expr}); } }`;
    return `      {\n        test: ${test},\n        render: () => {\n${body}\n          return ${v};\n        }\n      }`;
  });

  lines.push(`h_if(${containerVar}, ${anchor}, [\n${branchExprs.join(',\n')}\n    ]);`);
}

// v-for: erzeugt eine Item-Render-Funktion mit eigenem Kind-Scope (childScope)
// und übergibt sie an die Runtime (h_for), die per Key wiederverwendet.
function genFor(node, forDir, ctxVar, lines, containerVar) {
  const anchor = nextId('anchor');
  lines.push(`const ${anchor} = h_createAnchor();`);
  lines.push(`h_append(${containerVar}, ${anchor});`);

  const itemCtx = nextId('itemCtx');
  const itemRefName = nextId('itemRef');
  const idxRefName = nextId('idxRef');
  const keyDir = node.directives.find((d) => d.type === 'key');

  const cloned = {
    ...node,
    directives: node.directives.filter((d) => !['for', 'key'].includes(d.type)),
  };

  // --- Item-Render-Funktion: bekommt itemRef/indexRef, baut eigenen Scope ---
  const itemLines = [];
  const scopeEntries = [`${JSON.stringify(forDir.item)}: ${itemRefName}`];
  if (forDir.index) scopeEntries.push(`${JSON.stringify(forDir.index)}: ${idxRefName}`);
  itemLines.push(`const ${itemCtx} = childScope(${ctxVar}, { ${scopeEntries.join(', ')} });`);
  const v = genElement(cloned, itemCtx, itemLines);
  itemLines.push(`return ${v};`);
  const renderItemBody = itemLines.map((l) => '      ' + l).join('\n');

  // --- Key-Funktion: bekommt rohe (item, index) Werte, nutzt denselben Scope-Mechanismus ---
  const keyScopeEntries = [`${JSON.stringify(forDir.item)}: __item`];
  if (forDir.index) keyScopeEntries.push(`${JSON.stringify(forDir.index)}: __idx`);
  const keyExpr = keyDir ? keyDir.expr : '__idx';
  const keyFnCode =
    `(__item, __idx) => { ` +
    `const __s = childScope(${ctxVar}, { ${keyScopeEntries.join(', ')} }); ` +
    `with (__s) { return (${keyExpr}); } }`;

  const itemsGetterCode =
    `() => { let __r; with (${ctxVar}) { __r = (${forDir.list}); } return __r; }`;

  lines.push(
    `h_for(${containerVar}, ${anchor}, ${itemsGetterCode}, ${keyFnCode}, (${itemRefName}, ${idxRefName}) => {\n${renderItemBody}\n    });`
  );
}
