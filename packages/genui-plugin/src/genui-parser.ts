/**
 * genui-parser.ts
 *
 * Parses raw LLM message text into structured parts:
 *   - TextPart   → plain text to render as markdown
 *   - GenUIPart  → a GenUIComponent to render interactively
 *   - HTMLPart   → raw HTML (existing behaviour, unchanged)
 *
 * Supports TWO formats from the LLM:
 *
 * FORMAT 1 — A2UI JSONL (recommended, new)
 * ─────────────────────────────────────────
 * The LLM wraps A2UI messages between delimiters:
 *
 *   ---A2UI-START---
 *   {"surfaceUpdate": {"surfaceId": "weather", "components": [...]}}
 *   {"dataModelUpdate": {"surfaceId": "weather", "contents": [...]}}
 *   {"beginRendering": {"surfaceId": "weather", "root": "header"}}
 *   ---A2UI-END---
 *
 * FORMAT 2 — Direct GenUI JSON (legacy, still supported) 
 * ──────────────────────────────────────────────────────
 *   {"type":"weather","city":"Tokyo","temperature":22,...}
 */

import { type GenUIComponent, isGenUIComponent, isA2UIMessage } from "./genui-schema"
import { parseA2UIMessages, mapA2UIToGenUI } from "./a2ui-mapper"

export type TextPart = { type: "text"; content: string }
export type GenUIPart = { type: "genui"; component: GenUIComponent }
export type HTMLPart = { type: "html"; content: string }
export type ParsedPart = TextPart | GenUIPart | HTMLPart

// ── Delimiters ────────────────────────────────────────────────────────────────

const A2UI_START = "---A2UI-START---"
const A2UI_END = "---A2UI-END---"

const HTML_START = "---HTML-START---"
const HTML_END = "---HTML-END---"

// ── FORMAT 1: A2UI block extraction ──────────────────────────────────────────

type Block = { component: GenUIComponent; start: number; end: number }

function extractA2UIBlocks(text: string): Block[] {
  const results: Block[] = []
  let cursor = 0

  while (true) {
    const startIdx = text.indexOf(A2UI_START, cursor)
    if (startIdx === -1) break

    const endIdx = text.indexOf(A2UI_END, startIdx)
    if (endIdx === -1) break

    const jsonl = text.slice(startIdx + A2UI_START.length, endIdx).trim()
    const messages = parseA2UIMessages(jsonl)
    const component = mapA2UIToGenUI(messages)

    if (component) {
      results.push({
        component,
        start: startIdx,
        end: endIdx + A2UI_END.length,
      })
    }

    cursor = endIdx + A2UI_END.length
  }

  return results
}

// ── FORMAT 2: Direct GenUI JSON extraction (legacy) ───────────────────────────

function tryParseJSON(raw: string): GenUIComponent | null {
  try {
    const parsed = JSON.parse(raw.trim())
    // Reject A2UI messages — those are handled by extractA2UIBlocks
    if (isA2UIMessage(parsed)) return null
    if (isGenUIComponent(parsed)) return parsed
  } catch {}
  return null
}

function extractDirectJSONBlocks(text: string): Block[] {
  const results: Block[] = []
  let searchFrom = 0

  while (true) {
    const start = text.indexOf("{", searchFrom)
    if (start === -1) break

    let depth = 0
    let inString = false
    let escape = false
    let end = -1

    for (let i = start; i < text.length; i++) {
      const ch = text[i]
      if (escape) { escape = false; continue }
      if (ch === "\\" && inString) { escape = true; continue }
      if (ch === '"') { inString = !inString; continue }
      if (inString) continue
      if (ch === "{") depth++
      if (ch === "}") {
        depth--
        if (depth === 0) { end = i; break }
      }
    }

    if (end === -1) break

    const raw = text.slice(start, end + 1)
    const component = tryParseJSON(raw)
    if (component) {
      results.push({ component, start, end: end + 1 })
    }

    searchFrom = end + 1
  }

  return results
}

// ── Main parser ───────────────────────────────────────────────────────────────

/**
 * Parse an LLM message string into an ordered list of parts.
 *
 * Example input:
 *   "Here's the weather for Tokyo!
 *    ---A2UI-START---
 *    {"surfaceUpdate": ...}
 *    {"dataModelUpdate": ...}
 *    ---A2UI-END---
 *    Let me know if you need anything else."
 *
 * Example output:
 *   [
 *     { type: "text", content: "Here's the weather for Tokyo!" },
 *     { type: "genui", component: { type: "weather", city: "Tokyo", ... } },
 *     { type: "text", content: "Let me know if you need anything else." },
 *   ]
 */
function extractHTMLBlocks(text: string): Array<{ content: string; start: number; end: number }> {
  const results = []
  let cursor = 0
  while (true) {
    const startIdx = text.indexOf(HTML_START, cursor)
    if (startIdx === -1) break
    const endIdx = text.indexOf(HTML_END, startIdx)
    if (endIdx === -1) break
    const content = text.slice(startIdx + HTML_START.length, endIdx).trim()
    results.push({ content, start: startIdx, end: endIdx + HTML_END.length })
    cursor = endIdx + HTML_END.length
  }
  return results
}

export function parseMessage(text: string): ParsedPart[] {
   
  const a2uiBlocks = extractA2UIBlocks(text)
  const htmlBlocks = extractHTMLBlocks(text)

  const genUIBlocks: Block[] =
    a2uiBlocks.length > 0 ? a2uiBlocks : extractDirectJSONBlocks(text)

  type AnyBlock = { start: number; end: number; kind: "genui" | "html" | "chart"; component?: GenUIComponent; content?: string }
const allBlocks: AnyBlock[] = [
  ...genUIBlocks.map(b => ({ ...b, kind: "genui" as const })),
  ...htmlBlocks.map(b => ({ ...b, kind: "html" as const })),
]
  allBlocks.sort((a, b) => a.start - b.start)

  const parts: ParsedPart[] = []
  let cursor = 0

  for (const block of allBlocks) {
    if (block.start > cursor) {
      const content = text.slice(cursor, block.start).trim()
      if (content) parts.push({ type: "text", content })
    }

    if (block.kind === "html") {
  parts.push({ type: "html", content: block.content! })
} else {
  parts.push({ type: "genui", component: block.component! })
}
    cursor = block.end
  }

  // Remaining text after last block
  if (cursor < text.length) {
    const content = text.slice(cursor).trim()
    if (content) parts.push({ type: "text", content })
  }

  // If nothing was parsed, return the whole thing as text
  return parts.length > 0 ? parts : [{ type: "text", content: text }]
}
export const parseGenUI = parseMessage