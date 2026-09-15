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
export function effect(fn) {
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
export function ref(initial) {
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
export function reactive(obj) {
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
export function computed(getter) {
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
export function proxyRefs(target) {
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
export function childScope(parentCtx, extra) {
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
