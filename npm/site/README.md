# finder template builder

A small Vite + TypeScript app for visually building the `Folder` JSON
templates your `structure` package reads (`LoadJSON5`) — add folders and
files, set `existence` (`required` / `forbidden` / `optional`), tags, a
post-match `command` (+ `invert_command`), and a `min_version`, then export
or copy the resulting JSON.

It also has an **Import** button so you can paste an existing template and
edit it, and it understands the legacy `"files": ["a.txt", "b.txt"]` string
format alongside the newer `[{ "name": ..., "existence": ... }]` format.

**Output is normalized**: a field is only written when it deviates from its
default, so `description`, `command`, `tags`, `folders`, `files`,
`invert_command`, `min_version`, and `size` are all omitted when they're
still at their default (`""`, `false`, `[]`, unset, etc.), and a file's
`existence` is omitted when it's `"required"`. Only `name` is always
present. This keeps exported templates small — a plain file with no
constraints serializes to just `{ "name": "..." }`.

## Run it

```bash
npm install
npm run dev
```

Then open the printed local URL. `npm run build` produces a static
`dist/` folder you can host anywhere (or just open `dist/index.html`
locally).

## One assumption worth checking

Your `Folder`/`File` structs reference a `Size` type (`DataSize Size`,
`NewSize()`) that wasn't in the snippet you shared, so it's modeled here as:

```json
{ "min": 1024, "max": 2048 }
```

If your real `Size` struct uses different field names or units, update
`SizeConstraint` in `src/types.ts` and the two spots in `src/state.ts` that
read/write `size.min` / `size.max` — everything else (the tree UI, the size
toggle in the inspector) will keep working unchanged.

## A couple of other things I noticed in the Go snippet

- `MinVersion`'s json tag is missing its closing quote:
  `` `json:"min_version,omitempty` `` — it'll still compile, but
  `encoding/json` will likely treat the whole malformed tag as no tag at all
  and fall back to matching the field name case-insensitively, rather than
  actually applying `omitempty`.
- `Command`, `InvertCommand`, and `Tags` use bare `json:invert_command`
  instead of `` json:"invert_command" `` (missing quotes) — same risk there.

Not something the generator needed to fix, but worth a glance since they'd
affect how the JSON this tool produces gets decoded on the Go side.

## Project layout

```
src/
  types.ts    Folder/File/Size shapes (editor state + the plain JSON shape)
  state.ts    node creation, tree mutation, serialize <-> parse
  main.ts     DOM rendering: tree, inspector form, live JSON preview
  style.css
```

No UI framework — plain TypeScript re-rendering the tree/inspector/preview
on each edit, which is plenty fast at template-sized trees.
