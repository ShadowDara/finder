import type {
  Checksum,
  Existence,
  FileJSON,
  FileNode,
  FolderJSON,
  FolderNode,
  SizeConstraint,
  TemplateJSON,
} from "./types";

let counter = 0;
/** Small, dependency-free id generator (crypto.randomUUID needs a secure context). */
export function nextId(): string {
  counter += 1;
  return `n${Date.now().toString(36)}${counter}`;
}

export function newFile(name = "new-file.txt"): FileNode {
  return {
    id: nextId(),
    name,
    nameRegex: "",
    existence: "required",
    size: null,
    checksums: null,
  };
}

export function newFolder(name = "new-folder"): FolderNode {
  return {
    id: nextId(),
    name,
    nameRegex: "",
    description: "",
    minVersion: "",
    command: "",
    invertCommand: false,
    tags: [],
    files: [],
    folders: [],
    size: null,
    markdownNote: "",
  };
}

export function newRoot(version: string): FolderNode {
  const root = newFolder("*");
  root.minVersion = version;
  root.description = "Describe what this template matches";
  return root;
}

/** Find a folder node by id anywhere in the tree (DFS). */
export function findFolder(root: FolderNode, id: string): FolderNode | null {
  if (root.id === id) return root;
  for (const child of root.folders) {
    const found = findFolder(child, id);
    if (found) return found;
  }
  return null;
}

/** Find the file with `fileId` plus the folder that directly contains it. */
export function findFile(
  root: FolderNode,
  fileId: string,
): { folder: FolderNode; file: FileNode } | null {
  for (const file of root.files) {
    if (file.id === fileId) return { folder: root, file };
  }
  for (const child of root.folders) {
    const found = findFile(child, fileId);
    if (found) return found;
  }
  return null;
}

/** Remove a subfolder with the given id from wherever it lives. Returns true if removed. */
export function removeFolder(root: FolderNode, id: string): boolean {
  const idx = root.folders.findIndex((f) => f.id === id);
  if (idx !== -1) {
    root.folders.splice(idx, 1);
    return true;
  }
  return root.folders.some((child) => removeFolder(child, id));
}

export function removeFile(root: FolderNode, fileId: string): boolean {
  const idx = root.files.findIndex((f) => f.id === fileId);
  if (idx !== -1) {
    root.files.splice(idx, 1);
    return true;
  }
  return root.folders.some((child) => removeFile(child, fileId));
}

/**
 * Encode a raw Markdown note for the JSON file: keeps newlines and other
 * special characters as percent-escapes (like encodeURIComponent), so the
 * note survives plain-JSON serialization as one line. Returns undefined
 * when the note is empty.
 */
export function encodeMarkdownNote(note: string): string | undefined {
  return note;
}

/** Decodes the percent-encoded notes produced by encodeMarkdownNote. */
export function decodeMarkdownNote(note: string): string {
  return note;
}

function serializeSize(
  size: SizeConstraint | null,
): SizeConstraint | undefined {
  if (!size) return undefined;
  if (size.min === undefined && size.max === undefined) return undefined;
  const out: SizeConstraint = {};
  if (size.min !== undefined) out.min = size.min;
  if (size.max !== undefined) out.max = size.max;
  return out;
}

// Default values a field is considered "unset" at, and therefore omitted
// from exported JSON so templates stay small. Keep this in sync with the
// defaults `newFile` / `newFolder` start new nodes at.
const DEFAULT_EXISTENCE: Existence = "required";

export function serializeFile(file: FileNode): FileJSON {
  const out: FileJSON = { name: file.name };
  if (file.nameRegex.trim()) out.name_regex = file.nameRegex.trim();
  if (file.existence && file.existence !== DEFAULT_EXISTENCE) {
    out.existence = file.existence;
  }
  const size = serializeSize(file.size);
  if (size) out.size = size;
  const checksums = serializeChecksums(file.checksums);
  if (checksums) out.checksums = checksums;
  return out;
}

function serializeChecksums(
  checksums: FileNode["checksums"],
): Partial<Checksum> | undefined {
  if (!checksums) return undefined;

  const out: Partial<Checksum> = {};
  const sha256 = checksums.sha256.trim();
  const sha512 = checksums.sha512.trim();

  if (sha256) out.sha256 = sha256;
  if (sha512) out.sha512 = sha512;

  if (Object.keys(out).length === 0) return undefined;
  return out;
}

/**
 * Serialize the root folder into the full template JSON. Only the root
 * carries the root-only metadata (description, min_version, tags, mdnote);
 * nested folders are serialized via `serializeChildFolder`.
 */
export function serializeFolder(folder: FolderNode): TemplateJSON {
  const out: TemplateJSON = { name: folder.name };

  if (folder.nameRegex.trim()) out.name_regex = folder.nameRegex.trim();
  if (folder.description.trim()) out.description = folder.description;
  if (folder.command.trim()) out.command = folder.command;
  if (folder.invertCommand) out.invert_command = true;
  if (folder.tags.length > 0) out.tags = folder.tags;
  if (folder.files.length > 0) out.files = folder.files.map(serializeFile);
  if (folder.folders.length > 0) {
    out.folders = folder.folders.map(serializeChildFolder);
  }
  if (folder.minVersion.trim()) out.min_version = folder.minVersion.trim();
  const size = serializeSize(folder.size);
  if (size) out.size = size;

  const note = encodeMarkdownNote(folder.markdownNote);
  if (note) out.mdnote = note;

  return out;
}

/**
 * Serialize a nested folder. Only fields that are valid on every nesting
 * level end up here (name, name_regex, command, invert_command, files,
 * folders, size) — root-only metadata never leaks into subfolders.
 */
function serializeChildFolder(folder: FolderNode): FolderJSON {
  const out: FolderJSON = { name: folder.name };

  if (folder.nameRegex.trim()) out.name_regex = folder.nameRegex.trim();
  if (folder.command.trim()) out.command = folder.command;
  if (folder.invertCommand) out.invert_command = true;
  if (folder.files.length > 0) out.files = folder.files.map(serializeFile);
  if (folder.folders.length > 0) {
    out.folders = folder.folders.map(serializeChildFolder);
  }
  const size = serializeSize(folder.size);
  if (size) out.size = size;

  return out;
}

/** Parse either the plain-string `files` legacy format or the object format. */
function parseFiles(raw: unknown): FileNode[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => {
    if (typeof entry === "string") {
      return {
        id: nextId(),
        name: entry,
        nameRegex: "",
        existence: "required",
        size: null,
        checksums: null,
      };
    }
    const e = entry as FileJSON;
    return {
      id: nextId(),
      name: e.name ?? "",
      nameRegex: e.name_regex ?? "",
      existence: e.existence ?? "required",
      size: e.size ? { min: e.size.min, max: e.size.max } : null,
      checksums: e.checksums
        ? {
            sha256: e.checksums.sha256 ?? "",
            sha512: e.checksums.sha512 ?? "",
          }
        : null,
    };
  });
}

export function parseFolder(raw: FolderJSON | TemplateJSON): FolderNode {
  const t = raw as TemplateJSON;
  const mdnote = t.mdnote;
  let markdownNote = "";
  if (typeof mdnote === "string" && mdnote.length > 0) {
    markdownNote = decodeMarkdownNote(mdnote);
  }

  return {
    id: nextId(),
    name: t.name ?? "",
    nameRegex: t.name_regex ?? "",
    description: t.description ?? "",
    minVersion: t.min_version ?? "",
    command: t.command ?? "",
    invertCommand: !!t.invert_command,
    tags: Array.isArray(t.tags) ? [...t.tags] : [],
    files: parseFiles(t.files),
    folders: Array.isArray(t.folders) ? t.folders.map(parseFolder) : [],
    size: t.size ? { min: t.size.min, max: t.size.max } : null,
    markdownNote,
  };
}
