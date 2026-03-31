import type { Plugin } from "@opencode-ai/plugin"

export const GenUIPlugin: Plugin = async (input) => {
  return {
    "experimental.chat.system.transform": async (_, output) => {
      output.system.push(`
## GenUI Rendering

You can render rich UI components and charts inline using special blocks. NEVER create files. ALWAYS use blocks inline.

---

### BLOCK 1 — HTML blocks (charts, dashboards, custom UI)

\`\`\`
---HTML-START---
<your HTML here using the design system classes below>
---HTML-END---
\`\`\`

Chart.js is available as \`window.Chart\`. Use it for all charts.

#### Design System Classes (use these — no custom CSS needed)

**Layout**
- \`card\` \`card-header\` \`card-body\` \`card-footer\` — card container
- \`grid-2\` \`grid-3\` \`grid-4\` — responsive grid columns
- \`flex\` \`flex-col\` \`items-center\` \`justify-between\` — flexbox
- \`gap-2\` \`gap-3\` \`gap-4\` — spacing
- \`p-1\` \`p-2\` \`p-3\` \`p-4\` — padding
- \`mt-1\` \`mt-2\` \`mt-3\` \`mb-1\` \`mb-2\` \`mb-3\` — margin
- \`w-full\` \`divider\` \`bg-muted\` \`bg-white\` \`border\` \`rounded\` \`rounded-lg\`

**Typography**
- \`h1\` \`h2\` \`h3\` \`h4\` — headings
- \`label\` — uppercase small label
- \`text-sm\` \`text-xs\` \`text-lg\` — sizes
- \`text-muted\` \`text-primary\` \`text-success\` \`text-danger\` \`text-warning\`
- \`font-bold\` \`font-medium\` \`text-center\` \`text-right\`

**Components**
- \`badge\` \`badge-primary\` \`badge-success\` \`badge-warning\` \`badge-danger\` \`badge-info\`
- \`btn\` \`btn-primary\` \`btn-success\` \`btn-danger\` \`btn-outline\` \`btn-sm\` \`btn-lg\` \`btn-full\`
- \`input\` \`input-label\` \`input-group\`
- \`alert\` \`alert-info\` \`alert-success\` \`alert-warning\` \`alert-danger\` + \`alert-icon\` \`alert-title\` \`alert-body\`
- \`progress-bar-wrap\` + \`progress-bar\` (set width % inline)
- \`stat-grid\` + \`stat\` \`stat-value\` \`stat-delta up/down\`
- \`list\` + \`list-item\` \`list-item active\` \`list-item success\`
- \`table-wrap\` + \`table\` \`th\` \`td\`
- \`chart-wrap\` — wrap canvas elements in this

#### HTML Example — Bar Chart
\`\`\`html
<div class="card">
  <div class="card-header">
    <h3>Monthly Revenue</h3>
    <span class="badge badge-success">↑ 12% vs last month</span>
  </div>
  <div class="card-body">
    <div class="chart-wrap">
      <canvas id="chart1"></canvas>
    </div>
  </div>
</div>
<script>
new Chart(document.getElementById('chart1'), {
  type: 'bar',
  data: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Revenue ($k)',
      data: [12, 18, 15, 22, 19, 25],
      backgroundColor: '#6366f1',
      borderRadius: 6,
    }]
  },
  options: { responsive: true, plugins: { legend: { display: false } } }
})
<\/script>
\`\`\`

#### HTML Example — Stats Dashboard
\`\`\`html
<div class="card">
  <div class="card-header">
    <h3>SaaS Metrics</h3>
    <span class="badge">Q4 2024</span>
  </div>
  <div class="card-body">
    <div class="stat-grid grid-3">
      <div class="stat">
        <span class="label">MRR</span>
        <span class="stat-value">$24k</span>
        <span class="stat-delta up">↑ 8%</span>
      </div>
      <div class="stat">
        <span class="label">Churn</span>
        <span class="stat-value">2.1%</span>
        <span class="stat-delta down">↓ 0.3%</span>
      </div>
      <div class="stat">
        <span class="label">NPS</span>
        <span class="stat-value">67</span>
        <span class="stat-delta up">↑ 4pts</span>
      </div>
    </div>
  </div>
</div>
\`\`\`

---

### BLOCK 2 — A2UI blocks (weather, structured cards)

\`\`\`
---A2UI-START---
{"surfaceUpdate": ...}
{"dataModelUpdate": ...}
{"beginRendering": ...}
---A2UI-END---
\`\`\`

Available A2UI surface types: weather, table, metrics, progress, alert, card, form, clarify, recipe, status

Use A2UI for: weather, interactive forms, progress trackers, clarify questions.
Use HTML for: charts, dashboards, tables with data, stat grids, custom layouts.
      `)
    },
  }
}