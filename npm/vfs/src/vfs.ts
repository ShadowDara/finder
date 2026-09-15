import { zipSync, unzipSync } from "fflate";
import { VfsError, VfsNotFoundError, VfsExistsError } from "../errors.js";
import type {
  NodeId,
  VNode,
  FileNode,
  FolderNode,
  TreeEntry,
  VfsEvent,
  VfsEventType,
  VfsListener,
  CreateFolderOptions,
  CreateFileOptions,
  WriteFileOptions,
  ImportZipOptions,
  SerializedVfs,
} from "../types.js";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function generateId(): string {
  const g = globalThis as unknown as { crypto?: { randomUUID?: () => string } };
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Zerlegt einen Pfad in Segmente, löst "." und ".." auf, ignoriert leere Segmente. */
function normalize(path: string): string[] {
  const stack: string[] = [];
  for (const raw of path.split("/")) {
    const part = raw.trim();
    if (part === "" || part === ".") continue;
    if (part === "..") {
      stack.pop();
      continue;
    }
    stack.push(part);
  }
  return stack;
}

function toBytes(content: string | Uint8Array): Uint8Array {
  return typeof content === "string" ? textEncoder.encode(content) : content;
}

export class VirtualFileSystem {
  private nodes = new Map<NodeId, VNode>();
  private rootId: NodeId;
  private listeners = new Set<VfsListener>();

  constructor() {
    const now = Date.now();
    this.rootId = generateId();
    this.nodes.set(this.rootId, {
      id: this.rootId,
      name: "",
      type: "folder",
      parentId: null,
      createdAt: now,
      updatedAt: now,
      children: [],
    });
  }

  get root(): FolderNode {
    return this.nodes.get(this.rootId) as FolderNode;
  }

  // ---------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------

  on(listener: VfsListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(type: VfsEventType, path: string, node: VNode): void {
    const event: VfsEvent = { type, path, node };
    for (const listener of this.listeners) listener(event);
  }

  // ---------------------------------------------------------------------
  // Pfad-Auflösung (intern)
  // ---------------------------------------------------------------------

  private resolveFolder(parts: string[]): FolderNode | undefined {
    let current: FolderNode = this.root;
    for (const part of parts) {
      const childId = current.children.find(
        (id) => this.nodes.get(id)!.name === part,
      );
      if (!childId) return undefined;
      const child = this.nodes.get(childId)!;
      if (child.type !== "folder") return undefined;
      current = child;
    }
    return current;
  }

  private splitParentAndName(path: string): {
    parentParts: string[];
    name: string;
  } {
    const parts = normalize(path);
    const name = parts.pop();
    if (!name)
      throw new VfsError(`Ungültiger Pfad (kein Dateiname): "${path}"`);
    return { parentParts: parts, name };
  }

  /** Liefert den absoluten Pfad ("/a/b/c") eines Knotens. */
  getPath(node: VNode | NodeId): string {
    const target = typeof node === "string" ? this.nodes.get(node) : node;
    if (!target) throw new VfsNotFoundError(String(node));
    const segments: string[] = [];
    let current: VNode | undefined = target;
    while (current && current.id !== this.rootId) {
      segments.unshift(current.name);
      current = current.parentId ? this.nodes.get(current.parentId) : undefined;
    }
    return "/" + segments.join("/");
  }

  // ---------------------------------------------------------------------
  // Lookup / Existenz
  // ---------------------------------------------------------------------

  resolveNode(path: string): VNode | undefined {
    const parts = normalize(path);
    if (parts.length === 0) return this.root;
    const name = parts.pop()!;
    const parent = this.resolveFolder(parts);
    if (!parent) return undefined;
    const id = parent.children.find(
      (cid) => this.nodes.get(cid)!.name === name,
    );
    return id ? this.nodes.get(id) : undefined;
  }

  exists(path: string): boolean {
    return this.resolveNode(path) !== undefined;
  }

  isFile(path: string): boolean {
    return this.resolveNode(path)?.type === "file";
  }

  isFolder(path: string): boolean {
    return this.resolveNode(path)?.type === "folder";
  }

  stat(path: string): VNode {
    const node = this.resolveNode(path);
    if (!node) throw new VfsNotFoundError(path);
    return node;
  }

  // ---------------------------------------------------------------------
  // Ordner
  // ---------------------------------------------------------------------

  createFolder(path: string, options: CreateFolderOptions = {}): FolderNode {
    const parts = normalize(path);
    let current: FolderNode = this.root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const existingId = current.children.find(
        (id) => this.nodes.get(id)!.name === part,
      );

      if (existingId) {
        const existing = this.nodes.get(existingId)!;
        if (existing.type !== "folder") {
          throw new VfsError(
            `Pfadsegment "${part}" ist eine Datei, kein Ordner`,
          );
        }
        current = existing;
        continue;
      }

      if (!options.recursive && i < parts.length - 1) {
        throw new VfsNotFoundError("/" + parts.slice(0, i + 1).join("/"));
      }

      const now = Date.now();
      const folder: FolderNode = {
        id: generateId(),
        name: part,
        type: "folder",
        parentId: current.id,
        createdAt: now,
        updatedAt: now,
        children: [],
      };
      this.nodes.set(folder.id, folder);
      current.children.push(folder.id);
      current.updatedAt = now;
      this.emit("create", this.getPath(folder), folder);
      current = folder;
    }

    return current;
  }

  /** Liefert die direkten Kind-Knoten eines Ordners. */
  list(path: string = "/"): VNode[] {
    const node = this.resolveNode(path);
    if (!node) throw new VfsNotFoundError(path);
    if (node.type !== "folder") throw new VfsError(`Kein Ordner: ${path}`);
    return node.children.map((id) => this.nodes.get(id)!);
  }

  /** Liefert eine verschachtelte, JSON-freundliche Baumstruktur (z.B. für eine Sidebar). */
  getTree(path: string = "/"): TreeEntry {
    const node = this.resolveNode(path);
    if (!node) throw new VfsNotFoundError(path);
    return this.toTreeEntry(node);
  }

  private toTreeEntry(node: VNode): TreeEntry {
    const path = this.getPath(node);
    if (node.type === "file") {
      return {
        type: "file",
        id: node.id,
        name: node.name,
        path,
        size: node.content.byteLength,
        mimeType: node.mimeType,
        createdAt: node.createdAt,
        updatedAt: node.updatedAt,
      };
    }
    return {
      type: "folder",
      id: node.id,
      name: node.name,
      path,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
      children: node.children.map((id) =>
        this.toTreeEntry(this.nodes.get(id)!),
      ),
    };
  }

  // ---------------------------------------------------------------------
  // Dateien
  // ---------------------------------------------------------------------

  createFile(
    path: string,
    content: string | Uint8Array = new Uint8Array(0),
    options: CreateFileOptions = {},
  ): FileNode {
    const { parentParts, name } = this.splitParentAndName(path);

    const parentFolder = options.recursive
      ? this.createFolder("/" + parentParts.join("/"), { recursive: true })
      : this.resolveFolder(parentParts);

    if (!parentFolder) throw new VfsNotFoundError("/" + parentParts.join("/"));

    const data = toBytes(content);
    const existingId = parentFolder.children.find(
      (id) => this.nodes.get(id)!.name === name,
    );

    if (existingId) {
      const existing = this.nodes.get(existingId)!;
      if (existing.type !== "file")
        throw new VfsError(`"${name}" ist ein Ordner, keine Datei`);
      if (!options.overwrite) throw new VfsExistsError(path);
      existing.content = data;
      existing.mimeType = options.mimeType ?? existing.mimeType;
      existing.updatedAt = Date.now();
      this.emit("update", this.getPath(existing), existing);
      return existing;
    }

    const now = Date.now();
    const file: FileNode = {
      id: generateId(),
      name,
      type: "file",
      parentId: parentFolder.id,
      content: data,
      mimeType: options.mimeType,
      createdAt: now,
      updatedAt: now,
    };
    this.nodes.set(file.id, file);
    parentFolder.children.push(file.id);
    parentFolder.updatedAt = now;
    this.emit("create", this.getPath(file), file);
    return file;
  }

  readFile(path: string, as: "text"): string;
  readFile(path: string, as?: "binary"): Uint8Array;
  readFile(
    path: string,
    as: "text" | "binary" = "binary",
  ): string | Uint8Array {
    const node = this.resolveNode(path);
    if (!node) throw new VfsNotFoundError(path);
    if (node.type !== "file") throw new VfsError(`Kein Datei-Knoten: ${path}`);
    return as === "text" ? textDecoder.decode(node.content) : node.content;
  }

  writeFile(
    path: string,
    content: string | Uint8Array,
    options: WriteFileOptions = {},
  ): FileNode {
    const shouldCreate = options.create ?? true;
    const node = this.resolveNode(path);

    if (node) {
      if (node.type !== "file")
        throw new VfsError(`Kein Datei-Knoten: ${path}`);
      node.content = toBytes(content);
      node.mimeType = options.mimeType ?? node.mimeType;
      node.updatedAt = Date.now();
      this.emit("update", path, node);
      return node;
    }

    if (!shouldCreate) throw new VfsNotFoundError(path);
    return this.createFile(path, content, {
      mimeType: options.mimeType,
      recursive: true,
    });
  }

  // ---------------------------------------------------------------------
  // Löschen / Umbenennen / Verschieben / Kopieren
  // ---------------------------------------------------------------------

  delete(path: string): void {
    const parts = normalize(path);
    if (parts.length === 0)
      throw new VfsError("Root-Ordner kann nicht gelöscht werden");
    const name = parts.pop()!;
    const parent = this.resolveFolder(parts);
    if (!parent) throw new VfsNotFoundError(path);

    const idx = parent.children.findIndex(
      (id) => this.nodes.get(id)!.name === name,
    );
    if (idx === -1) throw new VfsNotFoundError(path);

    const node = this.nodes.get(parent.children[idx])!;
    parent.children.splice(idx, 1);
    parent.updatedAt = Date.now();

    this.removeSubtree(node);
    this.emit("delete", path, node);
  }

  private removeSubtree(node: VNode): void {
    if (node.type === "folder") {
      for (const childId of node.children) {
        this.removeSubtree(this.nodes.get(childId)!);
      }
    }
    this.nodes.delete(node.id);
  }

  rename(path: string, newName: string): VNode {
    const node = this.resolveNode(path);
    if (!node) throw new VfsNotFoundError(path);
    const parent = node.parentId
      ? (this.nodes.get(node.parentId) as FolderNode)
      : this.root;

    const collision = parent.children.some(
      (id) => id !== node.id && this.nodes.get(id)!.name === newName,
    );
    if (collision)
      throw new VfsExistsError(`${this.getPath(parent)}/${newName}`);

    node.name = newName;
    node.updatedAt = Date.now();
    this.emit("rename", this.getPath(node), node);
    return node;
  }

  /** Verschiebt (und/oder benennt um) einen Knoten. `destinationPath` ist der volle Zielpfad. */
  move(sourcePath: string, destinationPath: string): VNode {
    const node = this.resolveNode(sourcePath);
    if (!node) throw new VfsNotFoundError(sourcePath);

    const oldParent = node.parentId
      ? (this.nodes.get(node.parentId) as FolderNode)
      : this.root;
    const { parentParts, name } = this.splitParentAndName(destinationPath);
    const newParent = this.resolveFolder(parentParts);
    if (!newParent) throw new VfsNotFoundError("/" + parentParts.join("/"));

    if (newParent.children.some((id) => this.nodes.get(id)!.name === name)) {
      throw new VfsExistsError(destinationPath);
    }

    oldParent.children = oldParent.children.filter((id) => id !== node.id);
    oldParent.updatedAt = Date.now();

    node.name = name;
    node.parentId = newParent.id;
    node.updatedAt = Date.now();
    newParent.children.push(node.id);
    newParent.updatedAt = Date.now();

    this.emit("move", destinationPath, node);
    return node;
  }

  copy(sourcePath: string, destinationPath: string): VNode {
    const node = this.resolveNode(sourcePath);
    if (!node) throw new VfsNotFoundError(sourcePath);
    const { parentParts, name } = this.splitParentAndName(destinationPath);
    const newParent = this.resolveFolder(parentParts);
    if (!newParent) throw new VfsNotFoundError("/" + parentParts.join("/"));
    if (newParent.children.some((id) => this.nodes.get(id)!.name === name)) {
      throw new VfsExistsError(destinationPath);
    }
    const clone = this.cloneSubtree(node, newParent.id, name);
    newParent.children.push(clone.id);
    newParent.updatedAt = Date.now();
    this.emit("create", destinationPath, clone);
    return clone;
  }

  private cloneSubtree(node: VNode, parentId: NodeId, name: string): VNode {
    const now = Date.now();
    if (node.type === "file") {
      const clone: FileNode = {
        id: generateId(),
        name,
        type: "file",
        parentId,
        content: node.content.slice(),
        mimeType: node.mimeType,
        createdAt: now,
        updatedAt: now,
      };
      this.nodes.set(clone.id, clone);
      return clone;
    }
    const clone: FolderNode = {
      id: generateId(),
      name,
      type: "folder",
      parentId,
      createdAt: now,
      updatedAt: now,
      children: [],
    };
    this.nodes.set(clone.id, clone);
    for (const childId of node.children) {
      const child = this.nodes.get(childId)!;
      const childClone = this.cloneSubtree(child, clone.id, child.name);
      clone.children.push(childClone.id);
    }
    return clone;
  }

  // ---------------------------------------------------------------------
  // Suche
  // ---------------------------------------------------------------------

  /** Durchsucht rekursiv (ab `path`) nach Knoten, deren Name das Muster enthält. */
  find(query: string | RegExp, path: string = "/"): VNode[] {
    const start = this.resolveNode(path);
    if (!start) throw new VfsNotFoundError(path);
    const matches: VNode[] = [];
    const matcher =
      typeof query === "string"
        ? (n: string) => n.includes(query)
        : (n: string) => query.test(n);

    const walk = (node: VNode) => {
      if (matcher(node.name)) matches.push(node);
      if (node.type === "folder") {
        for (const childId of node.children) walk(this.nodes.get(childId)!);
      }
    };
    walk(start);
    return matches;
  }

  // ---------------------------------------------------------------------
  // ZIP Export / Import
  // ---------------------------------------------------------------------

  /** Exportiert einen Ordner (Default: Root) als ZIP-Binärdaten. */
  exportToZip(path: string = "/"): Uint8Array {
    const node = this.resolveNode(path);
    if (!node) throw new VfsNotFoundError(path);
    if (node.type !== "folder") throw new VfsError(`Kein Ordner: ${path}`);

    const files: Record<string, Uint8Array> = {};

    const walk = (folder: FolderNode, prefix: string) => {
      if (folder.children.length === 0 && prefix !== "") {
        files[`${prefix}/`] = new Uint8Array(0);
        return;
      }
      for (const childId of folder.children) {
        const child = this.nodes.get(childId)!;
        const childPath = prefix ? `${prefix}/${child.name}` : child.name;
        if (child.type === "folder") {
          walk(child, childPath);
        } else {
          files[childPath] = child.content;
        }
      }
    };

    walk(node, "");
    return zipSync(files, { level: 6 });
  }

  /** Importiert ZIP-Binärdaten in den angegebenen Zielordner (Default: '/'). */
  importFromZip(
    data: Uint8Array | ArrayBuffer,
    options: ImportZipOptions = {},
  ): void {
    const targetPath = options.targetPath ?? "/";
    const overwrite = options.overwrite ?? true;
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);

    this.createFolder(targetPath, { recursive: true });
    const entries = unzipSync(bytes);

    // Ordner zuerst anlegen, damit auch leere Ordner erhalten bleiben.
    const sortedPaths = Object.keys(entries).sort(
      (a, b) => a.split("/").length - b.split("/").length,
    );

    for (const entryPath of sortedPaths) {
      const content = entries[entryPath];
      const fullPath = joinPath(targetPath, entryPath);

      if (entryPath.endsWith("/")) {
        this.createFolder(fullPath, { recursive: true });
      } else {
        this.createFile(fullPath, content, { overwrite, recursive: true });
      }
    }
  }

  // ---------------------------------------------------------------------
  // Persistenz (unabhängig von ZIP, z.B. für localStorage/IndexedDB)
  // ---------------------------------------------------------------------

  toJSON(): SerializedVfs {
    const nodes: SerializedVfs["nodes"] = [];
    for (const node of this.nodes.values()) {
      if (node.type === "file") {
        nodes.push({ ...node, content: bytesToBase64(node.content) });
      } else {
        nodes.push(node);
      }
    }
    return { rootId: this.rootId, nodes };
  }

  static fromJSON(data: SerializedVfs): VirtualFileSystem {
    const vfs = new VirtualFileSystem();
    vfs.nodes.clear();
    vfs.rootId = data.rootId;
    for (const node of data.nodes) {
      if (node.type === "file") {
        vfs.nodes.set(node.id, {
          ...node,
          content: base64ToBytes(node.content),
        });
      } else {
        vfs.nodes.set(node.id, node);
      }
    }
    return vfs;
  }
}

function joinPath(...segments: string[]): string {
  return (
    "/" +
    segments
      .map((s) => normalize(s).join("/"))
      .filter(Boolean)
      .join("/")
  );
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++)
    binary += String.fromCharCode(bytes[i]);
  return typeof btoa === "function"
    ? btoa(binary)
    : Buffer.from(bytes).toString("base64");
}

function base64ToBytes(base64: string): Uint8Array {
  if (typeof atob === "function") {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  return new Uint8Array(Buffer.from(base64, "base64"));
}
