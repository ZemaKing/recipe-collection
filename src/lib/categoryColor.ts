// Meaningful, fixed colors per recipe category (not derived from a hash) so
// the same category always reads the same color everywhere it's shown:
// admin recipe list/filter, home, /recepti, /kategorije, /omiljeni,
// /nedavno-dodati, and the sidebar's category quick links.
//
// hoverBg/hoverText are separate literal classes (not built from bg/text at
// runtime) so Tailwind's static scanner can see and generate them — a
// template-built `hover:${bg}` string never appears in source and gets
// silently dropped from the compiled CSS.
export interface CategoryColorClasses {
  bg: string
  text: string
  hoverBg: string
  hoverText: string
}

const DEFAULT_COLORS: CategoryColorClasses = {
  bg: 'bg-slate-500/15',
  text: 'text-slate-400',
  hoverBg: 'hover:bg-slate-500/15',
  hoverText: 'hover:text-slate-400',
}

const CATEGORY_COLORS: Record<string, CategoryColorClasses> = {
  dorucak: {
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    hoverBg: 'hover:bg-amber-500/15',
    hoverText: 'hover:text-amber-400',
  },
  predjela: {
    bg: 'bg-lime-500/15',
    text: 'text-lime-400',
    hoverBg: 'hover:bg-lime-500/15',
    hoverText: 'hover:text-lime-400',
  },
  'supe-i-corbe': {
    bg: 'bg-orange-500/15',
    text: 'text-orange-400',
    hoverBg: 'hover:bg-orange-500/15',
    hoverText: 'hover:text-orange-400',
  },
  'glavna-jela': {
    bg: 'bg-rose-500/15',
    text: 'text-rose-400',
    hoverBg: 'hover:bg-rose-500/15',
    hoverText: 'hover:text-rose-400',
  },
  prilozi: {
    bg: 'bg-yellow-500/15',
    text: 'text-yellow-400',
    hoverBg: 'hover:bg-yellow-500/15',
    hoverText: 'hover:text-yellow-400',
  },
  salate: {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    hoverBg: 'hover:bg-emerald-500/15',
    hoverText: 'hover:text-emerald-400',
  },
  peciva: {
    bg: 'bg-stone-500/15',
    text: 'text-stone-400',
    hoverBg: 'hover:bg-stone-500/15',
    hoverText: 'hover:text-stone-400',
  },
  deserti: {
    bg: 'bg-pink-500/15',
    text: 'text-pink-400',
    hoverBg: 'hover:bg-pink-500/15',
    hoverText: 'hover:text-pink-400',
  },
  'sosovi-prelivi-i-namazi': {
    bg: 'bg-violet-500/15',
    text: 'text-violet-400',
    hoverBg: 'hover:bg-violet-500/15',
    hoverText: 'hover:text-violet-400',
  },
  'pica-i-napici': {
    bg: 'bg-sky-500/15',
    text: 'text-sky-400',
    hoverBg: 'hover:bg-sky-500/15',
    hoverText: 'hover:text-sky-400',
  },
  ostalo: DEFAULT_COLORS,
}

export function getCategoryBadgeColor(slug: string): CategoryColorClasses {
  return CATEGORY_COLORS[slug] ?? DEFAULT_COLORS
}
