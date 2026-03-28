"use client"

import { useState, useEffect, useRef } from "react"

type Message = {
  id: number
  senderId: number
  content: string
  createdAt: string
}

type Props = {
  toUserId: number
  toUserName: string
  currentUserId: number
  onClose: () => void
}

const CSS = `
.cm-overlay {
  position: fixed; inset: 0; z-index: 10000;
  display: flex; align-items: flex-end; justify-content: flex-end;
  padding: 1.5rem; pointer-events: none;
}
.cm-box {
  pointer-events: all;
  width: 360px; height: 500px;
  background: var(--card); border: 1px solid var(--border);
  border-radius: 1.25rem;
  box-shadow: 0 16px 64px oklch(0 0 0 / .25);
  display: flex; flex-direction: column; overflow: hidden;
  animation: cmSlideIn .22s ease;
}
@keyframes cmSlideIn {
  from { opacity: 0; transform: translateY(20px) scale(.97); }
  to   { opacity: 1; transform: translateY(0)    scale(1); }
}
.cm-head {
  padding: .85rem 1.1rem; border-bottom: 1px solid var(--border);
  background: linear-gradient(135deg, oklch(0.16 0.09 268), oklch(0.28 0.16 258));
  display: flex; align-items: center; gap: .75rem; flex-shrink: 0;
}
.cm-head-av {
  width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
  background: rgba(255,255,255,.2); border: 1.5px solid rgba(255,255,255,.3);
  display: flex; align-items: center; justify-content: center;
  font-size: .75rem; font-weight: 800; color: #fff;
}
.cm-head-info { flex: 1; min-width: 0; }
.cm-head-name { font-weight: 800; font-size: .88rem; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cm-head-sub  { font-size: .68rem; color: rgba(255,255,255,.55); margin-top: .1rem; }
.cm-head-close {
  background: none; border: none; color: rgba(255,255,255,.7); font-size: 1rem;
  cursor: pointer; padding: .25rem .4rem; border-radius: .4rem;
  transition: background .15s; flex-shrink: 0;
}
.cm-head-close:hover { background: rgba(255,255,255,.15); color: #fff; }
.cm-msgs {
  flex: 1; overflow-y: auto; padding: .85rem 1rem;
  display: flex; flex-direction: column; gap: .35rem;
}
.cm-msgs::-webkit-scrollbar { width: 4px; }
.cm-msgs::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
.cm-msg-group { display: flex; flex-direction: column; }
.cm-bubble-row { display: flex; }
.cm-bubble-row.mine { justify-content: flex-end; }
.cm-bubble {
  max-width: 78%; padding: .5rem .85rem; border-radius: 1rem;
  font-size: .83rem; line-height: 1.5; word-break: break-word;
}
.cm-bubble.theirs {
  background: var(--muted); color: var(--foreground);
  border-bottom-left-radius: .3rem;
}
.cm-bubble.mine {
  background: linear-gradient(135deg, oklch(0.4882 0.2172 264.3763), oklch(0.6231 0.1880 259.8145));
  color: #fff; border-bottom-right-radius: .3rem;
}
.cm-time {
  font-size: .6rem; color: var(--muted-foreground); margin-top: .1rem; padding: 0 .25rem;
}
.cm-time.mine { text-align: right; }
.cm-empty {
  flex: 1; display: flex; align-items: center; justify-content: center;
  font-size: .82rem; color: var(--muted-foreground); text-align: center;
  line-height: 1.6;
}
.cm-foot {
  padding: .7rem .85rem; border-top: 1px solid var(--border);
  display: flex; gap: .55rem; align-items: flex-end; flex-shrink: 0;
}
.cm-input {
  flex: 1; resize: none; border: 1.5px solid var(--border); border-radius: .75rem;
  padding: .55rem .85rem; background: var(--background); color: var(--foreground);
  font-size: .84rem; font-family: inherit; outline: none;
  transition: border-color .15s; max-height: 96px; line-height: 1.45;
}
.cm-input:focus { border-color: oklch(0.6231 0.1880 259.8145); box-shadow: 0 0 0 3px oklch(0.6231 0.1880 259.8145 / .1); }
.cm-send {
  flex-shrink: 0; width: 38px; height: 38px; border-radius: .75rem; border: none;
  background: linear-gradient(135deg, oklch(0.4882 0.2172 264.3763), oklch(0.6231 0.1880 259.8145));
  color: #fff; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: opacity .15s, transform .12s;
  box-shadow: 0 2px 8px oklch(0.4882 0.2172 264.3763 / .3);
}
.cm-send:disabled { opacity: .4; cursor: not-allowed; transform: none; box-shadow: none; }
.cm-send:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
`

function toInitials(name: string) {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })
}

export default function ChatModal({ toUserId, toUserName, currentUserId, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState("")
  const [sending, setSending]   = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  async function fetchMessages() {
    const r = await fetch(`/api/chat/${toUserId}`)
    if (r.ok) setMessages(await r.json())
  }

  useEffect(() => {
    fetchMessages()
    const timer = setInterval(fetchMessages, 3000)
    return () => clearInterval(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toUserId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    setInput("")
    try {
      const r = await fetch(`/api/chat/${toUserId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      })
      if (r.ok) {
        const msg = await r.json()
        setMessages(prev => [...prev, msg])
      }
    } finally { setSending(false) }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="cm-overlay">
        <div className="cm-box">
          {/* Header */}
          <div className="cm-head">
            <div className="cm-head-av">{toInitials(toUserName)}</div>
            <div className="cm-head-info">
              <div className="cm-head-name">{toUserName}</div>
              <div className="cm-head-sub">Chat · refreshes every 3s</div>
            </div>
            <button className="cm-head-close" onClick={onClose}>✕</button>
          </div>

          {/* Messages */}
          <div className="cm-msgs">
            {messages.length === 0 ? (
              <div className="cm-empty">No messages yet.<br />Say hello! 👋</div>
            ) : (
              messages.map(m => {
                const isMine = m.senderId === currentUserId
                return (
                  <div className="cm-msg-group" key={m.id}>
                    <div className={`cm-bubble-row${isMine ? " mine" : ""}`}>
                      <div className={`cm-bubble ${isMine ? "mine" : "theirs"}`}>{m.content}</div>
                    </div>
                    <div className={`cm-time${isMine ? " mine" : ""}`}>{fmtTime(m.createdAt)}</div>
                  </div>
                )
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="cm-foot">
            <textarea
              className="cm-input"
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type a message… (Enter to send)"
            />
            <button className="cm-send" onClick={send} disabled={!input.trim() || sending}>
              ➤
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
