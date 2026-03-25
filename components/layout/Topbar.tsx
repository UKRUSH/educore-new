export default function Topbar({
  name,
  photoUrl,
}: {
  name: string
  photoUrl: string | null
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <header className="h-16 shrink-0 flex items-center justify-between px-6 bg-card border-b border-border">
      <p className="text-sm text-muted-foreground">
        Welcome back, <span className="font-semibold text-foreground">{name.split(" ")[0]}</span>
      </p>

      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold overflow-hidden">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <span className="text-sm font-medium text-foreground hidden sm:block">{name}</span>
      </div>
    </header>
  )
}
