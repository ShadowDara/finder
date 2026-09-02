// Passe den Import unten an den Pfad deiner JSX-Factory an.
import { jsx, Fragment } from "../src/jsx-runtime";
import "./home.css";

type Os = "mac" | "windows" | "linux";

function detectOs(): Os {
  const ua = navigator.userAgent;
  if (ua.includes("Mac")) return "mac";
  if (ua.includes("Win")) return "windows";
  return "linux";
}

const installCommands: Record<Os, string> = {
  mac: "curl -fsSL https://finder.sh/install | sh",
  linux: "curl -fsSL https://finder.sh/install | sh",
  windows: 'powershell -c "irm finder.sh/install.ps1 | iex"',
};

function Nav() {
  return (
    <header class="nav wrap">
      <div class="logo">
        <span class="logo-mark"></span>
        finder
      </div>
      <nav class="nav-links">
        <a href="#docs">Docs</a>
        <a href="#github">GitHub</a>
        <a href="#changelog">Changelog</a>
      </nav>
    </header>
  );
}

function Terminal({ os }: { os: Os }) {
  const command = installCommands[os];

  const onCopy = async (e: Event) => {
    const btn = e.currentTarget as HTMLButtonElement;
    await navigator.clipboard.writeText(command);
    const original = btn.textContent;
    btn.textContent = "copied";
    setTimeout(() => (btn.textContent = original), 1400);
  };

  return (
    <div class="terminal">
      <div class="terminal-bar">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div class="terminal-body">
        <code>
          <span class="prompt">$</span>
          {command}
        </code>
        <button class="copy-btn" onClick={onCopy}>
          copy
        </button>
      </div>
    </div>
  );
}

function OsRow({ current }: { current: Os }) {
  const labels: Record<Os, string> = {
    mac: "macOS",
    windows: "Windows",
    linux: "Linux",
  };
  const order: Os[] = [
    current,
    ...(["mac", "windows", "linux"] as Os[]).filter((o) => o !== current),
  ];

  return (
    <div class="os-row">
      {order.map((os, i) => (
        <a
          class={i === 0 ? "os-btn primary" : "os-btn"}
          href={`#download-${os}`}
        >
          Download for {labels[os]}
        </a>
      ))}
    </div>
  );
}

function Hero() {
  const os = detectOs();
  return (
    <section class="hero wrap">
      <div class="glow"></div>
      <div class="eyebrow">
        <span class="dot"></span>v2.4 — jetzt mit Fuzzy-Preview
      </div>
      <h1 class="title">
        Finde jede Datei,
        <br />
        <span class="grad">bevor du fertig getippt hast.</span>
      </h1>
      <p class="subtitle">
        Finder ist eine native Desktop-Suche, die Dateiinhalte, Metadaten und
        Ordnerstrukturen in Echtzeit indiziert — ganz ohne Cloud.
      </p>
      <Terminal os={os} />
      <OsRow current={os} />
    </section>
  );
}

const features: { kbd: string; title: string; text: string }[] = [
  {
    kbd: "⌘K",
    title: "Sofortiger Start",
    text: "Ein globaler Shortcut öffnet die Suche aus jeder Anwendung heraus, ohne Wartezeit.",
  },
  {
    kbd: "~2ms",
    title: "Lokaler Index",
    text: "Ergebnisse kommen aus einem Index auf der Festplatte — kein Netzwerk, keine Verzögerung.",
  },
  {
    kbd: "*.{ts,md}",
    title: "Inhaltssuche",
    text: "Durchsucht Dateiinhalte, nicht nur Namen, mit Unterstützung für reguläre Ausdrücke.",
  },
  {
    kbd: "→ Vorschau",
    title: "Direkte Vorschau",
    text: "Bilder, PDFs und Code werden inline angezeigt, bevor du eine Datei öffnest.",
  },
  {
    kbd: "rsync",
    title: "Netzlaufwerke",
    text: "Indiziert auch gemountete Netzwerk- und externe Laufwerke im Hintergrund.",
  },
  {
    kbd: "0 Cloud",
    title: "Bleibt lokal",
    text: "Es verlässt kein Dateiinhalt das Gerät — die Suche funktioniert komplett offline.",
  },
];

function Features() {
  return (
    <section class="features wrap">
      {features.map((f) => (
        <div class="feature">
          <span class="kbd">{f.kbd}</span>
          <h3>{f.title}</h3>
          <p>{f.text}</p>
        </div>
      ))}
    </section>
  );
}

function Footer() {
  return (
    <footer class="wrap">
      <span>© {new Date().getFullYear()} Finder</span>
      <a href="#github">github.com/finder</a>
    </footer>
  );
}

function App() {
  return (
    <Fragment>
      <Nav />
      <Hero />
      <Features />
      <Footer />
    </Fragment>
  );
}

export default function render(el: HTMLDivElement) {
  el.innerHTML = <App></App>;
  el.innerHTML = (
    <>
      <h1>Soon</h1>
      <a href="../">Back Home</a>
    </>
  );
}
