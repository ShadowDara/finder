// Max size of a template's JSON content, in bytes (5 KB).
export const MAX_TEMPLATE_BYTES = 5 * 1024

export const MAX_TEMPLATE_NAME_LENGTH = 120

export type TemplateInputResult =
  | { ok: true; name: string; content: string }
  | { ok: false; error: string }

/**
 * Validates untrusted template input coming from the client:
 * - name must be a non-empty string within the length limit
 * - content must be valid JSON serialized as a string
 * - content byte size must not exceed MAX_TEMPLATE_BYTES
 */
export function validateTemplateInput(input: unknown): TemplateInputResult {
  if (typeof input !== 'object' || input === null) {
    return { ok: false, error: 'Ungültiger Request-Body.' }
  }

  const { name, content } = input as Record<string, unknown>

  if (typeof name !== 'string' || name.trim().length === 0) {
    return { ok: false, error: 'Name ist erforderlich.' }
  }

  if (name.length > MAX_TEMPLATE_NAME_LENGTH) {
    return {
      ok: false,
      error: `Name darf höchstens ${MAX_TEMPLATE_NAME_LENGTH} Zeichen lang sein.`,
    }
  }

  if (typeof content !== 'string' || content.trim().length === 0) {
    return { ok: false, error: 'Inhalt (JSON) ist erforderlich.' }
  }

  const byteSize = new TextEncoder().encode(content).length
  if (byteSize > MAX_TEMPLATE_BYTES) {
    return {
      ok: false,
      error: `Template ist zu groß (${byteSize} Bytes). Maximal erlaubt sind ${MAX_TEMPLATE_BYTES} Bytes.`,
    }
  }

  try {
    JSON.parse(content)
  } catch {
    return { ok: false, error: 'Inhalt ist kein gültiges JSON.' }
  }

  return { ok: true, name: name.trim(), content }
}
