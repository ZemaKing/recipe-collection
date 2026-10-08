import momIconUrl from '@/assets/mom-icon.svg'

interface MomIconProps {
  className?: string
}

// Custom multi-color illustration for the "From Mom" tag (traced artwork,
// not a stroke-based lucide-style glyph) — colors are baked into the path
// fills rather than driven by currentColor/text-* classes. Served as a
// separate, cached file: inlined, its ~28 kB of path data (11 kB gzip) sat in
// the JS every page has to download first (docs/performance.md).
function MomIcon({ className }: MomIconProps) {
  return <img src={momIconUrl} alt="" aria-hidden="true" className={className} />
}

export default MomIcon
