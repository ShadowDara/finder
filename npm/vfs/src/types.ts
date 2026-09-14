export type NodeId = string;

export interface BaseNode {
  id: NodeId;
  name: string;
  parentId: NodeId | null;
  createdAt: number;
  updatedAt: number;
}

export interface FileNode extends BaseNode {
  type: 'file';
  content: Uint8Array;
  mimeType?: string;
}

export interface FolderNode extends BaseNode {
  type: 'folder';
  children: NodeId[];
}

export type VNode = FileNode | FolderNode;

/** Serialisierbare Baum-Repräsentation, z.B. für ein Editor-Sidebar/Tree-View */
export interface TreeFileEntry {
  type: 'file';
  id: NodeId;
  name: string;
  path: string;
  size: number;
  mimeType?: string;
  createdAt: number;
  updatedAt: number;
}

export interface TreeFolderEntry {
  type: 'folder';
  id: NodeId;
  name: string;
  path: string;
  createdAt: number;
  updatedAt: number;
  children: TreeEntry[];
}

export type TreeEntry = TreeFileEntry | TreeFolderEntry;

export type VfsEventType = 'create' | 'update' | 'delete' | 'move' | 'rename';

export interface VfsEvent {
  type: VfsEventType;
  path: string;
  node: VNode;
}

export type VfsListener = (event: VfsEvent) => void;

export interface CreateFolderOptions {
  /** Fehlende Zwischenordner automatisch anlegen (wie `mkdir -p`) */
  recursive?: boolean;
}

export interface CreateFileOptions {
  mimeType?: string;
  /** Vorhandene Datei überschreiben statt Fehler zu werfen */
  overwrite?: boolean;
  /** Fehlende Zwischenordner automatisch anlegen */
  recursive?: boolean;
}

export interface WriteFileOptions {
  mimeType?: string;
  /** Datei (und ggf. Ordner) anlegen, falls sie noch nicht existiert (Default: true) */
  create?: boolean;
}

export interface ImportZipOptions {
  /** Zielordner im VFS, in den entpackt wird (Default: '/') */
  targetPath?: string;
  /** true = bestehende Dateien überschreiben, false = Fehler bei Konflikt (Default: true) */
  overwrite?: boolean;
}

/** Ebene Repräsentation für Persistenz (z.B. localStorage), unabhängig vom Zip-Format */
export interface SerializedVfs {
  rootId: NodeId;
  nodes: Array<
    | (Omit<FileNode, 'content'> & { content: string /* base64 */ })
    | FolderNode
  >;
}
