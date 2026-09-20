## 📌 Summary

<!-- Briefly describe what this PR does -->

_Describe the change in a few sentences_

## 🔍 Related Issue

<!-- Link the issue this PR resolves, if applicable -->

Closes #

## 🛠 Proposed Changes

<!-- List the changes made -->

- Change 1
- Change 2
- …

## 🧪 Testing

<!-- How has this been tested? Steps and results -->

1. …
2. …

---

## 🧩 Finder Template Changes

<!--
  Fill this section out when this PR adds or changes a Finder template.
  Templates are JSON5 files that describe a project type so Finder can detect it.
  Built-in templates live in `templates/`, custom templates in `.finder/templates/`.
  Schema files: `.finder/shema/`.
-->

### Template checklist

- [ ] Template is a valid `.json5` file
- [ ] Template matches the schema in `.finder/shema/` (`finder-template.schema.json` / `finder-template.v2.schema.json`)
- [ ] `name` is `"*"` unless a narrower pattern is intentional
- [ ] Requires only the minimal set of files/folders needed to identify the project type
- [ ] Includes a clear `description` and useful `tags`
- [ ] Avoids generic markers that cause false positives (e.g. `README.md` alone)
- [ ] Validated with `./finder check`
- [ ] Tested against a real folder with `./finder <template-name>`
- [ ] Documentation updated (`CUSTOM_TEMPLATES.md`, `tags.md`) if applicable

### Validation output

<!-- Paste the output of these commands -->

```
./finder check
./finder <template-name>
```

---

## 📸 Screenshots (if applicable)

<!-- UI / behavior changes – include screenshots or GIFs -->

## ✅ Final Checklist

- [ ] PR title is descriptive
- [ ] Changes are tested
- [ ] Updates to documentation (if applicable)
- [ ] No unrelated changes
