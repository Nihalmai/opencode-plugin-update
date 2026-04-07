import { type Component, createSignal, onMount, onCleanup } from "solid-js"

// Loads a CDN script into the parent page once — skips if already loaded
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement("script")
    s.src = src
    s.onload = () => resolve()
    s.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(s)
  })
}

const HTMLRenderer: Component<{ html: string }> = (props) => {
  const [height, setHeight] = createSignal(400)
  const [exportingPdf, setExportingPdf] = createSignal(false)
  const [exportingCsv, setExportingCsv] = createSignal(false)
  const [hasCanvas, setHasCanvas] = createSignal(false)
  let iframeRef: HTMLIFrameElement | undefined

  const fullHTML = () => `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"><\/script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
      background: transparent;
      color: #0f172a;
      overflow: hidden;
    }
    #root { width: 100%; }
  </style>
</head>
<body>
  <div id="root">${props.html}</div>
  <script>
    function sendHeight() {
      var h = document.getElementById('root').scrollHeight
      if (h > 0) window.parent.postMessage({ type: 'genui-html-resize', height: h + 24 }, '*')
    }
    sendHeight()
    setTimeout(sendHeight, 200)
    setTimeout(sendHeight, 600)
    setTimeout(sendHeight, 1200)
    new ResizeObserver(sendHeight).observe(document.getElementById('root'))
    window.addEventListener('load', sendHeight)

    if (window.Chart) {
      Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif"
      Chart.defaults.font.size = 12
      Chart.defaults.color = "#71717a"
      Chart.defaults.borderColor = "#e4e4e7"
      Chart.defaults.plugins.tooltip.backgroundColor = "#09090b"
      Chart.defaults.plugins.tooltip.titleColor = "#ffffff"
      Chart.defaults.plugins.tooltip.bodyColor = "#a1a1aa"
      Chart.defaults.plugins.tooltip.borderColor = "#27272a"
      Chart.defaults.plugins.tooltip.borderWidth = 1
      Chart.defaults.plugins.tooltip.padding = 11
      Chart.defaults.plugins.tooltip.cornerRadius = 10
      Chart.defaults.scale.grid.color = "#f4f4f5"
      Chart.defaults.scale.ticks.padding = 8
      Chart.defaults.animation.duration = 600
    }

    function notifyCanvasReady() {
      var canvas = document.querySelector('canvas')
      if (canvas) {
        window.parent.postMessage({ type: 'genui-canvas-ready' }, '*')
      }
    }
    setTimeout(notifyCanvasReady, 800)
    setTimeout(notifyCanvasReady, 1500)
    setTimeout(notifyCanvasReady, 3000)
  <\/script>
</body>
</html>`

  // ── Filename helper ───────────────────────────────────────

  function getSmartFilename(ext: string): string {
    try {
      const doc = iframeRef?.contentDocument
      if (!doc) return `chart.${ext}`
      const title =
        doc.querySelector("h1, h2, h3, h4, .card-title")?.textContent?.trim() ||
        doc.querySelector("title")?.textContent?.trim()
      if (title) {
        return title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 50) + `.${ext}`
      }
    } catch {}
    return `chart.${ext}`
  }

  function fixQuotes(str: string): string {
    return str.replace(/'/g, '"')
  }

  // ── PDF Export ────────────────────────────────────────────
  // Captures the ENTIRE iframe body (title + chart + text) as a proper A4 PDF

  async function handleExportPdf() {
    try {
      setExportingPdf(true)

      // Load both libraries from CDN — only happens once, cached on repeat clicks
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js")
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js")

      const doc = iframeRef?.contentDocument
      if (!doc) throw new Error("iframe not ready")

      const win = window as any

      // Capture full iframe body — title, chart bars, summary text, all of it
      const capturedCanvas = await win.html2canvas(doc.body, {
        scale: 2,                        // 2x resolution = crisp, not blurry
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",      // white background in PDF
        width: doc.body.scrollWidth,
        height: doc.body.scrollHeight,
        windowWidth: doc.body.scrollWidth,
        windowHeight: doc.body.scrollHeight,
      })

      const imgData = capturedCanvas.toDataURL("image/png", 1.0)

      // Fit content into A4 page with 15mm margins
      const pageW = 210
      const pageH = 297
      const margin = 15
      const contentW = pageW - margin * 2
      const imgAspect = capturedCanvas.height / capturedCanvas.width
      const contentH = Math.min(contentW * imgAspect, pageH - margin * 2)

      const { jsPDF } = win.jspdf
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" })
      pdf.addImage(imgData, "PNG", margin, margin, contentW, contentH)
      pdf.save(getSmartFilename("pdf"))
    } catch (err) {
      console.error("PDF export failed:", err)
    } finally {
      setTimeout(() => setExportingPdf(false), 2000)
    }
  }

  // ── CSV Export ────────────────────────────────────────────

  function handleExportCsv() {
    try {
      const doc = iframeRef?.contentDocument
      if (!doc) return

      // 1 — hidden chart-data element (AI-provided JSON)
      const dataEl = doc.getElementById("chart-data")
      if (dataEl) {
        try {
          const data = JSON.parse(dataEl.textContent || "")
          if (data?.labels?.length) {
            buildAndDownloadCsv(data.labels, data.datasets)
            return
          }
        } catch {}
      }

      // 2 — scan inline scripts for ECharts / Chart.js data arrays
      const scripts = Array.from(doc.querySelectorAll("script:not([src])"))
      for (const script of scripts) {
        const content = script.textContent || ""
        if (!content.includes("setOption") && !content.includes("new Chart")) continue

        const xMatch = content.match(/xAxis[\s\S]*?data:\s*(\[[^\]]+\])/)
        const yMatches = [...content.matchAll(/series[\s\S]*?data:\s*(\[[^\]]+\])/g)]
        if (xMatch && yMatches.length > 0) {
          try {
            const labels = JSON.parse(fixQuotes(xMatch[1]))
            const datasets = yMatches.map((m, i) => ({
              label: `Series ${i + 1}`,
              data: JSON.parse(fixQuotes(m[1]))
            }))
            buildAndDownloadCsv(labels, datasets)
            return
          } catch {}
        }

        const labelsMatch = content.match(/labels:\s*(\[[^\]]+\])/)
        const dataMatch = content.match(/data:\s*(\[[^\]]+\])/)
        if (labelsMatch && dataMatch) {
          try {
            const labels = JSON.parse(fixQuotes(labelsMatch[1]))
            const values = JSON.parse(fixQuotes(dataMatch[1]))
            buildAndDownloadCsv(labels, [{ label: "Value", data: values }])
            return
          } catch {}
        }
      }

      // 3 — fallback: HTML table
      const table = doc.querySelector("table")
      if (table) {
        const rows = Array.from(table.querySelectorAll("tr"))
        const csv = rows.map((row) =>
          Array.from(row.querySelectorAll("th, td"))
            .map((cell) => `"${cell.textContent?.trim()}"`)
            .join(",")
        ).join("\n")
        downloadCsvString(csv)
        return
      }

      console.warn("No chart data found to export")
    } catch (err) {
      console.error("CSV export failed:", err)
      setExportingCsv(false)
    }
  }

  function buildAndDownloadCsv(
    labels: any[],
    datasets: { label: string; data: any[] }[]
  ) {
    const headers = ["Label", ...datasets.map((ds) => ds.label || "Value")]
    const rows = labels.map((label: any, i: number) => {
      const values = datasets.map((ds) => ds.data[i] ?? "")
      return [label, ...values]
    })
    const csv = [headers, ...rows]
      .map((row) => row.map((cell: any) => `"${cell}"`).join(","))
      .join("\n")
    downloadCsvString(csv)
  }

  function downloadCsvString(csv: string) {
    setExportingCsv(true)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = getSmartFilename("csv")
    a.style.display = "none"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setTimeout(() => setExportingCsv(false), 2000)
  }

  // ── Message listener ──────────────────────────────────────

  function handleMessage(e: MessageEvent) {
    if (!e.data?.type) return
    if (e.data.type === "genui-html-resize") {
      setHeight(Math.min(Math.max(e.data.height, 120), 900))
    }
    if (e.data.type === "genui-canvas-ready") {
      setHasCanvas(true)
    }
  }

  onMount(() => window.addEventListener("message", handleMessage))
  onCleanup(() => window.removeEventListener("message", handleMessage))

  // ── Button style ──────────────────────────────────────────

  const btnStyle = (active: boolean) => ({
    display: "inline-flex",
    "align-items": "center",
    gap: "5px",
    padding: "5px 12px",
    "border-radius": "8px",
    "font-size": "12px",
    "font-weight": "600",
    "font-family": "inherit",
    cursor: "pointer",
    border: "1px solid #e4e4e7",
    background: active ? "#f0fdf4" : "#ffffff",
    color: active ? "#16a34a" : "#3f3f46",
    transition: "all .15s",
    "box-shadow": "0 1px 2px rgba(0,0,0,.05)",
  })

  // ── Render ────────────────────────────────────────────────

  return (
    <div style={{ "margin": "8px 0 16px 0", "width": "100%" }}>
      <iframe
        ref={iframeRef}
        srcdoc={fullHTML()}
        sandbox="allow-scripts allow-same-origin"
        style={{
          "width": "100%",
          "height": `${height()}px`,
          "border": "none",
          "display": "block",
          "background": "transparent",
        }}
      />
      {hasCanvas() && (
        <div style={{
          display: "flex",
          "justify-content": "flex-end",
          gap: "6px",
          "margin-top": "8px",
        }}>
          <button style={btnStyle(exportingPdf())} onClick={handleExportPdf} disabled={exportingPdf()}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            {exportingPdf() ? "Exported!" : "Export PDF"}
          </button>

          <button style={btnStyle(exportingCsv())} onClick={handleExportCsv} disabled={exportingCsv()}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {exportingCsv() ? "Exported!" : "Export CSV"}
          </button>
        </div>
      )}
    </div>
  )
}

export default HTMLRenderer