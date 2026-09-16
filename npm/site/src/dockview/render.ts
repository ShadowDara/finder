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
          return new ExplorerPanel(options);

        case "editor":
          return new EditorPanel(options);

        case "terminal":
          return new TerminalPanel(options);

        case "welcome":
          return new WelcomePanel();

        default:
          throw new Error(`Unknown component: ${options.name}`);
      }
    },
  });

  const editor = api.addPanel({
    id: "editor",
    component: "editor",
    title: "main.ts",
  });

  const explorer = api.addPanel({
    id: "explorer",
    component: "explorer",
    title: "Explorer",
  });

  const terminal = api.addPanel({
    id: "terminal",
    component: "terminal",
    title: "Terminal",
  });

  const welcome = api.addPanel({
    id: "welcome",
    component: "welcome",
    title: "Welcome",
  });

  // Editor als Hauptbereich
  editor.api.setActive();

  // Terminal unter den Editor
  terminal.api.moveTo({
    position: {
      direction: "below",
      referencePanel: editor,
    },
  });

  // Explorer links vom Editor
  explorer.api.moveTo({
    position: {
      direction: "left",
      referencePanel: editor,
    },
  });

  // Welcome zunächst schließen
  welcome.api.close();

  return api;
}
