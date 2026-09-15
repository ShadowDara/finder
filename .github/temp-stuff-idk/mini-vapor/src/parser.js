// parser.js
// ---------------------------------------------------------------------------
// Ein bewusst schlanker Recursive-Descent-Parser für eine Untermenge von
// Vue-Templates: Elemente, statische Attribute, :bind, @event, v-if /
// v-else-if / v-else, v-for, v-model, key sowie {{ interpolation }}.
// ---------------------------------------------------------------------------

const VOID_TAGS = new Set(['br', 'hr', 'img', 'input', 'meta', 'link']);

export function parseTemplate(template) {
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
