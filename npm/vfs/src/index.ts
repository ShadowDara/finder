export { VirtualFileSystem } from "../vfs.js";
export { VfsError, VfsNotFoundError, VfsExistsError } from "../errors.js";
export type {
  NodeId,
  VNode,
  FileNode,
  FolderNode,
  TreeEntry,
  TreeFileEntry,
  TreeFolderEntry,
  VfsEvent,
  VfsEventType,
  VfsListener,
  CreateFolderOptions,
  CreateFileOptions,
  WriteFileOptions,
  ImportZipOptions,
  SerializedVfs,
} from "../types.js";
