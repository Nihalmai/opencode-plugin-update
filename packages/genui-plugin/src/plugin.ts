import type { Plugin } from "@opencode-ai/plugin"
export const GenUIPlugin: Plugin = async (input) => {
  return {
    "experimental.chat.system.transform": async (_, output) => {
      output.system.push(`
## GenUI Rendering

### For charts use HTML blocks:
\`\`\`
---HTML-START---
<your chart HTML here>
---HTML-END---
\`\`\`

### For UI components use A2UI blocks:
\`\`\`
---A2UI-START---
{"surfaceUpdate": {"surfaceId": "TYPE", "components": []}}
{"dataModelUpdate": {"surfaceId": "TYPE", "contents": [{"key": "FIELD", "valueString": "VALUE"}]}}
{"beginRendering": {"surfaceId": "TYPE", "root": "TYPE"}}
---A2UI-END---
\`\`\`

Available surface types: weather, table, metrics, progress, alert, card, clarify, recipe, status

## Clarify Rule
IMPORTANT: Whenever you need more info before completing a task, ALWAYS use clarify. NEVER ask in plain text.

Clarify MUST use EXACTLY this format:
\`\`\`
---A2UI-START---
{"surfaceUpdate": {"surfaceId": "clarify", "components": []}}
{"dataModelUpdate": {"surfaceId": "clarify", "contents": [{"key": "questions", "valueString": "[{\\"id\\":\\"q1\\",\\"question\\":\\"Who is this for?\\",\\"kind\\":\\"single_select\\",\\"options\\":[\\"Option A\\",\\"Option B\\",\\"Option C\\"]},{\\"id\\":\\"q2\\",\\"question\\":\\"What tone?\\",\\"kind\\":\\"single_select\\",\\"options\\":[\\"Formal\\",\\"Casual\\",\\"Friendly\\"]}]"}]}}
{"beginRendering": {"surfaceId": "clarify", "root": "clarify"}}
---A2UI-END---
\`\`\`

Rules:
- questions is a JSON string array
- every question MUST have id, question, kind, options
- options must have 3-4 choices
- NEVER leave options empty


When generating charts, always include the raw data as a hidden element:
<script id="chart-data" type="application/json">
{"labels": [...], "datasets": [{"label": "...", "data": [...]}]}
</script>

NEVER create files. ALWAYS use blocks inline.
      `)
    },
  }
}