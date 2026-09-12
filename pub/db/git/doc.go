// Package gitdb ist eine Go-Bibliothek zum Scannen von Git-Repositories
// über die auf dem System installierte Git-CLI und zum Export der
// gescannten Daten nach SQLite oder JSON.
//
// # Überblick
//
// Der Exporter liest die Objektdatenbank eines Git-Repositories, ohne
// eigene Objektdateien zu parsen: Er delegiert alle Low-Level-Arbeit an
// "git" (branch, tag, rev-list, ls-tree, cat-file, diff --numstat,
// config). Damit funktioniert die Bibliothek mit jedem Git-Format
// (SHA-1 und SHA-256 Repositories) und benötigt keine C-Bibliotheken.
//
// # Verwendung
//
//	package main
//
//	import (
//		"log"
//
//		"github.com/shadowdara/finder/pub/db/git"
//	)
//
//	func main() {
//		opts := gitdb.ExportOptions{
//			RepoPath:   "./mein-repo",
//			SQLitePath: "repo.db",
//			JSONDir:    "./repo-export",
//			WithBlobs:  true,
//		}
//		meta, err := gitdb.Export(opts)
//		if err != nil {
//			log.Fatal(err)
//		}
//		log.Printf("exportiert: %d Commits, %d Refs", meta.Commits, meta.Refs)
//	}
//
// # Exportziele
//
// SQLite (ExportSQLite): Eine relationale Datenbank mit den Tabellen
// refs, commits, parents, author, committer, tree_entries und blobs.
// Blob-Inhalte können auf Wunsch inline (gzip-komprimiert) gespeichert
// oder nur als Metadaten erfasst werden.
//
// JSON (ExportJSON): Eine Menge von JSON-Dateien im Ausgabeverzeichnis:
//
//	repo.json       – Metadaten des Repositories
//	refs.json       – alle Refs
//	commits.json    – alle Commits (flache Liste)
//	trees.json      – alle Baum-Einträge aller Commits
//	blobs.json      – Blob-Hashes und Größen
//	blobs/<sha>.txt – optional die Blob-Inhalte
//
// # Abhängigkeiten
//
//   - git muss im PATH installiert sein (git --version wird geprüft)
//   - SQLite ist als reines-Go-Treiber (modernc.org/sqlite) eingebunden,
//     es wird kein CGO benötigt
//
// # Grenzen
//
//   - Es werden nur Commits erreicht von: HEAD, allen Zweigen (refs/heads),
//     Tags (refs/tags), refs/remotes sowie allen Refs unter refs/ erscannt.
//   - Objekte außerhalb dieser Referenzen (unreferenzierte Objekte) werden
//     nicht exportiert.
//   - Leere Repositories ohne Commits exportieren gültige, aber leere
//     Tabellen.
package gitdb
