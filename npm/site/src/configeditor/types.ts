export type BuiltinFieldType =
  | "string"
  | "textarea"
  | "number"
  | "boolean"
  | "select"
  | "multiselect"
  | "color"
  | "date"
  | "json"
  | "group";

export interface SelectOption {
  label: string;
  value: string;
}

/**
 * Basis-Shape für ein Feld. Bewusst offen gehalten, damit eigene Feldtypen
 * beliebige Zusatz-Properties mitbringen können (min/max bei "number",
 * options bei "select", fields bei "group", ...).
 */
export interface ConfigField {
  /** Eindeutiger Key innerhalb der aktuellen Ebene, z.B. "port" */
  key: string;
  /** Anzeigename, fällt sonst auf `key` zurück */
  label?: string;
  /** Beschreibungstext unter dem Label */
  description?: string;
  /** Default-Wert, wird als "Standard: ..." angezeigt + für Reset genutzt */
  default?: unknown;
  /** Aktueller Wert (überschreibt default beim initialen Rendern) */
  value?: unknown;
  required?: boolean;
  readonly?: boolean;
  type: BuiltinFieldType | (string & {});

  // typ-spezifische, optionale Extras:
  placeholder?: string;
  options?: SelectOption[]; // select / multiselect
  min?: number; // number
  max?: number; // number
  step?: number; // number
  rows?: number; // textarea
  fields?: ConfigField[]; // group (verschachtelt)

  [extra: string]: unknown;
}

export interface ConfigSchema {
  title?: string;
  description?: string;
  fields: ConfigField[];
  /**
   * Optionale URL für einen echten Server. Fehlt sie (Standardfall ohne
   * Backend), landet "Speichern" automatisch in localStorage.
   */
  saveUrl?: string;
  saveMethod?: "POST" | "PUT" | "PATCH";
}
