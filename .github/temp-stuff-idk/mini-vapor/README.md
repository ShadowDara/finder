# mini-vapor

Ein kleiner Vue-ähnlicher Compiler, dessen **Output keinen Virtual DOM
braucht**. Statt einen virtuellen Baum zu bauen und ihn bei jeder Änderung
mit dem vorherigen zu vergleichen ("Diffing"), erzeugt der Compiler
**imperativen JavaScript-Code**, der die echten DOM-Knoten direkt anlegt und
pro Bindung (Text, Attribut, Liste, Bedingung, ...) genau **einen reaktiven
Effekt** registriert. Ändert sich ein Signal, aktualisiert nur der eine
betroffene Effekt genau den einen betroffenen DOM-Knoten.

Das ist derselbe Grundgedanke wie bei **Vue Vapor Mode**, **Solid.js** oder
**Svelte**: die "Diff-Arbeit" passiert einmalig beim Kompilieren des
Templates, nicht mehr zur Laufzeit bei jedem Update.

## Was macht das hier konkret?

Aus diesem Template:

```html
<div>
  <p>Count: {{ count }}</p>
  <button @click="inc" :disabled="count >= 3">+1</button>
</div>
```

erzeugt der Compiler diesen Code (leicht gekürzt):

```js
function render(ctx) {
  const el0 = h_createElement("div");
  const el1 = h_createElement("p");
  const txt2 = h_createText();
  h_effect(() => { with (ctx) { h_setText(txt2, "Count: " + (count)); } });
  h_append(el1, txt2);
  h_append(el0, el1);

  const el3 = h_createElement("button");
  h_on(el3, "click", function ($event) { with (ctx) { (inc($event)); } });
  h_effect(() => { with (ctx) { h_setAttr(el3, "disabled", (count >= 3)); } });
  h_append(el0, el3);

  return el0;
}
```

Es gibt keinen `vnode`, kein `patch()`, keinen Tree-Diff — nur direkte
DOM-Aufrufe und gezielte `effect()`-Aufrufe.

## Architektur

```
src/
  reactivity.js  – ref(), reactive(), computed(), effect() (Signals)
  parser.js      – Template-String -> AST (Elemente, Direktiven, Text)
  codegen.js     – AST -> imperativer JS-Sourcecode (kein VDOM!)
  runtime.js     – h_createElement, h_setText, h_if, h_for, ... (DOM-Helfer)
  compiler.js    – compileTemplate(), defineComponent() (öffentliche API)
dist/
  mini-vapor.js  – gebündelte Browser-Version (IIFE, window.MiniVapor)
examples/
  demo.html      – Counter + Todo-App zum direkten Öffnen im Browser
```

## Unterstütztes Template-Subset

- `{{ expr }}` Text-Interpolation
- `:attr="expr"` / `v-bind:attr` reaktive Attribut-Bindung
- `@event="handler"` / `@event.enter/.stop/.prevent/.self` Events + Modifier
- `v-if` / `v-else-if` / `v-else`
- `v-for="item in list"` (+ optional `(item, index) in list`) mit
  **Key-basierter Wiederverwendung von DOM-Knoten** (`:key="expr"`)
- `v-model` (einfacher Zwei-Wege-Binding für `<input>`)

## Nutzung

### Im Browser (Bundle)

```html
<script src="dist/mini-vapor.js"></script>
<script>
  const { defineComponent, ref } = MiniVapor;

  const app = defineComponent({
    template: `
      <div>
        <p>{{ count }}</p>
        <button @click="inc">+1</button>
      </div>
    `,
    setup() {
      const count = ref(0);
      return { count, inc: () => count.value++ };
    },
  });

  app.mount(document.getElementById('app'));
</script>
```

Öffne `examples/demo.html` direkt im Browser für eine lauffähige Demo
(Counter + Todo-Liste). Über die Konsole kannst du dir mit
`counterApp.compiled.source` bzw. `todoApp.compiled.source` den erzeugten
Code ansehen.

### Als ES-Module (Node/Bundler)

```js
import { defineComponent, ref } from './src/compiler.js';
```

## Wie funktioniert das "keyed" v-for ohne VDOM?

`h_for()` in `runtime.js` hält eine `Map<key, {node, itemRef, indexRef}>`.
Bei jedem Update:

1. Für jeden Key, der schon existiert, wird nur `itemRef.value` /
   `indexRef.value` aktualisiert — das triggert automatisch nur die
   Effekte, die tatsächlich von diesem Item abhängen (z.B. der Text darin).
2. Für neue Keys wird ein neuer DOM-Knoten erzeugt.
3. Keys, die verschwunden sind, werden entfernt.

Das ist eine **direkte Map-basierte Reconciliation**, kein Baumvergleich
zweier virtueller Bäume.

## Testen

```bash
npm install jsdom --no-save
node test.mjs        # Counter, v-if/else, v-for
node test-todo.mjs    # v-model, Event-Modifier, computed
node test-bundle.mjs  # Browser-Bundle
```

## Grenzen (bewusst, für Lesbarkeit)

Dies ist eine Lern-/Demo-Implementierung, kein Produktionscompiler. Es fehlen
u.a.: Slots, Components-als-Kinder, `<style>`/`<script>`-SFC-Parsing,
statische Hoisting-Optimierungen, komplexere Ausdrucks-Transformationen
(`with` wird zur Auswertung genutzt) und ein echter Tokenizer/Fehlerhandling
für ungültiges Markup.
