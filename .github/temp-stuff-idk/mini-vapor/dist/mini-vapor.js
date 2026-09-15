(function (global) {
"use strict";

// ==== src/reactivity.js ====
// reactivity.js
// ---------------------------------------------------------------------------
// Minimales, feingranulares Reaktivitätssystem.
// Kein VDOM, kein Diffing: jede Bindung (Text, Attribut, Liste, ...) hängt
// als eigener "effect" direkt an den Signalen, von denen sie abhängt, und
// aktualisiert bei Änderung *nur* den betroffenen DOM-Knoten.
// ---------------------------------------------------------------------------

let activeEffect = null;
const effectStack = [];

/**
 * Führt fn aus und merkt sich dabei, welche Signale gelesen wurden.
 * Ändert sich später eines dieser Signale, wird fn erneut ausgeführt.
 */
function effect(fn) {
  const runner = () => {
    if (effectStack.includes(runner)) return; // schützt vor direkter Rekursion
    effectStack.push(runner);
    activeEffect = runner;
    try {
      fn();
    } finally {
      effectStack.pop();
      activeEffect = effectStack[effectStack.length - 1] || null;
    }
  };
  runner._isEffect = true;
  runner();
  return runner;
}

/** Ein einzelner reaktiver Wert ("Signal"). */
function ref(initial) {
  let value = initial;
  const subs = new Set();
  return {
    __isRef: true,
    get value() {
      if (activeEffect) subs.add(activeEffect);
      return value;
    },
    set value(next) {
      if (Object.is(next, value)) return;
      value = next;
      [...subs].forEach((fn) => fn());
    },
  };
}

/** Reaktives Objekt: jede Property verhält sich wie ein eigenes ref(). */
function reactive(obj) {
  const subsMap = new Map();
  function subsFor(key) {
    let s = subsMap.get(key);
    if (!s) {
      s = new Set();
      subsMap.set(key, s);
    }
    return s;
  }
  return new Proxy(obj, {
    get(target, key, receiver) {
      if (activeEffect) subsFor(key).add(activeEffect);
      const val = Reflect.get(target, key, receiver);
      return val;
    },
    set(target, key, value, receiver) {
      const old = target[key];
      const ok = Reflect.set(target, key, value, receiver);
      if (!Object.is(old, value)) {
        [...subsFor(key)].forEach((fn) => fn());
      }
      return ok;
    },
  });
}

/** Abgeleiteter, gecachter Wert. */
function computed(getter) {
  const result = ref();
  effect(() => {
    result.value = getter();
  });
  return {
    __isRef: true,
    get value() {
      return result.value;
    },
  };
}

/**
 * Wickelt ein Objekt aus refs so ein, dass man im Template `foo` statt
 * `foo.value` schreiben kann (genau wie Vues <script setup>-Templates).
 */
function proxyRefs(target) {
  return new Proxy(target, {
    get(t, key) {
      if (key === Symbol.iterator || typeof key === 'symbol') return t[key];
      const val = t[key];
      return val && val.__isRef ? val.value : val;
    },
    set(t, key, value) {
      const existing = t[key];
      if (existing && existing.__isRef) {
        existing.value = value;
        return true;
      }
      t[key] = value;
      return true;
    },
    has(t, key) {
      return key in t;
    },
  });
}

/**
 * Erzeugt einen "Kind-Scope" (z.B. für v-for Items), der zuerst in `extra`
 * nachschaut (item, index, ...) und sonst an den Eltern-Scope delegiert.
 */
function childScope(parentCtx, extra) {
  return new Proxy(extra, {
    get(t, key) {
      if (Object.prototype.hasOwnProperty.call(t, key)) {
        const v = t[key];
        return v && v.__isRef ? v.value : v;
      }
      return parentCtx[key];
    },
    set(t, key, value) {
      if (Object.prototype.hasOwnProperty.call(t, key)) {
        const existing = t[key];
        if (existing && existing.__isRef) {
          existing.value = value;
          return true;
        }
        t[key] = value;
        return true;
      }
      parentCtx[key] = value;
      return true;
    },
    has(t, key) {
      return Object.prototype.hasOwnProperty.call(t, key) || key in parentCtx;
    },
  });
}


// ==== src/runtime.js ====
// js
// ---------------------------------------------------------------------------
// Diese Funktionen ruft der VOM COMPILER ERZEUGTE CODE auf. Sie fassen jede
// Operation an "der" einen echten DOM-Node an, den sie betrifft - es gibt
// keinen Baumvergleich, kein Patchen zweier Bäume, kein VDOM.
// ---------------------------------------------------------------------------


function h_createElement(tag) {
  return document.createElement(tag);
}

function h_createText(text = '') {
  return document.createTextNode(text);
}

function h_createAnchor() {
  return document.createComment('');
}

function h_setText(node, value) {
  const str = value == null ? '' : String(value);
  if (node.data !== str) node.data = str;
}

function h_setAttr(el, name, value) {
  if (name === 'class') {
    el.className = value == null ? '' : value;
    return;
  }
  if (name.startsWith('on') && typeof value === 'function') {
    el[name.toLowerCase()] = value;
    return;
  }
  if (value === false || value == null) {
    el.removeAttribute(name);
  } else if (value === true) {
    el.setAttribute(name, '');
  } else {
    el.setAttribute(name, value);
  }
}

function h_on(el, event, handler) {
  el.addEventListener(event, handler);
}

function h_append(parent, child) {
  parent.appendChild(child);
}

function h_insertBefore(parent, child, anchor) {
  parent.insertBefore(child, anchor);
}

function h_remove(node) {
  if (node && node.parentNode) node.parentNode.removeChild(node);
}

function h_effect(fn) {
  return effect(fn);
}

/**
 * Verwaltet einen v-if / v-else-if / v-else Block.
 * `branches` ist eine Liste aus { test, render } (test===null => else-Zweig).
 * Bei jeder Auswertung wird höchstens der aktuell aktive Zweig neu erstellt
 * bzw. entfernt - der Rest des Baums bleibt unangetastet.
 */
function h_if(parent, anchor, branches) {
  let currentNode = null;
  let currentIndex = -1;
  return effect(() => {
    let matchIndex = branches.findIndex((b) => b.test === null || b.test());
    if (matchIndex === currentIndex) return;
    if (currentNode) {
      h_remove(currentNode);
      currentNode = null;
    }
    currentIndex = matchIndex;
    if (matchIndex !== -1) {
      currentNode = branches[matchIndex].render();
      h_insertBefore(parent, currentNode, anchor);
    }
  });
}

/**
 * Verwaltet einen v-for Block mit Keyed-Reconciliation:
 * DOM-Knoten werden zwischen Re-Renders WIEDERVERWENDET, wenn ihr Key
 * erhalten bleibt - nur item/index werden aktualisiert, was wiederum nur
 * die davon abhängigen Bindungen (Text/Attribut) feuert.
 */
function h_for(parent, anchor, itemsGetter, keyFn, renderItem) {
  let prevMap = new Map();
  return effect(() => {
    const items = itemsGetter() || [];
    const newMap = new Map();
    const frag = document.createDocumentFragment();
    items.forEach((item, index) => {
      const key = keyFn(item, index);
      let entry = prevMap.get(key);
      if (!entry) {
        const itemRef = ref(item);
        const indexRef = ref(index);
        const node = renderItem(itemRef, indexRef);
        entry = { node, itemRef, indexRef };
      } else {
        entry.itemRef.value = item;
        entry.indexRef.value = index;
        prevMap.delete(key);
      }
      newMap.set(key, entry);
      frag.appendChild(entry.node);
    });
    prevMap.forEach((entry) => h_remove(entry.node));
    h_insertBefore(parent, frag, anchor);
    prevMap = newMap;
  });
}

function mount(compiled, container, ctx) {
  const el = compiled.render(ctx);
  container.innerHTML = '';
  container.appendChild(el);
  return el;
}


// ==== src/parser.js ====
// parser.js
// ---------------------------------------------------------------------------
// Ein bewusst schlanker Recursive-Descent-Parser für eine Untermenge von
// Vue-Templates: Elemente, statische Attribute, :bind, @event, v-if /
// v-else-if / v-else, v-for, v-model, key sowie {{ interpolation }}.
// ---------------------------------------------------------------------------

const VOID_TAGS = new Set(['br', 'hr', 'img', 'input', 'meta', 'link']);

function parseTemplate(template) {
  let i = 0;
  const n = template.length;

  const isWs = (c) => /\s/.test(c);
  const startsWith = (s) => template.startsWith(s, i);
  const skipWs = () => {
    while (i < n && isWs(template[i])) i++;
  };
  const skipComments = () => {
    while (startsWith('<!--')) {
      const end = template.indexOf('-->', i);
      i = end === -1 ? n : end + 3;
      skipWs();
    }
  };

  function parseChildren() {
    const nodes = [];
    while (i < n) {
      skipComments();
      if (i >= n || startsWith('</')) break;
      if (template[i] === '<') {
        nodes.push(parseElement());
      } else {
        const t = parseText();
        if (t) nodes.push(t);
      }
    }
    return nodes;
  }

  function parseText() {
    const parts = [];
    let buf = '';
    while (i < n && template[i] !== '<') {
      if (startsWith('{{')) {
        if (buf) {
          parts.push({ type: 'static', value: buf });
          buf = '';
        }
        const end = template.indexOf('}}', i + 2);
        const expr = template.slice(i + 2, end === -1 ? n : end).trim();
        parts.push({ type: 'expr', value: expr });
        i = end === -1 ? n : end + 2;
      } else {
        buf += template[i++];
      }
    }
    if (buf) parts.push({ type: 'static', value: buf });
    if (parts.length === 0) return null;
    if (parts.length === 1 && parts[0].type === 'static' && parts[0].value.trim() === '') {
      return null;
    }
    return { type: 'text', parts };
  }

  function parseTagName() {
    const start = i;
    while (i < n && /[a-zA-Z0-9\-]/.test(template[i])) i++;
    return template.slice(start, i);
  }

  function parseAttrName() {
    const start = i;
    while (i < n && /[^\s=/>]/.test(template[i])) i++;
    return template.slice(start, i);
  }

  function parseAttrValue() {
    const quote = template[i];
    if (quote === '"' || quote === "'") {
      i++;
      const start = i;
      while (i < n && template[i] !== quote) i++;
      const value = template.slice(start, i);
      i++;
      return value;
    }
    const start = i;
    while (i < n && !isWs(template[i]) && template[i] !== '>') i++;
    return template.slice(start, i);
  }

  function classifyAttr(name, value, attrs, directives) {
    if (name.startsWith('@')) {
      const [event, ...modifiers] = name.slice(1).split('.');
      directives.push({ type: 'on', event, modifiers, expr: value });
    } else if (name === ':key' || name === 'v-bind:key') {
      // :key ist speziell für v-for-Reconciliation, keine echte Attribut-Bindung
      directives.push({ type: 'key', expr: value });
    } else if (name.startsWith(':')) {
      directives.push({ type: 'bind', name: name.slice(1), expr: value });
    } else if (name === 'v-if') {
      directives.push({ type: 'if', expr: value });
    } else if (name === 'v-else-if') {
      directives.push({ type: 'elseif', expr: value });
    } else if (name === 'v-else') {
      directives.push({ type: 'else' });
    } else if (name === 'v-for') {
      const m = value.match(/^\s*(?:\(([^)]*)\)|([a-zA-Z_$][\w$]*))\s+in\s+(.+)\s*$/);
      if (m) {
        const itemPart = (m[1] || m[2]).split(',').map((s) => s.trim());
        directives.push({
          type: 'for',
          item: itemPart[0],
          index: itemPart[1] || null,
          list: m[3].trim(),
        });
      }
    } else if (name === 'v-model') {
      directives.push({ type: 'model', expr: value });
    } else if (name === 'key') {
      directives.push({ type: 'key', expr: value });
    } else {
      attrs[name] = value;
    }
  }

  function parseAttrs() {
    const attrs = {};
    const directives = [];
    while (true) {
      skipWs();
      if (i >= n || startsWith('/>') || template[i] === '>') break;
      const name = parseAttrName();
      if (!name) break;
      skipWs();
      let value = '';
      if (template[i] === '=') {
        i++;
        skipWs();
        value = parseAttrValue();
      }
      classifyAttr(name, value, attrs, directives);
    }
    return { attrs, directives };
  }

  function parseElement() {
    i++; // '<'
    const tag = parseTagName();
    const { attrs, directives } = parseAttrs();
    let selfClosing = false;
    if (startsWith('/>')) {
      selfClosing = true;
      i += 2;
    } else {
      i++; // '>'
    }
    const node = { type: 'element', tag, attrs, directives, children: [] };
    if (selfClosing || VOID_TAGS.has(tag)) return node;
    node.children = parseChildren();
    if (startsWith(`</${tag}`)) {
      const end = template.indexOf('>', i);
      i = end === -1 ? n : end + 1;
    }
    return node;
  }

  skipWs();
  const roots = parseChildren();
  return roots.length === 1 ? roots[0] : { type: 'fragment', children: roots };
}


// ==== src/codegen.js ====
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

function generate(ast) {
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


// ==== src/compiler.js ====
// compiler.js





/**
 * Kompiliert einen Template-String zu einer JS-Funktion `render(ctx)`,
 * die beim Aufruf einen fertigen, sich selbst aktualisierenden DOM-Baum
 * zurückgibt - ohne jemals eine virtuelle Baumstruktur zu bauen oder zu
 * vergleichen.
 */
function compileTemplate(template) {
  const ast = parseTemplate(template);
  const body = generate(ast);
  const fnSource =
    `return function render(ctx) {\n` + body.replace(/^/gm, '  ') + `\n};`;

  // Alle Runtime-Helfer werden als Funktionsparameter injiziert, damit der
  // generierte Code sie unqualifiziert (h_createElement, h_effect, ...)
  // aufrufen kann.
  const factory = new Function(
    'h_createElement',
    'h_createText',
    'h_createAnchor',
    'h_setText',
    'h_setAttr',
    'h_on',
    'h_append',
    'h_insertBefore',
    'h_remove',
    'h_effect',
    'h_if',
    'h_for',
    'childScope',
    fnSource
  );

  const render = factory(
    h_createElement,
    h_createText,
    h_createAnchor,
    h_setText,
    h_setAttr,
    h_on,
    h_append,
    h_insertBefore,
    h_remove,
    h_effect,
    h_if,
    h_for,
    childScope
  );

  return { render, source: fnSource, ast };
}

/**
 * Definiert eine Komponente aus { template, setup }, ähnlich `<script setup>`.
 * `setup()` liefert refs/Funktionen zurück, die im Template ohne `.value`
 * verwendet werden können.
 */
function defineComponent({ template, setup }) {
  const compiled = compileTemplate(template);
  return {
    mount(container, props = {}) {
      const setupResult = setup ? setup(props) : {};
      const ctx = proxyRefs(setupResult);
      return mount(compiled, container, ctx);
    },
    compiled,
  };
}



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
