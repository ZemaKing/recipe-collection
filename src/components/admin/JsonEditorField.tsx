import { useRef } from 'react'
import { cn } from '@/lib/utils'

interface JsonEditorFieldProps {
  value: string
  onChange: (value: string) => void
  hasError: boolean
  placeholder: string
}

function JsonEditorField({ value, onChange, hasError, placeholder }: JsonEditorFieldProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)
  const lineCount = Math.max(value.split('\n').length, 1)

  function syncGutterScroll() {
    if (gutterRef.current && textareaRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  return (
    <div
      className={cn(
        'flex overflow-hidden rounded-control border bg-surface-elevated',
        hasError ? 'border-favorite' : 'border-border',
      )}
    >
      <div
        ref={gutterRef}
        aria-hidden="true"
        className="w-10 shrink-0 overflow-hidden bg-surface py-2.5 text-right font-mono text-xs leading-5 text-muted-foreground select-none"
      >
        {Array.from({ length: lineCount }, (_, index) => (
          <div key={index} className="pr-2">
            {index + 1}
          </div>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncGutterScroll}
        placeholder={placeholder}
        spellCheck={false}
        rows={10}
        className="w-full resize-none border-l border-border bg-transparent py-2.5 pr-3 pl-3 font-mono text-xs leading-5 text-foreground outline-none placeholder:text-muted-foreground/70"
      />
    </div>
  )
}

export default JsonEditorField
