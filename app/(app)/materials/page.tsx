"use client"

import { useState, useEffect, useMemo, useRef } from "react"

// ── Types ───────────────────────────────────────────────────────────────────

type FileAsset = {
  fileName: string
  fileSize: number
  fileUrl: string
  fileType: string
}

type SuggestedResource = {
  id: number
  title: string
  sourceName: string
  url: string
  type: "ARTICLE" | "YOUTUBE" | "LINK"
}

type MaterialSummary = {
  quickSummary: string
  detailedNotes: string | null
  keyTerms: string | null
}

type Material = {
  id: number
  title: string
  courseCode: string
  type: string
  description: string | null
  isSummarized: boolean
  createdAt: string
  fileAsset: FileAsset | null
  summary: MaterialSummary | null
  suggestedResources: SuggestedResource[]
}

type FileEntry = {
  key: string          // unique id for React key
  file: File
  title: string        // editable per-file title
  status: "pending" | "uploading" | "done" | "error"
  errorMsg?: string
}

// ── Constants ───────────────────────────────────────────────────────────────

const TYPES = ["ALL", "PDF", "SLIDES", "NOTES"]

const TYPE_COLOR: Record<string, string> = {
  PDF:    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  SLIDES: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  NOTES:  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
}

const TYPE_ICON: Record<string, string> = {
  PDF: "📄", SLIDES: "📊", NOTES: "📝",
}

const RESOURCE_ICON: Record<string, string> = {
  YOUTUBE: "▶", ARTICLE: "📰", LINK: "🔗",
}

const RESOURCE_COLOR: Record<string, string> = {
  YOUTUBE: "text-red-600 dark:text-red-400",
  ARTICLE: "text-blue-600 dark:text-blue-400",
  LINK:    "text-green-600 dark:text-green-400",
}

const ACCEPT_TYPES = ".pdf,.ppt,.pptx,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.zip"
const MAX_SIZE = 20 * 1024 * 1024

const INPUT =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileTitle(f: File): string {
  return f.name.replace(/\.[^.]+$/, "")
}

// ── Component ───────────────────────────────────────────────────────────────

export default function MaterialsPage() {
  const [materials, setMaterials]   = useState<Material[]>([])
  const [loading, setLoading]       = useState(true)
  const [typeFilter, setTypeFilter] = useState("ALL")
  const [search, setSearch]         = useState("")
  const [error, setError]           = useState("")

  // Upload form
  const [showUpload, setShowUpload] = useState(false)
  const [courseCode, setCourseCode] = useState("")
  const [matType, setMatType]       = useState("NOTES")
  const [description, setDescription] = useState("")
  const [fileEntries, setFileEntries] = useState<FileEntry[]>([])
  const [uploading, setUploading]   = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [dragOver, setDragOver]     = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Expand / summarize
  const [expanded, setExpanded]       = useState<number | null>(null)
  const [summarizing, setSummarizing] = useState<number | null>(null)
  const [summarizingAll, setSummarizingAll] = useState(false)
  const [summarizeAllProgress, setSummarizeAllProgress] = useState({ done: 0, total: 0 })

  async function load() {
    setLoading(true)
    const res = await fetch("/api/materials")
    if (res.ok) setMaterials(await res.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() =>
    materials
      .filter((m) => typeFilter === "ALL" || m.type === typeFilter)
      .filter((m) => {
        const q = search.toLowerCase()
        return !q || m.title.toLowerCase().includes(q) || m.courseCode.toLowerCase().includes(q)
      }),
    [materials, typeFilter, search]
  )

  // ── File picking ──────────────────────────────────────────────────────────

  function addFiles(newFiles: FileList | File[]) {
    const arr = Array.from(newFiles)
    setFileEntries((prev) => {
      const existing = new Set(prev.map((e) => e.file.name + e.file.size))
      const fresh = arr
        .filter((f) => !existing.has(f.name + f.size))
        .map((f) => ({
          key: `${f.name}-${f.size}-${Date.now()}-${Math.random()}`,
          file: f,
          title: fileTitle(f),
          status: "pending" as const,
        }))
      return [...prev, ...fresh]
    })
  }

  function removeEntry(key: string) {
    setFileEntries((prev) => prev.filter((e) => e.key !== key))
  }

  function updateTitle(key: string, title: string) {
    setFileEntries((prev) => prev.map((e) => e.key === key ? { ...e, title } : e))
  }

  function handleDrop(ev: React.DragEvent) {
    ev.preventDefault()
    setDragOver(false)
    addFiles(ev.dataTransfer.files)
  }

  // ── Upload logic ──────────────────────────────────────────────────────────

  async function uploadAll() {
    if (!courseCode.trim()) { setUploadError("Course code is required."); return }
    if (fileEntries.length === 0) { setUploadError("Add at least one file."); return }
    const oversized = fileEntries.find((e) => e.file.size > MAX_SIZE)
    if (oversized) { setUploadError(`"${oversized.file.name}" exceeds the 20 MB limit.`); return }

    setUploading(true)
    setUploadError("")
    let anyError = false

    for (const entry of fileEntries) {
      if (entry.status === "done") continue

      setFileEntries((prev) => prev.map((e) => e.key === entry.key ? { ...e, status: "uploading" } : e))

      const fd = new FormData()
      fd.append("file", entry.file)
      fd.append("title", entry.title.trim() || fileTitle(entry.file))
      fd.append("courseCode", courseCode.trim())
      fd.append("type", matType)
      fd.append("description", description.trim())

      const res = await fetch("/api/materials/upload", { method: "POST", body: fd })
      const data = await res.json()

      if (!res.ok) {
        setFileEntries((prev) =>
          prev.map((e) => e.key === entry.key ? { ...e, status: "error", errorMsg: data.error ?? "Upload failed." } : e)
        )
        anyError = true
      } else {
        setFileEntries((prev) => prev.map((e) => e.key === entry.key ? { ...e, status: "done" } : e))
        setMaterials((prev) => [{ ...data, suggestedResources: data.suggestedResources ?? [] }, ...prev])
      }
    }

    setUploading(false)
    if (!anyError) closeUpload()
  }

  function closeUpload() {
    setShowUpload(false)
    setCourseCode("")
    setMatType("NOTES")
    setDescription("")
    setFileEntries([])
    setUploadError("")
  }

  // ── Summarize ─────────────────────────────────────────────────────────────

  async function summarizeMaterial(id: number) {
    setSummarizing(id)
    setError("")
    const res = await fetch(`/api/materials/${id}/summarize`, { method: "POST" })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? "Summarization failed."); setSummarizing(null); return }
    setMaterials((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, isSummarized: true, summary: data.summary, suggestedResources: data.suggestedResources ?? [] }
          : m
      )
    )
    setExpanded(id)
    setSummarizing(null)
  }

  async function summarizeAll() {
    const pending = materials.filter((m) => !m.isSummarized && m.fileAsset)
    if (pending.length === 0) return
    setSummarizingAll(true)
    setError("")
    setSummarizeAllProgress({ done: 0, total: pending.length })

    for (let i = 0; i < pending.length; i++) {
      const mat = pending[i]
      setSummarizing(mat.id)
      const res = await fetch(`/api/materials/${mat.id}/summarize`, { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        setMaterials((prev) =>
          prev.map((m) =>
            m.id === mat.id
              ? { ...m, isSummarized: true, summary: data.summary, suggestedResources: data.suggestedResources ?? [] }
              : m
          )
        )
      }
      setSummarizeAllProgress({ done: i + 1, total: pending.length })
    }

    setSummarizing(null)
    setSummarizingAll(false)
  }

  async function deleteMaterial(id: number) {
    if (!confirm("Delete this material?")) return
    const res = await fetch(`/api/materials/${id}`, { method: "DELETE" })
    if (res.ok) setMaterials((prev) => prev.filter((m) => m.id !== id))
    else setError("Failed to delete material.")
  }

  // ── File entry status icons ───────────────────────────────────────────────

  const pendingCount   = fileEntries.filter((e) => e.status === "pending").length
  const uploadingCount = fileEntries.filter((e) => e.status === "uploading").length
  const doneCount      = fileEntries.filter((e) => e.status === "done").length
  const errorCount     = fileEntries.filter((e) => e.status === "error").length

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Study Materials</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload PDFs and notes — then let AI summarize and suggest related resources.
          </p>
        </div>
        {!showUpload && (
          <div className="flex items-center gap-2">
            {materials.some((m) => !m.isSummarized && m.fileAsset) && (
              <button
                onClick={summarizeAll}
                disabled={summarizingAll || !!summarizing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 dark:border-purple-700 dark:bg-purple-900/20 dark:text-purple-300 dark:hover:bg-purple-900/40 text-sm font-medium disabled:opacity-60 transition-colors"
              >
                {summarizingAll ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>
                    Summarizing {summarizeAllProgress.done}/{summarizeAllProgress.total}…
                  </>
                ) : (
                  <>
                    ✨ Summarize All ({materials.filter((m) => !m.isSummarized && m.fileAsset).length})
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => { setShowUpload(true); setUploadError("") }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Upload Material
            </button>
          </div>
        )}
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            placeholder="Search by title or course code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
          />
        </div>
        <div className="flex gap-1.5">
          {TYPES.map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                typeFilter === t
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}>
              {t === "ALL" ? "All" : `${TYPE_ICON[t]} ${t}`}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>{filtered.length} material{filtered.length !== 1 ? "s" : ""}</span>
        {materials.some((m) => m.isSummarized) && (
          <><span>·</span>
          <span className="text-purple-600 dark:text-purple-400">
            {materials.filter((m) => m.isSummarized).length} summarized
          </span></>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ── Upload panel ──────────────────────────────────────────────────── */}
      {showUpload && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Upload Materials</h3>
            <span className="text-xs text-muted-foreground">You can upload multiple files at once</span>
          </div>

          {uploadError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5 text-sm text-destructive">
              {uploadError}
            </div>
          )}

          {/* Shared fields: course code + type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Course Code <span className="text-destructive">*</span>
              </label>
              <input
                placeholder="e.g. CS2010"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className={INPUT}
                disabled={uploading}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Type</label>
              <select value={matType} onChange={(e) => setMatType(e.target.value)} className={INPUT} disabled={uploading}>
                <option value="NOTES">📝 Notes</option>
                <option value="PDF">📄 PDF</option>
                <option value="SLIDES">📊 Slides</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Description <span className="text-xs opacity-60">(optional — applied to all files)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Brief description…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={uploading}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition resize-none"
            />
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed cursor-pointer transition-colors py-8 px-4 ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-accent/30"
            } ${uploading ? "pointer-events-none opacity-60" : ""}`}
          >
            <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm font-medium text-foreground">
              {dragOver ? "Drop files here" : "Click or drag files here"}
            </p>
            <p className="text-xs text-muted-foreground">PDF, PPT, DOC, TXT, images — max 20 MB each</p>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_TYPES}
              multiple
              className="sr-only"
              onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = "" }}
              disabled={uploading}
            />
          </div>

          {/* Selected files list */}
          {fileEntries.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  {fileEntries.length} file{fileEntries.length !== 1 ? "s" : ""} selected
                  {uploading && uploadingCount > 0 && <span className="ml-2 text-primary">· uploading {doneCount}/{fileEntries.length}…</span>}
                  {!uploading && doneCount > 0 && errorCount === 0 && <span className="ml-2 text-green-600 dark:text-green-400">· all uploaded</span>}
                  {!uploading && errorCount > 0 && <span className="ml-2 text-destructive">· {errorCount} failed</span>}
                </p>
                {!uploading && (
                  <button
                    onClick={() => setFileEntries([])}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                {fileEntries.map((entry) => (
                  <div key={entry.key} className={`flex items-center gap-3 px-4 py-3 ${
                    entry.status === "done"     ? "bg-green-50 dark:bg-green-900/10" :
                    entry.status === "error"    ? "bg-destructive/5" :
                    entry.status === "uploading"? "bg-primary/5" : "bg-background"
                  }`}>
                    {/* Status icon */}
                    <span className="text-base shrink-0">
                      {entry.status === "done"      && <span className="text-green-600 dark:text-green-400">✓</span>}
                      {entry.status === "error"     && <span className="text-destructive">✕</span>}
                      {entry.status === "uploading" && (
                        <svg className="h-4 w-4 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                        </svg>
                      )}
                      {entry.status === "pending" && <span className="text-muted-foreground">{TYPE_ICON.PDF}</span>}
                    </span>

                    {/* Editable title */}
                    <div className="flex-1 min-w-0">
                      <input
                        value={entry.title}
                        onChange={(e) => updateTitle(entry.key, e.target.value)}
                        disabled={uploading || entry.status === "done"}
                        placeholder="Title…"
                        className="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-70"
                      />
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground truncate">{entry.file.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">· {formatBytes(entry.file.size)}</span>
                        {entry.status === "error" && entry.errorMsg && (
                          <span className="text-xs text-destructive shrink-0">· {entry.errorMsg}</span>
                        )}
                      </div>
                    </div>

                    {/* Remove button */}
                    {!uploading && entry.status !== "done" && (
                      <button
                        onClick={() => removeEntry(entry.key)}
                        className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={uploadAll}
              disabled={uploading || fileEntries.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {uploading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                  Uploading {doneCount + uploadingCount}/{fileEntries.length}…
                </>
              ) : (
                <>
                  Upload {fileEntries.filter(e => e.status !== "done").length > 0
                    ? `${fileEntries.filter(e => e.status !== "done").length} file${fileEntries.filter(e => e.status !== "done").length !== 1 ? "s" : ""}`
                    : ""}
                </>
              )}
            </button>
            <button
              onClick={closeUpload}
              disabled={uploading}
              className="px-5 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-accent disabled:opacity-60"
            >
              {doneCount > 0 && !uploading ? "Done" : "Cancel"}
            </button>
          </div>
        </div>
      )}

      {/* ── Material list ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-3">📚</p>
          <p className="text-base mb-1">
            {search || typeFilter !== "ALL" ? "No materials match your search." : "No materials uploaded yet."}
          </p>
          {!search && typeFilter === "ALL" && (
            <p className="text-sm">Upload your first lecture note or PDF to get started.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((mat) => (
            <div key={mat.id} className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Main row */}
              <div className="flex items-center gap-4 px-5 py-4">
                <span className="text-2xl shrink-0">{TYPE_ICON[mat.type] ?? "📄"}</span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground text-sm">{mat.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[mat.type] ?? ""}`}>
                      {mat.type}
                    </span>
                    {mat.isSummarized && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        ✨ AI Summary
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                    <span className="font-mono font-medium text-foreground">{mat.courseCode}</span>
                    {mat.fileAsset && (
                      <><span>·</span><span>{mat.fileAsset.fileName}</span><span>·</span><span>{formatBytes(mat.fileAsset.fileSize)}</span></>
                    )}
                    <span>·</span>
                    <span>{new Date(mat.createdAt).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!mat.isSummarized && mat.fileAsset && (
                    <button
                      onClick={() => summarizeMaterial(mat.id)}
                      disabled={summarizing === mat.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50 disabled:opacity-60 transition-colors"
                    >
                      {summarizing === mat.id ? (
                        <><svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                        </svg>Summarizing…</>
                      ) : <>✨ Summarize</>}
                    </button>
                  )}

                  {mat.fileAsset && (
                    <a href={mat.fileAsset.fileUrl} target="_blank" rel="noopener noreferrer"
                      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Download">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                    </a>
                  )}

                  {(mat.description || mat.summary) && (
                    <button
                      onClick={() => setExpanded(expanded === mat.id ? null : mat.id)}
                      className={`p-2 rounded-lg transition-colors ${expanded === mat.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
                      title="Details"
                    >
                      <svg className={`h-4 w-4 transition-transform ${expanded === mat.id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                  )}

                  <button onClick={() => deleteMaterial(mat.id)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Delete">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Expanded detail */}
              {expanded === mat.id && (
                <div className="border-t border-border px-5 py-5 bg-muted/20 space-y-5">
                  {mat.description && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Description</p>
                      <p className="text-sm text-foreground leading-relaxed">{mat.description}</p>
                    </div>
                  )}

                  {mat.summary && (
                    <>
                      <div className="rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/40 p-4">
                        <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <span>✨</span> AI Quick Summary
                        </p>
                        <p className="text-sm text-foreground leading-relaxed">{mat.summary.quickSummary}</p>
                      </div>

                      {mat.summary.detailedNotes && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Detailed Notes</p>
                          <div className="text-sm text-foreground leading-relaxed whitespace-pre-line bg-background rounded-lg border border-border p-4">
                            {mat.summary.detailedNotes}
                          </div>
                        </div>
                      )}

                      {mat.summary.keyTerms && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Key Terms</p>
                          <div className="flex flex-wrap gap-2">
                            {mat.summary.keyTerms.split(",").map((term, i) => (
                              <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                                {term.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {mat.suggestedResources && mat.suggestedResources.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Suggested Resources
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {mat.suggestedResources.map((res) => (
                          <a key={res.id} href={res.url} target="_blank" rel="noopener noreferrer"
                            className="group flex items-start gap-3 p-3 rounded-lg border border-border bg-background hover:border-primary/40 hover:bg-primary/5 transition-colors">
                            <span className={`text-base shrink-0 mt-0.5 ${RESOURCE_COLOR[res.type]}`}>
                              {RESOURCE_ICON[res.type]}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors leading-snug truncate">
                                {res.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">{res.sourceName}</p>
                            </div>
                            <svg className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                            </svg>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
