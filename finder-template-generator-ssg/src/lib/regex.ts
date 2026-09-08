/**
 * generateRegex.ts
 * ------------------------------------------------------------
 * Erzeugt aus einer "accept"-Liste und einer "disallow"-Liste
 * einen einzigen RegExp, der:
 *   - alle Strings aus `accept` matcht
 *   - alle Strings aus `disallow` NICHT matcht
 *
 * Prinzip (boolesche Algebra auf Sprachen/Regex):
 *   Ergebnis = Accept  UND  NICHT(Disallow)
 *
 * Dafür wird:
 *   1. Aus jeder Liste ein kompakter Regex-Fragment via Trie
 *      generiert (gemeinsame Präfixe werden zusammengefasst,
 *      einzelne Buchstaben zu Zeichenklassen [abc] verschmolzen).
 *   2. Das disallow-Fragment als negatives Lookahead (?!...)
 *      vor das accept-Fragment gesetzt -> das ist die "UND NICHT"
 *      Verknüpfung.
 * ------------------------------------------------------------
 */

/** Ein Trie-Knoten: pro Zeichen ein Kind-Knoten, plus optionales Wortende-Flag */
interface TrieNode {
  children: Map<string, TrieNode>;
  isEnd: boolean;
}

function createNode(): TrieNode {
  return { children: new Map(), isEnd: false };
}

/** Escaped ein einzelnes Zeichen für sichere Verwendung in RegExp */
function escapeRegexChar(ch: string): string {
  return ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Baut aus einem Array von Strings einen Trie */
function buildTrie(words: readonly string[]): TrieNode {
  const root = createNode();
  for (const word of words) {
    let node = root;
    for (const ch of word) {
      let child = node.children.get(ch);
      if (!child) {
        child = createNode();
        node.children.set(ch, child);
      }
      node = child;
    }
    node.isEnd = true;
  }
  return root;
}

/**
 * Wandelt einen Trie-Knoten rekursiv in ein Regex-Fragment (ohne Anker) um.
 * Fasst dabei:
 *  - mehrere terminale Einzelbuchstaben zu [abc] zusammen
 *  - Teilbäume in nicht-erfassende Gruppen (?:...)
 *  - optionale Verzweigungen (wenn Knoten selbst Wortende ist) mit `?`
 */
function trieToFragment(node: TrieNode): string {
  if (node.children.size === 0) return '';

  const branchParts: string[] = [];
  const singleChars: string[] = [];

  for (const [key, child] of node.children) {
    const isLeaf = child.children.size === 0 && child.isEnd;

    if (isLeaf) {
      singleChars.push(escapeRegexChar(key));
    } else {
      const subFragment = trieToFragment(child);
      const wrapped = subFragment.includes('|') ? `(?:${subFragment})` : subFragment;
      const optional = child.isEnd ? '?' : '';
      branchParts.push(`${escapeRegexChar(key)}${wrapped}${optional}`);
    }
  }

  if (singleChars.length === 1) {
    branchParts.push(singleChars[0]);
  } else if (singleChars.length > 1) {
    branchParts.push(`[${singleChars.join('')}]`);
  }

  return branchParts.join('|');
}

/** Erzeugt aus einer Wortliste ein Regex-Fragment (oder null bei leerer Liste) */
function wordsToFragment(words: readonly string[] | undefined): string | null {
  if (!words || words.length === 0) return null;
  const trie = buildTrie(words);
  const fragment = trieToFragment(trie);
  return fragment || null;
}

export interface GenerateRegexOptions {
  /** zusätzliche RegExp-Flags, z.B. 'i' für case-insensitive */
  flags?: string;
}

/**
 * Hauptfunktion.
 * @param accept   Strings, die der Regex akzeptieren soll
 * @param disallow Strings, die der Regex ablehnen soll
 * @param options  optionale Einstellungen (z.B. RegExp-Flags)
 */
export function generateRegex(
  accept: readonly string[],
  disallow: readonly string[] = [],
  options: GenerateRegexOptions = {}
): RegExp {
  const acceptFragment = wordsToFragment(accept);
  if (!acceptFragment) {
    throw new Error('accept-Array darf nicht leer sein.');
  }

  const disallowFragment = wordsToFragment(disallow);

  // Boolesche Verknüpfung: Accept AND NOT Disallow
  const negativeLookahead = disallowFragment
    ? `(?!^(?:${disallowFragment})$)`
    : '';

  const pattern = `^${negativeLookahead}(?:${acceptFragment})$`;

  return new RegExp(pattern, options.flags ?? '');
}

// // ------------------------------------------------------------
// // Demo / Selbsttest (kann entfernt werden)
// // ------------------------------------------------------------
// if (require.main === module) {
//   const accept = ['cat', 'car', 'cart', 'dog', 'do'];
//   const disallow = ['cot', 'cats', 'dot'];

//   const re = generateRegex(accept, disallow);
//   console.log('Generiertes Regex:', re.source);

//   const testWords = [...accept, ...disallow, 'foo', 'ca', 'carts'];
//   for (const w of testWords) {
//     console.log(w.padEnd(8), '->', re.test(w));
//   }
// }
