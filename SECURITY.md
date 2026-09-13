# Security Policy

## Supported Versions

Finder follows a rolling support model. Only the latest minor release
line (`0.3.x`) receives security updates, and fixes are released on
the latest patch version.

| Version            | Supported          |
| ------------------ | ------------------ |
| 0.3.x (latest)     | :white_check_mark: |
| 0.2.x              | :x:                |
| 0.1.x and earlier  | :x:                |

If you are running an older version, please upgrade to the latest
release before reporting an issue, and verify whether the
vulnerability still exists there.

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security
vulnerabilities that could put users at risk.

Instead, report security issues privately so they can be addressed
before public disclosure:

- **Preferred:** open a GitHub Security Advisory at
  <https://github.com/ShadowDara/finder/security/advisories/new>
- **Alternative:** contact the maintainers privately via the GitHub
  repository (e.g. a private message / email referenced in the
  repository profile).

### What to include

To help triage quickly, please include:

- the affected finder version (run `finder version`)
- the platform/OS and architecture
- a minimal, reproducible description of the issue
- the impact (data loss, remote code execution, privilege
  escalation, information disclosure, etc.)
- a proof of concept or steps to reproduce, if available
- any suggested fix, if you have one

### What to expect

- **Acknowledgement:** you will receive an initial response within
  a few days.
- **Triaging:** the report will be validated and a severity level
  assigned.
- **Fixes:** critical issues are prioritized and fixed as soon as
  possible; a patched release will be published, typically on the
  latest `0.3.x` version.
- **Disclosure:** after a fix is released, we will coordinate
  responsible public disclosure and credit the reporter (unless you
  prefer to stay anonymous).

If a report is declined because it is considered a non-issue, we will
explain why. We still appreciate the report — edge cases that are not
vulnerabilities today may become relevant in the future.

## Security Considerations

### Template command execution

Finder templates can define a `command` that is executed with the
shell inside the found directory after a match. Because of this:

- **Only run templates from sources you trust.** A malicious template
  could execute arbitrary commands on your machine.
- Custom templates placed in `~/.finder/templates/`,
  `./.finder/templates/`, or custom template folders are loaded
  automatically and can override built-in templates.
- Review custom templates for `command` fields before using them,
  especially if they were downloaded from the internet or copied
  from untrusted repositories.
- Templates are data, not sandboxed code. Do not treat a repository
  with a `.finder` template directory as safe just because the
  template itself is a text file.

### Web UI (`findergen`)

The built-in HTTP server (`findergen`) serves a local management UI.
It is designed for local use:

- Do not expose the `findergen` port to the public internet or to
  untrusted networks without additional authentication and
  protection.
- Bind it to `localhost`/`127.0.0.1` unless you know what you are
  doing.

### Search behavior

Finder performs recursive scans of drives and filesystems. It may
read file contents to compute checksums when a template requests
them. Be mindful when scanning directories that may contain
sensitive or very large files.

### Dependencies

Dependencies are pinned via `go.mod`/`go.sum`. Please check release
notes for dependency updates and upgrade finder regularly to receive
security fixes for the standard library and third-party modules.

## Security Best Practices for Users

- Always use the [latest release](https://github.com/ShadowDara/finder/releases).
- Verify downloaded binaries against the published checksums
  (`SHA256SUMS.txt` / SHA-512 hashes provided per release).
- Review custom templates before placing them in a template folder.
- Do not run finder as root/administrator unless required.

## Security Best Practices for Contributors

- Do not introduce new shell-command execution paths without
  review.
- Validate and sanitize paths, template names, and command strings.
- When adding the ability to load external data (templates, config,
  cache), always treat the data as untrusted input.
- Run `go vet` and the test suite before submitting changes.
