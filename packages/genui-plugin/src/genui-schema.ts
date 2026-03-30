export type GenUIComponent =
  | { type: "weather"; city?: string; location?: string; temperature: number; unit?: "C" | "F"; condition: string; icon?: string; humidity?: string; wind?: string; feelsLike?: number; updated?: string; forecast?: { day: string; condition: string; high: number; low: number }[] }
  | { type: "recipe"; title: string; icon?: string; time?: string; difficulty?: string; servings?: number; tags?: string[]; ingredients?: { name: string; amount: string; icon?: string }[]; steps?: any[]; action?: string }
  | { type: "chart"; kind: "bar" | "line" | "area" | "pie"; title?: string; series: { name: string; data: { label: string; value: number }[] }[] }
  | { type: "table"; title?: string; columns: { key: string; label: string; align?: "left" | "right" | "center" }[]; rows: Record<string, string | number | boolean>[]; caption?: string }
  | { type: "metrics"; title?: string; items: { label: string; value: string | number; unit?: string; delta?: number; color?: string }[]; columns?: 2 | 3 | 4 }
  | { type: "status"; title?: string; items: { label: string; status: "ok" | "warning" | "error" | "pending" | "info"; detail?: string }[] }
  | { type: "alert"; level: "info" | "success" | "warning" | "error"; title: string; body?: string }
  | { type: "progress"; title?: string; steps: { label: string; status: "done" | "active" | "pending" | "error"; detail?: string }[]; overall?: number }
  | { type: "card"; title: string; subtitle?: string; body: string; badge?: { text: string }; icon?: string }
  | { type: "form"; title: string; description?: string; fields: { id: string; label: string; type: "text" | "number" | "select" | "textarea"; placeholder?: string; options?: string[]; required?: boolean }[]; submit: string }
  | { type: "clarify"; questions: { id: string; question: string; kind: "single_select" | "multi_select" | "rank_priorities"; options: string[] }[] }

export function isGenUIComponent(obj: unknown): obj is GenUIComponent {
  if (!obj || typeof obj !== "object") return false
  const validTypes = ["weather", "recipe", "chart", "table", "metrics", "status", "alert", "progress", "card", "form", "clarify"]
  return validTypes.includes((obj as any).type)
}
export function isA2UIMessage(obj: unknown): boolean {
  if (!obj || typeof obj !== "object") return false
  const keys = Object.keys(obj as object)
  return keys.some(k => ["surfaceUpdate", "dataModelUpdate", "beginRendering", "createSurface"].includes(k))
}