Ja — genau. Du willst im Prinzip **Build-Time Data Loading pro Page**, wobei der Code in der Page-Datei Zugriff auf Node-Funktionen wie `fs` hat, Daten verarbeitet und das Ergebnis anschließend **als statische Daten in das Browser-Bundle bzw. die generierte Page** gelangt.

Also etwa:

```tsx
// pages/docs.tsx

import fs from "node:fs";

const markdown = fs.readFileSync("./content/docs.md", "utf8");

const docs = markdown
  .split("\n")
  .filter(Boolean)
  .map((line) => ({
    title: line.trim(),
  }));

export default function Page(el: HTMLElement) {
  // docs soll hier bereits im Bundle vorhanden sein
  el.innerHTML = docs
    .map((doc) => `<h2>${doc.title}</h2>`)
    .join("");
}
```

Du willst **nicht**, dass `fs` im Browser landet.

### Das gewünschte Prinzip

```text
                    BUILD
                      │
                      ▼
              pages/docs.tsx
                      │
              ┌───────┴────────┐
              │ Node.js / Vite │
              │                │
              │ fs.readFile()  │
              │ parse           │
              │ transform       │
              └───────┬────────┘
                      │
                 statische Daten
                      │
                      ▼
              Browser Bundle
                      │
                      ▼
              pages/docs.html
```

Dafür würde ich deine API etwas anders aufbauen.

## Empfohlene API

Zum Beispiel:

```tsx
// pages/docs.tsx

import { readFile } from "node:fs/promises";

export async function load() {
  const markdown = await readFile("./content/docs.md", "utf8");

  return markdown
    .split("\n")
    .filter(Boolean)
    .map((line) => ({
      title: line.trim(),
    }));
}

export default function Page(
  el: HTMLElement,
  data: Awaited<ReturnType<typeof load>>,
) {
  el.innerHTML = data
    .map((doc) => `<h2>${doc.title}</h2>`)
    .join("");
}
```

Der entscheidende Unterschied ist:

```ts
export async function load()
```

ist **Build-Time-Code**.

Während:

```ts
export default function Page(...)
```

**Client-Code** ist.

---

## Noch besser: `definePage`

Du könntest sogar eine API bauen:

```tsx
import { readFile } from "node:fs/promises";
import { definePage } from "virtual:pages";

export default definePage({
  async data() {
    const markdown = await readFile("./content/docs.md", "utf8");

    return {
      docs: markdown
        .split("\n")
        .filter(Boolean)
        .map((title) => ({
          title,
        })),
    };
  },

  render(el, data) {
    el.innerHTML = data.docs
      .map((doc) => `<h2>${doc.title}</h2>`)
      .join("");
  },
});
```

Beim Build macht dein Plugin daraus effektiv:

```ts
const data = await page.data();
```

und generiert dann Client-Code wie:

```js
const data = {
  docs: [
    { title: "Installation" },
    { title: "Configuration" },
    { title: "Deployment" }
  ]
};

render(document.querySelector("#app"), data);
```

Damit ist **`fs`, Parsing usw. komplett aus dem Browser-Bundle verschwunden**.

---

# Das lässt sich mit deinem bestehenden Plugin ziemlich elegant machen

Du hast bereits alle Pages:

```ts
pages: PageEntry[]
```

und kennst deren Source:

```ts
page.source
```

Ich würde deshalb einen **Build-Time-Data-Hook** hinzufügen.

Zum Beispiel:

```ts
export interface PageModule {
  default: (
    el: HTMLElement,
    data?: unknown,
  ) => void | Promise<void>;

  data?: () => unknown | Promise<unknown>;
}
```

Dann muss dein Plugin die Page während des Builds einmal als **Node/Vite-Module** laden.

Das Ergebnis:

```ts
pages/docs.tsx
```

mit:

```ts
import fs from "node:fs";

export async function data() {
  const file = fs.readFileSync("./content/docs.json", "utf8");

  return JSON.parse(file).map((item) => ({
    title: item.name,
  }));
}

export default function render(el, data) {
  // ...
}
```

wird beim Build ungefähr zu:

```js
const data = [
  { title: "Foo" },
  { title: "Bar" }
];

function render(el, data) {
  // ...
}
```

Der Browser sieht **kein `fs` und keinen ursprünglichen Dateizugriff**.

---

## Wichtig: nicht einfach `import()` im normalen Bundle

Das hier wäre falsch:

```ts
const module = await import(page.importPath);
const data = await module.data();
```

wenn dieser Code Teil des normalen Browser-Bundles wird.

Denn dann könnte Rollup versuchen, `fs` bzw. die Node-Abhängigkeiten mitzunehmen.

Du brauchst stattdessen **zwei getrennte Modulwelten**:

```text
Page Source
   │
   ├── Build-Time-Modul
   │      └── Node.js
   │          ├── fs
   │          ├── path
   │          ├── fetch
   │          └── Datenverarbeitung
   │
   └── Client-Modul
          └── Browser
              └── render()
```

Und nur das Ergebnis des ersten Zweigs wird in den zweiten Zweig injiziert.

---

# Für dein Plugin würde ich sogar `data()` + `render()` nehmen

Beispiel:

```tsx
// pages/products.tsx

import { readFile } from "node:fs/promises";

interface Product {
  name: string;
  price: number;
}

export async function data() {
  const json = await readFile("./products.json", "utf8");

  const products: Product[] = JSON.parse(json);

  return products
    .filter((product) => product.price > 10)
    .map((product) => ({
      name: product.name,
      price: product.price.toFixed(2),
    }));
}

export default function render(
  el: HTMLElement,
  products: Awaited<ReturnType<typeof data>>,
) {
  el.innerHTML = products
    .map(
      (product) => `
        <article>
          <h2>${product.name}</h2>
          <span>${product.price} €</span>
        </article>
      `,
    )
    .join("");
}
```

Beim Build:

```text
products.json
     ↓
fs.readFile()
     ↓
JSON.parse()
     ↓
filter()
     ↓
map()
     ↓
────────────────────
statisches JS
────────────────────
     ↓
Browser
     ↓
render(element, DATA)
```

Das ist genau der Use Case, für den sich dein Plugin sehr gut eignet.

**Noch interessanter:** Du kannst dasselbe Ergebnis auch direkt in dein erzeugtes HTML schreiben, sodass die Daten überhaupt nicht mehr als JS-Daten im Bundle liegen müssen. Dann könntest du beispielsweise `renderToString()`/HTML-SSG machen und am Ende bereits fertiges HTML ausgeben. Für dein bestehendes Plugin wäre das wahrscheinlich der nächste sinnvolle Schritt.