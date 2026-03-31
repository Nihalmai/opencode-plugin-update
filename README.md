# opencode-genui

A fork of [OpenCode](https://github.com/anomalyco/opencode) with built-in UI rendering support — charts, tables, weather cards, metrics, and more.

## What this adds

- **HTML blocks** — renders charts and visualizations inline via iframe
- **A2UI blocks** — renders structured UI components (weather, table, metrics, progress, alert, card, form, recipe, status)
- **Auto system prompt injection** — no setup needed per project, works everywhere

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

## Keeping up with upstream

When anomalyco/opencode releases updates:
```bash
git remote add upstream https://github.com/anomalyco/opencode
git fetch upstream
git merge upstream/dev
```

Only these 3 files may conflict:
- `packages/ui/src/components/message-part.tsx`
- `packages/ui/package.json`  
- `packages/opencode/package.json`

Everything in `packages/genui-plugin/` is untouched.
