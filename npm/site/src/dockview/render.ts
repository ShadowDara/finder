import {
  createDockview,
  type CreateComponentOptions,
  type IContentRenderer,
} from "dockview";

import {
  EditorPanel,
  ExplorerPanel,
  TerminalPanel,
  WelcomePanel,
} from "./panels";

export default function renderDockview(el: HTMLDivElement) {
  const api = createDockview(el, {
    createComponent(options: CreateComponentOptions): IContentRenderer {
      switch (options.name) {
        case "explorer":
          return new ExplorerPanel();

        case "editor":
          return new EditorPanel();

        case "terminal":
          return new TerminalPanel();

        case "welcome":
          return new WelcomePanel();

        default:
          throw new Error(`Unknown component: ${options.name}`);
      }
    },
  });

  /*
   * ==========================
   * Editor
   * ==========================
   */

  const editor = api.addPanel({
    id: "editor",
    component: "editor",
    title: "main.ts",
  });

  /*
   * ==========================
   * Terminal
   * ==========================
   */

  api.addPanel({
    id: "terminal",
    component: "terminal",
    title: "Terminal",

    position: {
      referencePanel: editor,
      direction: "below",
    },
  });

  /*
   * ==========================
   * Explorer
   * ==========================
   */

  api.addPanel({
    id: "explorer",
    component: "explorer",
    title: "Explorer",

    position: {
      referencePanel: editor,
      direction: "left",
    },
  });

  /*
   * ==========================
   * Welcome
   * ==========================
   */

  const welcome = api.addPanel({
    id: "welcome",
    component: "welcome",
    title: "Welcome",
  });

  // Nicht sichtbar lassen
  welcome.api.close();

  // Editor aktivieren
  editor.api.setActive();

  return api;
}
