// runtime.js
// ---------------------------------------------------------------------------
// Diese Funktionen ruft der VOM COMPILER ERZEUGTE CODE auf. Sie fassen jede
// Operation an "der" einen echten DOM-Node an, den sie betrifft - es gibt
// keinen Baumvergleich, kein Patchen zweier Bäume, kein VDOM.
// ---------------------------------------------------------------------------
import { effect, ref } from './reactivity.js';

export function h_createElement(tag) {
  return document.createElement(tag);
}

export function h_createText(text = '') {
  return document.createTextNode(text);
}

export function h_createAnchor() {
  return document.createComment('');
}

export function h_setText(node, value) {
  const str = value == null ? '' : String(value);
  if (node.data !== str) node.data = str;
}

export function h_setAttr(el, name, value) {
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

export function h_on(el, event, handler) {
  el.addEventListener(event, handler);
}

export function h_append(parent, child) {
  parent.appendChild(child);
}

export function h_insertBefore(parent, child, anchor) {
  parent.insertBefore(child, anchor);
}

export function h_remove(node) {
  if (node && node.parentNode) node.parentNode.removeChild(node);
}

export function h_effect(fn) {
  return effect(fn);
}

/**
 * Verwaltet einen v-if / v-else-if / v-else Block.
 * `branches` ist eine Liste aus { test, render } (test===null => else-Zweig).
 * Bei jeder Auswertung wird höchstens der aktuell aktive Zweig neu erstellt
 * bzw. entfernt - der Rest des Baums bleibt unangetastet.
 */
export function h_if(parent, anchor, branches) {
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
export function h_for(parent, anchor, itemsGetter, keyFn, renderItem) {
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

export function mount(compiled, container, ctx) {
  const el = compiled.render(ctx);
  container.innerHTML = '';
  container.appendChild(el);
  return el;
}
