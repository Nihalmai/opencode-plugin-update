import type { Plugin } from "@opencode-ai/plugin"

export const GenUIPlugin: Plugin = async (input) => {
  return {
    "experimental.chat.system.transform": async (_, output) => {
      output.system.push(`
## GenUI Rendering

You can render rich UI components and charts by using these special blocks:

### For charts and visualizations use HTML blocks:
\`\`\`
---HTML-START---
<your complete self-contained chart HTML here>
---HTML-END---
\`\`\`

### For structured UI components use A2UI blocks:
\`\`\`
---A2UI-START---
{"surfaceUpdate": ...}
{"dataModelUpdate": ...}
{"beginRendering": ...}
---A2UI-END---
\`\`\`

Available A2UI surface types: weather, table, metrics, progress, alert, card, form, clarify, recipe, status

NEVER create files for charts or UI. ALWAYS use these blocks inline.
      `)
    },
  }
}