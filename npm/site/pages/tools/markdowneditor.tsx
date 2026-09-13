import { jsx, raw } from "../../src/jsx-runtime";
import { parseMarkdown, parseMarkdownToDocument } from "@shadowdara/dlib";
// import { SERVER_ADRESS } from "../../src/vars";
import "./markdowneditor.css";

// interface NoteResponse {
//   content: string;
// }

// function getApiUrl(path: string): string {
//   return import.meta.env.DEV ? `${SERVER_ADRESS}${path}` : path;
// }

export default function render(el: HTMLDivElement) {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug") ?? params.get("id") ?? "0";
  const noteName = params.get("name") ?? `Note ${slug}`;
  let viewOnly = true;
  let rawMarkdown = "";
  //   let saved = "Not saved yet";

  el.innerHTML = (
    <main>
      <h1>Markdown Notes</h1>
      <div class="container">
        <textarea id="notetext" hidden={viewOnly}>
          # This is Markdown Press{"\n\n"}CTRL + E to swtich the view mode
        </textarea>
        <article id="preview" class="viewonly"></article>
      </div>
      <div class="inline">
        {/* <button id="save-note" type="button">
          Save
        </button> */}
        <button id="toggle-view" type="button">
          Edit
        </button>
        <button id="export-note" type="button">
          Export
        </button>
        {/* <span id="save-status">{saved}</span> */}
      </div>
    </main>
  );

  const textarea = el.querySelector<HTMLTextAreaElement>("#notetext")!;
  const preview = el.querySelector<HTMLElement>("#preview")!;
  const toggleButton = el.querySelector<HTMLButtonElement>("#toggle-view")!;
  //   const status = el.querySelector<HTMLElement>("#save-status")!;

  function updatePreview(): void {
    preview.innerHTML = raw(parseMarkdown(rawMarkdown)).toString();
  }

  function setViewOnly(next: boolean): void {
    viewOnly = next;
    textarea.hidden = viewOnly;
    preview.classList.toggle("viewonly", viewOnly);
    toggleButton.textContent = viewOnly ? "Edit" : "View";
    if (!viewOnly) textarea.focus();
  }

  //   async function loadNote(): Promise<void> {
  //     try {
  //       const response = await fetch(
  //         getApiUrl(`/api/notes/${encodeURIComponent(slug)}`),
  //       );
  //       if (!response.ok) throw new Error(`HTTP ${response.status}`);
  //       const note = (await response.json()) as NoteResponse;
  //       rawMarkdown = atob(note.content);
  //     } catch (error) {
  //       console.warn("Could not load note; starting with an empty note.", error);
  //       rawMarkdown = `# ${noteName}\n\nWrite your note here.`;
  //     }
  //     textarea.value = rawMarkdown;
  //     updatePreview();
  //   }

  //   async function saveNote(): Promise<void> {
  //     try {
  //       const response = await fetch(
  //         getApiUrl(`/api/notes/${encodeURIComponent(slug)}`),
  //         {
  //           method: "PUT",
  //           headers: { "Content-Type": "application/json" },
  //           body: JSON.stringify({ content: btoa(rawMarkdown) }),
  //         },
  //       );
  //       if (!response.ok) throw new Error(`HTTP ${response.status}`);
  //       saved = `Saved at ${new Date().toLocaleTimeString()}`;
  //       status.textContent = saved;
  //     } catch (error) {
  //       saved = "Save failed";
  //       status.textContent = saved;
  //       console.error("Could not save note", error);
  //     }
  //   }

  function exportHTML(): void {
    const html = `<!-- Markdown Note -->${parseMarkdownToDocument(rawMarkdown)}`;
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${noteName}_export.html`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleKeydown(event: KeyboardEvent): void {
    // if (event.ctrlKey && event.key.toLowerCase() === "s") {
    //   event.preventDefault();
    //   //   void saveNote();
    // }
    if (event.ctrlKey && event.key.toLowerCase() === "e") {
      event.preventDefault();
      setViewOnly(!viewOnly);
    }
  }

  textarea.addEventListener("input", () => {
    rawMarkdown = textarea.value;
    updatePreview();
  });
  toggleButton.addEventListener("click", () => setViewOnly(!viewOnly));
  //   el.querySelector<HTMLButtonElement>("#save-note")!.addEventListener(
  //     "click",
  //     () => void saveNote(),
  //   );
  el.querySelector<HTMLButtonElement>("#export-note")!.addEventListener(
    "click",
    exportHTML,
  );
  window.addEventListener("keydown", handleKeydown);
  //   void loadNote();

  rawMarkdown = textarea.value;
  updatePreview();
}
