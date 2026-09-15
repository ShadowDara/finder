# js-to-fling

Ein Source-to-Source-Compiler, der eine **Teilmenge** von TypeScript/JavaScript
nach [Fling](#) übersetzt — der kleinen, dynamisch typisierten Skriptsprache
aus dem beiliegenden Referenz-Sprachdokument. Geschrieben in TypeScript,
Parsing via `@babel/parser` (mit dem TypeScript-Plugin), AST-Traversal via
`@babel/traverse`/`@babel/types`.

> **Warum nur eine Teilmenge?** Fling ist absichtlich sehr klein (siehe Spec
> §10: kein `return`, kein `for`, keine Closures-Syntax außer `fn`, keine
> Klassen, …). Ein *korrekter* Compiler kann daher nicht "alles" aus JS/TS
> übersetzen. Diese Implementierung übersetzt großzügig, was sich **korrekt**
> abbilden lässt, und bricht mit einer **klaren Fehlermeldung** ab, sobald ein
> Konstrukt keine treue Fling-Entsprechung hat — anstatt still falschen Code
> zu erzeugen. Das spiegelt Spec §8: Der Referenzinterpreter selbst scheitert
> bei vielen Fehlern nur "leise" (gibt `Null` zurück) — dieser Compiler tut
> das **nicht**, sondern meldet das Problem beim Kompilieren.

## Installation

```bash
npm install
npm run build
```

(`npm install` benötigt Internetzugriff für `@babel/parser`, `@babel/traverse`,
`@babel/types`, `@types/node`, `typescript`. Der Quellcode ist vollständig —
es fehlen ohne Netzwerkzugriff nur die `node_modules`.)

## Benutzung

```bash
npx ts-node src/cli.ts examples/example1.ts -o examples/example1.fling
# oder nach `npm run build`:
node dist/cli.js input.ts -o output.fling
```

Ausgabe sind **Diagnostics** pro Datei:

- `ERROR` — das Konstrukt kann nicht übersetzt werden; Kompilierung schlägt
  fehl (keine Ausgabedatei).
- `WARNING` — wurde übersetzt, aber das Laufzeitverhalten könnte von JS
  abweichen (z. B. `&&`/`||` ohne Short-Circuit).
- `INFO` — eine automatische, aber bemerkenswerte Umformung (z. B.
  Bezeichner-Umbenennung, `%`-Operanden-Tausch).

Referenzen wie `[B1]`, `[B13]` verweisen auf die Bug-Liste in §9 des
Sprachdokuments.

## Änderungshinweis: `+` auf Strings

> **Update:** Im Referenzinterpreter wurde das ursprüngliche Bug B3
> (`"a" + "b"` → `Null`) gefixt — `String + String` **konkateniert jetzt**
> korrekt. Dieser Compiler geht entsprechend davon aus, dass String+String
> funktioniert, und lässt es zu. Was **nicht** bestätigt ist: gemischtes
> `Number + String`. Da der Compiler keine vollständige Typprüfung durchführt,
> kann er String+String nur erkennen, wenn mindestens ein Operand syntaktisch
> offensichtlich ein String-/Template-Literal ist — bei zwei Variablen, die
> beide zur Laufzeit Strings sind, wird nichts Besonderes angezeigt (das ist
> dann einfach ein normales `+`). Bei einer erkannten Mischung aus String und
> vermutlich-nicht-String gibt der Compiler eine **Warnung** aus, lehnt aber
> nichts mehr grundsätzlich ab.

## Was wird unterstützt?

| JS/TS | Fling | Anmerkung |
|---|---|---|
| `let`/`const x = …;` | `let`/`const x = …;` | mehrere Deklaratoren werden aufgeteilt |
| `var x = …;` | `let x = …;` | Warnung: Hoisting-Semantik geht verloren |
| `function f(a, b) { … }` | `fn f(a, b) { … }` | nur einfache Identifier-Parameter |
| `if/else`, `else if`-Ketten | `if/else`, verschachteltes `else { if … }` | automatische Umwandlung |
| `while (cond) { … }` | `while cond { … }` | |
| `for (init; test; update) { … }` | `init; while test { …; update }` | |
| `do { … } while (test)` | Body einmal + `while` | Body wird dupliziert (siehe unten) |
| `return …;` (einzeln, am Ende) | letzter Ausdruck der Funktion | direkte Fling-Semantik |
| `return …;` (mehrere Pfade / früh) | `result`/Guard-Flag-Muster | siehe [Frühe Returns](#frühe-returns) |
| `cond ? a : b` | `if/else`, **nur** in `let`/`const`-Initialisierung, einfacher Zuweisung oder als eigenständiges Statement | sonst Fehler |
| Arithmetik `+ - * /` | dieselben Operatoren | `+` jetzt auch für String+String (siehe oben) |
| `%` | `%` (Operanden vertauscht!) | kompensiert Bug B1 |
| `== === != !==` | `== !=` | Warnung bei `==`/`!=` (Fling ist typstrikt wie `===`) |
| `< > <= >=` | dieselben | gemischte Vergleichsketten werden geklammert |
| `&& \|\|` | `&& \|\|` | Warnung: kein Short-Circuit (B7); gemischte Ketten werden geklammert |
| `! -` (unär) | `! -` | |
| `++x`/`--x` als Statement oder Wert | `x = x + 1` | Postfix **als Wert** wird abgelehnt |
| `x += 1` usw. | `x = x + 1` usw. | inkl. `%=`-Tausch |
| Arrays `[1, 2, 3]` | dasselbe | kein Spread, keine Lücken |
| Objekte `{ a, b: 1 }` | dasselbe | Keys müssen Identifier sein |
| `arr[i]` | `arr[i]` | Warnung: nur für Arrays verlässlich (B4/B5) |
| `obj.prop` | `obj.prop` | |
| `console.log(...)` | `print(...)` | inkl. Template-Literal-Expansion |
| Template-Literale **nur** als `print`/`console.log`-Argument | mehrere `print`-Argumente | sonst Fehler (kein `${}` außerhalb von `print`) |
| Bezeichner mit `_`/`$`/führender Ziffer | automatisch umbenannt | `my_var` → `myVar`, Keyword-Kollisionen werden aufgelöst |

## Was wird abgelehnt (mit klarer Fehlermeldung)?

- `break`, `continue`, `switch`, `try`/`catch`/`throw`, Klassen, Generatoren,
  `async`/`await`, Module (`import`/`export` mit Re-Exports), Destructuring,
  Spread/Rest, `typeof`/`instanceof`/`in`, Bitoperatoren, `**`,
  Optional-Chaining `?.`, Nullish-Coalescing `??`, Kommaoperator, TS-Enums,
  TS-Namespaces.
- Zuweisung an `obj.x = …` / `arr[0] = …` (Bug B6 — undefined behavior im
  Referenzinterpreter).
- Verkettung `foo().bar` / `foo()[0]` (Bug B13 — der Referenzparser
  unterstützt das nicht).
- Dezimal-Literale wie `3.14` (Bug B2 — der Fling-Lexer kennt keine
  Fließkommaliterale).
- String-Literale, die ein `"` enthalten (Bug B10 — keine Escape-Sequenzen).
- `return` innerhalb einer Schleife (Fling hat kein `break`/frühen Ausstieg).
- Ternary an jeder Stelle außer den drei oben genannten (kein `?:` in Fling).

## Frühe Returns

Fling hat **kein** `return`-Keyword und keinen frühen Ausstieg aus einer
Funktion (Spec §6.5). Der Rückgabewert ist entweder der Wert der letzten
Anweisung, oder — falls dieser `Null` ist — der Wert einer Variable namens
`result`, falls im Funktionsscope vorhanden.

- **Trivialer Fall:** Wenn das einzige `return` die letzte Anweisung der
  Funktion ist, wird es einfach entfernt (`return a + b;` → `a + b`).
- **Mehrere/frühe Returns (Guard Clauses):** Der Compiler führt automatisch
  eine Variable `result` (Fling-Konvention) und intern eine Hilfsvariable
  `flingReturned` ein, um korrektes Kurzschluss-Verhalten nachzubilden — z. B.
  wird
  ```ts
  function classify(x: number): string {
    if (x < 0) { return "negative"; }
    if (x === 0) { return "zero"; }
    return "positive";
  }
  ```
  zu einer verschachtelten `if`/`else`-Kette, die `result` genau einmal auf
  dem tatsächlich erreichten Pfad setzt und alles danach mit
  `if !flingReturned { … }` schützt. Das ist notwendig, weil Fling **nichts**
  hat, das einem `return`/`break` entspricht — jede „Rest des Codes läuft
  trotzdem weiter"-Situation muss explizit mit einer Bedingung abgefangen
  werden.
- **Nicht unterstützt:** `return` innerhalb eines `while`/`for`-Bodies (dafür
  gäbe es kein Fling-Äquivalent, da man aus der Schleife *und* der Funktion
  gleichzeitig aussteigen müsste).

### Reservierte interne Namen

`result` und `flingReturned` werden vom Compiler selbst verwendet, sobald
eine Funktion sie braucht. Deklariert eine Funktion selbst eine Variable mit
einem dieser Namen, bricht die Kompilierung mit einer Fehlermeldung ab
(Umbenennung durch den Nutzer nötig) — der Compiler benennt **fremde**
Bezeichner automatisch um (siehe Tabelle oben), aber nicht diese beiden, da
`result` Teil der offiziellen Fling-Sprachkonvention ist (Spec §6.5) und
`flingReturned` mit dem generierten Code verzahnt ist.

## Bekannte Ungenauigkeiten / Caveats

- **`print`-Spacing:** `print` fügt zwischen allen Argumenten ein Leerzeichen
  ein (Spec §7). Ein expandiertes Template-Literal wie `` `x=${x}` `` wird zu
  `print("x=", x)` und hat dadurch ein zusätzliches Leerzeichen gegenüber dem
  JS-Original — kosmetisch, aber nicht identisch.
- **Computed Member Access (`x[y]`):** wird übersetzt, aber nur bei Arrays mit
  numerischem Index laut Spec zuverlässig (B4/B5). Der Compiler kann das
  statisch nicht immer prüfen und gibt stattdessen eine Warnung aus.
- **`obj.prop` auf Arrays/Strings außer `.length`:** liefert laut Spec still
  `Null` — wird vom Compiler nicht separat erkannt (keine Typinferenz).
- **`+` bei gemischten Typen:** String+String konkateniert (siehe oben);
  Number+String ist nicht bestätigt und kann weiterhin still `Null` ergeben.
  Ohne echte Typprüfung kann der Compiler das nur bei syntaktisch
  offensichtlichen Fällen warnen, nicht generell verhindern.
- **`var`:** wird als `let` kompiliert; Function-Scoping/Hoisting von `var`
  wird nicht nachgebildet.
- **Bare `{ … }`-Blöcke:** werden inline in den umgebenden Scope aufgelöst
  (Fling kennt kein eigenständiges Block-Statement, Spec §10) — meist
  unkritisch, da auch `if`/`else` in Fling nicht scopen (Bug B8).

## Projektstruktur

```
src/
  keywords.ts        Fling-Keywords/Globals
  identifiers.ts      Sanitizing-Regeln für Bezeichner (Spec §2.4)
  diagnostics.ts       Fehler-/Warnungs-Sammlung
  ir.ts                Fling-AST (Ziel-IR)
  emit.ts              Pretty-Printer: IR -> Fling-Quelltext
  walk.ts              generischer AST-Walker (überspringt verschachtelte Funktionen)
  functionReturn.ts     return-Elimination (result/flingReturned-Muster)
  renamePass.ts         Scope-bewusste Bezeichner-Umbenennung
  toFling.ts            Haupt-Konverter: Babel-AST -> Fling-IR
  compile.ts            Orchestrierung: parse -> sanitize -> convert -> emit
  cli.ts                Kommandozeilen-Tool
examples/
  example1.ts           Beispiel, das die meisten Features zeigt
```

## Beispiel

`examples/example1.ts` demonstriert Guard-Clause-Returns, ternäre Ausdrücke,
`for`-zu-`while`-Umwandlung, `%`-Bugkompensation, Template-Literal-Expansion
in `print`, String-Konkatenation und mehr. Diagnostics beim Kompilieren
erklären jede automatische Umformung.
