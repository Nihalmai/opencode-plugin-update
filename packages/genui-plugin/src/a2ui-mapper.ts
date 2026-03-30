/**
 * a2ui-mapper.ts
 *
 * Converts A2UI protocol JSONL messages into GenUIComponent types
 * that your existing GenUIRenderer.tsx already knows how to render.
 *
 * A2UI docs: https://a2ui.org
 * Flow: LLM outputs A2UI JSONL → parseA2UIMessages → mapA2UIToGenUI → GenUIComponent
 */

import type { GenUIComponent } from "./genui-schema"

// ── A2UI Protocol Types ────────────────────────────────────────────────────────

export interface A2UIMessage {
  surfaceUpdate?: {
    surfaceId: string
    components: A2UIEntry[]
  }
  dataModelUpdate?: {
    surfaceId: string
    contents: A2UIDataEntry[]
  }
  beginRendering?: {
    surfaceId: string
    root: string
  }
  createSurface?: {
    surfaceId: string
    catalogId?: string
  }
}

interface A2UIEntry {
  id: string
  component: Record<string, any>
}

interface A2UIDataEntry {
  key: string
  valueString?: string
  valueInt?: number
  valueFloat?: number
  valueBool?: boolean
  valueMap?: A2UIDataEntry[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function parseA2UIMessages(jsonl: string): A2UIMessage[] {
  const results: A2UIMessage[] = []
  let depth = 0
  let inString = false
  let escape = false
  let start = -1

  for (let i = 0; i < jsonl.length; i++) {
    const ch = jsonl[i]
    if (escape) { escape = false; continue }
    if (ch === "\\" && inString) { escape = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue

    if (ch === "{") {
      if (depth === 0) start = i
      depth++
    } else if (ch === "}") {
      depth--
      if (depth === 0 && start !== -1) {
        try {
          results.push(JSON.parse(jsonl.slice(start, i + 1)) as A2UIMessage)
        } catch {}
        start = -1
      }
    }
  }

  return results
}

function flattenData(contents: A2UIDataEntry[]): Record<string, any> {
  const out: Record<string, any> = {}
  for (const entry of contents) {
    if (entry.valueMap) {
      out[entry.key] = flattenData(entry.valueMap)
    } else {
      out[entry.key] =
        entry.valueString ?? entry.valueInt ?? entry.valueFloat ?? entry.valueBool ?? null
    }
  }
  return out
}

function parseArrayFields(data: Record<string, any>, keys: string[]): void {
  for (const key of keys) {
    if (typeof data[key] === "string") {
      try { data[key] = JSON.parse(data[key]) } catch {}
    }
  }
}

function getText(val: any): string {
  if (!val) return ""
  if (typeof val === "string") return val
  if (val.literalString) return val.literalString
  return ""
}

function collectTexts(components: A2UIEntry[]): string[] {
  return components
    .filter(c => "Text" in c.component)
    .map(c => getText(c.component.Text?.text))
    .filter(Boolean)
}

function collectInputs(components: A2UIEntry[]) {
  const inputTypes: Record<string, "text" | "number" | "select" | "textarea"> = {
    TextInput: "text",
    NumberInput: "number",
    DateTimeInput: "text",
    Select: "select",
    Textarea: "textarea",
  }
  return components
    .filter(c => Object.keys(inputTypes).some(t => t in c.component))
    .map(c => {
      const type = Object.keys(inputTypes).find(t => t in c.component)!
      const props = c.component[type]
      return {
        id: c.id,
        label: getText(props?.label) || c.id,
        type: inputTypes[type],
        placeholder: getText(props?.placeholder),
        options: props?.options ?? [],
        required: props?.required ?? false,
      }
    })
}

function collectButton(components: A2UIEntry[]): string {
  const btn = components.find(c => "Button" in c.component)
  if (!btn) return "Submit"
  const props = btn.component.Button
  return getText(props?.label) || getText(props?.child) || "Submit"
}

function detectType(
  surfaceId: string,
  components: A2UIEntry[],
  data: Record<string, any>,
): GenUIComponent["type"] {
  const validTypes: GenUIComponent["type"][] = [
    "weather", "recipe", "chart", "table",
    "metrics", "status", "alert", "progress", "card", "form", "clarify",
  ]
  const sid = surfaceId.toLowerCase()
  for (const t of validTypes) {
    if (sid.includes(t)) return t
  }

  if ("temperature" in data || "condition" in data) return "weather"
  if ("series" in data) return "chart"
  if ("rows" in data && "columns" in data) return "table"
  if ("steps" in data) return "progress"
  if ("items" in data && Array.isArray(data.items) && data.items[0]?.status) return "status"
  if ("items" in data) return "metrics"
  if ("level" in data) return "alert"
  if ("ingredients" in data) return "recipe"

  const compTypes = components.map(c => Object.keys(c.component)[0])
  const hasInputs = compTypes.some(t =>
    ["TextInput", "NumberInput", "Select", "Textarea", "DateTimeInput"].includes(t)
  )
  if (hasInputs) return "form"

  return "card"
}

// ── Main mapper ───────────────────────────────────────────────────────────────

export function mapA2UIToGenUI(messages: A2UIMessage[]): GenUIComponent | null {
  let components: A2UIEntry[] = []
  let data: Record<string, any> = {}
  let surfaceId = "main"

  for (const msg of messages) {
    if (msg.surfaceUpdate) {
      surfaceId = msg.surfaceUpdate.surfaceId
      components = [...components, ...msg.surfaceUpdate.components]
    }
    if (msg.dataModelUpdate) {
      data = { ...data, ...flattenData(msg.dataModelUpdate.contents) }
    }
  }

  if (components.length === 0 && Object.keys(data).length === 0) return null

  const type = detectType(surfaceId, components, data)
  const texts = collectTexts(components)

  switch (type) {
    case "clarify":
  parseArrayFields(data, ["questions"])
  return {
    type: "clarify",
    questions: Array.isArray(data.questions) ? data.questions : [],
  }

    case "weather":
      parseArrayFields(data, ["forecast"])
      return {
        type: "weather",
        city: data.city ?? data.location ?? texts[0] ?? surfaceId,
        temperature: Number(data.temperature ?? data.temp ?? 0),
        unit: (data.unit ?? "C") as "C" | "F",
        condition: data.condition ?? data.description ?? "Clear",
        humidity: data.humidity != null ? String(data.humidity) : undefined,
        wind: data.wind != null ? String(data.wind) : undefined,
        feelsLike: data.feelsLike != null ? Number(data.feelsLike) : undefined,
        forecast: Array.isArray(data.forecast) ? data.forecast : undefined,
      }

    case "alert":
      return {
        type: "alert",
        level: (data.level ?? (
          surfaceId.includes("error") ? "error" :
          surfaceId.includes("warn") ? "warning" :
          surfaceId.includes("success") ? "success" : "info"
        )) as "info" | "success" | "warning" | "error",
        title: data.title ?? texts[0] ?? "Alert",
        body: data.body ?? texts[1],
      }

    case "progress":
      parseArrayFields(data, ["steps"])
      return {
        type: "progress",
        title: data.title ?? texts[0] ?? "Progress",
        steps: Array.isArray(data.steps) ? data.steps : [],
        overall: data.overall,
      }

    case "metrics":
      parseArrayFields(data, ["items"])
      return {
        type: "metrics",
        title: data.title ?? texts[0],
        items: Array.isArray(data.items) ? data.items : [],
        columns: data.columns,
      }

    case "status":
      parseArrayFields(data, ["items"])
      return {
        type: "status",
        title: data.title ?? texts[0] ?? "System Status",
        items: Array.isArray(data.items) ? data.items : [],
      }

    case "table":
      parseArrayFields(data, ["columns", "rows"])
      return {
        type: "table",
        title: data.title ?? texts[0],
        columns: Array.isArray(data.columns) ? data.columns : [],
        rows: Array.isArray(data.rows) ? data.rows : [],
        caption: data.caption,
      }

    case "chart":
      parseArrayFields(data, ["series"])
      return {
        type: "chart",
        kind: (data.kind ?? "bar") as "bar" | "line" | "area" | "pie",
        title: data.title ?? texts[0],
        series: Array.isArray(data.series) ? data.series : [],
      }

    case "form": {
      parseArrayFields(data, ["fields"])
      const inputs = collectInputs(components)
      return {
        type: "form",
        title: data.title ?? texts[0] ?? "Form",
        description: data.description ?? texts[1],
        fields: inputs.length > 0 ? inputs : (Array.isArray(data.fields) ? data.fields : []),
        submit: collectButton(components),
      }
    }

    case "recipe":
      parseArrayFields(data, ["ingredients", "steps"])
      return {
        type: "recipe",
        title: data.title ?? texts[0] ?? "Recipe",
        icon: data.icon,
        time: data.time,
        difficulty: data.difficulty,
        servings: data.servings,
        ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
        steps: Array.isArray(data.steps) ? data.steps : [],
      }

    default:
      return {
        type: "card",
        title: texts[0] ?? data.title ?? "Info",
        subtitle: texts[1] ?? data.subtitle,
        body: data.body ?? texts.slice(2).join(" ") ?? JSON.stringify(data),
        badge: data.badge ? { text: String(data.badge) } : undefined,
        icon: data.icon,
      }
  }
}