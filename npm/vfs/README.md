# virtual-fs

Ein leichtgewichtiges, komplett im Speicher laufendes virtuelles Dateisystem in TypeScript — gedacht als Datenmodell für einen Web-basierten Datei-Editor (Dateibaum, Tabs, etc.).

## Features

- Ordner & Dateien mit `id`, `name`, Timestamps
- Pfad-basierte API (`/src/index.ts`), inkl. `mkdir -p`-artiger `recursive`-Option
- CRUD: `createFolder`, `createFile`, `readFile`, `writeFile`, `delete`, `rename`, `move`, `copy`
- Baum-Export (`getTree`) für z.B. eine Sidebar-Komponente
- Volltextsuche über Dateinamen (`find`)
- Event-System (`vfs.on(...)`) für reaktive UIs
- **ZIP-Import/-Export** (`importFromZip` / `exportToZip`) via [`fflate`](https://github.com/101arrowz/fflate)
- JSON-Serialisierung (`toJSON` / `fromJSON`) für Persistenz z.B. in `localStorage`

## Installation

```bash
npm install
npm run build
```

## Beispiele

```ts
import { VirtualFileSystem } from 'virtual-fs';

const vfs = new VirtualFileSystem();

// Ordner & Dateien anlegen
vfs.createFolder('/src/components', { recursive: true });
vfs.createFile('/src/index.ts', 'console.log("hello")');
vfs.createFile('/src/components/Button.tsx', 'export const Button = () => null;');

// Lesen / Schreiben
vfs.readFile('/src/index.ts', 'text'); // -> string
vfs.writeFile('/src/index.ts', 'console.log("updated")');

// Umbenennen / Verschieben / Kopieren
vfs.rename('/src/index.ts', 'main.ts');
vfs.move('/src/main.ts', '/main.ts');
vfs.copy('/src/components', '/src/components-backup');

// Baum für UI (z.B. Sidebar-Tree)
const tree = vfs.getTree('/');

// Auf Änderungen reagieren (z.B. um den Editor-State zu aktualisieren)
const unsubscribe = vfs.on((event) => {
  console.log(event.type, event.path);
});

// Suche
vfs.find('Button'); // -> passende Knoten

// --- ZIP ---

// Export als ZIP (z.B. zum Download-Button im Editor)
const zipBytes = vfs.exportToZip('/'); // Uint8Array

// Import aus ZIP (z.B. Drag & Drop einer .zip-Datei)
const vfs2 = new VirtualFileSystem();
vfs2.importFromZip(zipBytes, { targetPath: '/', overwrite: true });
```

### Im Browser: ZIP-Datei per `<input type="file">` importieren

```ts
fileInput.addEventListener('change', async () => {
  const file = fileInput.files![0];
  const buffer = await file.arrayBuffer();
  vfs.importFromZip(buffer);
});
```

### ZIP-Export als Download anbieten

```ts
const zipBytes = vfs.exportToZip('/');
const blob = new Blob([zipBytes], { type: 'application/zip' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'projekt.zip';
a.click();
URL.revokeObjectURL(url);
```

## API-Übersicht

| Methode | Beschreibung |
|---|---|
| `createFolder(path, { recursive })` | Ordner anlegen |
| `createFile(path, content, { mimeType, overwrite, recursive })` | Datei anlegen |
| `readFile(path, 'text' \| 'binary')` | Dateiinhalt lesen |
| `writeFile(path, content, { create, mimeType })` | Datei schreiben/erstellen |
| `list(path)` | Direkte Kind-Knoten eines Ordners |
| `getTree(path)` | Rekursive Baumstruktur (JSON-freundlich) |
| `exists` / `isFile` / `isFolder` / `stat` | Existenz- und Typ-Checks |
| `rename(path, newName)` | Umbenennen |
| `move(sourcePath, destinationPath)` | Verschieben/Umbenennen |
| `copy(sourcePath, destinationPath)` | Tiefes Kopieren |
| `delete(path)` | Löschen (inkl. Unterbaum) |
| `find(query, path?)` | Suche nach Namen (String oder RegExp) |
| `exportToZip(path?)` | Export als ZIP (`Uint8Array`) |
| `importFromZip(data, { targetPath, overwrite })` | Import aus ZIP-Daten |
| `toJSON()` / `VirtualFileSystem.fromJSON(data)` | Persistenz außerhalb von ZIP |
| `on(listener)` | Auf Änderungen abonnieren |

## Projektstruktur

```
src/
  types.ts    Typdefinitionen
  errors.ts   Fehlerklassen
  vfs.ts      Kernklasse VirtualFileSystem
  index.ts    Barrel-Export
```
