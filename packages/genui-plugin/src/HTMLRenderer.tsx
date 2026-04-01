import { type Component, createSignal, onMount, onCleanup } from "solid-js"

const HTMLRenderer: Component<{ html: string }> = (props) => {
  const [height, setHeight] = createSignal(400)
  const [copying, setCopying] = createSignal(false)
  const [downloading, setDownloading] = createSignal(false)
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

  function getSmartFilename(): string {
    try {
      const doc = iframeRef?.contentDocument
      if (!doc) return "chart.png"
      const title =
        doc.querySelector("h1, h2, h3, h4, .card-title")?.textContent?.trim() ||
        doc.querySelector("title")?.textContent?.trim()
      if (title) {
        return title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 50) + ".png"
      }
    } catch {}
    return "chart.png"
  }

  function getCanvasDataUrl(): string | null {
    try {
      const doc = iframeRef?.contentDocument
      if (!doc) return null
      const canvas = doc.querySelector("canvas")
      if (!canvas) return null
      return canvas.toDataURL("image/png")
    } catch {
      return null
    }
  }

  function handleDownload() {
    const dataUrl = getCanvasDataUrl()
    if (!dataUrl) return
    setDownloading(true)
    const filename = getSmartFilename()
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = filename
    a.style.display = "none"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => setDownloading(false), 2000)
  }

  function handleCopy() {
    const dataUrl = getCanvasDataUrl()
    if (!dataUrl) return
    setCopying(true)
    fetch(dataUrl)
      .then((r) => r.blob())
      .then((blob) =>
        navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
      )
      .then(() => setTimeout(() => setCopying(false), 2000))
      .catch(() => setCopying(false))
  }

  function handleMessage(e: MessageEvent) {
    if (!e.data?.type) return
    if (e.data.type === "genui-html-resize") {
      setHeight(Math.min(Math.max(e.data.height, 120), 900))
    }
    if (e.data.type === "genui-canvas-ready") {
      setHasCanvas(true)
    }
  }

  onMount(() => {
    window.addEventListener("message", handleMessage)
  })

  onCleanup(() => {
    window.removeEventListener("message", handleMessage)
  })

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
          <button style={btnStyle(downloading())} onClick={handleDownload}>
            ⬇ {downloading() ? "Downloaded!" : "Download PNG"}
          </button>
          <button style={btnStyle(copying())} onClick={handleCopy}>
            📋 {copying() ? "Copied!" : "Copy Image"}
          </button>
        </div>
      )}
    </div>
  )
}

export default HTMLRenderer