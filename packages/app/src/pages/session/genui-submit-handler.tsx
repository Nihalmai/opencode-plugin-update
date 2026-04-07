import { onMount, onCleanup } from "solid-js"
import { useParams } from "@solidjs/router"
import { useSDK } from "@/context/sdk"

export function GenUISubmitHandler() {
  const sdk = useSDK()
  const params = useParams<{ id: string }>()

  onMount(() => {
    const handler = async (e: Event) => {
      const text = (e as CustomEvent<{ text: string }>).detail?.text
      if (!text) return
      const sessionID = params.id
      if (!sessionID) return
      try {
        await (sdk.client as any).session.chat({
          sessionID,
          parts: [{ type: "text", text }],
        })
      } catch (err) {
        console.error("GenUI submit error:", err)
      }
    }
    window.addEventListener("genui-submit", handler)
    onCleanup(() => window.removeEventListener("genui-submit", handler))
  })

  return null
}