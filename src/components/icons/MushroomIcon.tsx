interface MushroomIconProps {
  className?: string
}

// lucide-react has no mushroom glyph, so this fills the gap in the same
// stroke-based style (24x24 viewBox, round caps/joins, currentColor) as the
// rest of the icon set used across the app.
function MushroomIcon({ className }: MushroomIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 11c0-4.42 3.58-8 8-8s8 3.58 8 8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" />
      <path d="M9 12v6a3 3 0 0 0 6 0v-6" />
    </svg>
  )
}

export default MushroomIcon
