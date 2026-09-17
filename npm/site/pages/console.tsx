import { jsx } from "twynejs/jsx-runtime";
import { SERVER_ADRESS } from "../src/vars";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import "./console.css";

interface StartResponse {
  session_id: string;
}

interface VerifyResponse {
  token: string;
}

interface WsMessage {
  type: "output" | "error";
  data?: string;
}

let ws: WebSocket | null = null;
let term: Terminal | null = null;
let fitAddon: FitAddon | null = null;
let sessionId = "";
let token = "";

// ---------------------------------------------------------------------------
// Dev/Prod adress helper
// ---------------------------------------------------------------------------

function k(address: string): string {
  if (import.meta.env.DEV) {
    return SERVER_ADRESS + address;
  }
  return address;
}

function wsUrl(path: string): string {
  const base = import.meta.env.DEV ? SERVER_ADRESS : window.location.origin;
  const proto = base.startsWith("https") ? "wss" : "ws";
  return proto + base.replace(/^https?/, "") + path;
}

// ---------------------------------------------------------------------------
// Page render
// ---------------------------------------------------------------------------

export default function render(el: HTMLDivElement) {
  el.innerHTML = renderAuth();
  bindAuth(el);
}

function renderAuth(): string {
  return (
    <main class="console-page">
      <header class="console-header">
        <div class="console-title">
          <span class="console-logo"></span>
          Findergen Console
        </div>
        <div class="console-status" id="console-status">
          idle
        </div>
      </header>

      <section class="console-auth" id="console-auth">
        <div class="auth-card">
          <div class="auth-icon">🔐</div>
          <h1>Console Session</h1>
          <p>
            Starte eine Session — der Server druckt einen{" "}
            <strong>6-stelligen Code</strong> in sein Terminal. Gib ihn hier
            ein, um Zugriff auf die Shell zu bekommen.
          </p>

          <button class="auth-btn" id="btn-start" type="button">
            Session starten
          </button>

          <div class="auth-code" id="auth-code" hidden>
            <label htmlFor="code-input">Code aus dem Server-Terminal</label>
            <div class="auth-code-row">
              <input
                id="code-input"
                type="text"
                inputmode="numeric"
                maxlength="6"
                placeholder="______"
                autocomplete="one-time-code"
              />
              <button class="auth-btn" id="btn-verify" type="button" disabled>
                Bestätigen
              </button>
            </div>
            <p class="auth-error" id="auth-error" hidden></p>
          </div>
        </div>
      </section>

      <section class="console-term-wrap" id="console-term-wrap" hidden>
        <div class="console-toolbar">
          <button class="tool-btn" id="btn-close" type="button">
            ✕ Session beenden
          </button>
        </div>
        <div class="term" id="term"></div>
      </section>
    </main>
  );
}

function bindAuth(el: HTMLDivElement): void {
  const startBtn = el.querySelector<HTMLButtonElement>("#btn-start")!;
  const authCode = el.querySelector<HTMLDivElement>("#auth-code")!;
  const codeInput = el.querySelector<HTMLInputElement>("#code-input")!;
  const verifyBtn = el.querySelector<HTMLButtonElement>("#btn-verify")!;
  const authError = el.querySelector<HTMLParagraphElement>("#auth-error")!;
  const status = el.querySelector<HTMLDivElement>("#console-status")!;

  const setStatus = (
    s: string,
    state?: "connecting" | "connected" | "error",
  ) => {
    status.textContent = s;
    if (state) {
      status.dataset.state = state;
    }
  };

  startBtn.addEventListener("click", async () => {
    startBtn.disabled = true;
    setStatus("starting…");
    try {
      const res = await fetch(k("/api/console/start"), {
        method: "POST",
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = (await res.json()) as StartResponse;
      sessionId = data.session_id;
      authCode.hidden = false;
      startBtn.hidden = true;
      codeInput.focus();
      setStatus("warte auf Code…");
      authError.hidden = true;
    } catch (e) {
      console.error(e);
      startBtn.disabled = false;
      setStatus("fehler");
      authError.textContent = "Konnte Session nicht starten. Läuft der Server?";
      authError.hidden = false;
    }
  });

  const verify = async () => {
    const code = codeInput.value.trim();
    if (code.length !== 6) return;
    verifyBtn.disabled = true;
    setStatus("verifiziere…");
    try {
      const res = await fetch(k("/api/console/verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, code }),
      });
      if (!res.ok) {
        const errText = await res.text();
        authError.textContent = errText || "Falscher Code. Versuche es erneut.";
        authError.hidden = false;
        verifyBtn.disabled = false;
        setStatus("verifizierung fehlgeschlagen");
        return;
      }
      const data = (await res.json()) as VerifyResponse;
      token = data.token;
      authError.hidden = true;
      openTerminal(el);
    } catch (e) {
      console.error(e);
      verifyBtn.disabled = false;
      authError.textContent = "Server nicht erreichbar.";
      authError.hidden = false;
      setStatus("fehler");
    }
  };

  verifyBtn.addEventListener("click", verify);
  codeInput.addEventListener("input", () => {
    codeInput.value = codeInput.value.replace(/\D/g, "").slice(0, 6);
    verifyBtn.disabled = codeInput.value.length !== 6;
    authError.hidden = true;
  });
  codeInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && codeInput.value.length === 6) verify();
  });
}

function openTerminal(el: HTMLDivElement): void {
  const auth = el.querySelector<HTMLElement>("#console-auth")!;
  const wrap = el.querySelector<HTMLElement>("#console-term-wrap")!;
  const status = el.querySelector<HTMLDivElement>("#console-status")!;
  const termEl = el.querySelector<HTMLDivElement>("#term")!;
  auth.hidden = true;
  wrap.hidden = false;
  status.textContent = "verbinden…";
  status.dataset.state = "connecting";

  // --- xterm.js setup ---
  term = new Terminal({
    cursorBlink: true,
    convertEol: false,
    fontFamily:
      'ui-monospace, "Cascadia Code", "Courier New", Consolas, monospace',
    fontSize: 14,
    lineHeight: 1.25,
    theme: {
      background: "#010409",
      foreground: "#e6edf3",
      cursor: "#3fb950",
      selectionBackground: "#264f78",
      black: "#010409",
      red: "#f85149",
      green: "#3fb950",
      yellow: "#d29922",
      blue: "#58a6ff",
      magenta: "#bc8cff",
      cyan: "#39c5cf",
      white: "#e6edf3",
      brightBlack: "#484f58",
      brightRed: "#ff7b72",
      brightGreen: "#56d364",
      brightYellow: "#e3b341",
      brightBlue: "#79c0ff",
      brightMagenta: "#d2a8ff",
      brightCyan: "#56d4dd",
      brightWhite: "#f0f6fc",
    },
  });

  fitAddon = new FitAddon();
  term.loadAddon(fitAddon);
  term.open(termEl);
  fitAddon.fit();

  const url = wsUrl("/api/console/ws?token=" + encodeURIComponent(token));
  ws = new WebSocket(url);

  const sendResize = () => {
    if (!term) return;
    const { cols, rows } = term;
    ws?.send(JSON.stringify({ type: "resize", cols, rows }));
  };

  ws.onopen = () => {
    status.textContent = "verbunden";
    status.dataset.state = "connected";
    sendResize();
    term?.focus();
  };
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data) as WsMessage;
    if (msg.type === "output" && msg.data) {
      const bin = atob(msg.data);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      term?.write(new TextDecoder("utf-8").decode(bytes));
    } else if (msg.type === "error") {
      status.textContent = "fehler";
      status.dataset.state = "error";
    }
  };
  ws.onclose = () => {
    status.textContent = "getrennt";
    status.dataset.state = "error";
    term?.write("\r\n\x1b[31m[Session beendet]\x1b[0m\r\n");
  };
  ws.onerror = () => {
    status.textContent = "fehler";
    status.dataset.state = "error";
  };

  // term input → WebSocket
  term.onData((data) => {
    ws?.send(JSON.stringify({ type: "input", data }));
  });

  // resize → WebSocket
  let resizeTimer: ReturnType<typeof setTimeout> | null = null;
  const onResize = () => {
    fitAddon?.fit();
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(sendResize, 150);
  };
  window.addEventListener("resize", onResize);

  const closeBtn = el.querySelector<HTMLButtonElement>("#btn-close")!;
  const cleanup = () => {
    ws?.close();
    ws = null;
    window.removeEventListener("resize", onResize);
    term?.dispose();
    term = null;
    fitAddon = null;
    auth.hidden = false;
    wrap.hidden = true;
    status.textContent = "idle";
    status.dataset.state = "";
  };
  closeBtn.addEventListener("click", cleanup);
}
