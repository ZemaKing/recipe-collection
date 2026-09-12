// Categories have no color field in the DB — badge colors are derived
// deterministically from the category slug so the same category always
// gets the same color without a schema change.
const PALETTE = [
  { bg: 'bg-rose-500/15', text: 'text-rose-400' },
  { bg: 'bg-purple-500/15', text: 'text-purple-400' },
  { bg: 'bg-orange-500/15', text: 'text-orange-400' },
  { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  { bg: 'bg-amber-500/15', text: 'text-amber-400' },
  { bg: 'bg-sky-500/15', text: 'text-sky-400' },
  { bg: 'bg-pink-500/15', text: 'text-pink-400' },
  { bg: 'bg-slate-500/15', text: 'text-slate-400' },
]

export function getCategoryBadgeColor(slug: string) {
  let hash = 0
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) | 0
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]
}
