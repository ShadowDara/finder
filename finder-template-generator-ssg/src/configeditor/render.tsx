import {
  renderConfigEditor,
  setupConfigEditor,
  loadSavedValues,
} from "./editor";
import type { ConfigSchema } from "./types";

const EDITOR_ID = "app-config";

const schema: ConfigSchema = {
  title: "Finder Config",
  description: "More infos about it here",
  // kein saveUrl -> setupConfigEditor speichert automatisch in localStorage
  fields: [
    // { key: "name", type: "string", label: "Name", default: "", required: true },
    {
      key: "port",
      type: "number",
      label: "Port",
      default: 8080,
      min: 1,
      max: 65535,
    },
    {
      key: "cache",
      type: "boolean",
      label: "Cache",
      default: false,
    },
    {
      key: "create_cache_db",
      type: "boolean",
      label: "Create Cache Database",
      default: false,
    },
    // { key: "debug", type: "boolean", label: "Debug-Modus", default: false },
    // {
    //   key: "logLevel",
    //   type: "select",
    //   label: "Log-Level",
    //   default: "info",
    //   options: [
    //     { label: "Error", value: "error" },
    //     { label: "Warn", value: "warn" },
    //     { label: "Info", value: "info" },
    //     { label: "Debug", value: "debug" },
    //   ],
    // },
    // {
    //   key: "database",
    //   type: "group",
    //   label: "Datenbank",
    //   fields: [
    //     { key: "host", type: "string", label: "Host", default: "localhost" },
    //     {
    //       key: "poolSize",
    //       type: "number",
    //       label: "Pool-Größe",
    //       default: 10,
    //       min: 1,
    //     },
    //   ],
    // },
  ],
};

export default function render(el: HTMLDivElement) {
  const values = loadSavedValues(EDITOR_ID);

  el.innerHTML = renderConfigEditor(schema, { id: EDITOR_ID, values });

  setupConfigEditor(EDITOR_ID, {
    onSave: (payload, id) => {
      console.log("saved:", id, payload);
    },
  });
}
