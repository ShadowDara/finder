// Ambient module declaration for the `virtual:pages` module the plugin
// provides. Commit this file to your project (it doesn't need to be
// regenerated — its content doesn't depend on which pages actually exist,
// only on the shape of PageEntry/PageModule).
//
// Why a static file instead of relying on the plugin's auto-generated
// `pages.d.ts`: that file is written by the plugin's `configResolved` hook,
// which only runs once Vite itself starts. `tsc -b` runs standalone and
// never triggers Vite, so on a clean checkout `tsc -b && vite build` fails
// before Vite ever gets a chance to write it. Keeping a static copy in
// source control sidesteps the ordering problem completely.
declare module "virtual:pages" {
  export interface PageModule {
    /** Called with the mount element on the client. */
    default: (el: HTMLElement) => void | Promise<void>;
    [key: string]: unknown;
  }

  export interface PageEntry {
    id: string;
    load: () => Promise<PageModule>;
  }

  export const pages: Record<string, PageEntry>;
}
