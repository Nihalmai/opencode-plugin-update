# opencode-genui

A fork of [OpenCode](https://github.com/anomalyco/opencode) with built-in UI rendering support — charts, tables, weather cards, metrics, dashboards, and more.

## What this adds

- **HTML blocks** — renders charts and visualizations inline via iframe using a full shadcn-quality design system
- **A2UI blocks** — renders structured UI components (weather, table, metrics, progress, alert, card, form, recipe, status, clarify)
- **Auto system prompt injection** — no setup needed per project, works everywhere automatically
- **Global charts skill** — AI knows how to generate beautiful charts using Chart.js with consistent styling

## Demo

Ask any of these and get instant visual UI:

```
weather at mumbai
show me a bar chart of monthly revenue Jan 12k Feb 18k Mar 15k Apr 22k
show me a SaaS metrics dashboard with MRR, churn, NPS
show me a progress tracker for building a mobile app
show me a sortable table of top 5 programming languages
give me a full product launch dashboard
```

## How it works

```
User asks question
      ↓
plugin.ts tells AI to use special format
      ↓
AI responds with ---A2UI-START--- or ---HTML-START--- block
      ↓
genui-parser.ts scans and finds the block
      ↓
a2ui-mapper.ts translates it
      ↓
GenUIRenderer.tsx or HTMLRenderer.tsx draws the UI
      ↓
User sees beautiful interactive card ✅
```

## How to run

### Prerequisites
- [Bun](https://bun.sh) installed
- Node.js 18+

### Setup
```bash
git clone https://github.com/Nihalmai/opencode-plugin-update.git
cd opencode-plugin-update
bun install
bun run dev
```

## Setting up the charts skill (global)

Skills tell the AI extra instructions for specific tasks. The charts skill makes chart output significantly better.

### Step 1 — Create the skill folder
```bash
mkdir -p ~/.claude/skills/charts-skill
```

### Step 2 — Create the skill file
Create `~/.claude/skills/charts-skill/SKILL.md` with this content:

```markdown
# Charts Skill

When generating charts always use Chart.js inside ---HTML-START--- blocks.

## Rules
- Always wrap canvas in a div with class="chart-wrap"
- Always wrap everything in a div with class="card"
- Use card-header for title and badge
- Use these colors in order: #6366f1, #f59e0b, #10b981, #3b82f6, #ec4899
- Always set borderRadius: 6 on bar charts
- Always set tension: 0.4 on line charts
- Always set responsive: true
- Never add custom CSS — use the design system classes only

## Available design classes
card, card-header, card-body, card-title, card-footer,
badge, badge-green, badge-indigo, badge-red, badge-amber,
stat-grid, stat, stat-value, stat-label, stat-delta, delta-up, delta-down,
grid-2, grid-3, grid-4, flex, items-center, justify-between,
gap-2, gap-3, gap-4, mt-2, mt-3, mb-2, mb-3,
text-muted, text-sm, font-bold, overline
```

### Step 3 — Point OpenCode to your skills
Add to your `~/.config/opencode/config.json`:
```json
{
  "skills": ["~/.claude/skills"]
}
```

## Plugin only (no fork needed)

If you just want the AI side (system prompt injection) without the UI rendering, install the npm package:

```bash
npm install opencode-genui-plugin
```

Then add to your `opencode.json`:
```json
{
  "plugin": ["opencode-genui-plugin"]
}
```

> Note: This gives you correct AI output format but cards won't render visually without this fork.

## Architecture

```
packages/
├── genui-plugin/          ← your plugin (safe from upstream updates)
│   └── src/
│       ├── plugin.ts         ← injects system prompt
│       ├── GenUIRenderer.tsx ← renders 10 UI components
│       ├── HTMLRenderer.tsx  ← renders charts (shadcn-quality design system)
│       ├── genui-parser.ts   ← parses A2UI and HTML blocks
│       ├── a2ui-mapper.ts    ← translates A2UI to component data
│       ├── genui-schema.ts   ← TypeScript types
│       └── index.tsx         ← exports everything
├── opencode/              ← OpenCode source (3 lines changed)
└── ui/                    ← OpenCode UI (minimal changes)
```

## Keeping up with upstream

When anomalyco/opencode releases updates:

```bash
git remote add upstream https://github.com/anomalyco/opencode
git fetch upstream
git merge upstream/dev
```

Only these 3 files may ever conflict:
- `packages/ui/src/components/message-part.tsx`
- `packages/ui/package.json`
- `packages/opencode/package.json`

Everything in `packages/genui-plugin/` is completely untouched.

## Related

- [OpenCode](https://github.com/anomalyco/opencode) — the original project
- [npm package](https://www.npmjs.com/package/opencode-genui-plugin) — AI side only
- [Feature request on OpenCode](https://github.com/anomalyco/opencode/issues/19919) — official UI plugin API request
