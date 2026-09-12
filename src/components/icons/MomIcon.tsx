interface MomIconProps {
  className?: string
}

// Custom icon for the "From Mom" tag — a headscarf/bun figure in an apron
// with a flower badge, matching the provided reference illustration.
// Lucide has no equivalent glyph, so this is hand-drawn to fit the same
// stroke-based style (currentColor, size-* utility classes) as the rest.
function MomIcon({ className }: MomIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="3.3" r="1.2" />
      <path d="M9.2 5.2c0-1.1 1.2-1.9 2.8-1.9s2.8.8 2.8 1.9" />
      <path d="M7 9a5 5 0 0 1 10 0v1a5 5 0 0 1-10 0z" />
      <path d="M9.4 9.6c.3.4.7.4 1 0M13.6 9.6c.3.4.7.4 1 0" />
      <path d="M10 11.6c.6.5 1.4.5 2 0" />
      <path d="M5 21v-3a7 7 0 0 1 14 0v3" />
      <path d="M8.5 14.2V21M15.5 14.2V21" />
      <circle cx="12" cy="17" r="1.5" />
      <path d="M12 14.7v.3M12 18.4v.3M10.1 15.5l.2.2M13.7 18.3l.2.2M10.1 18.5l.2-.2M13.7 15.7l.2-.2" />
    </svg>
  )
}

export default MomIcon
