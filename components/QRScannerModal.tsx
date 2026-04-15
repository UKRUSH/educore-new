"use client"

import { useEffect, useRef, useState } from "react"
import jsQR from "jsqr"

type ScanResult = {
  success: boolean
  clubName?: string
  clubId?: number
  label?: string
  scannedAt?: string
  attendanceId?: number
  studentName?: string
  studentId?: string
  error?: string
}

interface Props {
  onClose: () => void
  onSuccess: (result: ScanResult) => void
}

const CSS = `
.qrs-backdrop {
  position: fixed; inset: 0; z-index: 60;
  background: rgba(0,0,0,.7); backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center; padding: 1rem;
  animation: qrsFadeIn .2s ease;
}
@keyframes qrsFadeIn { from { opacity: 0; } to { opacity: 1; } }

.qrs-modal {
  background: var(--card); border: 1px solid var(--border);
  border-radius: 1.35rem; width: 100%; max-width: 400px;
  box-shadow: 0 24px 80px rgba(0,0,0,.35);
  display: flex; flex-direction: column; overflow: hidden;
  animation: qrsSlideUp .28s cubic-bezier(.22,1,.36,1);
}
@keyframes qrsSlideUp { from { opacity: 0; transform: translateY(20px) scale(.97); } to { opacity: 1; transform: none; } }

.qrs-header {
  padding: 1.1rem 1.4rem .9rem;
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
  background: linear-gradient(90deg, oklch(0.97 0.015 145), var(--card));
}
.qrs-title { font-size: 1rem; font-weight: 800; color: var(--foreground); display: flex; align-items: center; gap: .5rem; }
.qrs-close {
  width: 1.9rem; height: 1.9rem; border-radius: .5rem;
  background: var(--muted); border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--muted-foreground); transition: background .15s, color .15s;
}
.qrs-close:hover { background: var(--accent); color: var(--foreground); }
.qrs-close svg { width: 13px; height: 13px; }

.qrs-body { padding: 1.35rem; display: flex; flex-direction: column; gap: 1rem; align-items: center; }

.qrs-video-wrap {
  position: relative; width: 100%; max-width: 320px;
  border-radius: 1rem; overflow: hidden;
  background: #000;
  box-shadow: 0 4px 20px rgba(0,0,0,.2);
}
.qrs-video { width: 100%; display: block; border-radius: 1rem; }
.qrs-canvas { display: none; }

.qrs-frame {
  position: absolute; inset: 0; pointer-events: none;
  display: flex; align-items: center; justify-content: center;
}
.qrs-frame-corner {
  position: absolute; width: 48px; height: 48px;
  border-color: oklch(0.65 0.2 145); border-style: solid;
}
.qrs-frame-corner.tl { top: 12px; left: 12px; border-width: 3px 0 0 3px; border-radius: 4px 0 0 0; }
.qrs-frame-corner.tr { top: 12px; right: 12px; border-width: 3px 3px 0 0; border-radius: 0 4px 0 0; }
.qrs-frame-corner.bl { bottom: 12px; left: 12px; border-width: 0 0 3px 3px; border-radius: 0 0 0 4px; }
.qrs-frame-corner.br { bottom: 12px; right: 12px; border-width: 0 3px 3px 0; border-radius: 0 0 4px 0; }

.qrs-scan-line {
  position: absolute; left: 12px; right: 12px; height: 2px;
  background: oklch(0.65 0.2 145 / 0.8);
  box-shadow: 0 0 8px oklch(0.65 0.2 145 / 0.6);
  animation: qrsScan 2s ease-in-out infinite;
}
@keyframes qrsScan { 0% { top: 12px; } 50% { top: calc(100% - 14px); } 100% { top: 12px; } }

.qrs-hint { font-size: .8rem; color: var(--muted-foreground); text-align: center; line-height: 1.55; }

.qrs-error {
  width: 100%; background: oklch(0.97 0.05 25 / 0.5);
  border: 1px solid oklch(0.88 0.1 25 / 0.4);
  border-radius: .75rem; padding: .7rem 1rem;
  font-size: .82rem; color: oklch(0.5 0.22 25);
  display: flex; align-items: center; gap: .4rem;
}
.qrs-success {
  width: 100%; background: oklch(0.93 0.06 145 / 0.35);
  border: 1px solid oklch(0.82 0.1 145 / 0.5);
  border-radius: .75rem; padding: 1rem 1.1rem;
  display: flex; flex-direction: column; gap: .3rem;
}
.qrs-success-title { font-size: .925rem; font-weight: 800; color: oklch(0.35 0.18 145); display: flex; align-items: center; gap: .4rem; }
.qrs-success-sub { font-size: .8rem; color: var(--muted-foreground); }

.qrs-cam-err {
  width: 100%; max-width: 320px; aspect-ratio: 4/3;
  background: var(--muted); border-radius: 1rem;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: .5rem; padding: 1.5rem; text-align: center;
}
.qrs-cam-err-icon { font-size: 2rem; margin-bottom: .25rem; }
.qrs-cam-err-title { font-size: .875rem; font-weight: 700; color: var(--foreground); }
.qrs-cam-err-sub { font-size: .78rem; color: var(--muted-foreground); line-height: 1.5; }

.qrs-retry-btn {
  margin-top: .5rem; padding: .5rem 1.25rem; border-radius: .65rem;
  background: linear-gradient(135deg, oklch(0.62 0.2 260), oklch(0.5 0.22 265));
  color: #fff; font-size: .82rem; font-weight: 700; border: none; cursor: pointer;
}

.qrs-done-btn {
  width: 100%; padding: .75rem; border-radius: .8rem;
  background: linear-gradient(135deg, oklch(0.55 0.2 145), oklch(0.45 0.2 150));
  color: #fff; font-size: .9rem; font-weight: 800; border: none; cursor: pointer;
  transition: opacity .18s;
}
.qrs-done-btn:hover { opacity: .9; }
`

export default function QRScannerModal({ onClose, onSuccess }: Props) {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null)

  const [camError, setCamError]   = useState("")
  const [scanning, setScanning]   = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [posting, setPosting]     = useState(false)

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  async function startCamera() {
    setCamError("")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        const video = videoRef.current
        video.srcObject = stream
        await new Promise<void>((resolve) => {
          video.onloadedmetadata = () => resolve()
        })
        await video.play()
      }
      setScanning(true)
      timerRef.current = setInterval(scanFrame, 250)
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return
      setCamError("Camera access denied. Please allow camera permission and try again.")
    }
  }

  function stopCamera() {
    if (timerRef.current) clearInterval(timerRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setScanning(false)
  }

  function scanFrame() {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) return

    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" })
    if (code?.data) {
      stopCamera()
      sendToken(code.data)
    }
  }

  async function sendToken(token: string) {
    setPosting(true)
    try {
      const res  = await fetch("/api/clubs/attendance/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (!res.ok) {
        setScanResult({ success: false, error: data.error ?? "Failed to mark attendance." })
      } else {
        const result: ScanResult = {
          success: true,
          clubName: data.clubName,
          clubId: data.clubId,
          label: data.label,
          scannedAt: data.scannedAt,
          attendanceId: data.attendanceId,
          studentName: data.studentName,
          studentId: data.studentId,
        }
        setScanResult(result)
        onSuccess(result)
      }
    } catch {
      setScanResult({ success: false, error: "Network error. Please try again." })
    } finally {
      setPosting(false)
    }
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="qrs-backdrop" onClick={onClose}>
        <div className="qrs-modal" onClick={(e) => e.stopPropagation()}>

          <div className="qrs-header">
            <div className="qrs-title">
              <span>📷</span> Scan Attendance QR
            </div>
            <button className="qrs-close" onClick={onClose}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className="qrs-body">
            {/* Camera or error */}
            {camError ? (
              <div className="qrs-cam-err">
                <div className="qrs-cam-err-icon">📵</div>
                <div className="qrs-cam-err-title">Camera Unavailable</div>
                <div className="qrs-cam-err-sub">{camError}</div>
                <button className="qrs-retry-btn" onClick={startCamera}>Try Again</button>
              </div>
            ) : !scanResult ? (
              <div className="qrs-video-wrap">
                <video ref={videoRef} className="qrs-video" playsInline muted />
                <canvas ref={canvasRef} className="qrs-canvas" />
                {scanning && (
                  <div className="qrs-frame">
                    <div className="qrs-frame-corner tl" />
                    <div className="qrs-frame-corner tr" />
                    <div className="qrs-frame-corner bl" />
                    <div className="qrs-frame-corner br" />
                    <div className="qrs-scan-line" />
                  </div>
                )}
              </div>
            ) : null}

            {/* Posting spinner */}
            {posting && (
              <div style={{ fontSize: ".85rem", color: "var(--muted-foreground)", display: "flex", alignItems: "center", gap: ".5rem" }}>
                <svg style={{ animation: "qrsSpin .8s linear infinite" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" strokeOpacity=".25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                </svg>
                Marking attendance…
              </div>
            )}

            {/* Result */}
            {scanResult && !posting && (
              <>
                {scanResult.success ? (
                  <div className="qrs-success">
                    <div className="qrs-success-title">✓ Attendance Marked!</div>
                    <div className="qrs-success-sub">{scanResult.clubName} — {scanResult.label}</div>
                    {scanResult.scannedAt && (
                      <div className="qrs-success-sub">{new Date(scanResult.scannedAt).toLocaleString()}</div>
                    )}
                  </div>
                ) : (
                  <div className="qrs-error">
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {scanResult.error}
                  </div>
                )}
              </>
            )}

            {/* Hint or done button */}
            {!scanResult && !camError && (
              <p className="qrs-hint">Point your camera at the QR code displayed by your club leader.</p>
            )}

            {scanResult && !posting && (
              <button className="qrs-done-btn" onClick={onClose}>
                {scanResult.success ? "Done" : "Close"}
              </button>
            )}

            {scanResult?.error && (
              <button
                style={{ fontSize: ".8rem", color: "oklch(0.52 0.2 260)", background: "none", border: "none", cursor: "pointer", padding: ".2rem" }}
                onClick={() => { setScanResult(null); startCamera() }}
              >
                Try scanning again
              </button>
            )}
          </div>

          <style>{`@keyframes qrsSpin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    </>
  )
}
