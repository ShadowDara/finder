// compiler.js
import { parseTemplate } from './parser.js';
import { generate } from './codegen.js';
import * as runtime from './runtime.js';
import { effect, ref, reactive, computed, proxyRefs, childScope } from './reactivity.js';

/**
 * Kompiliert einen Template-String zu einer JS-Funktion `render(ctx)`,
 * die beim Aufruf einen fertigen, sich selbst aktualisierenden DOM-Baum
 * zurückgibt - ohne jemals eine virtuelle Baumstruktur zu bauen oder zu
 * vergleichen.
 */
export function compileTemplate(template) {
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
    runtime.h_createElement,
    runtime.h_createText,
    runtime.h_createAnchor,
    runtime.h_setText,
    runtime.h_setAttr,
    runtime.h_on,
    runtime.h_append,
    runtime.h_insertBefore,
    runtime.h_remove,
    runtime.h_effect,
    runtime.h_if,
    runtime.h_for,
    childScope
  );

  return { render, source: fnSource, ast };
}

/**
 * Definiert eine Komponente aus { template, setup }, ähnlich `<script setup>`.
 * `setup()` liefert refs/Funktionen zurück, die im Template ohne `.value`
 * verwendet werden können.
 */
export function defineComponent({ template, setup }) {
  const compiled = compileTemplate(template);
  return {
    mount(container, props = {}) {
      const setupResult = setup ? setup(props) : {};
      const ctx = proxyRefs(setupResult);
      return runtime.mount(compiled, container, ctx);
    },
    compiled,
  };
}

export { ref, reactive, computed, effect };
