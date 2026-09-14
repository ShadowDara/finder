export class VfsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VfsError';
  }
}

export class VfsNotFoundError extends VfsError {
  constructor(path: string) {
    super(`Pfad nicht gefunden: ${path}`);
    this.name = 'VfsNotFoundError';
  }
}

export class VfsExistsError extends VfsError {
  constructor(path: string) {
    super(`Pfad existiert bereits: ${path}`);
    this.name = 'VfsExistsError';
  }
}
