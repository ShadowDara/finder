/**
 * Lightweight JSON highlighter for Finder templates.
 *
 * Produces HTML with highlight.js-compatible scope classes (`hljs-*`) so the
 * imported `github-dark` theme keeps working, and additionally colorizes the
 * content of every `"name"` string value as a regex/glob pattern (tokens are
 * wrapped in `rx-*` classes).
 *
 * The input is expected to be valid JSON (templates are validated + minified
 * server-side). Non-JSON input falls back to plain, HTML-escaped text.
 */

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Tokenize a regex/glob pattern into `rx-*` colored spans (HTML escaped). */
function tokenizeRegex(pattern: string): string {
  let result = "";
  let i = 0;

  const emit = (cls: string, token: string) => {
    result += `<span class="rx-${cls}">${escapeHtml(token)}</span>`;
  };

  while (i < pattern.length) {
    const ch = pattern[i];

    // Escape sequences: \d \w \s \b \. \\ \/ \xHH \uHHHH \u{HHHH} \p{...}
    if (ch === "\\" && i + 1 < pattern.length) {
      const next = pattern[i + 1];
      let token: string;
      if (
        next === "x" &&
        /^[0-9a-fA-F]{2}$/.test(pattern.slice(i + 2, i + 4))
      ) {
        token = pattern.slice(i, i + 4);
        i += 4;
      } else if (next === "u") {
        if (pattern[i + 2] === "{") {
          const end = pattern.indexOf("}", i + 3);
          token = pattern.slice(i, end === -1 ? i + 2 : end + 1);
          i += token.length;
        } else if (/^[0-9a-fA-F]{4}$/.test(pattern.slice(i + 2, i + 6))) {
          token = pattern.slice(i, i + 6);
          i += 6;
        } else {
          token = pattern.slice(i, i + 2);
          i += 2;
        }
      } else if (next === "p" && pattern[i + 2] === "{") {
        const end = pattern.indexOf("}", i + 3);
        token = pattern.slice(i, end === -1 ? i + 2 : end + 1);
        i += token.length;
      } else {
        token = pattern.slice(i, i + 2);
        i += 2;
      }
      emit("esc", token);
    }
    // Character class: [...]
    else if (ch === "[") {
      let j = i + 1;
      if (pattern[j] === "^") j++;
      if (pattern[j] === "]") j++;
      while (j < pattern.length && pattern[j] !== "]") {
        if (pattern[j] === "\\") j++;
        j++;
      }
      emit("class", pattern.slice(i, Math.min(j + 1, pattern.length)));
      i = j + 1;
    }
    // Curly quantifier: {n}, {n,}, {n,m}
    else if (ch === "{") {
      const m = pattern.slice(i).match(/^\{(\d+)(?:,(\d*))?\}/);
      if (m) {
        emit("quant", m[0]);
        i += m[0].length;
      } else {
        result += escapeHtml(ch);
        i++;
      }
    }
    // Quantifiers: * + ?
    else if ("+*?".includes(ch)) {
      emit("quant", ch);
      i++;
    }
    // Anchors: ^ $
    else if (ch === "^" || ch === "$") {
      emit("anchor", ch);
      i++;
    }
    // Groups: ( (?: (?= (?!
    else if (ch === "(") {
      const look = pattern.slice(i, i + 3);
      if (look === "(?:" || look === "(?=" || look === "(?!") {
        emit("group", look);
        i += 3;
      } else {
        emit("group", "(");
        i++;
      }
    } else if (ch === ")") {
      emit("group", ")");
      i++;
    }
    // Alternation
    else if (ch === "|") {
      emit("alt", "|");
      i++;
    }
    // Any-character dot
    else if (ch === ".") {
      emit("esc", ".");
      i++;
    }
    // Plain characters
    else {
      result += escapeHtml(ch);
      i++;
    }
  }

  return result;
}

/**
 * Highlight a Finder template (valid JSON) with regex coloring for `name` values.
 */
export function highlightFinderTemplate(code: string): string {
  let out = "";
  let i = 0;
  const n = code.length;

  // Stack of container types; `nextToken` tells whether the next string is a key.
  const stack: ("object" | "array")[] = [];
  let nextToken: "key" | "value" = "value";
  let pendingName = false;

  const emitPunct = (ch: string) => {
    out += `<span class="hljs-punctuation">${ch}</span>`;
  };

  while (i < n) {
    const ch = code[i];

    if (/\s/.test(ch)) {
      out += ch;
      i++;
      continue;
    }
    if (ch === "{") {
      emitPunct(ch);
      stack.push("object");
      nextToken = "key";
      pendingName = false;
      i++;
      continue;
    }
    if (ch === "[") {
      emitPunct(ch);
      stack.push("array");
      nextToken = "value";
      pendingName = false;
      i++;
      continue;
    }
    if (ch === "}" || ch === "]") {
      emitPunct(ch);
      stack.pop();
      nextToken = "value";
      i++;
      continue;
    }
    if (ch === ",") {
      emitPunct(ch);
      nextToken =
        stack.length > 0 && stack[stack.length - 1] === "object"
          ? "key"
          : "value";
      i++;
      continue;
    }
    if (ch === ":") {
      emitPunct(ch);
      nextToken = "value";
      i++;
      continue;
    }
    if (ch === '"') {
      let j = i + 1;
      let content = "";
      let closed = false;
      while (j < n) {
        if (code[j] === "\\") {
          content += code[j] + (code[j + 1] ?? "");
          j += 2;
          continue;
        }
        if (code[j] === '"') {
          closed = true;
          break;
        }
        content += code[j];
        j++;
      }
      if (!closed) return escapeHtml(code); // malformed → plain text

      const isKey = nextToken === "key";
      if (isKey) {
        out += `<span class="hljs-attr">&quot;${escapeHtml(content)}&quot;</span>`;
        if (content === "name") pendingName = true;
      } else if (pendingName) {
        out += `<span class="hljs-string">&quot;${tokenizeRegex(content)}&quot;</span>`;
        pendingName = false;
      } else {
        out += `<span class="hljs-string">&quot;${escapeHtml(content)}&quot;</span>`;
      }

      nextToken = "value";
      i = j + 1;
      continue;
    }
    if (/[0-9-]/.test(ch)) {
      const m = code
        .slice(i)
        .match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
      if (m) {
        out += `<span class="hljs-number">${escapeHtml(m[0])}</span>`;
        i += m[0].length;
        nextToken = "value";
        pendingName = false;
        continue;
      }
    }
    if (/^(?:true|false|null)/.test(code.slice(i))) {
      const m = code.slice(i).match(/^(?:true|false|null)/)![0];
      out += `<span class="hljs-literal">${m}</span>`;
      i += m.length;
      nextToken = "value";
      pendingName = false;
      continue;
    }

    // Unexpected character → not JSON, show plain escaped text.
    return escapeHtml(code);
  }

  return out;
}
