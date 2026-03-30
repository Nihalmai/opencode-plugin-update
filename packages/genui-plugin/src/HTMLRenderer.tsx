import { type Component, createSignal, onMount } from "solid-js"

const HTMLRenderer: Component<{ html: string }> = (props) => {
  let iframeRef: HTMLIFrameElement | undefined
  const [height, setHeight] = createSignal(400)

  const fullHTML = () => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
          background: #ffffff;
          color: #0f172a;
          padding: 0;
          color: #f1f5f9;
          overflow: hidden;
        }
        #root { width: 100%; }
      </style>
    </head>
    <body>
      <div id="root">${props.html}</div>
      <script>
        function sendHeight() {
  const h = document.getElementById('root').scrollHeight
  if (h > 0) window.parent.postMessage({ type: 'genui-html-resize', height: h + 24 }, '*')
}

sendHeight()
setTimeout(sendHeight, 200)
setTimeout(sendHeight, 600)
setTimeout(sendHeight, 1200)

const observer = new ResizeObserver(sendHeight)
observer.observe(document.getElementById('root'))
window.addEventListener('load', sendHeight)
      </script>
    </body>
    </html>
  `

  onMount(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "genui-html-resize") {
        setHeight(Math.min(Math.max(e.data.height, 120), 900))
      }
    }
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  })

  return (
    <div style={{
      "margin": "8px 0 16px 0",
      "width": "100%",
      "max-width": "100%",
    }}>
      <iframe
        ref={iframeRef}
        srcdoc={fullHTML()}
        sandbox="allow-scripts"
        style={{
          "width": "100%",
          "height": `${height()}px`,
          "border": "none",
          "display": "block",
          "background": "transparent",
        }}
      />
    </div>
  )
}

export default HTMLRenderer