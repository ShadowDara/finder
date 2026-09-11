import type { Template as FinderTemplate } from '@shadowdara/finder-lib'

export const MAX_TEMPLATE_BYTES = 5 * 1024
export const MAX_TEMPLATE_NAME_LENGTH = 120
export const MAX_TAGS = 12
export const MAX_TAG_LENGTH = 32

type TemplateInput = { name: string; content: string; tags: string[] }
export type TemplateInputResult = { ok: true; name: string; content: string; tags: string[] } | { ok: false; error: string }

function isFinderTemplate(value: unknown): value is FinderTemplate {
  if (typeof value !== 'object' || value === null) return false
  const template = value as Record<string, unknown>
  if (typeof template.name !== 'string' || !template.name.trim()) return false
  for (const key of ['description', 'min_version', 'command']) {
    if (template[key] !== undefined && typeof template[key] !== 'string') return false
  }
  if (template.tags !== undefined && (!Array.isArray(template.tags) || template.tags.some((tag) => typeof tag !== 'string'))) return false
  const validateFiles = (files: unknown) => !files || (Array.isArray(files) && files.every((file) => typeof file === 'object' && file !== null && typeof (file as Record<string, unknown>).name === 'string'))
  if (!validateFiles(template.files)) return false
  if (!Array.isArray(template.folders || [])) return false
  return true
}

export function validateTemplateInput(input: unknown): TemplateInputResult {
  if (typeof input !== 'object' || input === null) return { ok: false, error: 'Ungültiger Request-Body.' }
  const { name, content, tags } = input as Record<string, unknown>
  if (typeof name !== 'string' || !name.trim()) return { ok: false, error: 'Name ist erforderlich.' }
  if (name.length > MAX_TEMPLATE_NAME_LENGTH) return { ok: false, error: `Name darf höchstens ${MAX_TEMPLATE_NAME_LENGTH} Zeichen lang sein.` }
  if (typeof content !== 'string' || !content.trim()) return { ok: false, error: 'Inhalt (JSON) ist erforderlich.' }
  if (new TextEncoder().encode(content).length > MAX_TEMPLATE_BYTES) return { ok: false, error: `Template darf höchstens ${MAX_TEMPLATE_BYTES} Bytes groß sein.` }
  let parsed: unknown
  try { parsed = JSON.parse(content) } catch { return { ok: false, error: 'Inhalt ist kein gültiges JSON.' } }
  if (!isFinderTemplate(parsed)) return { ok: false, error: 'Das JSON entspricht nicht dem Template-Interface von @shadowdara/finder-lib.' }
  const normalizedTags = Array.isArray(tags) ? tags.filter((tag): tag is string => typeof tag === 'string').map((tag) => tag.trim().toLowerCase()).filter(Boolean) : Array.isArray((parsed as FinderTemplate).tags) ? (parsed as FinderTemplate).tags!.map((tag) => tag.trim().toLowerCase()).filter(Boolean) : []
  if (normalizedTags.length > MAX_TAGS || normalizedTags.some((tag) => tag.length > MAX_TAG_LENGTH)) return { ok: false, error: `Maximal ${MAX_TAGS} Tags mit jeweils höchstens ${MAX_TAG_LENGTH} Zeichen erlaubt.` }
  return { ok: true, name: name.trim(), content, tags: [...new Set(normalizedTags)] }
}

export type { TemplateInput }
