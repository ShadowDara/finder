//! farbtext — eine winzige Markup-Sprache für farbigen Terminal-Text.

export type ParseError =
  | {
      type: "UnterminatedTag";
      pos: number;
    }
  | {
      type: "UnknownTag";
      name: string;
      pos: number;
    }
  | {
      type: "UnmatchedClose";
      name: string;
      pos: number;
    }
  | {
      type: "NothingToClose";
      pos: number;
    }
  | {
      type: "EmptyTag";
      pos: number;
    };

export class FarbtTextError extends Error {
  constructor(public readonly error: ParseError) {
    super(formatError(error));
    this.name = "FarbtTextError";
  }
}

function formatError(error: ParseError): string {
  switch (error.type) {
    case "UnterminatedTag":
      return `Tag ab Position ${error.pos} wurde nicht mit ']' geschlossen`;

    case "UnknownTag":
      return `Unbekanntes Tag '${error.name}' an Position ${error.pos}`;

    case "UnmatchedClose":
      return `Schließendes Tag '[/${error.name}]' an Position ${error.pos} passt zu keinem offenen Tag`;

    case "NothingToClose":
      return `'[/]' an Position ${error.pos}, aber es ist kein Tag offen`;

    case "EmptyTag":
      return `Leeres Tag '[]' an Position ${error.pos}`;
  }
}

interface StackEntry {
  name: string;
  code: string;
}

/**
 * Wandelt einen Text mit farbtext-Markup in einen String
 * mit echten ANSI-Escape-Codes um.
 */
export function render(input: string): string {
  const chars = [...input];
  let out = "";
  const stack: StackEntry[] = [];

  let i = 0;

  while (i < chars.length) {
    const c = chars[i];

    // Escapes: \[ und \]
    if (
      c === "\\" &&
      i + 1 < chars.length &&
      (chars[i + 1] === "[" || chars[i + 1] === "]")
    ) {
      out += chars[i + 1];
      i += 2;
      continue;
    }

    if (c === "[") {
      const start = i;

      let j = i + 1;

      while (j < chars.length && chars[j] !== "]") {
        j++;
      }

      if (j >= chars.length) {
        throw new FarbtTextError({
          type: "UnterminatedTag",
          pos: start,
        });
      }

      const tagContent = chars.slice(i + 1, j).join("");

      i = j + 1;

      if (tagContent.startsWith("/")) {
        // Schließendes Tag
        const rest = tagContent.slice(1).trim();

        if (rest.length === 0) {
          if (stack.length === 0) {
            throw new FarbtTextError({
              type: "NothingToClose",
              pos: start,
            });
          }

          stack.pop();
        } else {
          // Kann mehrere Namen enthalten:
          // [/red bold]
          for (const name of rest.split(/\s+/)) {
            let index = -1;

            for (let k = stack.length - 1; k >= 0; k--) {
              if (stack[k].name === name) {
                index = k;
                break;
              }
            }

            if (index === -1) {
              throw new FarbtTextError({
                type: "UnmatchedClose",
                name,
                pos: start,
              });
            }

            stack.splice(index, 1);
          }
        }

        // Zurücksetzen und verbleibende Styles neu anwenden
        out += "\x1b[0m";

        if (stack.length > 0) {
          const codes = stack.map((entry) => entry.code);
          out += `\x1b[${codes.join(";")}m`;
        }
      } else {
        // Öffnendes Tag, ggf. mehrere Namen:
        // [red bold]
        const names = tagContent.split(/\s+/).filter(Boolean);

        if (names.length === 0) {
          throw new FarbtTextError({
            type: "EmptyTag",
            pos: start,
          });
        }

        const newCodes: string[] = [];

        for (const name of names) {
          const code = codeFor(name);

          if (code === undefined) {
            throw new FarbtTextError({
              type: "UnknownTag",
              name,
              pos: start,
            });
          }

          newCodes.push(code);

          stack.push({
            name,
            code,
          });
        }

        out += `\x1b[${newCodes.join(";")}m`;
      }

      continue;
    }

    out += c;
    i++;
  }

  // Am Ende automatisch zurücksetzen,
  // falls noch Tags offen sind.
  if (stack.length > 0) {
    out += "\x1b[0m";
  }

  return out;
}

/**
 * Ordnet einen Tag-Namen dem passenden ANSI-SGR-Code zu.
 */
function codeFor(name: string): string | undefined {
  if (name.startsWith("bg_")) {
    return bgCode(name.slice(3));
  }

  switch (name) {
    case "reset":
      return "0";

    case "bold":
      return "1";

    case "dim":
      return "2";

    case "italic":
      return "3";

    case "underline":
      return "4";

    case "blink":
      return "5";

    case "reverse":
      return "7";

    case "hidden":
      return "8";

    case "strike":
    case "strikethrough":
      return "9";

    default:
      return fgCode(name);
  }
}

function fgCode(name: string): string | undefined {
  switch (name) {
    case "black":
      return "30";
    case "red":
      return "31";
    case "green":
      return "32";
    case "yellow":
      return "33";
    case "blue":
      return "34";
    case "magenta":
      return "35";
    case "cyan":
      return "36";
    case "white":
      return "37";

    case "bright_black":
      return "90";
    case "bright_red":
      return "91";
    case "bright_green":
      return "92";
    case "bright_yellow":
      return "93";
    case "bright_blue":
      return "94";
    case "bright_magenta":
      return "95";
    case "bright_cyan":
      return "96";
    case "bright_white":
      return "97";

    default:
      return undefined;
  }
}

function bgCode(name: string): string | undefined {
  switch (name) {
    case "black":
      return "40";
    case "red":
      return "41";
    case "green":
      return "42";
    case "yellow":
      return "43";
    case "blue":
      return "44";
    case "magenta":
      return "45";
    case "cyan":
      return "46";
    case "white":
      return "47";

    case "bright_black":
      return "100";
    case "bright_red":
      return "101";
    case "bright_green":
      return "102";
    case "bright_yellow":
      return "103";
    case "bright_blue":
      return "104";
    case "bright_magenta":
      return "105";
    case "bright_cyan":
      return "106";
    case "bright_white":
      return "107";

    default:
      return undefined;
  }
}
