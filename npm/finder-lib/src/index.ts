// finder lib for ts
// to validate templates in TS

// Version which is fitting with the finder version

export interface Template {
  min_version?: string;
  description?: string;
  tags?: string[];
  name: string;
  folders?: Folder[];
  files?: File[];
  command?: string;
  invert_command?: boolean;
  size?: Size;
}

export interface Folder {
  name: string;
  folders?: Folder[];
  files?: File[];
  command?: string;
  invert_command?: boolean;
  size?: Size;
}

export interface File {
  name: string;
  existence?: string;
  size?: Size;
  checksums?: Checksums;
}

export interface Size {
  mix?: number;
  max?: number;
  min_size_type?: string;
  max_size_type?: string;
}

export interface Checksums {
  sha256?: string;
  sha512?: string;
}

// ALL Versions

export namespace v0_3_16 {
  export interface Template {
    min_version?: string;
    description?: string;
    tags?: string[];
    name: string;
    folders?: Folder[];
    files?: File[];
    command?: string;
    invert_command?: boolean;
    size?: Size;
  }

  export interface Folder {
    name: string;
    folders?: Folder[];
    files?: File[];
    command?: string;
    invert_command?: boolean;
    size?: Size;
  }

  export interface File {
    name: string;
    existence?: string;
    size?: Size;
    checksums?: Checksums;
  }

  export interface Size {
    mix?: number;
    max?: number;
    min_size_type?: string;
    max_size_type?: string;
  }

  export interface Checksums {
    sha256?: string;
    sha512?: string;
  }
}

export namespace v0_3_17 {
  export interface Template {
    min_version?: string;
    description?: string;
    tags?: string[];
    name: string;
    folders?: Folder[];
    files?: File[];
    command?: string;
    invert_command?: boolean;
    size?: Size;
    mdnote?: string;
  }

  export interface Folder {
    name: string;
    folders?: Folder[];
    files?: File[];
    command?: string;
    invert_command?: boolean;
    size?: Size;
  }

  export interface File {
    name: string;
    existence?: string;
    size?: Size;
    checksums?: Checksums;
  }

  export interface Size {
    mix?: number;
    max?: number;
    min_size_type?: string;
    max_size_type?: string;
  }

  export interface Checksums {
    sha256?: string;
    sha512?: string;
  }
}
