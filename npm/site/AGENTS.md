# AGENTS — Pages SSG Plugin + JSX Runtime

Dieses Dokument beschreibt den eigenen Vite-Plugin-Stack in diesem Projekt: das Seiten-Plugin, die JSX-Runtime und den Ablauf, wie aus `.tsx`/`.jsx`-Dateien statische Seiten entstehen.

Ziel:

- versteht, wie Seiten in `pages/` automatisch erkannt werden
- erklärt, wie die JSX-Runtime HTML erzeugt
- zeigt, was man damit praktisch bauen kann
- macht die Verbindung zwischen Page-Route, `window.PAGE_ID` und dem Render-Export klar

---

## 1) Überblick

Das Projekt hat ein eigenes SSG-/Pages-Plugin in:

- `pages-ssg-plugin.ts`
- `src/jsx-runtime.ts`
- `src/main.ts`

Das Plugin scannt Dateien im `pages/`-Ordner, baut daraus eine virtuelle `virtual:pages`-Map und erzeugt dabei per Route eine eigene HTML-Datei.

Wichtig:

- Jede Seite ist normalerweise eine Datei unter `pages/`
- Jede Seite exportiert eine Standardfunktion wie `default function render(el) { ... }`
- Diese Funktion bekommt ein `HTMLDivElement` und schreibt dort den gerenderten Inhalt hinein
- Die erzeugten Inhalte sind keine React-Komponenten, sondern HTML-Strings, die von der eigenen JSX-Runtime gebaut werden

---

## 2) Wie das Plugin funktioniert

### 2.1 Seiten entdecken

Im Plugin `pages-ssg-plugin.ts` läuft die Logik grob so:

1. `scanPages()` liest alle Dateien im `pages/`-Verzeichnis
2. `scanDocs()` liest Markdown-Dateien aus `docs/`
3. `preparePages()` sammelt alle Seiten zu einer Liste
4. `createVirtualModule()` erzeugt eine virtuelle Module-Datei mit einer Map wie:

```ts
export const pages = {
  home: { id: "home", type: "component", load: () => import("/pages/home.tsx"), styles: [...] },
  viewer: { id: "viewer", type: "component", load: () => import("/pages/viewer.tsx"), styles: [...] },
};
```

Das ist wichtig, weil `src/main.ts` nicht manuell jede Seite importiert, sondern genau diese virtuelle Map verwendet.

### 2.2 Route + PAGE_ID

Die generierte HTML-Seite setzt in der Vorlage ein globales Fenster-Flag:

```html
<script>
  window.PAGE_ID = "home";
</script>
```

Dann startet `src/main.ts`:

```ts
const id = window.PAGE_ID;
const page = pages[id];
```

Wenn die Seite gefunden wird, lädt sie dynamisch:

```ts
const module = await page.load();
await module.default(app, page.data);
```

Das heißt: die HTML-Seite selbst ist nur das Shell-HTML; die eigentliche Seite kommt aus der Page-Datei.

---

## 3) Wie JSX-Seiten funktionieren

### 3.1 Die JSX-Factory

Die eigentliche JSX-Erzeugung geschieht in `src/jsx-runtime.ts`:

```ts
export function jsx(tag, props, ...children) { ... }
export function Fragment(props) { ... }
export function raw(value) { ... }
```

Die zentrale Idee ist: Statt React zu verwenden, erzeugt die Funktion direkt ein HTML-Fragment als String.

Beispiel:

```tsx
return (
  <header class="nav">
    <h1>Finder</h1>
    <button>Download</button>
  </header>
);
```

wird intern ungefähr so verarbeitet:

```ts
jsx(
  "header",
  { class: "nav" },
  jsx("h1", null, "Finder"),
  jsx("button", null, "Download"),
);
```

und diese `jsx`-Funktion baut daraus einen String wie:

```html
<header class="nav">
  <h1>Finder</h1>
  <button>Download</button>
</header>
```

### 3.2 Escaping

Die Runtime escaped Text und Attribute automatisch:

- `&` -> `&amp;`
- `<` -> `&lt;`
- `>` -> `&gt;`
- `"` -> `&quot;`
- `'` -> `&#039;`

Damit werden User-Eingaben sicher in HTML gebracht, statt ungefiltert eingefügt zu werden.

Das geschieht in `escapeText()` und `escapeAttribute()`.

### 3.3 Raw HTML

Manchmal will man bewusst echten HTML-Inhalt einbauen, z. B. CSS- oder JS-Code, ohne Escaping. Dafür gibt es:

```ts
export function raw(value: string): HtmlValue;
```

Das ist nützlich für vertrauenswürdigen Inhalt, etwa:

```tsx
<script>{raw(jsCode)}</script>
```

Vorsicht: `raw()` sollte nur für interne, kontrollierte Strings verwendet werden, nicht für beliebige Nutzerdaten.

### 3.4 Boolean-Attribute

Die Runtime behandelt HTML-Boolean-Attribute wie `disabled`, `checked`, `required`, `hidden`, etc. speziell:

```tsx
<input disabled={true} checked={false} />
```

Ergebnis:

```html
<input disabled />
```

Nur wenn der Wert `true` ist, erscheint das Attribut; bei `false` oder `null` fällt es weg.

### 3.5 `Fragment`

Es gibt ein `Fragment`-Konstrukt, damit mehrere Ebenen ohne extra Wrapper zurückgegeben werden können:

```tsx
function App() {
  return (
    <Fragment>
      <Nav />
      <Hero />
      <Footer />
    </Fragment>
  );
}
```

Das erzeugt nur den Inhalt ohne ein zusätzliches HTMLElement.

---

## 4) Typischer Aufbau einer Page-Datei

Ein typisches Beispiel ist `pages/home.tsx`:

```tsx
import { jsx, Fragment } from "../src/jsx-runtime";
import "./home.css";

function Nav() {
  return (
    <header class="nav wrap">
      <div class="logo">finder</div>
      <nav>
        <a href="#docs">Docs</a>
      </nav>
    </header>
  );
}

function App() {
  return (
    <Fragment>
      <Nav />
      <section class="hero">Hallo</section>
    </Fragment>
  );
}

export default function render(el: HTMLDivElement) {
  el.innerHTML = <App />;
}
```

Wichtige Punkte:

- `default export function render(el)` ist das Einstiegspunkt der Seite
- `el.innerHTML` bekommt das HTML-Objekt/den HTML-String
- die Seite kann danach weitere DOM-Events anhängen
- man kann CSS per Import für die Seite laden

---

## 5) Was man damit praktisch bauen kann

Das System ist gut für:

- statische Landingpages
- dokumentationsartige Seiten mit Markdown + inhaltlicher Struktur
- kleine interaktive Frontends ohne React-Setup
- SSG-Seiten mit eigener Route-Struktur
- Seiten, die eine saubere HTML-Ausgabe ohne SPA-Overhead erzeugen

Typische Anwendungsfälle:

### 5.1 Landingpage / Produktseite

```tsx
export default function render(el: HTMLDivElement) {
  el.innerHTML = (
    <main>
      <h1>My Product</h1>
      <button>Start</button>
    </main>
  );
}
```

### 5.2 Dokumentationsseite

Markdown-Dateien in `docs/` werden geparst und als HTML gerendert; die Seite selbst kann ebenfalls weitere UI-Bausteine brauchen.

### 5.3 Interactive UI

Nach dem Rendern kann man Events anhängen:

```tsx
export default function render(el: HTMLDivElement) {
  el.innerHTML = <button class="copy-btn">Copy</button>;

  const button = el.querySelector(".copy-btn");
  button?.addEventListener("click", () => {
    console.log("clicked");
  });
}
```

### 5.4 Seiten mit CSS

```tsx
import "./home.css";
```

Das Plugin sammelt zugehörige Styles und fügt sie beim Rendern oder Build automatisch hinzu.

---

## 6) Der Ablauf beim Rendern

Der komplette Ablauf ist grob:

1. Vite startet und lädt das Plugin
2. Plugin scannt `pages/` und `docs/`
3. `virtual:pages` wird erzeugt
4. `src/main.ts` liest `window.PAGE_ID`
5. `pages[id].load()` importiert die Page-Datei
6. `default`-Export wird ausgeführt
7. Die Page setzt `el.innerHTML` oder manipuliert das DOM
8. die CSS-Dateien der Seite werden über `loadStyles()` eingebunden

---

## 7) CSS-Handling

Die Funktion `loadStyles()` in `src/jsx-runtime.ts` lädt per DOM einen `<link rel="stylesheet">`-Tag für die Seite:

```ts
export function loadStyles(styles: string[]) {
  for (const href of styles) {
    const url = new URL(href, import.meta.url).href;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
    document.head.appendChild(link);
  }
}
```

Damit kann eine Seite ihre eigenen Styles sauber an die Route binden, ohne alles global zu laden.

---

## 8) Build- und SSG-Mechanik

Das Plugin hat zusätzlich einen Build-Pfad:

- `generateBundle()` erzeugt aus jeder Page eine HTML-Datei
- dabei wird ein `script` und ggf. Referenz-CSS in die Ausgabe gesetzt
- das Ergebnis ist eine statische Seite im `dist/`-Ordner

Das ist genau das, was dieses Projekt als statische Website bzw. Dokumentationsseite verwendet.

---

## 9) Wichtige Designprinzipien

### Die JSX-Runtime ist bewusst klein

Sie ist kein komplettes React. Sie ist eine minimale, kontrollierte HTML-Builder-Engine mit:

- `jsx`
- `Fragment`
- `raw`
- `escapeHtml`
- `loadStyles`

### Seiten sind Funktionen, nicht Komponenten-Frameworks

Es gibt keine Hook-API, keinen React-State-Mechanismus und kein Virtual DOM. Der Code erzeugt direkt HTML.

### Das macht das System ideal für SSG

Für Seiten, die vorab gerendert werden, sind diese Eigenschaften sehr praktisch: einfach, schlank, transparent und leicht zu debuggen.

---

## 10) Praktische Regeln für neue Seiten

Wenn du eine neue Seite anlegst, dann gilt in der Regel:

1. Datei in `pages/` anlegen, z. B. `pages/about.tsx`
2. Standard-Export mit `render(el)` definieren
3. mit `jsx`/`Fragment` HTML bauen
4. CSS per Import anlegen, falls nötig
5. intern `el.innerHTML = <App />` verwenden
6. falls man Events braucht, danach per `querySelector()` anbinden

Beispiel:

```tsx
import { jsx, Fragment } from "../src/jsx-runtime";
import "./about.css";

function AboutPage() {
  return (
    <main>
      <h1>About</h1>
      <p>Beschreibung</p>
    </main>
  );
}

export default function render(el: HTMLDivElement) {
  el.innerHTML = <AboutPage />;
}
```

---

## 11) Kurz gesagt

Das Plugin und die JSX-Runtime machen folgendes:

- entdecken Seiten aus Dateien im `pages/`-Ordner
- bilden eine Route/ID pro Seite
- setzen `window.PAGE_ID`
- laden die passende Seite zur Laufzeit
- verwenden eine kleine eigene JSX-Runtime, um HTML direkt zu generieren
- erlauben CSS pro Seite und generieren statische HTML-Ausgaben im Build

Das ist kein React-Projekt, sondern ein bewusst kleines, gezielt auf SSG und einfache HTML-generierende Seiten zugeschnittenes System.

Wenn du neue Seiten baust, denke immer in diesem Muster:

- Page-Datei definieren
- `default render(el)` exportieren
- HTML mit `jsx` und `Fragment` erzeugen
- DOM-Interaktion nach dem Rendern anhängen
- CSS optional per Import einbinden
