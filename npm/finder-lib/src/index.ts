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
export namespace versions {
  // Version v0.0.0
  export namespace v0_0_0 {
    export type template = Folder;

    export interface Folder {
      name: string;
      folders?: Folder[];
      files?: string[];
    }
  }

  // Version v0.3.1
  export namespace v0_3_1 {
    export interface Template {
      description?: string;
      tags?: string[];
      name: string;
      folders?: Folder[];
      files?: string[];
      command?: string;
      invert_command?: boolean;
    }

    export interface Folder {
      name: string;
      folders?: Folder[];
      files?: File[];
      command?: string;
      invert_command?: boolean;
    }
  }

  // Version v0.3.3
  export namespace v0_3_3 {
    export interface Template {
      description?: string;
      tags?: string[];
      name: string;
      folders?: Folder[];
      files?: string[] | File[];
      command?: string;
      invert_command?: boolean;
    }

    export interface Folder {
      name: string;
      folders?: Folder[];
      files?: File[] | string[];
      command?: string;
      invert_command?: boolean;
    }

    export interface File {
      name?: string;
      existence?: string;
    }
  }

  // Version v0.3.6
  export namespace v0_3_6 {
    export interface Template {
      min_version?: string;
      description?: string;
      tags?: string[];
      name: string;
      folders?: Folder[];
      files?: File[] | string[];
      command?: string;
      invert_command?: boolean;
    }

    export interface Folder {
      name: string;
      folders?: Folder[];
      files?: File[] | string[];
      command?: string;
      invert_command?: boolean;
    }

    export interface File {
      name: string;
      existence?: string;
    }
  }

  // Version v0.3.15
  export namespace v0_3_15 {
    export interface Template {
      min_version?: string;
      description?: string;
      tags?: string[];
      name: string;
      folders?: Folder[];
      files?: File[] | string[];
      command?: string;
      invert_command?: boolean;
      size?: Size;
    }

    export interface Folder {
      name: string;
      folders?: Folder[];
      files?: File[] | string[];
      command?: string;
      invert_command?: boolean;
      size?: Size;
    }

    export interface File {
      name: string;
      existence?: string;
      size?: Size;
    }

    export interface Size {
      mix?: number;
      max?: number;
      min_size_type?: string;
      max_size_type?: string;
    }
  }

  // Version v0.3.16
  export namespace v0_3_16 {
    export interface Template {
      min_version?: string;
      description?: string;
      tags?: string[];
      name: string;
      folders?: Folder[];
      files?: File[] | string[];
      command?: string;
      invert_command?: boolean;
      size?: Size;
    }

    export interface Folder {
      name: string;
      folders?: Folder[];
      files?: File[] | string[];
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

  // Version v0.3.17
  export namespace v0_3_17 {
    export interface Template {
      min_version?: string;
      description?: string;
      tags?: string[];
      name: string;
      folders?: Folder[];
      files?: File[] | string[];
      command?: string;
      invert_command?: boolean;
      size?: Size;
      mdnote?: string;
    }

    export interface Folder {
      name: string;
      folders?: Folder[];
      files?: File[] | string[];
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
}
