import { ChefHat, Search, SunMedium, User } from 'lucide-react'

function Topbar() {
  return (
    <header className="flex items-center gap-4 border-b border-border bg-surface px-4 py-3 md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <ChefHat className="size-6 shrink-0 text-accent" />
        <span className="text-base font-semibold">Moji Recepti</span>
      </div>

      <div className="hidden flex-col md:flex">
        <h1 className="text-lg font-semibold">Dobrodošao nazad, Kolekcionaru! 👋</h1>
        <p className="text-sm text-muted-foreground">Pronađi savršen recept za svaki trenutak.</p>
      </div>

      <div className="ml-auto flex items-center justify-end gap-3">
        <label className="relative hidden md:block md:w-72 lg:w-80">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Pretraži recepte, sastojke..."
            disabled
            className="w-full rounded-control border border-border bg-surface-elevated py-2 pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed"
          />
        </label>

        <button
          type="button"
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground md:hidden"
          title="Pretraga"
        >
          <Search className="size-4" />
        </button>

        <button
          type="button"
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
          title="Tema"
        >
          <SunMedium className="size-4" />
        </button>

        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-elevated text-muted-foreground">
          <User className="size-4" />
        </div>
      </div>
    </header>
  )
}

export default Topbar
