import { For, Show, createMemo, createSignal, type Component } from "solid-js"
import { Button } from "@opencode-ai/ui/button"
import { DockPrompt } from "@opencode-ai/ui/dock-prompt"
import { useLanguage } from "@/context/language"

interface Question {
  id: string
  question: string
  kind: string
  options: string[]
}

export const SessionClarifyDock: Component<{
  questions: Question[]
  onSubmit: (text: string) => void
  onDismiss: () => void
}> = (props) => {
  const language = useLanguage()
  const [currentQ, setCurrentQ] = createSignal(0)
  const [collectedAnswers, setCollectedAnswers] = createSignal<string[]>([])
  const [customText, setCustomText] = createSignal("")

  const question = createMemo(() => props.questions[currentQ()])
  const isLast = createMemo(() => currentQ() >= props.questions.length - 1)
  const total = createMemo(() => props.questions.length)

  const pick = (opt: string) => {
    const newAnswers = [...collectedAnswers(), opt]
    setCollectedAnswers(newAnswers)
    setCustomText("")

    if (!isLast()) {
      setCurrentQ(currentQ() + 1)
      return
    }

    const lines = props.questions.map((q, i) => `${q.question}: ${newAnswers[i] ?? ""}`)
    props.onSubmit(lines.join(" | "))
  }

  const submitCustom = () => {
    const val = customText().trim()
    if (!val) return
    pick(val)
  }

  return (
    <DockPrompt
      kind="question"
      header={
        <>
          <div data-slot="question-header-title">
            {question()?.question}
          </div>
          <div data-slot="question-progress">
            <For each={props.questions}>
              {(_, i) => (
                <button
                  type="button"
                  data-slot="question-progress-segment"
                  data-active={i() === currentQ()}
                  data-answered={i() < currentQ()}
                  aria-label={`Question ${i() + 1}`}
                />
              )}
            </For>
          </div>
        </>
      }
      footer={
        <>
          <Button variant="ghost" size="large" onClick={props.onDismiss}>
            Dismiss
          </Button>
          <div data-slot="question-footer-actions">
            <Show when={currentQ() > 0}>
              <Button
                variant="secondary"
                size="large"
                onClick={() => {
                  setCurrentQ(currentQ() - 1)
                  setCollectedAnswers(prev => prev.slice(0, -1))
                }}
              >
                Back
              </Button>
            </Show>
          </div>
        </>
      }
    >
      <Show when={total() > 1}>
        <div data-slot="question-hint">
          Question {currentQ() + 1} of {total()}
        </div>
      </Show>

      <div data-slot="question-options">
        <For each={question()?.options ?? []}>
          {(opt, i) => (
            <button
              data-slot="question-option"
              role="radio"
              aria-checked={false}
              onClick={() => pick(opt)}
            >
              <span data-slot="question-option-check" aria-hidden="true">
                <span data-slot="question-option-box" data-type="radio" data-picked={false}>
                  <span data-slot="question-option-radio-dot" />
                </span>
              </span>
              <span data-slot="question-option-main">
                <span data-slot="option-label">{opt}</span>
              </span>
            </button>
          )}
        </For>

        {/* Custom answer input */}
        <form
          data-slot="question-option"
          data-custom="true"
          data-picked={customText().trim().length > 0}
          role="radio"
          aria-checked={customText().trim().length > 0}
          onSubmit={(e) => {
            e.preventDefault()
            submitCustom()
          }}
        >
          <span data-slot="question-option-check" aria-hidden="true">
            <span data-slot="question-option-box" data-type="radio" data-picked={customText().trim().length > 0}>
              <span data-slot="question-option-radio-dot" />
            </span>
          </span>
          <span data-slot="question-option-main">
            <span data-slot="option-label">Type your own answer</span>
            <textarea
              ref={(el) =>
                setTimeout(() => {
                  el.style.height = "0px"
                  el.style.height = `${el.scrollHeight}px`
                }, 0)
              }
              data-slot="question-custom-input"
              placeholder="Type your answer and press Enter..."
              value={customText()}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  submitCustom()
                }
              }}
              onInput={(e) => {
                setCustomText(e.currentTarget.value)
                e.currentTarget.style.height = "0px"
                e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`
              }}
            />
          </span>
        </form>
      </div>
    </DockPrompt>
  )
}
