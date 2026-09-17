// Types for the template creator.
//
// The plain-JSON shapes written to disk / read by the Go tool come straight
// from `@shadowdara/finder-lib` (newest = v0.3.18), so they stay in sync with
// the actual finder schema instead of being hand-maintained here.
//
// The editor additionally works with mutable node types (FileNode / FolderNode)
// that carry UI-only ids and ""-defaults for the optional string fields.

import { newest } from "@shadowdara/finder-lib";

/**
 * The plain-JSON shape written to disk / read by the Go tool.
 *
 * Normalized: every field but `name` is optional and is only written when
 * it deviates from the field's default, so exported templates stay small.
 * Defaults: existence = "required", command = "", invert_command = false,
 * tags/folders/files = [], description/min_version = "", size = unset.
 */
export type FileJSON = newest.File;

/**
 * The plain-JSON shape of a nested folder (the Go `Folder` struct). Only
 * fields valid on every nesting level are allowed here — root-only metadata
 * (description / min_version / tags / mdnote / author / authors) belongs to
 * `TemplateJSON`.
 */
export type FolderJSON = newest.Folder;

/**
 * The full top-level template JSON: the root folder plus the root-only
 * metadata fields (description, min_version, tags, mdnote, author, authors).
 */
export type TemplateJSON = newest.Template;

/** Size range as edited in the UI; serialized via `serializeSize`. */
export type SizeConstraint = Pick<
  newest.Size,
  "min" | "max" | "min_size_type" | "max_size_type"
>;

/** Checksum pair as edited in the UI ("" = unset). */
export type Checksum = Required<newest.Checksums>;

/** Existence values from the finder schema. */
export type Existence = newest.Existence;

/** Size unit type: B, KB, MB, or GB. */
export type SizeType = newest.SizeType;

/** A single file entry in the editor tree. */
export interface FileNode {
  id: string;
  name: string;
  nameRegex: string;
  existence: Existence;
  size: SizeConstraint | null;
  checksums: Checksum | null;
}

/** A folder (or the root) node in the editor tree. */
export interface FolderNode {
  id: string;
  name: string;
  nameRegex: string;
  description: string;
  minVersion: string;
  command: string;
  invertCommand: boolean;
  tags: string[];
  files: FileNode[];
  folders: FolderNode[];
  size: SizeConstraint | null;
  markdownNote: string;
}
