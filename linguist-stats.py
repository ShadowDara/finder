
#!/usr/bin/env python3
"""
linguist_history.py

Checkt in einem Git-Repository nacheinander jeden Commit aus,
führt dort `linguist-js` aus und speichert die Ergebnisse zusammen
mit der Reihenfolge/Metadaten der Commits in einer JSON-Datei.
Die Struktur ist so gewählt, dass man sie danach leicht für
Chart.js aufbereiten kann.

Voraussetzungen:
- Git muss installiert sein und im PATH liegen.
- Node.js/npm muss installiert sein (für `npx linguist-js`).
- Das Zielverzeichnis muss ein sauberes Git-Repo sein
  (keine uncommitteten Änderungen), da zwischen Commits hin-
  und hergesprungen wird.

Nutzung:
    python linguist_history.py /pfad/zum/repo -o ergebnis.json
    python linguist_history.py /pfad/zum/repo --branch main --limit 100
"""

import argparse
import json
import subprocess
import sys
from pathlib import Path


def run(cmd, cwd=None, check=True):
    """Führt einen Shell-Befehl aus und gibt stdout als String zurück."""
    result = subprocess.run(
        cmd,
        cwd=cwd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    if check and result.returncode != 0:
        raise RuntimeError(
            f"Befehl fehlgeschlagen: {' '.join(cmd)}\n"
            f"stdout: {result.stdout}\nstderr: {result.stderr}"
        )
    return result.stdout.strip()


def get_current_ref(repo_path):
    """Merkt sich den aktuellen Branch (oder Commit-SHA im detached state)."""
    branch = run(["git", "symbolic-ref", "--short", "-q", "HEAD"], cwd=repo_path, check=False)
    if branch:
        return branch
    return run(["git", "rev-parse", "HEAD"], cwd=repo_path)


def get_commit_list(repo_path, branch=None, limit=None):
    """
    Liefert die Commit-Liste in chronologischer Reihenfolge
    (ältester zuerst) als Liste von Dicts mit sha, date, message.
    """
    ref = branch or "HEAD"
    fmt = "%H|%aI|%an|%s"
    cmd = ["git", "log", "--reverse", f"--pretty=format:{fmt}", ref]
    output = run(cmd, cwd=repo_path)

    commits = []
    for line in output.splitlines():
        if not line.strip():
            continue
        sha, date, author, message = line.split("|", 3)
        commits.append({"sha": sha, "date": date, "author": author, "message": message})

    if limit:
        commits = commits[-limit:]  # die letzten N (also die neuesten N, in Reihenfolge)

    return commits


def checkout(repo_path, sha):
    run(["git", "checkout", "--quiet", "--force", sha], cwd=repo_path)


def run_linguist(repo_path):
    """
    Führt linguist-js per npx im Repo-Verzeichnis aus und gibt
    das geparste JSON-Ergebnis zurück. Bei Fehlern wird None
    zurückgegeben und die Fehlermeldung mit ausgegeben.
    """
    try:
        output = run(["npx", "--yes", "linguist-js", "--json", "."], cwd=repo_path)
    except RuntimeError as e:
        print(f"  [Warnung] linguist-js fehlgeschlagen: {e}", file=sys.stderr)
        return None

    try:
        return json.loads(output)
    except json.JSONDecodeError:
        print("  [Warnung] Konnte linguist-js-Ausgabe nicht als JSON parsen.", file=sys.stderr)
        return None


def load_existing_results(output_path):
    """
    Lädt eine bereits vorhandene Ausgabedatei (falls vorhanden) und gibt
    ein Dict sha -> commit-Ergebnis zurück. So können bereits verarbeitete
    Commits übersprungen werden.
    """
    path = Path(output_path)
    if not path.exists():
        return {}

    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (json.JSONDecodeError, OSError) as e:
        print(f"[Warnung] Konnte bestehende Datei {output_path} nicht lesen ({e}), starte neu.", file=sys.stderr)
        return {}

    existing = {}
    for commit in data.get("commits", []):
        sha = commit.get("sha")
        if sha and commit.get("languages") is not None:
            existing[sha] = commit
    return existing


def main():
    parser = argparse.ArgumentParser(description="Sprachverlauf eines Git-Repos per linguist-js erfassen.")
    parser.add_argument("repo", help="Pfad zum Git-Repository")
    parser.add_argument("-o", "--output", default="linguist_history.json", help="Pfad der Ausgabedatei")
    parser.add_argument("--branch", default=None, help="Branch/Ref, dessen Historie analysiert wird (Default: HEAD)")
    parser.add_argument("--limit", type=int, default=None, help="Nur die letzten N Commits verarbeiten")
    parser.add_argument("--force", action="store_true", help="Vorhandene Ergebnisse ignorieren und alle Commits neu verarbeiten")
    args = parser.parse_args()

    repo_path = Path(args.repo).resolve()
    if not (repo_path / ".git").exists():
        print(f"Fehler: {repo_path} ist kein Git-Repository.", file=sys.stderr)
        sys.exit(1)

    # Sauberes Arbeitsverzeichnis sicherstellen, da wir zwischen Commits hin- und herspringen
    status = run(["git", "status", "--porcelain"], cwd=repo_path)
    if status:
        print("Fehler: Working Directory ist nicht sauber (uncommitted changes). Bitte committen/stashen.", file=sys.stderr)
        sys.exit(1)

    original_ref = get_current_ref(repo_path)
    print(f"Aktueller Ref gemerkt: {original_ref}")

    commits = get_commit_list(repo_path, branch=args.branch, limit=args.limit)
    print(f"{len(commits)} Commits gefunden.")

    existing = {} if args.force else load_existing_results(args.output)
    if existing:
        print(f"{len(existing)} bereits verarbeitete Commits gefunden, diese werden übersprungen.")

    todo = [c for c in commits if c["sha"] not in existing]
    print(f"{len(todo)} Commits müssen noch verarbeitet werden.")

    new_results = {}
    try:
        for i, commit in enumerate(todo):
            print(f"[{i + 1}/{len(todo)}] Checkout {commit['sha'][:8]} - {commit['message'][:60]}")
            checkout(repo_path, commit["sha"])
            languages = run_linguist(repo_path)

            new_results[commit["sha"]] = {
                "sha": commit["sha"],
                "date": commit["date"],
                "author": commit["author"],
                "message": commit["message"],
                "languages": languages,
            }

            # Nach jedem Commit zwischenspeichern, damit bei Abbruch nichts verloren geht
            merged = {**existing, **new_results}
            write_output(args.output, repo_path, commits, merged)
    finally:
        print(f"Stelle ursprünglichen Ref wieder her: {original_ref}")
        checkout(repo_path, original_ref)

    print(f"Fertig. Ergebnis gespeichert in: {args.output}")


def write_output(output_path, repo_path, commits, results_by_sha):
    """
    Schreibt die Ausgabedatei in der ursprünglichen Commit-Reihenfolge.
    Commits, die noch nicht verarbeitet wurden, werden ausgelassen.
    """
    ordered = []
    index = 0
    for commit in commits:
        result = results_by_sha.get(commit["sha"])
        if result is None:
            continue
        entry = dict(result)
        entry["index"] = index
        ordered.append(entry)
        index += 1

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(
            {"repo": str(repo_path), "commit_count": len(ordered), "commits": ordered},
            f, indent=2, ensure_ascii=False,
        )


if __name__ == "__main__":
    main()
