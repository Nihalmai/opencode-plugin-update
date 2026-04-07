import { type Component, For, Show, Switch, Match, createMemo, createSignal, onMount } from "solid-js"
import type { GenUIComponent } from "./genui-schema"

const GenUIRenderer: Component<{ component: GenUIComponent }> = (props) => {
  return (
    <div style={{ "margin": "12px 0", "font-family": "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <Switch>
        <Match when={props.component.type === "weather"}><WeatherCard c={props.component as any} /></Match>
        <Match when={props.component.type === "recipe"}><RecipeCard c={props.component as any} /></Match>
        <Match when={props.component.type === "progress"}><ProgressCard c={props.component as any} /></Match>
        <Match when={props.component.type === "metrics"}><MetricsCard c={props.component as any} /></Match>
        <Match when={props.component.type === "table"}><TableCard c={props.component as any} /></Match>
        <Match when={props.component.type === "status"}><StatusCard c={props.component as any} /></Match>
        <Match when={props.component.type === "alert"}><AlertCard c={props.component as any} /></Match>
        <Match when={props.component.type === "card"}><InfoCard c={props.component as any} /></Match>
        <Match when={props.component.type === "clarify"}><ClarifyCard c={props.component as any} /></Match>
      </Switch>
    </div>
  )
}

export default GenUIRenderer

// ── Shared styles ─────────────────────────────────────────────────────────────

const card: Record<string, string> = {
  background: "#ffffff",
  "border-radius": "16px",
  "box-shadow": "0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)",
  overflow: "hidden",
  "max-width": "480px",
}

const labelStyle: Record<string, string> = {
  "font-size": "11px",
  "font-weight": "600",
  "letter-spacing": "0.07em",
  "text-transform": "uppercase",
  color: "#9ca3af",
}

const btn = (color: string, text = "#fff") => ({
  background: color, color: text, border: "none", "border-radius": "8px",
  padding: "8px 16px", "font-size": "13px", "font-weight": "600", cursor: "pointer",
  transition: "opacity 0.15s", "font-family": "inherit",
})

// ── Weather ───────────────────────────────────────────────────────────────────

const weatherIcons: Record<string, string> = {
  sunny: "☀️", clear: "☀️", cloudy: "☁️", overcast: "☁️",
  rain: "🌧️", rainy: "🌧️", drizzle: "🌦️", snow: "❄️",
  storm: "⛈️", thunder: "⛈️", fog: "🌫️", windy: "💨",
  partlycloudy: "⛅", "partly cloudy": "⛅", night: "🌙",
}

const getWeatherIcon = (condition?: string) => {
  if (!condition) return "🌤️"
  const key = condition.toLowerCase().replace(/\s+/g, "")
  return weatherIcons[key] ?? weatherIcons[condition.toLowerCase()] ?? "🌤️"
}

const tempColor = (temp: number, unit = "C") => {
  const c = unit === "F" ? (temp - 32) * 5 / 9 : temp
  if (c <= 0) return "#60a5fa"
  if (c <= 15) return "#34d399"
  if (c <= 28) return "#f59e0b"
  return "#ef4444"
}

const WeatherCard: Component<{ c: any }> = (props) => {
  const c = props.c
  const [unit, setUnit] = createSignal<"C" | "F">(c.unit ?? "C")
  const [selectedDay, setSelectedDay] = createSignal<number | null>(null)
  const [dismissed, setDismissed] = createSignal(false)

  const displayTemp = (temp: number) =>
    unit() === "C" ? temp : Math.round(temp * 9 / 5 + 32)

  if (dismissed()) return null

  return (
    <div style={{ ...card, "max-width": "340px" }}>
      <div style={{ background: "linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)", padding: "16px 20px 12px" }}>
        <div style={{ display: "flex", "align-items": "center", "justify-content": "space-between", "margin-bottom": "4px" }}>
          <div style={{ ...labelStyle }}>WEATHER IN</div>
          <div style={{ display: "flex", gap: "4px" }}>
            <button onClick={() => setUnit("C")} style={{ ...btn(unit() === "C" ? "#0ea5e9" : "#e2e8f0", unit() === "C" ? "#fff" : "#64748b"), padding: "2px 8px", "font-size": "11px", "border-radius": "6px" }}>°C</button>
            <button onClick={() => setUnit("F")} style={{ ...btn(unit() === "F" ? "#0ea5e9" : "#e2e8f0", unit() === "F" ? "#fff" : "#64748b"), padding: "2px 8px", "font-size": "11px", "border-radius": "6px" }}>°F</button>
            <button onClick={() => setDismissed(true)} style={{ ...btn("#f1f5f9", "#94a3b8"), padding: "2px 8px", "font-size": "11px", "border-radius": "6px" }}>✕</button>
          </div>
        </div>
        <div style={{ display: "flex", "align-items": "center", "justify-content": "space-between" }}>
          <div style={{ "font-size": "20px", "font-weight": "700", color: "#0f172a" }}>{c.city ?? c.location}</div>
          <div style={{ "font-size": "36px", "line-height": "1" }}>{c.icon ?? getWeatherIcon(c.condition)}</div>
        </div>
      </div>
      <div style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", "align-items": "flex-end", gap: "4px", "margin-bottom": "4px" }}>
          <span style={{ "font-size": "52px", "font-weight": "800", "line-height": "1", color: tempColor(c.temperature, c.unit) }}>{displayTemp(c.temperature)}</span>
          <span style={{ "font-size": "20px", color: "#94a3b8", "margin-bottom": "8px" }}>°{unit()}</span>
        </div>
        <div style={{ "font-size": "14px", color: "#64748b", "font-weight": "500", "margin-bottom": "14px" }}>{c.condition}</div>
        <Show when={c.humidity || c.wind || c.feelsLike !== undefined}>
          <div style={{ display: "grid", "grid-template-columns": "repeat(3, 1fr)", gap: "1px", background: "#f1f5f9", "border-radius": "10px", overflow: "hidden" }}>
            <Show when={c.feelsLike !== undefined}><StatBox label="Feels like" value={`${displayTemp(c.feelsLike)}°`} /></Show>
            <Show when={c.humidity}><StatBox label="Humidity" value={`${c.humidity}`} /></Show>
            <Show when={c.wind}><StatBox label="Wind" value={c.wind} /></Show>
          </div>
        </Show>
      </div>
      <Show when={c.forecast?.length}>
        <div style={{ "border-top": "1px solid #f1f5f9", padding: "12px 20px" }}>
          <div style={{ display: "flex", "justify-content": "space-between" }}>
            <For each={c.forecast}>
              {(day: any, i) => (
                <div
                  onClick={() => setSelectedDay(selectedDay() === i() ? null : i())}
                  style={{
                    "text-align": "center", cursor: "pointer", padding: "6px 8px",
                    "border-radius": "10px", transition: "background 0.15s",
                    background: selectedDay() === i() ? "#eff6ff" : "transparent",
                    border: selectedDay() === i() ? "1px solid #bfdbfe" : "1px solid transparent",
                  }}
                >
                  <div style={{ "font-size": "10px", color: "#94a3b8", "margin-bottom": "4px" }}>{day.day}</div>
                  <div style={{ "font-size": "16px", "margin-bottom": "4px" }}>{getWeatherIcon(day.condition)}</div>
                  <div style={{ "font-size": "12px", "font-weight": "600", color: "#374151" }}>{displayTemp(day.high)}°</div>
                  <div style={{ "font-size": "11px", color: "#9ca3af" }}>{displayTemp(day.low)}°</div>
                </div>
              )}
            </For>
          </div>
          <Show when={selectedDay() !== null}>
            <div style={{ "margin-top": "10px", padding: "10px", background: "#eff6ff", "border-radius": "10px", "font-size": "12px", color: "#1d4ed8" }}>
              {c.forecast[selectedDay()!]?.day}: {c.forecast[selectedDay()!]?.condition}, High {displayTemp(c.forecast[selectedDay()!]?.high)}° / Low {displayTemp(c.forecast[selectedDay()!]?.low)}°
            </div>
          </Show>
        </div>
      </Show>
    </div>
  )
}

const StatBox: Component<{ label: string; value: string }> = (props) => (
  <div style={{ background: "#ffffff", padding: "10px 8px", "text-align": "center" }}>
    <div style={{ "font-size": "10px", color: "#94a3b8", "margin-bottom": "2px" }}>{props.label}</div>
    <div style={{ "font-size": "13px", "font-weight": "600", color: "#374151" }}>{props.value}</div>
  </div>
)

// ── Progress ──────────────────────────────────────────────────────────────────

const ProgressCard: Component<{ c: any }> = (props) => {
  const c = props.c
  const [steps, setSteps] = createSignal<any[]>(
    (c.steps ?? []).map((s: any) => ({ ...s, done: s.status === "done" }))
  )
  const [newStep, setNewStep] = createSignal("")
  const [adding, setAdding] = createSignal(false)

  const done = () => steps().filter(s => s.done).length
  const total = () => steps().length
  const pct = () => total() > 0 ? Math.round((done() / total()) * 100) : 0

  const toggle = (i: number) => {
    setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, done: !s.done, status: !s.done ? "done" : "pending" } : s))
  }

  const removeStep = (i: number) => {
    setSteps(prev => prev.filter((_, idx) => idx !== i))
  }

  const addStep = () => {
    if (!newStep().trim()) return
    setSteps(prev => [...prev, { label: newStep(), status: "pending", done: false }])
    setNewStep("")
    setAdding(false)
  }

  const statusStyle = (s: any) => {
    if (s.done) return { bg: "#dcfce7", color: "#16a34a", icon: "✓" }
    if (s.status === "active") return { bg: "#dbeafe", color: "#2563eb", icon: "→" }
    if (s.status === "error") return { bg: "#fee2e2", color: "#dc2626", icon: "✗" }
    return { bg: "#f1f5f9", color: "#94a3b8", icon: "○" }
  }

  return (
    <div style={{ ...card, "max-width": "440px" }}>
      <div style={{ padding: "20px 22px" }}>
        <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center", "margin-bottom": "6px" }}>
          <h3 style={{ "font-size": "16px", "font-weight": "700", color: "#0f172a", margin: "0" }}>{c.title ?? "Progress"}</h3>
          <span style={{ "font-size": "13px", "font-weight": "600", color: "#6366f1" }}>{pct()}%</span>
        </div>
        <div style={{ "font-size": "12px", color: "#94a3b8", "margin-bottom": "12px" }}>{done()} of {total()} completed</div>
        <div style={{ height: "8px", background: "#e2e8f0", "border-radius": "999px", overflow: "hidden", "margin-bottom": "20px" }}>
          <div style={{ height: "100%", "border-radius": "999px", width: `${pct()}%`, background: "linear-gradient(90deg, #6366f1, #8b5cf6)", transition: "width 0.4s ease" }} />
        </div>

        <div style={{ display: "flex", "flex-direction": "column", gap: "8px" }}>
          <For each={steps()}>
            {(step, i) => {
              const s = statusStyle(step)
              const [hovered, setHovered] = createSignal(false)
              return (
                <div
                  onMouseEnter={() => setHovered(true)}
                  onMouseLeave={() => setHovered(false)}
                  style={{
                    display: "flex", "align-items": "center", gap: "12px",
                    padding: "10px 12px", "border-radius": "10px", cursor: "pointer",
                    background: step.done ? "#f0fdf4" : step.status === "active" ? "#eff6ff" : "#fafafa",
                    border: step.done ? "1px solid #bbf7d0" : step.status === "active" ? "1px solid #bfdbfe" : "1px solid transparent",
                    transition: "all 0.15s",
                  }}
                  onClick={() => toggle(i())}
                >
                  <div style={{
                    width: "28px", height: "28px", "border-radius": "50%",
                    background: s.bg, color: s.color,
                    display: "flex", "align-items": "center", "justify-content": "center",
                    "font-size": "13px", "font-weight": "700", "flex-shrink": "0",
                    transition: "all 0.2s",
                  }}>{s.icon}</div>
                  <div style={{ flex: "1" }}>
                    <div style={{
                      "font-size": "13px", "font-weight": "500",
                      color: step.done ? "#16a34a" : step.status === "pending" ? "#94a3b8" : "#1e293b",
                      "text-decoration": step.done ? "line-through" : "none",
                      transition: "all 0.2s",
                    }}>{step.label}</div>
                    <Show when={step.detail}>
                      <div style={{ "font-size": "11px", color: "#94a3b8", "margin-top": "1px" }}>{step.detail}</div>
                    </Show>
                  </div>
                  <Show when={hovered()}>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeStep(i()) }}
                      style={{ ...btn("#fee2e2", "#dc2626"), padding: "2px 8px", "font-size": "11px", "border-radius": "6px" }}
                    >✕</button>
                  </Show>
                </div>
              )
            }}
          </For>
        </div>

        <Show when={adding()}>
          <div style={{ display: "flex", gap: "8px", "margin-top": "12px" }}>
            <input
              value={newStep()}
              onInput={(e) => setNewStep(e.currentTarget.value)}
              onKeyDown={(e) => e.key === "Enter" && addStep()}
              placeholder="Add new step..."
              style={{ flex: "1", padding: "8px 12px", border: "1px solid #e2e8f0", "border-radius": "8px", "font-size": "13px", outline: "none", "font-family": "inherit" }}
              autofocus
            />
            <button onClick={addStep} style={{ ...btn("#6366f1"), padding: "8px 14px" }}>Add</button>
            <button onClick={() => setAdding(false)} style={{ ...btn("#f1f5f9", "#64748b"), padding: "8px 14px" }}>Cancel</button>
          </div>
        </Show>

        <button
          onClick={() => setAdding(true)}
          style={{ ...btn("#f8fafc", "#6366f1"), width: "100%", "margin-top": "12px", padding: "10px", border: "1px dashed #c7d2fe" }}
        >+ Add Step</button>
      </div>
    </div>
  )
}

// ── Recipe ────────────────────────────────────────────────────────────────────

const RecipeCard: Component<{ c: any }> = (props) => {
  const c = props.c
  const [checkedIngredients, setCheckedIngredients] = createSignal<Set<number>>(new Set())
  const [activeStep, setActiveStep] = createSignal(0)
  const [servings, setServings] = createSignal(c.servings ?? 2)
  const [timerRunning, setTimerRunning] = createSignal(false)
  const [timerSeconds, setTimerSeconds] = createSignal(0)

  const toggleIngredient = (i: number) => {
    setCheckedIngredients(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`

  let timerInterval: any
  const toggleTimer = () => {
    if (timerRunning()) {
      clearInterval(timerInterval)
      setTimerRunning(false)
    } else {
      setTimerRunning(true)
      timerInterval = setInterval(() => setTimerSeconds(s => s + 1), 1000)
    }
  }

  return (
    <div style={{ ...card, "max-width": "500px" }}>
      <div style={{ padding: "20px 22px 0" }}>
        <div style={{ display: "flex", "align-items": "center", "justify-content": "space-between", "margin-bottom": "8px" }}>
          <h2 style={{ "font-size": "18px", "font-weight": "700", color: "#0f172a", margin: "0" }}>{c.title}</h2>
          <Show when={c.icon}><span style={{ "font-size": "28px" }}>{c.icon}</span></Show>
        </div>
        <div style={{ display: "flex", gap: "8px", "flex-wrap": "wrap", "margin-bottom": "12px" }}>
          <Show when={c.time}><Chip text={`⏱ ${c.time}`} bg="#f0fdf4" color="#16a34a" /></Show>
          <Show when={c.difficulty}><Chip text={`★ ${c.difficulty}`} bg="#fefce8" color="#ca8a04" /></Show>
          <div style={{ display: "flex", "align-items": "center", gap: "6px", padding: "4px 10px", background: "#eff6ff", "border-radius": "999px" }}>
            <button onClick={() => setServings(s => Math.max(1, s - 1))} style={{ ...btn("#dbeafe", "#2563eb"), padding: "0 6px", "border-radius": "4px", "font-size": "14px" }}>−</button>
            <span style={{ "font-size": "12px", "font-weight": "600", color: "#2563eb" }}>{servings()} servings</span>
            <button onClick={() => setServings(s => s + 1)} style={{ ...btn("#dbeafe", "#2563eb"), padding: "0 6px", "border-radius": "4px", "font-size": "14px" }}>+</button>
          </div>
        </div>
      </div>

      <Show when={c.ingredients?.length}>
        <div style={{ padding: "0 22px 16px" }}>
          <div style={{ ...labelStyle, "margin-bottom": "10px" }}>
            Ingredients
            <span style={{ "margin-left": "8px", "font-size": "11px", color: "#a5b4fc", "text-transform": "none", "font-weight": "400" }}>
              ({checkedIngredients().size}/{c.ingredients.length} checked)
            </span>
          </div>
          <div style={{ display: "grid", "grid-template-columns": "repeat(2, 1fr)", gap: "8px" }}>
            <For each={c.ingredients}>
              {(ing: any, i) => (
                <div
                  onClick={() => toggleIngredient(i())}
                  style={{
                    display: "flex", "align-items": "center", gap: "8px",
                    padding: "8px 10px", "border-radius": "8px", cursor: "pointer",
                    background: checkedIngredients().has(i()) ? "#f0fdf4" : "#f8fafc",
                    border: checkedIngredients().has(i()) ? "1px solid #bbf7d0" : "1px solid #f1f5f9",
                    transition: "all 0.15s", opacity: checkedIngredients().has(i()) ? "0.6" : "1",
                  }}
                >
                  <span style={{ "font-size": "18px" }}>{checkedIngredients().has(i()) ? "✅" : (ing.icon ?? "🥄")}</span>
                  <div>
                    <div style={{ "font-size": "12px", "font-weight": "600", color: "#1e293b", "text-decoration": checkedIngredients().has(i()) ? "line-through" : "none" }}>{ing.name}</div>
                    <div style={{ "font-size": "11px", color: "#94a3b8" }}>{ing.amount}</div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>

      <Show when={c.steps?.length}>
        <div style={{ "border-top": "1px solid #f1f5f9", padding: "16px 22px" }}>
          <div style={{ display: "flex", "align-items": "center", "justify-content": "space-between", "margin-bottom": "12px" }}>
            <div style={{ ...labelStyle }}>Instructions</div>
            <div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
              <span style={{ "font-size": "12px", "font-weight": "600", color: timerRunning() ? "#ef4444" : "#64748b", "font-variant-numeric": "tabular-nums" }}>
                ⏱ {formatTime(timerSeconds())}
              </span>
              <button onClick={toggleTimer} style={{ ...btn(timerRunning() ? "#fee2e2" : "#f0fdf4", timerRunning() ? "#dc2626" : "#16a34a"), padding: "4px 10px", "font-size": "11px" }}>
                {timerRunning() ? "Pause" : "Start"}
              </button>
              <button onClick={() => { setTimerSeconds(0); setTimerRunning(false); clearInterval(timerInterval) }} style={{ ...btn("#f1f5f9", "#64748b"), padding: "4px 10px", "font-size": "11px" }}>Reset</button>
            </div>
          </div>
          <For each={c.steps}>
            {(step: any, i) => (
              <div
                onClick={() => setActiveStep(i())}
                style={{
                  display: "flex", gap: "12px", "margin-bottom": "10px",
                  cursor: "pointer", opacity: activeStep() === i() ? "1" : "0.5",
                  transition: "opacity 0.2s",
                }}
              >
                <div style={{
                  width: "24px", height: "24px", "border-radius": "50%", "flex-shrink": "0",
                  background: activeStep() === i() ? "#f97316" : "#e2e8f0",
                  color: activeStep() === i() ? "#fff" : "#64748b",
                  display: "flex", "align-items": "center", "justify-content": "center",
                  "font-size": "12px", "font-weight": "700", transition: "all 0.2s",
                }}>{i() + 1}</div>
                <div style={{ "font-size": "13px", color: "#374151", "line-height": "1.5", "padding-top": "3px" }}>
                  {typeof step === "string" ? step : step.text ?? step.instruction}
                </div>
              </div>
            )}
          </For>
          <div style={{ display: "flex", gap: "8px", "margin-top": "4px" }}>
            <button
              onClick={() => setActiveStep(s => Math.max(0, s - 1))}
              disabled={activeStep() === 0}
              style={{ ...btn("#f1f5f9", "#374151"), flex: "1", opacity: activeStep() === 0 ? "0.4" : "1" }}
            >← Previous</button>
            <button
              onClick={() => setActiveStep(s => Math.min((c.steps?.length ?? 1) - 1, s + 1))}
              disabled={activeStep() === (c.steps?.length ?? 1) - 1}
              style={{ ...btn("#f97316"), flex: "1", opacity: activeStep() === (c.steps?.length ?? 1) - 1 ? "0.4" : "1" }}
            >Next Step →</button>
          </div>
        </div>
      </Show>
    </div>
  )
}

const Chip: Component<{ text: string; bg: string; color: string }> = (props) => (
  <span style={{ "font-size": "12px", "font-weight": "500", padding: "4px 10px", "border-radius": "999px", background: props.bg, color: props.color }}>{props.text}</span>
)

// ── Table ─────────────────────────────────────────────────────────────────────

const TableCard: Component<{ c: any }> = (props) => {
  const c = props.c
  const [sortKey, setSortKey] = createSignal<string | null>(null)
  const [sortDir, setSortDir] = createSignal<"asc" | "desc">("asc")
  const [search, setSearch] = createSignal("")
  const [selectedRow, setSelectedRow] = createSignal<number | null>(null)

  const filtered = createMemo(() => {
    let rows = [...(c.rows ?? [])]
    if (search()) {
      rows = rows.filter(row =>
        Object.values(row).some(v => String(v).toLowerCase().includes(search().toLowerCase()))
      )
    }
    if (sortKey()) {
      rows.sort((a, b) => {
        const av = a[sortKey()!], bv = b[sortKey()!]
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true })
        return sortDir() === "asc" ? cmp : -cmp
      })
    }
    return rows
  })

  const toggleSort = (key: string) => {
    if (sortKey() === key) {
      setSortDir(sortDir() === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  return (
    <div style={{ ...card, "max-width": "580px" }}>
      <div style={{ padding: "16px 20px", "border-bottom": "1px solid #f1f5f9" }}>
        <div style={{ display: "flex", "align-items": "center", "justify-content": "space-between" }}>
          <Show when={c.title}>
            <h3 style={{ "font-size": "15px", "font-weight": "700", color: "#0f172a", margin: "0" }}>{c.title}</h3>
          </Show>
          <input
            placeholder="🔍 Search..."
            value={search()}
            onInput={e => setSearch(e.currentTarget.value)}
            style={{ padding: "6px 12px", border: "1px solid #e2e8f0", "border-radius": "8px", "font-size": "12px", outline: "none", "font-family": "inherit", width: "160px" }}
          />
        </div>
        <Show when={search()}>
          <div style={{ "font-size": "11px", color: "#94a3b8", "margin-top": "6px" }}>{filtered().length} result{filtered().length !== 1 ? "s" : ""}</div>
        </Show>
      </div>
      <div style={{ "overflow-x": "auto" }}>
        <table style={{ width: "100%", "border-collapse": "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              <For each={c.columns}>{(col: any) => (
                <th
                  onClick={() => toggleSort(col.key)}
                  style={{
                    padding: "10px 16px", "text-align": col.align ?? "left",
                    "font-size": "11px", "font-weight": "600", "letter-spacing": "0.05em",
                    "text-transform": "uppercase", color: sortKey() === col.key ? "#6366f1" : "#6b7280",
                    "border-bottom": "1px solid #f1f5f9", cursor: "pointer", "white-space": "nowrap",
                    "user-select": "none",
                  }}
                >
                  {col.label} {sortKey() === col.key ? (sortDir() === "asc" ? "↑" : "↓") : "↕"}
                </th>
              )}</For>
            </tr>
          </thead>
          <tbody>
            <For each={filtered()}>{(row: any, i) => (
              <tr
                onClick={() => setSelectedRow(selectedRow() === i() ? null : i())}
                style={{
                  "border-bottom": "1px solid #f9fafb", cursor: "pointer",
                  background: selectedRow() === i() ? "#eff6ff" : "transparent",
                  transition: "background 0.1s",
                }}
              >
                <For each={c.columns}>{(col: any) => (
                  <td style={{ padding: "10px 16px", "font-size": "13px", color: "#374151", "text-align": col.align ?? "left" }}>
                    {String(row[col.key] ?? "—")}
                  </td>
                )}</For>
              </tr>
            )}</For>
          </tbody>
        </table>
      </div>
      <div style={{ padding: "8px 16px", "border-top": "1px solid #f1f5f9", "font-size": "11px", color: "#94a3b8" }}>
        {filtered().length} rows {sortKey() ? `· sorted by ${sortKey()} ${sortDir()}` : ""} · click header to sort · click row to highlight
      </div>
    </div>
  )
}

// ── Metrics ───────────────────────────────────────────────────────────────────

const MetricsCard: Component<{ c: any }> = (props) => {
  const c = props.c
  const [expanded, setExpanded] = createSignal<number | null>(null)
  const cols = () => c.columns ?? 3
  const colorMap: Record<string, string> = { green: "#16a34a", red: "#dc2626", yellow: "#ca8a04", blue: "#2563eb" }

  return (
    <div style={{ ...card, "max-width": "540px" }}>
      <Show when={c.title}>
        <div style={{ padding: "16px 20px 0" }}>
          <h3 style={{ "font-size": "15px", "font-weight": "700", color: "#0f172a", margin: "0" }}>{c.title}</h3>
        </div>
      </Show>
      <div style={{ display: "grid", "grid-template-columns": `repeat(${cols()}, 1fr)`, gap: "1px", background: "#f1f5f9", "margin-top": c.title ? "12px" : "0" }}>
        <For each={c.items}>{(item: any, i) => (
          <div
            onClick={() => setExpanded(expanded() === i() ? null : i())}
            style={{
              background: expanded() === i() ? "#fafaff" : "#fff",
              padding: "16px 18px", cursor: "pointer", transition: "background 0.15s",
            }}
          >
            <div style={{ ...labelStyle, "margin-bottom": "6px" }}>{item.label}</div>
            <div style={{ display: "flex", "align-items": "baseline", gap: "3px" }}>
              <span style={{ "font-size": "26px", "font-weight": "800", color: colorMap[item.color ?? ""] ?? "#0f172a", "line-height": "1" }}>{item.value}</span>
              <Show when={item.unit}><span style={{ "font-size": "12px", color: "#9ca3af" }}>{item.unit}</span></Show>
            </div>
            <Show when={item.delta !== undefined}>
              <div style={{ "font-size": "11px", "margin-top": "4px", "font-weight": "600", color: (item.delta ?? 0) >= 0 ? "#16a34a" : "#dc2626" }}>
                {(item.delta ?? 0) >= 0 ? "↑" : "↓"} {Math.abs(item.delta ?? 0)}% {item.deltaLabel ?? "vs last period"}
              </div>
            </Show>
            <Show when={expanded() === i()}>
              <div style={{ "margin-top": "10px", "font-size": "11px", color: "#64748b", "border-top": "1px solid #f1f5f9", "padding-top": "8px" }}>
                Click to collapse · Value: {item.value}{item.unit ?? ""}
              </div>
            </Show>
          </div>
        )}</For>
      </div>
    </div>
  )
}

// ── Status ────────────────────────────────────────────────────────────────────

const StatusCard: Component<{ c: any }> = (props) => {
  const c = props.c
  const [statuses, setStatuses] = createSignal<any[]>(c.items ?? [])
  const [refreshing, setRefreshing] = createSignal(false)
  const [expanded, setExpanded] = createSignal<Set<number>>(new Set())

  const iconMap: Record<string, string> = { ok: "✓", warning: "⚠", error: "✗", pending: "◌", info: "ℹ" }
  const styleMap: Record<string, { bg: string; color: string }> = {
    ok: { bg: "#dcfce7", color: "#16a34a" },
    warning: { bg: "#fef9c3", color: "#ca8a04" },
    error: { bg: "#fee2e2", color: "#dc2626" },
    pending: { bg: "#f1f5f9", color: "#64748b" },
    info: { bg: "#dbeafe", color: "#2563eb" },
  }

  const refresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1200)
  }

  const toggleExpand = (i: number) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const okCount = () => statuses().filter(s => s.status === "ok").length
  const errorCount = () => statuses().filter(s => s.status === "error").length
  const warnCount = () => statuses().filter(s => s.status === "warning").length

  return (
    <div style={{ ...card, "max-width": "420px" }}>
      <div style={{ padding: "14px 18px", "border-bottom": "1px solid #f1f5f9", display: "flex", "align-items": "center", "justify-content": "space-between" }}>
        <div>
          <h3 style={{ "font-size": "15px", "font-weight": "700", color: "#0f172a", margin: "0 0 4px 0" }}>{c.title ?? "System Status"}</h3>
          <div style={{ display: "flex", gap: "10px" }}>
            <span style={{ "font-size": "11px", color: "#16a34a", "font-weight": "600" }}>✓ {okCount()} ok</span>
            <Show when={warnCount() > 0}><span style={{ "font-size": "11px", color: "#ca8a04", "font-weight": "600" }}>⚠ {warnCount()} warn</span></Show>
            <Show when={errorCount() > 0}><span style={{ "font-size": "11px", color: "#dc2626", "font-weight": "600" }}>✗ {errorCount()} error</span></Show>
          </div>
        </div>
        <button
          onClick={refresh}
          style={{ ...btn("#f8fafc", "#64748b"), padding: "6px 12px", "font-size": "12px" }}
        >{refreshing() ? "Refreshing..." : "↻ Refresh"}</button>
      </div>
      <div style={{ padding: "8px 0" }}>
        <For each={statuses()}>{(item: any, i) => {
          const s = styleMap[item.status] ?? styleMap.info
          return (
            <div>
              <div
                onClick={() => toggleExpand(i())}
                style={{ display: "flex", "align-items": "center", gap: "12px", padding: "10px 18px", cursor: "pointer", transition: "background 0.1s" }}
              >
                <div style={{ width: "26px", height: "26px", "border-radius": "50%", background: refreshing() ? "#f1f5f9" : s.bg, color: refreshing() ? "#94a3b8" : s.color, display: "flex", "align-items": "center", "justify-content": "center", "font-size": "12px", "font-weight": "700", "flex-shrink": "0", transition: "all 0.3s" }}>
                  {refreshing() ? "..." : iconMap[item.status]}
                </div>
                <span style={{ "font-size": "13px", color: "#1e293b", flex: "1", "font-weight": "500" }}>{item.label}</span>
                <Show when={item.detail}>
                  <span style={{ "font-size": "12px", color: "#94a3b8" }}>{expanded().has(i()) ? "▲" : "▼"}</span>
                </Show>
              </div>
              <Show when={expanded().has(i()) && item.detail}>
                <div style={{ padding: "0 18px 10px 56px", "font-size": "12px", color: "#64748b" }}>{item.detail}</div>
              </Show>
            </div>
          )
        }}</For>
      </div>
    </div>
  )
}

// ── Alert ─────────────────────────────────────────────────────────────────────

const AlertCard: Component<{ c: any }> = (props) => {
  const c = props.c
  const [dismissed, setDismissed] = createSignal(false)
  const [expanded, setExpanded] = createSignal(true)

  const styleMap: Record<string, { bg: string; border: string; icon: string; titleColor: string }> = {
    info: { bg: "#eff6ff", border: "#bfdbfe", icon: "ℹ️", titleColor: "#1d4ed8" },
    success: { bg: "#f0fdf4", border: "#bbf7d0", icon: "✅", titleColor: "#15803d" },
    warning: { bg: "#fffbeb", border: "#fed7aa", icon: "⚠️", titleColor: "#b45309" },
    error: { bg: "#fef2f2", border: "#fecaca", icon: "🚨", titleColor: "#b91c1c" },
  }

  const s = styleMap[c.level] ?? styleMap.info
  if (dismissed()) return null

  return (
    <div style={{ ...card, "max-width": "460px", background: s.bg, border: `1px solid ${s.border}`, "box-shadow": "none" }}>
      <div style={{ padding: "14px 16px", display: "flex", gap: "12px", "align-items": "flex-start" }}>
        <span style={{ "font-size": "20px", "flex-shrink": "0" }}>{s.icon}</span>
        <div style={{ flex: "1" }}>
          <div style={{ "font-size": "14px", "font-weight": "700", color: s.titleColor, "margin-bottom": "4px", display: "flex", "align-items": "center", "justify-content": "space-between" }}>
            {c.title}
            <div style={{ display: "flex", gap: "6px" }}>
              <Show when={c.body}>
                <button onClick={() => setExpanded(e => !e)} style={{ ...btn("transparent", s.titleColor), padding: "0 4px", "font-size": "12px" }}>
                  {expanded() ? "▲" : "▼"}
                </button>
              </Show>
              <button onClick={() => setDismissed(true)} style={{ ...btn("transparent", s.titleColor), padding: "0 4px", "font-size": "14px" }}>✕</button>
            </div>
          </div>
          <Show when={c.body && expanded()}>
            <div style={{ "font-size": "13px", color: "#374151", "line-height": "1.6" }}>{c.body}</div>
          </Show>
        </div>
      </div>
    </div>
  )
}

// ── Info Card ─────────────────────────────────────────────────────────────────

const InfoCard: Component<{ c: any }> = (props) => {
  const c = props.c
  const [expanded, setExpanded] = createSignal(false)
  const [copied, setCopied] = createSignal(false)

  const copy = () => {
    navigator.clipboard.writeText(c.body ?? "")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ ...card, "max-width": "400px" }}>
      <div style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", "align-items": "center", gap: "10px", "margin-bottom": "8px" }}>
          <Show when={c.icon}><span style={{ "font-size": "24px" }}>{c.icon}</span></Show>
          <h3 style={{ "font-size": "15px", "font-weight": "700", color: "#0f172a", margin: "0", flex: "1" }}>{c.title}</h3>
          <Show when={c.badge}>
            <span style={{ "font-size": "11px", padding: "3px 8px", "border-radius": "999px", background: "#f1f5f9", color: "#64748b" }}>{c.badge.text}</span>
          </Show>
        </div>
        <Show when={c.subtitle}>
          <div style={{ "font-size": "12px", color: "#94a3b8", "margin-bottom": "8px" }}>{c.subtitle}</div>
        </Show>
        <p style={{ "font-size": "13px", color: "#374151", "line-height": "1.6", margin: "0", overflow: "hidden", "max-height": expanded() ? "none" : "60px" }}>
          {c.body}
        </p>
        <div style={{ display: "flex", gap: "8px", "margin-top": "12px" }}>
          <button onClick={() => setExpanded(e => !e)} style={{ ...btn("#f1f5f9", "#64748b"), "font-size": "12px", padding: "6px 12px" }}>
            {expanded() ? "Show less ▲" : "Read more ▼"}
          </button>
          <button onClick={copy} style={{ ...btn(copied() ? "#f0fdf4" : "#f1f5f9", copied() ? "#16a34a" : "#64748b"), "font-size": "12px", padding: "6px 12px" }}>
            {copied() ? "✓ Copied!" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Form ──────────────────────────────────────────────────────────────────────

const FormCard: Component<{ c: any }> = (props) => {
  const c = props.c
  const [values, setValues] = createSignal<Record<string, string>>({})
  const [submitted, setSubmitted] = createSignal(false)
  const [errors, setErrors] = createSignal<Record<string, string>>({})

  const validate = () => {
    const errs: Record<string, string> = {}
    for (const field of c.fields ?? []) {
      if (field.required && !values()[field.id]?.trim()) {
        errs[field.id] = `${field.label} is required`
      }
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    const answers = Object.entries(values())
      .map(([id, val]) => {
        const field = c.fields?.find((f: any) => f.id === id)
        return `${field?.label ?? id}: ${val}`
      })
      .join(", ")
    const text = `${c.title} submission — ${answers}`
    window.dispatchEvent(new CustomEvent("genui-submit", { detail: { text } }))
    setSubmitted(true)
  }

  if (submitted()) {
    return (
      <div style={{ ...card, "max-width": "480px" }}>
        <div style={{ padding: "32px 22px", "text-align": "center" }}>
          <div style={{ "font-size": "40px", "margin-bottom": "12px" }}>✅</div>
          <h3 style={{ "font-size": "16px", "font-weight": "700", color: "#0f172a", margin: "0 0 8px 0" }}>Submitted!</h3>
          <p style={{ "font-size": "13px", color: "#64748b", margin: "0" }}>Your response has been sent to the AI.</p>
          <button onClick={() => { setSubmitted(false); setValues({}) }} style={{ ...btn("#6366f1"), "margin-top": "16px", padding: "10px 20px" }}>Submit Another</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ ...card, "max-width": "480px" }}>
      <div style={{ padding: "20px 22px 0" }}>
        <h2 style={{ "font-size": "17px", "font-weight": "700", color: "#0f172a", margin: "0 0 6px 0" }}>{c.title}</h2>
        <Show when={c.description}>
          <p style={{ "font-size": "13px", color: "#64748b", margin: "0 0 16px 0" }}>{c.description}</p>
        </Show>
      </div>
      <div style={{ padding: "12px 22px", display: "flex", "flex-direction": "column", gap: "14px" }}>
        <For each={c.fields}>{(field: any) => (
          <div>
            <label style={{ "font-size": "12px", "font-weight": "600", color: "#374151", display: "block", "margin-bottom": "6px" }}>
              {field.label}{field.required && <span style={{ color: "#ef4444" }}> *</span>}
            </label>
            <Switch>
              <Match when={field.type === "select"}>
                <select
                  style={{ width: "100%", padding: "8px 12px", border: `1px solid ${errors()[field.id] ? "#fca5a5" : "#e2e8f0"}`, "border-radius": "8px", "font-size": "13px", color: "#374151", background: "#fff", outline: "none", "font-family": "inherit" }}
                  onChange={(e) => setValues(v => ({ ...v, [field.id]: e.currentTarget.value }))}
                >
                  <option value="">Select...</option>
                  <For each={field.options}>{(opt: string) => <option value={opt}>{opt}</option>}</For>
                </select>
              </Match>
              <Match when={field.type === "textarea"}>
                <textarea
                  placeholder={field.placeholder ?? ""}
                  style={{ width: "100%", padding: "8px 12px", border: `1px solid ${errors()[field.id] ? "#fca5a5" : "#e2e8f0"}`, "border-radius": "8px", "font-size": "13px", color: "#374151", "min-height": "80px", resize: "vertical", outline: "none", "box-sizing": "border-box", "font-family": "inherit" }}
                  onInput={(e) => setValues(v => ({ ...v, [field.id]: e.currentTarget.value }))}
                />
              </Match>
              <Match when={true}>
                <input
                  type={field.type ?? "text"}
                  placeholder={field.placeholder ?? ""}
                  style={{ width: "100%", padding: "8px 12px", border: `1px solid ${errors()[field.id] ? "#fca5a5" : "#e2e8f0"}`, "border-radius": "8px", "font-size": "13px", color: "#374151", outline: "none", "box-sizing": "border-box", "font-family": "inherit" }}
                  onInput={(e) => setValues(v => ({ ...v, [field.id]: e.currentTarget.value }))}
                />
              </Match>
            </Switch>
            <Show when={errors()[field.id]}>
              <div style={{ "font-size": "11px", color: "#dc2626", "margin-top": "4px" }}>{errors()[field.id]}</div>
            </Show>
          </div>
        )}</For>
      </div>
      <div style={{ padding: "12px 22px 20px" }}>
        <button
          onClick={handleSubmit}
          style={{ width: "100%", padding: "12px", background: "#6366f1", color: "#fff", border: "none", "border-radius": "10px", "font-size": "14px", "font-weight": "600", cursor: "pointer", "font-family": "inherit" }}
        >{c.submit ?? "Submit"}</button>
      </div>
    </div>
  )
}

// ── Clarify ───────────────────────────────────────────────────────────────────

const ClarifyCard: Component<{ c: any }> = (props) => {
  const questions = () => props.c.questions ?? []

  onMount(() => {
    window.dispatchEvent(new CustomEvent("genui-clarify-open", {
      detail: { questions: questions() }
    }))
  })

  return null
}