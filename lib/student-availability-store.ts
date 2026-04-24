type SlotRecord = {
  id: number
  userId: number
  dayOfWeek: number
  startTime: string
  endTime: string
  label: string | null
  createdAt: number
}

type AvailabilityStore = {
  nextId: number
  byUser: Map<number, SlotRecord[]>
}

declare global {
  var __educoreAvailabilityStore: AvailabilityStore | undefined
}

const store: AvailabilityStore =
  globalThis.__educoreAvailabilityStore ?? {
    nextId: 1,
    byUser: new Map<number, SlotRecord[]>(),
  }

if (!globalThis.__educoreAvailabilityStore) {
  globalThis.__educoreAvailabilityStore = store
}

function cloneForClient(slot: SlotRecord) {
  return {
    id: slot.id,
    dayOfWeek: slot.dayOfWeek,
    startTime: slot.startTime,
    endTime: slot.endTime,
    label: slot.label,
  }
}

function getUserSlots(userId: number) {
  const slots = store.byUser.get(userId) ?? []
  return slots
    .slice()
    .sort((a, b) =>
      a.dayOfWeek !== b.dayOfWeek
        ? a.dayOfWeek - b.dayOfWeek
        : a.startTime.localeCompare(b.startTime)
    )
}

function hasOverlap(existing: SlotRecord[], slot: Pick<SlotRecord, "dayOfWeek" | "startTime" | "endTime">) {
  return existing.some(s =>
    s.dayOfWeek === slot.dayOfWeek &&
    !(slot.endTime <= s.startTime || slot.startTime >= s.endTime)
  )
}

export function listAvailability(userId: number) {
  return getUserSlots(userId).map(cloneForClient)
}

export function addAvailability(
  userId: number,
  payload: { dayOfWeek: number; startTime: string; endTime: string; label: string | null }
): { ok: true; slot: ReturnType<typeof cloneForClient> } | { ok: false; error: string; status: number } {
  const existing = getUserSlots(userId)
  if (hasOverlap(existing, payload)) {
    return { ok: false, error: "This slot overlaps with an existing one.", status: 409 }
  }

  const slot: SlotRecord = {
    id: store.nextId++,
    userId,
    dayOfWeek: payload.dayOfWeek,
    startTime: payload.startTime,
    endTime: payload.endTime,
    label: payload.label,
    createdAt: Date.now(),
  }

  store.byUser.set(userId, [...existing, slot])
  return { ok: true, slot: cloneForClient(slot) }
}

export function removeAvailability(userId: number, id: number) {
  const existing = getUserSlots(userId)
  const next = existing.filter(s => s.id !== id)
  if (next.length === existing.length) return false
  store.byUser.set(userId, next)
  return true
}
