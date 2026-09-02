// Mirrors the Go structs in package `structure` (Folder, Files/File, Size).
// The Size struct wasn't part of the source you shared, so it's modeled here
// as a simple { min, max } byte range — rename the fields in `serialize.ts`
// if your real `Size` struct looks different.

export type Existence = "required" | "forbidden" | "optional";

export interface SizeConstraint {
  min?: number;
  max?: number;
}

/** Editable file-node. `id` is UI-only bookkeeping, stripped on export. */
export interface FileNode {
  id: string;
  name: string;
  existence: Existence;
  size: SizeConstraint | null;
}

/** Editable folder-node (tree). `id` is UI-only bookkeeping, stripped on export. */
export interface FolderNode {
  id: string;
  name: string;
  description: string;
  minVersion: string; // only meaningful on the root node, but the struct allows it anywhere
  command: string;
  invertCommand: boolean;
  tags: string[];
  files: FileNode[];
  folders: FolderNode[];
  size: SizeConstraint | null;
}

/**
 * The plain-JSON shape written to disk / read by the Go tool.
 *
 * Normalized: every field but `name` is optional and is only written when
 * it deviates from the field's default, so exported templates stay small.
 * Defaults: existence = "required", command = "", invert_command = false,
 * tags/folders/files = [], description/min_version = "", size = unset.
 */
export interface FileJSON {
  name: string;
  existence?: Existence;
  size?: SizeConstraint;
}

export interface FolderJSON {
  min_version?: string;
  description?: string;
  name: string;
  folders?: FolderJSON[];
  files?: FileJSON[];
  command?: string;
  invert_command?: boolean;
  tags?: string[];
  size?: SizeConstraint;
}
