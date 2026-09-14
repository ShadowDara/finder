# CHANGELOG

_The whole finder CHANGELOG_

## Newest

- added Author field to finder templates
- added a subcommand to validate templates

## 0.3.17 - 13.09.2026

- added regex support
- added mcapp minecraft world dashboard
- fixed buildcheck workflow
- added markdown notes to the templates which can be viewed in the web UI
- added command to view count of locations which where found
- added option to view the cache size
- updated the regex creator
- fixed a bug in the argparser lib where global flag where not found in subcommands

<details><summary>Commits</summary>

- _[8e63902](https://github.com/shadowdara/finder/tree/8e6390298c29bfeb6984a7e40190cb6eaa6d3350)_ Update frontend assets, templates & deps
  Regenerate frontend/site assets and metadata: update cmd/findergen frontend main_entry.js (changelog/docs/markdown additions), bump lightningcss to 1.33 in dependency lists, and refresh generated site stats (npm/site/data/backend.json and gh-pages.json). Also update templates index (npm/site/src/templates.js) to add min_version/tags for many templates. These changes reflect a site build and template metadata refresh.

- _[40751f1](https://github.com/shadowdara/finder/tree/40751f1a279c1c22be7b342ca3a7d66d86d5313b)_ Add min_version, tags and mdnote to templates
  Add "min_version": "0.3.17" across many templates (templates/ and internal/templates/), add tags to several templates (examples: mistral → ai; next/nuxt/remix/redwood/react-native → web; quarkus → java; quart → python; rethinkdb → docker), and perform minor JSON5 formatting cleanups. Update AGENTS.md and npm/site/data/agents.md to document the new mdnote field for templates. These changes document and enable the newer Finder features while improving template metadata for discovery.

- _[2a26856](https://github.com/shadowdara/finder/tree/2a2685670c78253e5a932583e800e0c9a2a2d960)_ Update package-lock.json

- _[0ccc718](https://github.com/shadowdara/finder/tree/0ccc718573804ae15ce455fa0b7a8769cd57e61f)_ Update check.py

- _[0191e23](https://github.com/shadowdara/finder/tree/0191e2303a83e2680689870dfbdd4e0209b9ca27)_ Update finder templates to v0.3.17
  This change bumps the project to finder-lib 0.3.17 and updates template metadata across the built-in template catalog, adding tags and min_version fields for many templates. It also moves the syntax highlighter to the shared finder-lib package, refreshes the creator preview styling, and fixes template parsing/size field compatibility with the new schema.

The diff also includes git parser cleanup and compatibility updates in the Go scanner code, plus dependency and generated site data refreshes that match the new library version.

- _[86252b8](https://github.com/shadowdara/finder/tree/86252b87e6fb905fc15e2e6c4f17203d9503f52b)_ Add markdown notes and regex tooling
  This change adds markdown note support to templates and exposes it in the template viewer/editor, plus several creator and regex builder improvements. It also updates the default Finder server port to 13420, expands installer script support for latest-version resolution, and refreshes the docs/site assets and config schema to match the newer template and UI behavior.

- _[7927ca0](https://github.com/shadowdara/finder/tree/7927ca03ae8143c80d4c6e01acbfc4353a4b927b)_ Add Monaco editor and template view updates
  This commit adds a Monaco-based JSON editor to the dashboard template form, prevents empty template content from being saved, and updates template rendering to support optional close controls and markdown notes. It also wires the new editor dependency into the app and lockfiles.

- _[8dbd64a](https://github.com/shadowdara/finder/tree/8dbd64a87291179a340767c2c02ebb9e5f272d31)_ Add template markdown preview
  This change introduces a reusable TemplateView modal for template details, rendering both the JSON content and the rendered markdown notes in the hub UI. It also adds markdown styling for the preview pane and updates the folder metadata comments to reflect the single-line whitespace-normalized storage format used for mdnote content.

- _[01c3ad7](https://github.com/shadowdara/finder/tree/01c3ad7c8253b11d3b7ac5debef943106288431c)_ Switch markdown notes to mdnote
  This change replaces the previous Base64 markdown note field with a percent-encoded `mdnote` across the Go model, TypeScript types, and web UI. The template creator and viewer now encode/decode note content consistently, and the hub app renders markdown notes directly. It also adds a new sample template and updates the hub dependency list to include the markdown parsing helper.

- _[ff90e22](https://github.com/shadowdara/finder/tree/ff90e2204ffa481e6867ccd65ef3882fd7da1926)_ safe

- _[dc91ca1](https://github.com/shadowdara/finder/tree/dc91ca10bae42f25fe89b9c4409e1c4d25a7edb2)_ Move template site under npm/site
  Relocate the finder template generator SSG app from finder-template-generator-ssg to npm/site and update repository ignores for generated build artifacts. This keeps the site assets in the npm package structure and prevents local build outputs like node_modules, dist folders, and tsbuildinfo files from being tracked.

- _[cd28c08](https://github.com/shadowdara/finder/tree/cd28c081e5df6f57dc5d3bbcb0db8fd7b8f3d03d)_ Highlight Finder template patterns
  Use a dedicated JSON highlighter for Finder templates and colorize regex/glob tokens in `name` fields. This keeps the existing dark theme while making pattern matches easier to read in template previews for discover and user pages.

- _[020dccf](https://github.com/shadowdara/finder/tree/020dccfa1ed824fa275318fa1ebcfcf255a0a740)_ Add prettyJson util and normalize template input
  Extract prettyJson into lib/utils and use it across dashboard, discover and user clients to pretty-print template JSON in editors and views.

Improve template input validation in npm/hub/lib/templates.ts: stricter type checks, parse-and-normalize JSON content before applying the byte-size limit, normalize/trim/lowercase tags and deduplicate them, and ensure saved content is non-null. Also apply minor formatting/TS fixes.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>

- _[18d87ce](https://github.com/shadowdara/finder/tree/18d87ce833e9aa0456ae055cae5350384f6b3511)_ Split user page into client component
  Refactor the user profile page into a server page plus a dedicated client component to keep data fetching server-side while preserving the template preview modal behavior. The dashboard also gains navigation links back to Discover and the current user's profile page.

- _[2037eb7](https://github.com/shadowdara/finder/tree/2037eb7d016a3f35a5c0e1142802ef9a540a0507)_ Update discover-client.tsx

- _[9b92160](https://github.com/shadowdara/finder/tree/9b9216051ad862bc6d963adf41165470466c5a29)_ safe

- _[7a6b065](https://github.com/shadowdara/finder/tree/7a6b0653f161a2366c789373bcd69de66b6545a6)_ Update .gitignore

- _[baf7ab4](https://github.com/shadowdara/finder/tree/baf7ab49f2b65cde3f63e333d332bc449ecd85ad)_ Update page.tsx

- _[8d61c88](https://github.com/shadowdara/finder/tree/8d61c888e1526e8b8a105bf7fc737b17fe85e0be)_ Update export-db.js

- _[b0cc24b](https://github.com/shadowdara/finder/tree/b0cc24b5c4c33dadc89e23878fed1f4873fe3aae)_ update

- _[8d43807](https://github.com/shadowdara/finder/tree/8d438078e9fb8a271d887a3f3ce4ad96e89ea6b8)_ Update layout.tsx

- _[bfbc058](https://github.com/shadowdara/finder/tree/bfbc0586ecbc5661ba4818c11460e4e8eaf38fb8)_ Update .gitignore

- _[b200860](https://github.com/shadowdara/finder/tree/b200860739c84e3d3b7023a13daadeb4b2203d87)_ Create export-db.js

- _[6cd2139](https://github.com/shadowdara/finder/tree/6cd213924831dd09879fedccbafce74def7e2a02)_ f

- _[5fcb63f](https://github.com/shadowdara/finder/tree/5fcb63f3cbfd2756fc6ed4e8fd8eb5c97b445668)_ Delete next-env.d.ts

- _[f0cde71](https://github.com/shadowdara/finder/tree/f0cde71003874d462c8c94de10762abd472ad449)_ Add template highlighting and styling refresh
  Refreshes the hub styling to a more consistent, formatted CSS layout and adds Highlight.js theme support for syntax-highlighted template previews. This also includes the related dependency updates for Highlight.js typings and a small cleanup in the discover client.

- _[7ec7ef5](https://github.com/shadowdara/finder/tree/7ec7ef5f60dd446f22984a7d51674fed26c1d653)_ Add template discovery polish and templates
  Adds two new custom Finder templates and updates the template discovery page to render highlighted JSON in the modal. This also includes the highlight.js dependency and a Next.js type-path fix for local dev builds.

- _[0b88cdf](https://github.com/shadowdara/finder/tree/0b88cdfd3d3782e3137d974022b04763270f44c7)_ Create test.env

- _[a6cb8aa](https://github.com/shadowdara/finder/tree/a6cb8aa8ba3075ee5b2d63f142dd965295783dbf)_ Update Dockerfile

- _[0bf8cfd](https://github.com/shadowdara/finder/tree/0bf8cfdba50162eb1e01adec258b98663846a1b8)_ Add gitdb package to export Git repos
  Introduce a new pub/db/git package that scans Git repositories via the system Git CLI and exports data to SQLite or JSON. Adds implementations for CLI interaction, scanning, models, JSON/SQLite exporters (with gzip blob storage), and helper utilities. Includes comprehensive unit & integration tests, package documentation (doc.go) and a README (German). Also bumps go.mod to go1.25 and adds modernc.org/sqlite plus related indirect dependencies; go.sum updated accordingly.

- _[c49e253](https://github.com/shadowdara/finder/tree/c49e253aa17e467e375202a24fbba8edcb88d9d1)_ Update index.html

- _[9c45e9d](https://github.com/shadowdara/finder/tree/9c45e9dcabaf1c1971e9e5e40ae24ab5803ca3bf)_ Add Nginx dashboard service
  Add a new 'dashboard' service to docker-compose.yml (exposed on 8080) and include docker/dashboard/Dockerfile (nginx:alpine) plus a static index.html UI. The dashboard provides a simple status page that pings findergen, template-site, uploadpage, and static-site (localhost ports 3013–3016), shows online/offline states, and refreshes every 15s. Files added: docker/dashboard/Dockerfile and docker/dashboard/index.html; docker-compose.yml updated to build the service.

- _[d5a1c63](https://github.com/shadowdara/finder/tree/d5a1c639554eeb018ec08e1054b64176121b479a)_ Update index.ts

- _[65133c5](https://github.com/shadowdara/finder/tree/65133c5612cb80c7757185a160d006659f487830)_ s

- _[24a8ec2](https://github.com/shadowdara/finder/tree/24a8ec293c316c0ce05df9518cdd7651913c5a7c)_ Update next-env.d.ts

- _[faf8f39](https://github.com/shadowdara/finder/tree/faf8f391cfb5577c55ea630e952bca91f3c64834)_ Update pnpm-workspace.yaml

- _[3cdf75a](https://github.com/shadowdara/finder/tree/3cdf75a3c4d46ad776c6243b9c08687d34f247d9)_ Update pnpm-workspace.yaml

- _[61ad2e9](https://github.com/shadowdara/finder/tree/61ad2e9c6d3336035ae4d6edd3dd6ae21df8a134)_ Update pnpm-workspace.yaml

- _[032dff2](https://github.com/shadowdara/finder/tree/032dff27052b8135a5d64f7033f57a8f804f48ee)_ Update Dockerfile

- _[3b40048](https://github.com/shadowdara/finder/tree/3b40048630819274f3fc3b89d30fb5822857dafe)_ Add static site and type compatibility fixes
  Adds a Dockerized static template site served via nginx on port 3016 and a new staticroot build mode for the SSG generator. Also updates the finder-lib template type naming to `Template`, fixes the Next.js generated type paths in the hub app, and includes the local `@shadowdara/finder-lib` package in the workspace configuration.

- _[f30d2d4](https://github.com/shadowdara/finder/tree/f30d2d4380a1857bb21258330521520be5a1b6de)_ added style

- _[f6ee93b](https://github.com/shadowdara/finder/tree/f6ee93b32a41167b08bc3c5f2e1f0a9c2c5b09d4)_ Update pnpm-workspace.yaml

- _[a9a5be5](https://github.com/shadowdara/finder/tree/a9a5be5693b5757ffd60358f2722e662cd92b3f2)_ Add template tags and discovery UI
  This change adds tag support to template records and search/filtering in the discovery API and UI. It also adds user profile pages, exposes template metadata to the frontend, validates uploaded JSON against the Finder schema, and updates the dashboard to collect comma-separated tags for each template.

- _[fb4f9e7](https://github.com/shadowdara/finder/tree/fb4f9e7e24d0c716ac8142c34fcf41e25e18bb65)_ Update index.ts

- _[141f271](https://github.com/shadowdara/finder/tree/141f271cf29b3d497ffbeee69cfbb2508202fee5)_ Add recovery-checksum auth flow and account APIs
  Implements a user-owned recovery checksum for password recovery and account management. Adds crypto helpers, Prisma field (recoveryKeyHash) and API routes for recovery-key, reset-password and account deletion. Updates auth config to disable email verification/sendResetPassword, updates UI (sign-up displays checksum, forgot/reset/verify pages simplified) and dashboard to allow account deletion. Misc: add .dockerignore, adjust Dockerfile and package.json docker:build, and extend finder-lib TS types. Requires a Prisma migration to add the new column.

- _[ce65df3](https://github.com/shadowdara/finder/tree/ce65df3a1073efaefe6842cffbedcef62a8a871b)_ s

- _[e45bbfd](https://github.com/shadowdara/finder/tree/e45bbfd04806cb26a703aca14518ec4756c5790a)_ Fix template site Docker build
  Update the template site container to build from the repo root and copy the SSG app from its subdirectory. Also align Next.js generated type imports with the production build layout and enable standalone output for the Hub app.

- _[dc27baa](https://github.com/shadowdara/finder/tree/dc27baab88d28fc77fe972b24e8c31eefe3e1ef1)_ Add local dev mailbox, auth flows, UI & Docker fix
  Introduce a development-only local mailbox and wire it into authentication and the UI. Added npm/hub/lib/local-mailbox (save/get/clear + env gate), a dev API route /api/dev-mailbox, and updated server auth to save verification/reset emails. Exported verification/reset helpers from auth-client. New UI pages: forgot-password, reset-password, verify-email; sign-in now links to forgot-password and sign-up redirects to verify-email. Also fixed docker-compose Dockerfile path and added start/stop snippets to docker/README.md.

- _[13e5279](https://github.com/shadowdara/finder/tree/13e52794817494c5b8fdebfbf4b626a7bb53f2c2)_ updated compose

- _[19a1da4](https://github.com/shadowdara/finder/tree/19a1da42ac4e2a8f2dad4d42b0a5553d89156af7)_ Add Docker setup for app services
  Adds Docker Compose configuration and per-service Dockerfiles for the findergen API, template SSG, and upload page. Updates nginx proxying to route /api requests to findergen, and removes the obsolete dub README placeholder.

- _[69ad841](https://github.com/shadowdara/finder/tree/69ad841eb06670319854b57734f0ec4a63444487)_ added discover

- _[a99c32b](https://github.com/shadowdara/finder/tree/a99c32b06688154f018ed1088a99c09c9920da48)_ added template hub

- _[8e6ec6f](https://github.com/shadowdara/finder/tree/8e6ec6f16122bc83b524ee9d292f94530be04076)_ added finder template lib

- _[a31ded0](https://github.com/shadowdara/finder/tree/a31ded08b1ca2f4cadf50b71ae2ebaa9d8af6bb0)_ Update backend asset stats; fix note preview closure
  Regenerate finder-template-generator-ssg backend metadata: updated generatedAt, total file counts/sizes, by-extension percentages and many asset entries (renames, size adjustments, added viewer/regexcreator/markdown assets). Also make a small TypeScript refactor in src/creator/main.tsx: introduce a narrowed noteFolder variable for the note preview closure and tidy querySelector formatting to avoid nullable-reference issues.

- _[c63f0ff](https://github.com/shadowdara/finder/tree/c63f0ff15a172d1ab33129efa53119b1386ca127)_ Delete stuffcanvas.canvas

- _[f79ca20](https://github.com/shadowdara/finder/tree/f79ca209dd8f0e51be27f4546ae9d724a35aefff)_ Update .gitattributes

- _[459c72f](https://github.com/shadowdara/finder/tree/459c72f0b1afac10a5e79ebb50b8d7da705efcb9)_ Update style.css

- _[fa4eb4c](https://github.com/shadowdara/finder/tree/fa4eb4c4c8663d913f4435d3b62174052d1737d4)_ Update Map.md

- _[aa4d6be](https://github.com/shadowdara/finder/tree/aa4d6be30390e2e06c5d5b53c300f35da2e52fd7)_ Add cache count and size commands
  This change adds CLI support for viewing cache statistics. It introduces a --count flag for search results and a cache-size command that calculates the Finder cache directory size, printing JSON or human-readable output depending on the output mode. Search and result printing were updated to support count-only output without listing matches.

- _[6629fab](https://github.com/shadowdara/finder/tree/6629fab4a70c9a2599b94e08d1da0e5272f03144)_ Add Markdown note support to creator
  This change adds Markdown note editing to the template creator and persists it as mdnote_base64 on the root folder so unicode text survives JSON export/import. It also wires the creator to the app version from package.json, initializes the root min_version from that value, and adds the corresponding field to the Go folder schema.

- _[a356afe](https://github.com/shadowdara/finder/tree/a356afe8da62c0bfd9675f7f17c0594dfd936981)_ Render markdown notes in template viewer
  Adds support for optional markdown notes stored in template JSON (mdnote_base64), decodes them in the viewer modal, and renders them with dedicated styling. This keeps template metadata readable without altering the raw JSON format.

- _[07b256a](https://github.com/shadowdara/finder/tree/07b256a99a159ca695490df788cd08235641078f)_ Add match modes and share/restore UI
  Introduce match modes and state sharing UI for the regex creator.

- UI: add a mode-selector (exact, startsWith, endsWith, contains), Base64 export field, copy button and restore input + feedback; update placeholders and tester hints. Styles added in regexcreator.css for selector and share/restore widgets.
- Logic: regexcreator.tsx wires mode buttons, share serialization (Base64 UTF‑8), clipboard copy, restore parsing and UI feedback.
- Core: src/lib/regex.ts adds MatchMode and mode option, assembles anchored/negated patterns per mode and returns the RegExp accordingly.

Improves flexibility for file-extension and substring matching and allows saving/loading editor state.

- _[f9d9fe7](https://github.com/shadowdara/finder/tree/f9d9fe7cbc542aa1e96127baba26060920ca7b55)_ fixed a bug in the argparser lib where global flag where not found in subcommands

- _[a9eef48](https://github.com/shadowdara/finder/tree/a9eef48c9d0707d22662be9113010178d3b775f7)_ Update parse.go

- _[edee477](https://github.com/shadowdara/finder/tree/edee477f59fa56c16db9c3fd5b65fef65234c656)_ Update main.go

- _[7f99de7](https://github.com/shadowdara/finder/tree/7f99de7f20063099b3a976961981f0613a3fa4ae)_ Update SECURITY.md

- _[85d00b4](https://github.com/shadowdara/finder/tree/85d00b4106bd9054071008e120db4da40e1592b2)_ Create stuffcanvas.canvas

- _[d296196](https://github.com/shadowdara/finder/tree/d2961966d1f0ea56e9c87b836a2cb0e7d8a65a02)_ Update README.md

- _[2d67a8e](https://github.com/shadowdara/finder/tree/2d67a8e6aaf0ce69021701642f21176a11abf057)_ add regexes

- _[e79e682](https://github.com/shadowdara/finder/tree/e79e682174113a5e5fe6e7faab0292b41847cbd0)_ Update main.tsx

- _[c2347c7](https://github.com/shadowdara/finder/tree/c2347c7706c5d23ed1b0f174b50f3ce6d806841f)_ safe site

- _[3e9fc82](https://github.com/shadowdara/finder/tree/3e9fc82faee789fa9f4134acfc478d5a5dd2e188)_ added install maker

- _[fdbd2ee](https://github.com/shadowdara/finder/tree/fdbd2ee7736d433457b18ebfd26a0949b560710e)_ safe

- _[5653869](https://github.com/shadowdara/finder/tree/56538690b1ef196579264c1415ee61488319c646)_ install script creator

- _[4c96c4a](https://github.com/shadowdara/finder/tree/4c96c4ac2b312f7a29285ad7e87461bfdd6ba08a)_ Create AGENTS.md

- _[d5ffc11](https://github.com/shadowdara/finder/tree/d5ffc1152cf067df216a47332b05bb54beb895cc)_ Update main.go

- _[f235ce4](https://github.com/shadowdara/finder/tree/f235ce411f109703b3dedc547cbacadb4aab82cf)_ Potential fix for code scanning alert no. 6: Arbitrary file access during archive extraction ("Zip Slip")
  Co-authored-by: Copilot Autofix powered by AI <62310815+github-advanced-security[bot]@users.noreply.github.com>
- _[0e98acb](https://github.com/shadowdara/finder/tree/0e98acb45da20781107245b8aa6b0900977187ae)_ update vite

- _[2d3fad6](https://github.com/shadowdara/finder/tree/2d3fad616a14a75ec1915ba8c65a0a522443babf)_ rm notes

- _[65a4693](https://github.com/shadowdara/finder/tree/65a4693dad5c5b67d5367430ce546921cfdfb63b)_ fix versions

- _[6a579fc](https://github.com/shadowdara/finder/tree/6a579fc80bf50b5de8f8068a9f41ecf0afd3388e)_ Potential fix for code scanning alert no. 5: Prototype-polluting function
  Co-authored-by: Copilot Autofix powered by AI <62310815+github-advanced-security[bot]@users.noreply.github.com>
- _[810b2b4](https://github.com/shadowdara/finder/tree/810b2b4f1e88aa129fa10925e2be767734d5b06a)_ Potential fix for code scanning alert no. 4: Prototype-polluting function
  Co-authored-by: Copilot Autofix powered by AI <62310815+github-advanced-security[bot]@users.noreply.github.com>
- _[f65a04f](https://github.com/shadowdara/finder/tree/f65a04f62de4f12d2bdf7a624011205fe7c7c3fb)_ fix permission

- _[a50028e](https://github.com/shadowdara/finder/tree/a50028e7538e696f511c08da698cdcfbc401df56)_ safe

- _[24a495c](https://github.com/shadowdara/finder/tree/24a495cbfc6b1ebe6ef9a600b62ea34a6876964d)_ fixed path opener

- _[c6c7c70](https://github.com/shadowdara/finder/tree/c6c7c700d647db048179a60ee7429d670ae6b8a6)_ added mc world viewer

- _[5ac6ec8](https://github.com/shadowdara/finder/tree/5ac6ec84689974efb6c562e4ed50bef26b233921)_ adding mc server

- _[bbfcd6c](https://github.com/shadowdara/finder/tree/bbfcd6cd038277815191b0da2b502362e4bfdb67)_ added to path

- _[0701b46](https://github.com/shadowdara/finder/tree/0701b46767a8ee1e702348c704616985e6a8f530)_ fixed viewer site

- _[be035fa](https://github.com/shadowdara/finder/tree/be035fa6457e553560380cd102d2fee386572ea0)_ tets

- _[9609fc1](https://github.com/shadowdara/finder/tree/9609fc1f3b2126806c7fab29bb364fd086d28d9e)_ Update .gitattributes

- _[2d2177a](https://github.com/shadowdara/finder/tree/2d2177acd9c8b548d5fa0ae34a0e716cf4d8dc0d)_ added info to help

- _[3a9ffd3](https://github.com/shadowdara/finder/tree/3a9ffd355b36e15b2707f4b7a098955b876cb0c9)_ Update .gitattributes

- _[59a3675](https://github.com/shadowdara/finder/tree/59a3675ce16c07410639edf1cae95c030c4f90c6)_ added regex creator

- _[c5a77be](https://github.com/shadowdara/finder/tree/c5a77be5243da2728d421ce761cc75e40fd52d6c)_ regex

- _[c41219a](https://github.com/shadowdara/finder/tree/c41219ae4b2326a88abdd3c7c15627f179b0ed4e)_ add csf

</details>

## 0.3.16 - 08.09.2026

- added cache creation
- added config editor
- added cache viewer
- Moved every site on the finder website to TSX instead
  of TS (template viewer) - 06.09.2026
- add code to the ssg plugin which runs on build time - 07.09.2026
- the search function should return an array of
  the found content instead of priting it directly,
  so the output can be formatted elsewhere. - 07.09.2026
- added size plugin for the frontend
- added syntax highliting for the markdown codeblocks
- updated some templates
- renamed checksums file in the release from `SHA256SUMS` to `SHA256SUMS.txt`
- added some helpfule vite plugins
- added file content checksum check
- fixed that to old template warning because it showed up the finder and the template where in the same version
- added SHA512 checksums

## 0.3.15 - 02.09.2025

- added new Templates
- added a HTML Server with go backend to create and view all templates
- added json output support to finder, just add `--json` to command
- added tags and min version to a lot of the templates
- the Templates are now saved as minified json

## 0.3.14 - 25.06.2026

## 0.3.13 - 22.06.2026

## 0.3.12 - 22.06.2026

## 0.3.11 - 10.04.2026

## 0.3.10 - 10.04.2026

## 0.3.9 - 09.04.2026

- fixed Binary Search

## 0.3.8 - 27.02.2026

- added Checksums

## 0.3.7 - 24.02.2026

- only for releasing

## 0.3.6 - 24.02.2026

- added Size option to the Templates
- updated README File
- updates `CUSTOM_TEMPLATES`
- added a new entry to the Template: **min finder version** which should
  help with for example old and new templates but is not required
- added Version package

## 0.3.5 - 18.02.2026

- made a Folder public for public finder modules
- added Template for
  - flax
- added Time which the searching took
- resturctured the argparser
- added version Command
- added Argparser package
- removed loading templates directly from the Console or via a custom filepath!
  Just move them into `$HOME/.finder/templates`.
- json output is broken in this Release, but will we fixed in future Releases
  although with other Output Types
- formatted the tag Search output correctly

## 0.3.4 - 16.02.2026

- changed Go Version to 1.18
- fixed _`Search on all Drives on Windows`_ from 0.3.3, it
  didn't quite well before
- added Async Search
- made color package public

## 0.3.3 - 15.02.2026

- added JSON Shema
- added File Options
- Search on all Drives on Windows
- added Tag Search

## 0.3.2 - 15.02.2026

- little Fixes

## 0.3.1 - 15.02.2026

### ✨ Features

#### Runtime Custom Template System

- **Custom Templates without Recompilation**: Users can now create templates in `~/.finder/templates/` or `./.finder/templates/` without recompiling the program
- **Automatic Template Discovery**: New `.json5` files are automatically detected and loaded on startup
- **User Templates Override**: User-defined templates can override built-in templates with the same name
- **Precedence System**: User templates take precedence over built-in templates

#### CLI Reorganization & Modernization

- **Modular CLI Architecture**: Complete restructuring from monolithic design
  - `parser.go`: Dedicated argument parsing logic
  - `handlers.go`: Isolated command handlers
  - `commands.go`: Clean routing (reduced from 300+ to 60 lines)
- **Command Aliases**: New shorter forms for common commands
  - `h`, `-h`, `--help` in addition to `help`
  - `ls` in addition to `list`
  - `--file` in addition to `-f`
  - `--config` in addition to `-c`
- **CLIOptions Struct**: Structured argument representation with predicates
  - `.IsHelp()`, `.IsList()`, `.IsCheck()`, `.IsFileLoad()`, `.IsDirectLoad()`, `.IsTemplateSearch()`
  - `.GetFileArg()`, `.GetDirectLoadArg()`, `.GetTemplateName()`
- **Verbose Mode**: New `--verbose` flag for extended output

#### Enhanced Help System

- **Better Help Structure**: Organized into COMMANDS, FILE & CONFIG OPERATIONS, GLOBAL FLAGS
- **Table Layout**: Improved readability with consistent formatting
- **Custom Templates Info**: Documentation for user template setup
- **Detailed Descriptions**: Each command with clear explanation

#### Enhanced List & Check Commands

- **Separated Display**: Built-in and custom templates are listed separately
- **Template Sources**: Source attribute shows whether template is built-in or custom
- **Helpful Hints**: Paths for custom template setup are displayed
- **Improved Validation**: Check command validates with source information

### 🧪 Testing

- **40+ new unit tests** for CLI parser logic
- **Parser Tests**: Comprehensive coverage for command recognition, flag parsing, argument extraction
- **Integration Tests**: End-to-end tests for command execution
- **Routing Tests**: Tests for handler mapping
- **Error Handling Tests**: Validation of error handling and user feedback

### 📖 Documentation

- **ARCHITECTURE.md**: Detailed technical documentation of the new CLI structure
- **REORGANIZATION.md**: Comprehensive before/after comparison and explanation
- **QUICKSTART.md**: Practical guide for adding new commands
- **CUSTOM_TEMPLATES.md**: User guide for custom template creation
- **Inline Code Comments**: Improved code documentation

### 🔧 Infrastructure

- **Enhanced Template Loader** (`templateloader.go`)
  - `LoadUserTemplates()`: Discovers user templates from filesystem
  - `JSONtemplateLoaderWithUserTemplates()`: Intelligent loading with user override
  - `LoadAllWithUserTemplates()`: Combined built-in + custom template discovery
- **Template Override Mechanism**: User templates can replace built-in templates
- **Graceful Error Handling**: Missing user template directories are not fatal

### 🎯 Quality Improvements

- **Clean Code Structure**: Single Responsibility Principle consistently applied
- **Better Testability**: Each module can be tested in isolation
- **Extensibility**: New commands can be added in 5 simple steps
- **Backward Compatibility**: External API (`HandleCommand()`) unchanged

### 👥 User Experience

- **Better Error Messages**: Context-sensitive error messages with suggestions
- **Helpful Hints**: Tips for common tasks (e.g., where to place templates)
- **Flexible Command Syntax**: Multiple synonyms for each command
- **Consistent Output Formatting**: Unified design across all commands

### 📊 Performance

- **No Recompilation Required**: Custom templates are loaded at runtime
- **Efficient Template Discovery**: Fast filesystem traversal
- **Minimal Overhead**: Template loading has negligible performance impact

### 🐛 Bug Fixes & Improvements

- Improved error handling in template loading
- Better handling of missing or malformed user templates
- Consistent error messages across all commands
- Fixed edge cases in CLI argument parsing

### 📝 Breaking Changes

- **No Breaking Changes**: All existing commands work unchanged
- Internal structure completely refactored, but public API remains stable

### 🙏 Highlights

This version brings the biggest improvement since 0.2.0:

- Users can now create their own templates
- Codebase is more maintainable and extensible
- Test coverage drastically improved

---

## 0.3.0 - 23.01.2026

Template System & CLI Foundations

## 0.2.0 - 23.01.2026

More Templates
Better Console Output
Help Message

## 0.1.0 - 17.11.2025

Programm Init

## 0.0.0 - 30.11.2025

the start
