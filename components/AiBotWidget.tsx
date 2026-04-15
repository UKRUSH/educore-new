"use client"

import { useState, useRef, useEffect } from "react"

type Role = "user" | "assistant"
type Msg  = { role: Role; content: string }

/* ─── tiny markdown → HTML converter (no deps) ─────────────────────── */
function renderMarkdown(text: string): string {
  const lines = text.split("\n")
  const out: string[] = []
  let inUl = false
  let inOl = false

  const closeUl = () => { if (inUl) { out.push("</ul>"); inUl = false } }
  const closeOl = () => { if (inOl) { out.push("</ol>"); inOl = false } }

  for (const raw of lines) {
    const line = raw.trimEnd()

    // numbered list  1. …
    const olMatch = line.match(/^(\d+)\.\s+(.+)/)
    if (olMatch) {
      closeUl()
      if (!inOl) { out.push('<ol class="ab-ol">'); inOl = true }
      out.push(`<li>${inlineFormat(olMatch[2])}</li>`)
      continue
    }

    // bullet list  - … / • … / * …
    const ulMatch = line.match(/^[-•*]\s+(.+)/)
    if (ulMatch) {
      closeOl()
      if (!inUl) { out.push('<ul class="ab-ul">'); inUl = true }
      out.push(`<li>${inlineFormat(ulMatch[1])}</li>`)
      continue
    }

    closeUl(); closeOl()

    if (line === "") {
      out.push('<div class="ab-br"></div>')
      continue
    }

    out.push(`<p class="ab-p">${inlineFormat(line)}</p>`)
  }

  closeUl(); closeOl()
  return out.join("")
}

function inlineFormat(s: string): string {
  return s
    // **bold**
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // *italic*
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // `code`
    .replace(/`([^`]+)`/g, '<code class="ab-code">$1</code>')
    // escape remaining < >
    // (already safe since we don't accept user HTML)
}

/* ─── styles ───────────────────────────────────────────────────────── */
const CSS = `
/* FAB */
.aibot-fab {
  position:fixed; bottom:1.5rem; right:1.5rem; z-index:9999;
  width:56px; height:56px; border-radius:50%; border:none; cursor:pointer;
  background:linear-gradient(135deg,oklch(.4882 .2172 264.38),oklch(.6231 .188 259.81));
  color:#fff; font-size:1.5rem;
  box-shadow:0 6px 24px oklch(.4882 .2172 264.38/.45);
  display:flex; align-items:center; justify-content:center;
  transition:transform .18s,box-shadow .18s;
}
.aibot-fab:hover { transform:scale(1.08); box-shadow:0 8px 32px oklch(.4882 .2172 264.38/.55); }

/* Window */
.aibot-window {
  position:fixed; bottom:5rem; right:1.5rem; z-index:9998;
  width:390px; height:560px;
  background:var(--card); border:1px solid var(--border); border-radius:1.25rem;
  box-shadow:0 20px 72px oklch(0 0 0/.28);
  display:flex; flex-direction:column; overflow:hidden;
  animation:aibotSlide .22s ease;
}
@keyframes aibotSlide {
  from { opacity:0; transform:translateY(18px) scale(.97); }
  to   { opacity:1; transform:translateY(0)    scale(1); }
}

/* Header */
.aibot-head {
  padding:.9rem 1.1rem; flex-shrink:0;
  background:linear-gradient(135deg,oklch(.16 .09 268),oklch(.28 .16 258));
  display:flex; align-items:center; gap:.75rem;
}
.aibot-head-icon {
  width:38px; height:38px; border-radius:50%;
  background:rgba(255,255,255,.15); border:1.5px solid rgba(255,255,255,.25);
  display:flex; align-items:center; justify-content:center;
  font-size:1.15rem; flex-shrink:0;
}
.aibot-head-info { flex:1; min-width:0; }
.aibot-head-name { font-weight:800; font-size:.92rem; color:#fff; }
.aibot-head-sub  { font-size:.68rem; color:rgba(255,255,255,.55); margin-top:.1rem; }
.aibot-head-actions { display:flex; gap:.25rem; }
.aibot-head-btn {
  background:none; border:none; color:rgba(255,255,255,.65);
  font-size:.82rem; cursor:pointer; padding:.25rem .45rem;
  border-radius:.4rem; transition:background .15s; flex-shrink:0; white-space:nowrap;
}
.aibot-head-btn:hover { background:rgba(255,255,255,.15); color:#fff; }

/* Messages area */
.aibot-msgs {
  flex:1; overflow-y:auto; padding:.9rem 1rem;
  display:flex; flex-direction:column; gap:.55rem;
}
.aibot-msgs::-webkit-scrollbar { width:4px; }
.aibot-msgs::-webkit-scrollbar-thumb { background:var(--border); border-radius:4px; }

/* Welcome */
.aibot-welcome {
  text-align:center; padding:1.4rem 1rem;
  color:var(--muted-foreground); font-size:.84rem; line-height:1.65;
}
.aibot-welcome-icon { font-size:2.2rem; margin-bottom:.5rem; }
.aibot-welcome strong { color:var(--foreground); }

/* Bubbles */
.aibot-row { display:flex; align-items:flex-end; gap:.45rem; }
.aibot-row.user { justify-content:flex-end; }

.aibot-bubble {
  max-width:85%; padding:.6rem 1rem; border-radius:1.1rem;
  font-size:.84rem; line-height:1.6; word-break:break-word;
}
.aibot-bubble.bot {
  background:var(--muted); color:var(--foreground);
  border-bottom-left-radius:.3rem;
}
.aibot-bubble.user {
  background:linear-gradient(135deg,oklch(.4882 .2172 264.38),oklch(.6231 .188 259.81));
  color:#fff; border-bottom-right-radius:.3rem;
  white-space:pre-wrap;
}

/* Markdown rendered inside bot bubble */
.aibot-bubble.bot .ab-p  { margin:.18rem 0; }
.aibot-bubble.bot .ab-br { height:.35rem; }
.aibot-bubble.bot .ab-ul {
  margin:.3rem 0 .3rem .1rem; padding-left:1.1rem;
  list-style:none;
}
.aibot-bubble.bot .ab-ul li { position:relative; padding-left:.4rem; margin:.2rem 0; }
.aibot-bubble.bot .ab-ul li::before {
  content:"•"; position:absolute; left:-1rem;
  color:oklch(.6231 .188 259.81); font-weight:700;
}
.aibot-bubble.bot .ab-ol {
  margin:.3rem 0 .3rem .1rem; padding-left:1.3rem; list-style:decimal;
}
.aibot-bubble.bot .ab-ol li { margin:.2rem 0; padding-left:.2rem; }
.aibot-bubble.bot strong { color:oklch(.38 .15 262); }
.aibot-bubble.bot em { font-style:italic; opacity:.85; }
.aibot-bubble.bot .ab-code {
  font-family:monospace; font-size:.79rem;
  background:oklch(.6231 .188 259.81/.12); color:oklch(.38 .15 262);
  padding:.1rem .35rem; border-radius:.3rem;
}

/* Typing dots */
.aibot-typing {
  display:flex; align-items:center; gap:.3rem;
  padding:.65rem .95rem; background:var(--muted);
  border-radius:1.1rem; border-bottom-left-radius:.3rem; width:fit-content;
}
.aibot-dot {
  width:7px; height:7px; border-radius:50%;
  background:var(--muted-foreground);
  animation:aibotBounce 1.2s infinite;
}
.aibot-dot:nth-child(2) { animation-delay:.2s; }
.aibot-dot:nth-child(3) { animation-delay:.4s; }
@keyframes aibotBounce {
  0%,80%,100% { transform:translateY(0); opacity:.5; }
  40%          { transform:translateY(-5px); opacity:1; }
}

/* Quick chips */
.aibot-chips {
  display:flex; flex-wrap:wrap; gap:.35rem; padding:.5rem 1rem .3rem;
  flex-shrink:0;
}
.aibot-chip {
  font-size:.72rem; padding:.3rem .75rem; border-radius:999px;
  border:1px solid var(--border); background:var(--background);
  color:var(--muted-foreground); cursor:pointer; transition:all .15s; white-space:nowrap;
}
.aibot-chip:hover {
  border-color:oklch(.6231 .188 259.81);
  color:oklch(.6231 .188 259.81);
  background:oklch(.6231 .188 259.81/.08);
}

/* Input area */
.aibot-foot {
  padding:.65rem .85rem; border-top:1px solid var(--border);
  display:flex; gap:.5rem; align-items:flex-end; flex-shrink:0;
}
.aibot-input {
  flex:1; resize:none; border:1.5px solid var(--border); border-radius:.75rem;
  padding:.55rem .85rem; background:var(--background); color:var(--foreground);
  font-size:.84rem; font-family:inherit; outline:none;
  transition:border-color .15s; max-height:96px; line-height:1.45;
}
.aibot-input:focus {
  border-color:oklch(.6231 .188 259.81);
  box-shadow:0 0 0 3px oklch(.6231 .188 259.81/.12);
}
.aibot-send {
  flex-shrink:0; width:38px; height:38px; border-radius:.75rem; border:none;
  background:linear-gradient(135deg,oklch(.4882 .2172 264.38),oklch(.6231 .188 259.81));
  color:#fff; font-size:1rem; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  transition:opacity .15s,transform .12s;
  box-shadow:0 2px 8px oklch(.4882 .2172 264.38/.3);
}
.aibot-send:disabled { opacity:.35; cursor:not-allowed; transform:none !important; box-shadow:none; }
.aibot-send:hover:not(:disabled) { opacity:.88; transform:translateY(-1px); }

@media (max-width:480px) {
  .aibot-window { width:calc(100vw - 2rem); right:1rem; }
}
`

const QUICK_QUESTIONS = [
  "📁 How do I upload study materials?",
  "🏆 How do I apply for a club?",
  "📈 What is the progress score?",
  "🎓 How do I book a mentor session?",
  "🔐 How do I register?",
]

/* ─── Bot bubble with rendered markdown ─────────────────────────────── */
function BotBubble({ content }: { content: string }) {
  return (
    <div
      className="aibot-bubble bot"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  )
}

/* ─── Main widget ───────────────────────────────────────────────────── */
export default function AiBotWidget() {
  const [open, setOpen]       = useState(false)
  const [input, setInput]     = useState("")
  const [history, setHistory] = useState<Msg[]>([])
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [history, loading])

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    setHistory(prev => [...prev, { role: "user", content: trimmed }])
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/ai-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: history.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      const reply = data.reply ?? "Sorry, I couldn't get a response. Please try again."
      setHistory(prev => [...prev, { role: "assistant", content: reply }])
    } catch {
      setHistory(prev => [...prev, {
        role: "assistant",
        content: "⚠️ Connection error. Please check your internet and try again.",
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  function clearChat() { setHistory([]) }

  return (
    <>
      <style>{CSS}</style>

      {/* FAB */}
      <button
        className="aibot-fab"
        onClick={() => setOpen(o => !o)}
        aria-label={open ? "Close EduBot" : "Open EduBot"}
        title="EduBot — Ask me about EduCore"
      >
        {open ? "✕" : "🤖"}
      </button>

      {open && (
        <div className="aibot-window">

          {/* Header */}
          <div className="aibot-head">
            <div className="aibot-head-icon">🤖</div>
            <div className="aibot-head-info">
              <div className="aibot-head-name">EduBot</div>
              <div className="aibot-head-sub">EduCore AI Assistant • Online</div>
            </div>
            <div className="aibot-head-actions">
              {history.length > 0 && (
                <button className="aibot-head-btn" onClick={clearChat} title="Clear chat">
                  🗑 Clear
                </button>
              )}
              <button className="aibot-head-btn" onClick={() => setOpen(false)}>✕</button>
            </div>
          </div>

          {/* Messages */}
          <div className="aibot-msgs">
            {history.length === 0 ? (
              <div className="aibot-welcome">
                <div className="aibot-welcome-icon">👋</div>
                <strong>Hi! I&apos;m EduBot</strong>
                <br />
                I can help you with anything about <strong>EduCore</strong> — your profile, study materials, clubs, mentor sessions, and more!
                <br /><br />
                What would you like to know? 😊
              </div>
            ) : (
              history.map((m, i) => (
                <div key={i} className={`aibot-row${m.role === "user" ? " user" : ""}`}>
                  {m.role === "assistant"
                    ? <BotBubble content={m.content} />
                    : <div className="aibot-bubble user">{m.content}</div>
                  }
                </div>
              ))
            )}

            {loading && (
              <div className="aibot-row">
                <div className="aibot-typing">
                  <div className="aibot-dot" />
                  <div className="aibot-dot" />
                  <div className="aibot-dot" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick chips — only when no chat yet */}
          {history.length === 0 && (
            <div className="aibot-chips">
              {QUICK_QUESTIONS.map(q => (
                <button key={q} className="aibot-chip" onClick={() => sendMessage(q)}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="aibot-foot">
            <textarea
              className="aibot-input"
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about EduCore… (Enter to send)"
              disabled={loading}
            />
            <button
              className="aibot-send"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              aria-label="Send"
            >
              ➤
            </button>
          </div>

        </div>
      )}
    </>
  )
}
