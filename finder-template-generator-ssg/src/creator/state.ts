import type {
  Existence,
  FileJSON,
  FileNode,
  FolderJSON,
  FolderNode,
  SizeConstraint,
} from "./types";

let counter = 0;
/** Small, dependency-free id generator (crypto.randomUUID needs a secure context). */
export function nextId(): string {
  counter += 1;
  return `n${Date.now().toString(36)}${counter}`;
}

export function newFile(name = "new-file.txt"): FileNode {
  return { id: nextId(), name, existence: "required", size: null };
}

export function newFolder(name = "new-folder"): FolderNode {
  return {
    id: nextId(),
    name,
    description: "",
    minVersion: "",
    command: "",
    invertCommand: false,
    tags: [],
    files: [],
    folders: [],
    size: null,
  };
}

export function newRoot(): FolderNode {
  const root = newFolder("root");
  root.minVersion = "0.1.0";
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
  fileId: string
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

function serializeSize(size: SizeConstraint | null): SizeConstraint | undefined {
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
  if (file.existence && file.existence !== DEFAULT_EXISTENCE) {
    out.existence = file.existence;
  }
  const size = serializeSize(file.size);
  if (size) out.size = size;
  return out;
}

export function serializeFolder(folder: FolderNode, isRoot = true): FolderJSON {
  const out: FolderJSON = { name: folder.name };

  if (folder.description.trim()) out.description = folder.description;
  if (folder.command.trim()) out.command = folder.command;
  if (folder.invertCommand) out.invert_command = true;
  if (folder.tags.length > 0) out.tags = folder.tags;
  if (folder.files.length > 0) out.files = folder.files.map(serializeFile);
  if (folder.folders.length > 0) {
    out.folders = folder.folders.map((f) => serializeFolder(f, false));
  }
  if (isRoot && folder.minVersion.trim()) {
    out.min_version = folder.minVersion.trim();
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
      return { id: nextId(), name: entry, existence: "required", size: null };
    }
    const e = entry as FileJSON;
    return {
      id: nextId(),
      name: e.name ?? "",
      existence: e.existence ?? "required",
      size: e.size ? { min: e.size.min, max: e.size.max } : null,
    };
  });
}

export function parseFolder(raw: FolderJSON): FolderNode {
  return {
    id: nextId(),
    name: raw.name ?? "",
    description: raw.description ?? "",
    minVersion: raw.min_version ?? "",
    command: raw.command ?? "",
    invertCommand: !!raw.invert_command,
    tags: Array.isArray(raw.tags) ? [...raw.tags] : [],
    files: parseFiles((raw as unknown as { files: unknown }).files),
    folders: Array.isArray(raw.folders) ? raw.folders.map(parseFolder) : [],
    size: raw.size ? { min: raw.size.min, max: raw.size.max } : null,
  };
}
